import { all } from 'redux-saga/effects';
import { createAsyncApiWatcher } from 'redux-kits';
import actionType from './actionType';

const watchFetchUsers = createAsyncApiWatcher({
  actionPrefix: actionType.FETCH_USERS,
  getPromises: () => [
    () =>
      new Promise((resolve) => {
        setTimeout(() => {
          resolve({
            data: [...Array(20)].map((_, index) => ({
              id: index + 1,
              name: `User ${index + 1}`,
            })),
          });
        }, 1000);
      }),
  ],
  mapResultToPayload: (state, action, results) => results[0],
});

export default function* saga() {
  yield all([watchFetchUsers()]);
}
