import { all } from 'redux-saga/effects';
import { configure, createAsyncWatcher } from 'redux-kits';
import actionType from './actionType';
import { getUsers } from './api';

configure({
  customFetch: (input: RequestInfo, init?: RequestInit) => {
    return fetch(input, init);
  },
});

const watchFetchUsers = createAsyncWatcher({
  actionPrefix: actionType.FETCH_USERS,
  runInSequence: true,
  listenOnceAtTime: true,
  getPromises: (state, action) => [
    () => getUsers({ limit: action.payload.limit }),
  ],
  mapPendingToPayload: () => ({
    clear: true,
  }),
  mapResultToPayload: (state, action, results, rawResults) =>
    rawResults[0].results,
});

const watchFetchRandomUsers = createAsyncWatcher({
  actionPrefix: actionType.FETCH_RANDOM_USERS,
  runInSequence: true,
  listenOnceAtTime: true,
  mapResultToPayload: (state, action, results, rawResults) => {
    return rawResults[0].results;
  },
});

export default function* saga() {
  yield all([watchFetchUsers(), watchFetchRandomUsers()]);
}
