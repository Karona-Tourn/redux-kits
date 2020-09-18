import produce from 'immer';
import { ActionTypeMaker } from './actionKits';

/**
 * Redux action
 *
 * @ignore
 */
export interface IAsyncAction {
  /**
   * Type of action.
   */
  type: string;
  payload?: any;
}

/**
 * Initial async reducerstate
 */
export interface I_initialAsyncState {
  data: any;

  /**
   * Tell if a reducer is pending for any work
   */
  pending: boolean;

  /**
   * Tell if a reducer has error
   */
  error: any;
}

/**
 * @ignore
 */
export interface IAsyncPagingData {
  [index: string]: any;
  id?: any;
}

export interface I_initialAsyncPagingState {
  [index: string]: any;
  data: IAsyncPagingData[];
  offset: number;
  pending: boolean;
  error: any;
  hasMore: boolean;
}

/**
 * Interface for action payload that will be used for [[createAsyncPagingWatcher]] and [[createAsyncPagingReducer]]
 *
 * @ignore
 */
export interface IAsyncPagingPayload extends IAsyncPagingData {
  data?: IAsyncPagingData[] | IAsyncPagingData;

  /**
   * If true, it will clear field `data` from reducer matching with `_PENDING` action type
   */
  clear?: boolean;

  /**
   * @deprecated Use [[clear]] instead
   */
  cleanPrevious?: boolean;

  /**
   * If true, field `offset` in the reducer state will be reset to 0
   */
  firstOffset?: boolean;
}

/**
 * @ignore
 */
export interface IAsyncPagingAction {
  type: string;
  payload: IAsyncPagingPayload | number;
}

/**
 * Action types that will become sub-reducers
 */
export interface IReducerBatchInit {
  /**
   * Array with fixed 2 elements represeting conditional action type at first index and
   * initial state at second index
   */
  [key: string]: [string, any];
}

/**
 * Action types that will become sub-reducers
 */
export interface IReducerBatch {
  [key: string]: (state: any, action: IAsyncAction) => any;
}

/**
 * Create a batch of reducer object that each property representing nested reducers
 *
 * @param init
 *
 * ```javascript
 * const reducers = createReducerBatch({
 *  mute: ['SET_MUTE', false],
 *  profile: ['SET_PROFILE', { name: '', gender: '' }]
 * });
 *
 * // You will get a reducer like the following one
 * reducers = {
 *  mute: function (state = false, action) { ... },
 *  profile: function (state = { name: '', gender: '' }, action) { ... }
 * }
 * ```
 */
export function createReducerBatch(init: IReducerBatchInit): IReducerBatch {
  const keys = Object.keys(init);
  const reducers: IReducerBatch = {};

  for (let key of keys) {
    const option = init[key];
    const actionType = option[0];
    const initialState = option[1] || null;
    reducers[key] = function (state = initialState, action: IAsyncAction) {
      switch (action.type) {
        case actionType:
          return action.payload;
        default:
          return state;
      }
    };
  }

  return reducers;
}

export interface IReducerGroupNode {
  /**
   * Action type
   */
  type: string;

  /**
   * Initial state
   */
  initState?: any;

  /**
   * Callback will be invoked when found a match action type to tell how state will be changed
   *
   * @param state
   * @param action
   * @returns Changed state
   */
  onUpdate?: ((state: any, action: IAsyncAction) => any) | null | undefined;
}

export interface IReducerGroupInit {
  [key: string]: IReducerGroupNode;
}

export interface IReducerGroupResetNode {
  /**
   * Action type
   */
  type: string;

  /**
   * Callback will be invoked when found a match action type to tell how state will be changed
   *
   * @param state
   * @param action
   * @returns Changed state
   */
  onUpdate?: ((state: any, action: IAsyncAction) => any) | null | undefined;
}

export interface IReducerGroupState {
  [key: string]: any;
}

/**
 * Help create a reducer that you can manage how state should be changed in nested reducers
 *
 * @param options
 * @param resetOption
 */
export function createReducerGroup(
  options: IReducerGroupInit,
  resetOption: IReducerGroupResetNode
): (state: IReducerGroupState, action: IAsyncAction) => IReducerGroupState {
  const mainInitialState: IReducerGroupState = {};
  const keys = Object.keys(options);

  for (let key of keys) {
    const option = options[key];
    mainInitialState[key] = option.initState || null;
  }

  return function (state = mainInitialState, action: IAsyncAction) {
    for (let key of keys) {
      const option = options[key];
      if (option.type === action.type) {
        return typeof state === 'object'
          ? produce(state, (draftState) => {
              if (option.onUpdate) {
                draftState[key] = option.onUpdate(draftState, action);
              } else {
                draftState[key] = action.payload;
              }
            })
          : action.payload;
      }
    }

    if (resetOption && resetOption.type === action.type) {
      return produce(state, (draftState) => {
        if (resetOption.onUpdate) {
          resetOption.onUpdate(state, action);
        } else {
          for (let key of keys) {
            draftState[key] = options[key].initState;
          }
        }
      });
    }

    return state;
  };
}

/**
 * Create a reducer that working with work related steps of state changes like: `PENDING` => `SUCCESS` or `FAIL`.
 * This function works closely with saga function createAsyncApiWatcher
 *
 * __Motivation__
 * ```javascript
 * // Old way
 * const profile = (state = { data: null, pending: false, error: null }, action) => {
 *  switch(action.type) {
 *    case 'FETCH_USER_PROFILE_PENDING':
 *      return { pending: true };
 *    case 'FETCH_USER_PROFILE_SUCCESS':
 *      return { pending: false, data: action.payload };
 *    case 'FETCH_USER_PROFILE_FAIL':
 *      return { pending: false, error: action.payload };
 *    default:
 *      return state;
 *  }
 * }
 *
 * // New way
 * const profile = createAsyncReducer('FETCH_USER_PROFILE');
 * ```
 *
 * @param actionTypePrefix Main action type
 * @param initialState Initial state in form of ```{ data: any, pending: boolean, error: any }```
 *
 * ```javascript
 * // Example
 * const profile = createAsyncReducer('FETCH_USER_PROFILE');
 * ```
 */
export function createAsyncReducer(
  actionTypePrefix: string,
  initialState: I_initialAsyncState = {
    data: null,
    pending: false,
    error: null,
  }
) {
  const PENDING = ActionTypeMaker.PENDING(actionTypePrefix);
  const SUCCESS = ActionTypeMaker.SUCCESS(actionTypePrefix);
  const FAIL = ActionTypeMaker.FAIL(actionTypePrefix);
  const RESET = ActionTypeMaker.RESET(actionTypePrefix);

  return function (state = initialState, action: IAsyncAction) {
    switch (action.type) {
      case PENDING:
        return produce(state, (draftState) => {
          draftState.pending = true;
        });
      case SUCCESS:
        return produce(state, (draftState) => {
          draftState.data = action.payload;
          draftState.error = null;
          draftState.pending = false;
        });
      case FAIL:
        return produce(state, (draftState) => {
          draftState.error = action.payload;
          draftState.pending = false;
        });
      case RESET:
        return produce(initialState, () => {});
      default:
        return state;
    }
  };
}

/**
 * Create a reducer that working with work related steps of state changes like: `PENDING` => `SUCCESS` or `FAIL`.
 * Moreover main use is to target work related to pagination (`limit` and `offset`) with server request, database and so on.
 * This function works closely with saga function createAsyncPagingApiWatcher
 *
 * __Motivation__
 * ```javascript
 * // Old way
 * const carts = (state = { data: [], offset: 0, pending: false, error: null, hasMore: true }, action) => {
 *  switch(action.type) {
 *    case 'FETCH_CARTS_PENDING':
 *      // return new state telling fetching cart data is pending
 *    case 'FETCH_CARTS_SUCCESS':
 *      // return new state with the fetched data of the cart
 *    case 'FETCH_CARTS_FAIL':
 *      // return new state telling fetching carts failed
 *    case 'FETCH_CARTS_ADD_FIRST':
 *      // return new state with new cart data inserted at first index of the data array
 *    case 'FETCH_CARTS_ADD_LAST':
 *      // return new state with new cart data inserted at last index of the data array
 *    case 'FETCH_CARTS_REMOVE':
 *      // return new state that one cart item of all is removed
 *    case 'FETCH_CARTS_UPDATE':
 *      // return new state that one cart item of all is updated
 *    case 'FETCH_CARTS_REPLACE':
 *      // return new state that one cart item of all is replaced with another one
 *    default:
 *      return state;
 *  }
 * }
 *
 * // New way
 * const carts = createAsyncPagingReducer('FETCH_CARTS');
 * ```
 *
 * @param actionTypePrefix Main action type
 * @param initialState Initial state in form of ```{ data: Array<T extends { id: any }>, offset: 0, pending: boolean, error: any, hasMore: boolean }```
 *
 * ```javascript
 * // Example
 * const carts = createAsyncPagingReducer('FETCH_CARTS');
 * ```
 */
export function createAsyncPagingReducer(
  actionTypePrefix: string,
  initialState: I_initialAsyncPagingState = {
    data: [],
    offset: 0,
    pending: false,
    error: null,
    hasMore: true,
  }
) {
  const PENDING = ActionTypeMaker.PENDING(actionTypePrefix);
  const SUCCESS = ActionTypeMaker.SUCCESS(actionTypePrefix);
  const FAIL = ActionTypeMaker.FAIL(actionTypePrefix);
  const RESET = ActionTypeMaker.RESET(actionTypePrefix);
  const UPDATE = ActionTypeMaker.UPDATE(actionTypePrefix);
  const ADD_LAST = ActionTypeMaker.ADD_LAST(actionTypePrefix);
  const ADD_FIRST = ActionTypeMaker.ADD_FIRST(actionTypePrefix);
  const REPLACE = ActionTypeMaker.REPLACE(actionTypePrefix);
  const REMOVE = ActionTypeMaker.REMOVE(actionTypePrefix);

  return function (state = initialState, action: IAsyncPagingAction) {
    switch (action.type) {
      case PENDING:
        return produce(state, (draftState) => {
          const payload = action.payload as IAsyncPagingPayload;
          if (payload.clear) {
            draftState.data = [];
            draftState.offset = 0;
          }
          draftState.pending = true;
          draftState.hasMore = true;
        });
      case SUCCESS:
        return produce(state, (draftState) => {
          const {
            data,
            firstOffset,
            ...rest
          } = action.payload as IAsyncPagingPayload;
          const newData = data && Array.isArray(data) ? data : [];
          const length = newData.length;

          if (firstOffset) {
            draftState.data = [...newData];
          } else {
            draftState.data.push(...newData);
          }

          draftState.offset = firstOffset ? length : draftState.offset + length;
          draftState.hasMore = length > 0;
          draftState.error = null;

          const keys = Object.keys(rest);
          if (keys.length > 0) {
            keys.forEach((key) => {
              draftState[key] = rest[key];
            });
          }

          draftState.pending = false;
        });
      case ADD_LAST:
        return produce(state, (draftState) => {
          draftState.data.push(action.payload as IAsyncPagingPayload);
          draftState.offset += 1;
        });
      case ADD_FIRST:
        return produce(state, (draftState) => {
          draftState.data.unshift(action.payload as IAsyncPagingPayload);
          draftState.offset += 1;
        });
      case UPDATE:
        return produce(state, (draftState) => {
          if (draftState.data) {
            const updateData = action.payload as IAsyncPagingPayload;
            const index = draftState.data.findIndex(
              (e) => e.id === updateData.id
            );

            if (index >= 0) {
              draftState.data[index] = {
                ...updateData,
              };
            }
          }
        });
      case REPLACE:
        return produce(state, (draftState) => {
          const payload = action.payload as IAsyncPagingPayload;
          const searchId = payload.id;
          const replaceIndex = draftState.data.findIndex(
            (e) => e.id === searchId
          );

          if (
            replaceIndex >= 0 &&
            payload.data &&
            !Array.isArray(payload.data)
          ) {
            draftState.data[replaceIndex] = payload.data;
          }
        });
      case REMOVE:
        return produce(state, (draftState) => {
          const id = action.payload;
          const index = draftState.data.findIndex((e) => e.id === id);
          if (index >= 0) {
            draftState.data.splice(index, 1);
            draftState.offset -= 1;
          }
        });
      case FAIL:
        return produce(state, (draftState) => {
          draftState.error = action.payload;
          draftState.pending = false;
        });
      case RESET:
        return produce(initialState, () => {});
      default:
        return state;
    }
  };
}
