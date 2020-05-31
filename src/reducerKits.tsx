import produce from 'immer';
import { actionTypeMaker } from './actionKits';

/**
 * Redux action
 * 
 * @ignore
 */
export interface AsyncAction {
  /**
   * Type of action.
   */
  type: string;
  payload?: any;
}

/**
 * Initial async reducerstate
 */
export interface InitialAsyncState {
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
export interface AsyncPagingData {
  id: any;
}

export interface InitialAsyncPagingState {
  data: AsyncPagingData[];
  offset: number;
  pending: boolean;
  error: any;
  hasMore: boolean;
}

export interface AsyncPagingPayload extends AsyncPagingData {
  data: AsyncPagingData[] | AsyncPagingData;
  cleanPrevious: boolean;
  firstOffset: boolean;
}

/**
 * @ignore
 */
export interface AsyncPagingAction {
  type: string;
  payload: AsyncPagingPayload;
}

export function createReducers(actionTypes: { [key: string]: [string, any] }) {
  const keys = Object.keys(actionTypes);
  const reducers: {
    [key: string]: (state: any, action: AsyncAction) => any;
  } = {};

  for (let key of keys) {
    const option = actionTypes[key];
    const actionType = option[0];
    const initialState = option[1] || null;
    reducers[key] = function (state = initialState, action: AsyncAction) {
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

export function createReducerGroup(
  options: {
    [key: string]: {
      type: string;
      initState?: any;
      onUpdate?: (state: any, action: AsyncAction) => any;
    };
  },
  resetOption: {
    type: string;
    onUpdate?: (state: any, action: AsyncAction) => any;
  }
) {
  const mainInitialState: {
    [key: string]: any;
  } = {};
  const keys = Object.keys(options);

  for (let key of keys) {
    const option = options[key];
    mainInitialState[key] = option.initState || null;
  }

  return function (state = mainInitialState, action: AsyncAction) {
    for (let key of keys) {
      const option = options[key];
      if (option.type == action.type) {
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

    if (resetOption && resetOption.type == action.type) {
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

export function createAsyncReducer(
  actionTypePrefix: string,
  initialState: InitialAsyncState = { data: null, pending: false, error: null }
) {
  const PENDING = actionTypeMaker.PENDING(actionTypePrefix);
  const SUCCESS = actionTypeMaker.SUCCESS(actionTypePrefix);
  const FAIL = actionTypeMaker.FAIL(actionTypePrefix);
  const RESET = actionTypeMaker.RESET(actionTypePrefix);

  return function (state = initialState, action: AsyncAction) {
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

export function createAsyncPagingReducer(
  actionTypePrefix: string,
  initialState: InitialAsyncPagingState = {
    data: [],
    offset: 0,
    pending: false,
    error: null,
    hasMore: true,
  }
) {
  const PENDING = actionTypeMaker.PENDING(actionTypePrefix);
  const SUCCESS = actionTypeMaker.SUCCESS(actionTypePrefix);
  const FAIL = actionTypeMaker.FAIL(actionTypePrefix);
  const RESET = actionTypeMaker.RESET(actionTypePrefix);
  const UPDATE = actionTypeMaker.UPDATE(actionTypePrefix);
  const ADD_LAST = actionTypeMaker.ADD_LAST(actionTypePrefix);
  const ADD_FIRST = actionTypeMaker.ADD_FIRST(actionTypePrefix);
  const REPLACE = actionTypeMaker.REPLACE(actionTypePrefix);
  const REMOVE = actionTypeMaker.REMOVE(actionTypePrefix);

  return function (state = initialState, action: AsyncPagingAction) {
    switch (action.type) {
      case PENDING:
        return produce(state, (draftState) => {
          if (action.payload.cleanPrevious) {
            draftState.data = [];
            draftState.offset = 0;
          }
          draftState.pending = true;
          draftState.hasMore = true;
        });
      case SUCCESS:
        return produce(state, (draftState) => {
          const data =
            action.payload.data && Array.isArray(action.payload.data)
              ? action.payload.data
              : [];
          const length = data.length;

          draftState.data.push(...data);
          draftState.offset = action.payload.firstOffset
            ? length
            : draftState.offset + length;
          draftState.hasMore = length > 0;
          draftState.error = null;
          draftState.pending = false;
        });
      case ADD_LAST:
        return produce(state, (draftState) => {
          draftState.data.push(action.payload);
          draftState.offset += 1;
        });
      case ADD_FIRST:
        return produce(state, (draftState) => {
          draftState.data.unshift(action.payload);
          draftState.offset += 1;
        });
      case UPDATE:
        return produce(state, (draftState) => {
          if (draftState.data) {
            const updateData = action.payload;
            const index = draftState.data.findIndex(
              (e) => e.id == updateData.id
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
          const searchId = action.payload.id;
          const replaceIndex = draftState.data.findIndex(
            (e) => e.id == searchId
          );

          if (
            replaceIndex >= 0 &&
            action.payload.data &&
            !Array.isArray(action.payload.data)
          ) {
            draftState.data[replaceIndex] = action.payload.data;
          }
        });
      case REMOVE:
        return produce(state, (draftState) => {
          const id = action.payload;
          const index = draftState.data.findIndex((e) => e.id == id);
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
