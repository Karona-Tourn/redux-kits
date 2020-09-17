import actionType from './actionType';

export const fetchUsers = (options: { limit?: number } = {}) => ({
  type: actionType.FETCH_USERS,
  payload: {
    limit: options.limit,
  },
});
