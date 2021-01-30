import actionType from './actionType';

export const fetchUsers = (options: { limit?: number; key?: string } = {}) => ({
  type: actionType.FETCH_USERS,
  payload: {
    limit: options.limit,
  },
  key: options.key,
});

export const fetchRandomUsers = (options: { limit?: number } = {}) => ({
  type: actionType.FETCH_RANDOM_USERS,
  http: [
    {
      url: `https://randomuser.me/api/?results=${options.limit ?? 100}`,
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    },
  ],
});
