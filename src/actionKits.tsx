const _cachedActionTypes: {
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
  return _cachedActionTypes[prefix] || (_cachedActionTypes[prefix] = {});
}

/**
 * @ignore
 */
export function getCachedActionTypes() {
  return _cachedActionTypes;
}

/**
 * Action type name maker
 */
export const actionTypeMaker = {
  /**
   * Create an action type with `_PENDING` suffix
   *
   * @param prefix Main name of an action type
   * @returns Full action type name concating with the suffix
   *
   * ```typescript
   * const type = actionTypeMaker.PENDING('FETCH_PROFILE');
   *
   * console.log(type); // FETCH_PROFILE_PENDING
   * ```
   */
  PENDING: (prefix: string) => {
    const at = getCachedActionType(prefix);
    return at.pending || (at.pending = `${prefix}_PENDING`);
  },
  /**
   * Create an action type with `_SUCCESS` suffix
   *
   * @param prefix Main name of an action type
   * @returns Full action type name concating with the suffix
   *
   * ```typescript
   * const type = actionTypeMaker.PENDING('FETCH_PROFILE');
   *
   * console.log(type); // FETCH_PROFILE_SUCCESS
   * ```
   */
  SUCCESS: (prefix: string) => {
    const at = getCachedActionType(prefix);
    return at.success || (at.success = `${prefix}_SUCCESS`);
  },
  /**
   * Create an action type with `_FAIL` suffix
   *
   * @param prefix Main name of an action type
   * @returns Full action type name concating with the suffix
   *
   * ```typescript
   * const type = actionTypeMaker.PENDING('FETCH_PROFILE');
   *
   * console.log(type); // FETCH_PROFILE_FAIL
   * ```
   */
  FAIL: (prefix: string) => {
    const at = getCachedActionType(prefix);
    return at.fail || (at.fail = `${prefix}_FAIL`);
  },
  /**
   * Create an action type with `_RESET` suffix
   *
   * @param prefix Main name of an action type
   * @returns Full action type name concating with the suffix
   *
   * ```typescript
   * const type = actionTypeMaker.PENDING('FETCH_PROFILE');
   *
   * console.log(type); // FETCH_PROFILE_RESET
   * ```
   */
  RESET: (prefix: string) => {
    const at = getCachedActionType(prefix);
    return at.reset || (at.reset = `${prefix}_RESET`);
  },
  /**
   * Create an action type with `_CANCEL` suffix
   *
   * @param prefix Main name of an action type
   * @returns Full action type name concating with the suffix
   *
   * ```typescript
   * const type = actionTypeMaker.PENDING('FETCH_PROFILE');
   *
   * console.log(type); // FETCH_PROFILE_CANCEL
   * ```
   */
  CANCEL: (prefix: string) => {
    const at = getCachedActionType(prefix);
    return at.cancel || (at.cancel = `${prefix}_CANCEL`);
  },
  /**
   * Create an action type with `_REMOVE` suffix
   *
   * @param prefix Main name of an action type
   * @returns Full action type name concating with the suffix
   *
   * ```typescript
   * const type = actionTypeMaker.PENDING('FETCH_PROFILE');
   *
   * console.log(type); // FETCH_PROFILE_REMOVE
   * ```
   */
  REMOVE: (prefix: string) => {
    const at = getCachedActionType(prefix);
    return at.remove || (at.remove = `${prefix}_REMOVE`);
  },
  /**
   * Create an action type with `_UPDATE` suffix
   *
   * @param prefix Main name of an action type
   * @returns Full action type name concating with the suffix
   *
   * ```typescript
   * const type = actionTypeMaker.PENDING('FETCH_PROFILE');
   *
   * console.log(type); // FETCH_PROFILE_UPDATE
   * ```
   */
  UPDATE: (prefix: string) => {
    const at = getCachedActionType(prefix);
    return at.update || (at.update = `${prefix}_UPDATE`);
  },
  /**
   * Create an action type with `_ADD_FIRST` suffix
   *
   * @param prefix Main name of an action type
   * @returns Full action type name concating with the suffix
   *
   * ```typescript
   * const type = actionTypeMaker.PENDING('FETCH_PROFILE');
   *
   * console.log(type); // FETCH_PROFILE_ADD_FIRST
   * ```
   */
  ADD_FIRST: (prefix: string) => {
    const at = getCachedActionType(prefix);
    return at.addFirst || (at.addFirst = `${prefix}_ADD_FIRST`);
  },
  /**
   * Create an action type with `_ADD_LAST` suffix
   *
   * @param prefix Main name of an action type
   * @returns Full action type name concating with the suffix
   *
   * ```typescript
   * const type = actionTypeMaker.PENDING('FETCH_PROFILE');
   *
   * console.log(type); // FETCH_PROFILE_ADD_LAST
   * ```
   */
  ADD_LAST: (prefix: string) => {
    const at = getCachedActionType(prefix);
    return at.addLast || (at.addLast = `${prefix}_ADD_LAST`);
  },
  /**
   * Create an action type with `_REPLACE` suffix
   *
   * @param prefix Main name of an action type
   * @returns Full action type name concating with the suffix
   *
   * ```typescript
   * const type = actionTypeMaker.PENDING('FETCH_PROFILE');
   *
   * console.log(type); // FETCH_PROFILE_REPLACE
   * ```
   */
  REPLACE: (prefix: string) => {
    const at = getCachedActionType(prefix);
    return at.replace || (at.replace = `${prefix}_REPLACE`);
  },
};
