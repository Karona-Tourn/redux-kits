import {
  createAsyncPagingWatcher,
  createAsyncWatcher,
} from '../sagaWatcherKits';
import { createAsyncPagingReducer, createAsyncReducer } from '../reducerKits';
import { combineReducers } from 'redux';
import { all } from 'redux-saga/effects';
import { expectSaga } from 'redux-saga-test-plan';
import { ActionTypeMaker } from '../actionKits';

const api = {
  getUsers: (isFail: boolean) => {
    if (isFail) {
      throw { message: 'Failed' };
    }

    return Promise.resolve({
      json: () =>
        Promise.resolve({
          data: {
            id: 1,
            name: 'Karona',
          },
        }),
    });
  },
  getAllUsers: (isFail: boolean) => {
    if (isFail) {
      throw { message: 'Failed' };
    }

    return Promise.resolve({
      json: () =>
        Promise.resolve({
          data: [
            {
              id: 1,
              name: 'Karona',
            },
          ],
        }),
    });
  },
};

const actionTypes = {
  FETCH_USERS: 'FETCH_USERS',
};

const reducers = combineReducers({
  users: createAsyncReducer(actionTypes.FETCH_USERS),
});

const pagingReducers = combineReducers({
  users: createAsyncPagingReducer(actionTypes.FETCH_USERS),
});

const watchFetchUsers = createAsyncWatcher({
  actionPrefix: actionTypes.FETCH_USERS,
  getPromises: (state, action) => [() => api.getUsers(action.payload.isFail)],
});

const watchFetchPagingUsers = createAsyncPagingWatcher({
  actionPrefix: actionTypes.FETCH_USERS,
  getPromises: (state, action) => [
    () => api.getAllUsers(action.payload.isFail),
  ],
  mapResultToPayload: (state, action, results) => {
    return {
      data: results[0],
    };
  },
});

function* saga() {
  yield all([watchFetchUsers()]);
}

describe('Test createAsyncWatcher', () => {
  it('Test fetch users', () => {
    return expectSaga(saga, api)
      .withReducer(reducers)
      .dispatch({
        type: actionTypes.FETCH_USERS,
        payload: {
          isFail: false,
        },
      })
      .take(actionTypes.FETCH_USERS)
      .take([
        ActionTypeMaker.CANCEL(actionTypes.FETCH_USERS),
        ActionTypeMaker.SUCCESS(actionTypes.FETCH_USERS),
        ActionTypeMaker.FAIL(actionTypes.FETCH_USERS),
      ])
      .take(actionTypes.FETCH_USERS)
      .hasFinalState({
        users: { data: { id: 1, name: 'Karona' }, pending: false, error: null },
      })
      .run();
  });

  it('Test fail fetch users', () => {
    return expectSaga(saga, api)
      .withReducer(reducers)
      .dispatch({
        type: actionTypes.FETCH_USERS,
        payload: {
          isFail: true,
        },
      })
      .take(actionTypes.FETCH_USERS)
      .take([
        ActionTypeMaker.CANCEL(actionTypes.FETCH_USERS),
        ActionTypeMaker.SUCCESS(actionTypes.FETCH_USERS),
        ActionTypeMaker.FAIL(actionTypes.FETCH_USERS),
      ])
      .take(actionTypes.FETCH_USERS)
      .hasFinalState({
        users: {
          data: null,
          pending: false,
          error: { message: 'Failed', status: undefined },
        },
      })
      .delay(300)
      .run();
  });
});

describe('Test createAsyncPagingWatcher', () => {
  it('Test fetch paging users', () => {
    return expectSaga(function* () {
      yield all([watchFetchPagingUsers()]);
    }, api)
      .withReducer(pagingReducers)
      .dispatch({
        type: actionTypes.FETCH_USERS,
        payload: {
          isFail: false,
          clear: true,
          firstOffset: true,
        },
      })
      .take(actionTypes.FETCH_USERS)
      .take([
        ActionTypeMaker.CANCEL(actionTypes.FETCH_USERS),
        ActionTypeMaker.SUCCESS(actionTypes.FETCH_USERS),
        ActionTypeMaker.FAIL(actionTypes.FETCH_USERS),
      ])
      .take(actionTypes.FETCH_USERS)
      .hasFinalState({
        users: {
          data: [{ id: 1, name: 'Karona' }],
          offset: 1,
          pending: false,
          error: null,
          hasMore: true,
        },
      })
      .run();
  });

  it('Test fail fetch paging users', () => {
    return expectSaga(function* () {
      yield all([watchFetchPagingUsers()]);
    }, api)
      .withReducer(pagingReducers)
      .dispatch({
        type: actionTypes.FETCH_USERS,
        payload: {
          isFail: true,
          clear: true,
          firstOffset: true,
        },
      })
      .take(actionTypes.FETCH_USERS)
      .take([
        ActionTypeMaker.CANCEL(actionTypes.FETCH_USERS),
        ActionTypeMaker.SUCCESS(actionTypes.FETCH_USERS),
        ActionTypeMaker.FAIL(actionTypes.FETCH_USERS),
      ])
      .take(actionTypes.FETCH_USERS)
      .hasFinalState({
        users: {
          data: [],
          offset: 0,
          pending: false,
          error: { message: 'Failed', status: undefined },
          hasMore: true,
        },
      })
      .delay(300)
      .run();
  });
});
