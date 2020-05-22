const cachedActionTypes: {
  [key: string]: {
    pending?: string;
    success?: string;
    fail?: string;
    reset?: string;
    cancel?: string;
    remove?: string;
    update?: string;
    addFirst?: string;
    addLast?: string;
    replace?: string;
  };
} = {};

function getCachedActionType(prefix: string) {
  return cachedActionTypes[prefix] || (cachedActionTypes[prefix] = {});
}

export function getCachedActionTypes() {
  return cachedActionTypes;
}

export const actionTypeMaker = {
  PENDING: (prefix: string) => {
    const at = getCachedActionType(prefix);
    return at.pending || (at.pending = `${prefix}_PENDING`);
  },
  SUCCESS: (prefix: string) => {
    const at = getCachedActionType(prefix);
    return at.success || (at.success = `${prefix}_SUCCESS`);
  },
  FAIL: (prefix: string) => {
    const at = getCachedActionType(prefix);
    return at.fail || (at.fail = `${prefix}_FAIL`);
  },
  RESET: (prefix: string) => {
    const at = getCachedActionType(prefix);
    return at.reset || (at.reset = `${prefix}_RESET`);
  },
  CANCEL: (prefix: string) => {
    const at = getCachedActionType(prefix);
    return at.cancel || (at.cancel = `${prefix}_CANCEL`);
  },
  REMOVE: (prefix: string) => {
    const at = getCachedActionType(prefix);
    return at.remove || (at.remove = `${prefix}_REMOVE`);
  },
  UPDATE: (prefix: string) => {
    const at = getCachedActionType(prefix);
    return at.update || (at.update = `${prefix}_UPDATE`);
  },
  ADD_FIRST: (prefix: string) => {
    const at = getCachedActionType(prefix);
    return at.addFirst || (at.addFirst = `${prefix}_ADD_FIRST`);
  },
  ADD_LAST: (prefix: string) => {
    const at = getCachedActionType(prefix);
    return at.addLast || (at.addLast = `${prefix}_ADD_LAST`);
  },
  REPLACE: (prefix: string) => {
    const at = getCachedActionType(prefix);
    return at.replace || (at.replace = `${prefix}_REPLACE`);
  },
};
