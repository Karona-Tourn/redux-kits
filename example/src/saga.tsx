import { all } from 'redux-saga/effects';
import { createAsyncWatcher } from 'redux-kits';
import actionType from './actionType';
import { getUsers } from './api';

const watchFetchUsers = createAsyncWatcher({
  actionPrefix: actionType.FETCH_USERS,
  runInSequence: true,
  listenOnceAtTime: true,
  getPromises: (state, action) => [
    () => getUsers({ limit: action.payload.limit }),
  ],
  mapResultToPayload: (state, action, results, rawResults) =>
    rawResults[0].results,
});

export default function* saga() {
  yield all([watchFetchUsers()]);
}
