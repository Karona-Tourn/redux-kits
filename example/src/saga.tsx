import { all } from 'redux-saga/effects';
import { createAsyncApiWatcher } from '@karonatourn/redux-kit';
import actionType from './actionType';

const watchFetchUsers = createAsyncApiWatcher({
  actionPrefix: actionType.FETCH_USERS,
  getApi: () => [
    () =>
      fetch('', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }),
  ],
});

export default function* saga() {
  yield all([watchFetchUsers()]);
}
