import produce from 'immer';
import {
  ActionTypeMaker,
  IAsyncAction,
  IAsyncPagingAction,
  IAsyncPagingPayload,
} from './actionKits';
import _ from 'lodash';
import { assignTo } from './utils';

/**
 * Initial async reducerstate
 */
export interface IAsyncState {
  [index: string]: any;

  data: any;

  /**
   * Tell if a reducer is pending for any work
   */
  pending: boolean;

  /**
   * Tell if a reducer has error
   */
  error: any;

  dataEntity?: {
    [key: string]: IAsyncState;
  };
}

/**
 * @ignore
 */
export interface IAsyncPagingData {
  [index: string]: any;
  id?: any;
}

export interface IAsyncPagingState {
  [index: string]: any;
  data: IAsyncPagingData[];
  offset: number;
  pending: boolean;
  refreshing: boolean;
  error: any;
  hasMore: boolean;
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

var defaultAsyncState: IAsyncState = {
  data: null,
  pending: false,
  error: null,
};

var defaultAsyncPagingState: IAsyncPagingState = {
  data: [],
  offset: 0,
  pending: false,
  refreshing: false,
  error: null,
  hasMore: true,
};

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

type AsyncReducerFunction =
  | ((state: IAsyncState, action: IAsyncAction) => IAsyncState)
  | null;

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
 * @param extraReducer Reducer function that handle other custom action types
 * @param initialState Initial state in form of ```{ data: any, pending: boolean, error: any }```
 *
 * ```javascript
 * // Example
 * const profile = createAsyncReducer('FETCH_USER_PROFILE');
 * ```
 */
export function createAsyncReducer(
  actionTypePrefix: string,
  extraReducer: AsyncReducerFunction = null,
  initialState: IAsyncState = defaultAsyncState
) {
  const defaultState = {
    ...defaultAsyncState,
    ...initialState,
  };

  const PENDING = ActionTypeMaker.PENDING(actionTypePrefix);
  const SUCCESS = ActionTypeMaker.SUCCESS(actionTypePrefix);
  const FAIL = ActionTypeMaker.FAIL(actionTypePrefix);
  const RESET = ActionTypeMaker.RESET(actionTypePrefix);

  return function (state = defaultState, action: IAsyncAction) {
    switch (action.type) {
      case PENDING:
        return produce(state, (draftState) => {
          let _state = draftState;
          const key = action.key;

          if (key) {
            if (!draftState.dataEntity) {
              draftState.dataEntity = {};
            }

            if (!draftState.dataEntity[key]) {
              draftState.dataEntity[key] = {
                ...defaultAsyncState,
              };
            }

            _state = draftState.dataEntity[key];
          }

          if (
            typeof action.payload === 'object' &&
            !Array.isArray(action.payload)
          ) {
            const { clear, ...payload } = action.payload;

            if (clear) {
              _state.data = null;
            }

            assignTo(_state, payload);
          }

          _state.pending = true;
        });
      case SUCCESS:
        return produce(state, (draftState) => {
          let _state = draftState;
          const key = action.key;

          if (key) {
            if (!draftState.dataEntity) {
              draftState.dataEntity = {};
            }

            if (!draftState.dataEntity[key]) {
              draftState.dataEntity[key] = {
                ...defaultAsyncState,
              };
            }

            _state = draftState.dataEntity[key];
          }

          if (
            typeof action.payload === 'object' &&
            !Array.isArray(action.payload)
          ) {
            const { data, ...payload } = action.payload;

            if (data) {
              assignTo(_state, payload);

              _state.data = data;
            } else {
              _state.data = payload;
            }
          } else {
            _state.data = action.payload;
          }

          _state.error = null;
          _state.pending = false;
        });
      case FAIL:
        return produce(state, (draftState) => {
          let _state = draftState;
          const key = action.key;

          if (key) {
            if (!draftState.dataEntity) {
              draftState.dataEntity = {};
            }

            if (!draftState.dataEntity[key]) {
              draftState.dataEntity[key] = {
                ...defaultAsyncState,
              };
            }

            _state = draftState.dataEntity[key];
          }

          if (typeof action.payload === 'object') {
            const { error, ...payload } = action.payload;

            if (error) {
              assignTo(_state, payload);

              _state.error = error;
            } else {
              _state.error = payload;
            }
          } else {
            _state.error = action.payload;
          }

          _state.pending = false;
        });
      case RESET:
        return produce(state, (draftState) => {
          const key = action.key;

          if (key) {
            if (key === '*') {
              _.unset(draftState, 'dataEntity');
            } else {
              _.unset(draftState, `dataEntity.${key}`);
            }
          } else {
            draftState.data = null;
            draftState.error = null;
            draftState.pending = false;
          }
        });
      default:
        if (extraReducer) {
          return extraReducer(state, action);
        }
        return state;
    }
  };
}

type AsyncReducerGroup = {
  [key: string]: (state: IAsyncState, action: IAsyncAction) => IAsyncState;
};

/**
 * Help creating async reducers with less lines of code
 *
 * @param {object} nameTypePairs instance object that its properties representing reducer names and the property values representing action types
 *
 * @returns instance of object that its properies points to created async reducers
 *
 * Example
 * ```js
 * const product = createAsyncReducerGroup({
 * productList: 'FETCH_PRODUCTS',
 * productDetail: ['FETCH_PRODUCT_DETAIL', { data: {} }], // set initial state with instance object for property data
 * cartList: 'FETCH_CARTS',
 * });
 *
 * const reducers = combineReducers({
 * ...product,
 * });
 * ```
 */
export function createAsyncReducerGroup(nameTypePairs: {
  [key: string]: string | [string, AsyncReducerFunction, IAsyncState];
}): AsyncReducerGroup {
  const group: AsyncReducerGroup = {};

  Object.entries(nameTypePairs).forEach((nt) => {
    group[nt[0]] =
      typeof nt[1] === 'string'
        ? createAsyncReducer(nt[1])
        : createAsyncReducer(...nt[1]);
  });

  return group;
}

type AsyncPagingReducerFunction =
  | ((state: IAsyncPagingState, action: IAsyncAction) => IAsyncPagingState)
  | null;

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
  extraReducer: AsyncPagingReducerFunction = null,
  initialState: IAsyncPagingState = defaultAsyncPagingState
) {
  const defaultState = {
    ...defaultAsyncPagingState,
    ...initialState,
  };

  const PENDING = ActionTypeMaker.PENDING(actionTypePrefix);
  const SUCCESS = ActionTypeMaker.SUCCESS(actionTypePrefix);
  const FAIL = ActionTypeMaker.FAIL(actionTypePrefix);
  const RESET = ActionTypeMaker.RESET(actionTypePrefix);
  const UPDATE = ActionTypeMaker.UPDATE(actionTypePrefix);
  const ADD_LAST = ActionTypeMaker.ADD_LAST(actionTypePrefix);
  const ADD_FIRST = ActionTypeMaker.ADD_FIRST(actionTypePrefix);
  const REPLACE = ActionTypeMaker.REPLACE(actionTypePrefix);
  const REMOVE = ActionTypeMaker.REMOVE(actionTypePrefix);

  return function (state = defaultState, action: IAsyncPagingAction) {
    switch (action.type) {
      case PENDING:
        return produce(state, (draftState) => {
          const {
            clear,
            firstOffset,
            ...payload
          } = action.payload as IAsyncPagingPayload;

          if (clear) {
            draftState.data = [];
            draftState.offset = 0;
          }

          assignTo(draftState, payload);

          if (!clear && firstOffset) {
            draftState.refreshing = true;
          }

          draftState.pending = true;
          draftState.hasMore = true;
        });
      case SUCCESS:
        return produce(state, (draftState) => {
          const {
            data,
            firstOffset,
            ...payload
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

          assignTo(draftState, payload);

          draftState.pending = false;
          draftState.refreshing = false;
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
          if (typeof action.payload === 'object') {
            const { error, ...payload } = action.payload;

            if (error) {
              assignTo(draftState, payload);

              draftState.error = error;
            } else {
              draftState.error = payload;
            }
          } else {
            draftState.error = action.payload;
          }

          draftState.pending = false;
          draftState.refreshing = false;
        });
      case RESET:
        return produce(defaultState, () => {});
      default:
        if (extraReducer) {
          return extraReducer(state, action);
        }
        return state;
    }
  };
}

type AsyncPagingReducerGroup = {
  [key: string]: (
    state: IAsyncPagingState,
    action: IAsyncPagingAction
  ) => IAsyncPagingState;
};

/**
 * Help creating async paging reducers with less lines of code
 *
 * @param {object} nameTypePairs instance object that its properties representing reducer names and the property values representing action types
 *
 * @returns instance of object that its properies points to created async reducers
 *
 * Example
 * ```js
 * const product = createAsyncReducerGroup({
 * productList: ['FETCH_PRODUCTS', { data: [] }], // set initial state with empty array for property data
 * cartList: 'FETCH_CARTS',
 * });
 *
 * const reducers = combineReducers({
 * ...product,
 * });
 * ```
 */
export function createAsyncPagingReducerGroup(nameTypePairs: {
  [key: string]:
    | string
    | [string, AsyncPagingReducerFunction, IAsyncPagingState];
}): AsyncPagingReducerGroup {
  const group: AsyncPagingReducerGroup = {};

  Object.entries(nameTypePairs).forEach((nt) => {
    group[nt[0]] =
      typeof nt[1] === 'string'
        ? createAsyncPagingReducer(nt[1])
        : createAsyncPagingReducer(...nt[1]);
  });

  return group;
}
