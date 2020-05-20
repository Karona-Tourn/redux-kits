import produce from 'immer';
import { isFalseValue } from './utils';
import { actionTypeMaker } from './actionKits';

export function createReducers(actionTypes) {
  const keys = Object.keys(actionTypes);
  const reducers = {};

  for (let key of keys) {
    const option = actionTypes[key];
    const actionType = option[0];
    const initialState = option[1] || null;
    reducers[key] = function (state = initialState, action) {
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

export function createReducerGroup(options, resetOption) {
  const mainInitialState = {};
  const keys = Object.keys(options);

  for (let key of keys) {
    const option = options[key];
    mainInitialState[key] = option.initState;
  }

  return function (state = mainInitialState, action) {
    for (let key of keys) {
      const option = options[key];
      if (option.type == action.type) {
        return typeof state === 'object'
          ? produce(
              state,
              option.onUpdate
                ? option.onUpdate
                : (draftState) => {
                    draftState[key] = action.payload;
                  }
            )
          : action.payload;
      }
    }

    if (resetOption && resetOption.type == action.type) {
      return produce(
        state,
        resetOption.onUpdate
          ? resetOption.onUpdate
          : (draftState) => {
              for (let key of keys) {
                draftState[key] = options[key].initState;
              }
            }
      );
    }

    return state;
  };
}

export function createAsyncReducer(
  actionTypePrefix,
  initialState = { data: null, pending: false, error: null }
) {
  const PENDING = actionTypeMaker.PENDING(actionTypePrefix);
  const SUCCESS = actionTypeMaker.SUCCESS(actionTypePrefix);
  const FAIL = actionTypeMaker.FAIL(actionTypePrefix);
  const RESET = actionTypeMaker.RESET(actionTypePrefix);

  return function (state = initialState, action) {
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
        return produce(initialState, (draftState) => {});
      default:
        return state;
    }
  };
}

export function createAsyncPagingReducer(
  actionTypePrefix,
  initialState = {
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

  return function (state = initialState, action) {
    switch (action.type) {
      case PENDING:
        return produce(state, (draftState) => {
          if (action.payload.cleanPrevious) {
            draftState.data = null;
            draftState.offset = 0;
          }
          draftState.pending = true;
          draftState.hasMore = true;
        });
      case SUCCESS:
        return produce(state, (draftState) => {
          if (action.payload.firstOffset || isFalseValue(draftState.data)) {
            const length = action.payload.data.length;
            draftState.data = action.payload.data;
            draftState.offset = length;
            draftState.hasMore = length > 0;
          } else {
            const length = action.payload.data.length;
            if (length > 0) {
              draftState.data.push(...action.payload.data);
              draftState.offset += length;
            }
            draftState.hasMore = length > 0;
          }
          draftState.error = null;
          draftState.pending = false;
        });
      case ADD_LAST:
        return produce(state, (draftState) => {
          if (draftState.data === null || draftState.data === undefined) {
            draftState.data = [];
          }
          draftState.data.push(action.payload);
          draftState.offset += 1;
        });
      case ADD_FIRST:
        return produce(state, (draftState) => {
          if (draftState.data === null || draftState.data === undefined) {
            draftState.data = [];
          }
          draftState.data.unshift(action.payload);
          draftState.offset += 1;
        });
      case UPDATE:
        return produce(state, (draftState) => {
          if (!isFalseValue(draftState.data)) {
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

          if (replaceIndex >= 0) {
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
        return produce(initialState, (draftState) => {});
      default:
        return state;
    }
  };
}
