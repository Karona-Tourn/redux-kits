export const actionTypeMaker = {
  PENDING: (prefix) => `${prefix}_PENDING`,
  SUCCESS: (prefix) => `${prefix}_SUCCESS`,
  FAIL: (prefix) => `${prefix}_FAIL`,
  RESET: (prefix) => `${prefix}_RESET`,
  CANCEL: (prefix) => `${prefix}_CANCEL`,
  REMOVE: (prefix) => `${prefix}_REMOVE`,
  UPDATE: (prefix) => `${prefix}_UPDATE`,
  ADD_FIRST: (prefix) => `${prefix}_ADD_FIRST`,
  ADD_LAST: (prefix) => `${prefix}_ADD_LAST`,
  REPLACE: (prefix) => `${prefix}_REPLACE`,
};
