export const getUsers = (params: { limit?: number } = {}) =>
  fetch(`https://randomuser.me/api/?results=${params.limit ?? 100}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
  });
