import { IAsyncPagingData } from './reducerKits';

export type HttpPayload = {
  url: string;
  headers?: Headers;
  method: 'GET' | 'POST' | 'DELETE' | 'UPDATE';
  params?: object;
  body?: object;
};

/**
 * Redux action
 *
 * @ignore
 */
export interface IAsyncAction {
  /**
   * Type of action.
   */
  type: string;
  payload?: any;
  http?: HttpPayload[];
}

/**
 * Interface for action payload that will be used for [[createAsyncPagingWatcher]] and [[createAsyncPagingReducer]]
 *
 * @ignore
 */
export interface IAsyncPagingPayload extends IAsyncPagingData {
  data?: IAsyncPagingData[] | IAsyncPagingData;

  /**
   * If true, it will clear field `data` from reducer matching with `_PENDING` action type
   */
  clear?: boolean;

  /**
   * @deprecated Use [[clear]] instead
   */
  cleanPrevious?: boolean;

  /**
   * If true, field `offset` in the reducer state will be reset to 0
   */
  firstOffset?: boolean;
}

/**
 * @ignore
 */
export interface IAsyncPagingAction {
  type: string;
  payload: IAsyncPagingPayload | number;
}

var _cachedActionTypes: {
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

type ActionCreatorType = (
  ...params: any[]
) => IAsyncAction | IAsyncPagingAction;

type HttpActionCreatorType = (params: {
  limit?: number;
  firstOffset?: boolean;
  clear?: boolean;
  [key: string]: any;
}) => IAsyncAction | IAsyncPagingAction;

type PagingData = { id: any; [key: string]: any };

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
export class ActionTypeMaker {
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
  static PENDING(prefix: string) {
    const at = getCachedActionType(prefix);
    return at.pending || (at.pending = `${prefix}_PENDING`);
  }
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
  static SUCCESS(prefix: string) {
    const at = getCachedActionType(prefix);
    return at.success || (at.success = `${prefix}_SUCCESS`);
  }
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
  static FAIL(prefix: string) {
    const at = getCachedActionType(prefix);
    return at.fail || (at.fail = `${prefix}_FAIL`);
  }
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
  static RESET(prefix: string) {
    const at = getCachedActionType(prefix);
    return at.reset || (at.reset = `${prefix}_RESET`);
  }
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
  static CANCEL(prefix: string) {
    const at = getCachedActionType(prefix);
    return at.cancel || (at.cancel = `${prefix}_CANCEL`);
  }
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
  static REMOVE(prefix: string) {
    const at = getCachedActionType(prefix);
    return at.remove || (at.remove = `${prefix}_REMOVE`);
  }
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
  static UPDATE(prefix: string) {
    const at = getCachedActionType(prefix);
    return at.update || (at.update = `${prefix}_UPDATE`);
  }
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
  static ADD_FIRST(prefix: string) {
    const at = getCachedActionType(prefix);
    return at.addFirst || (at.addFirst = `${prefix}_ADD_FIRST`);
  }
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
  static ADD_LAST(prefix: string) {
    const at = getCachedActionType(prefix);
    return at.addLast || (at.addLast = `${prefix}_ADD_LAST`);
  }
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
  static REPLACE(prefix: string) {
    const at = getCachedActionType(prefix);
    return at.replace || (at.replace = `${prefix}_REPLACE`);
  }
}

export class ActionCreator {
  static makeHttpPagingFetch(actionType: string): HttpActionCreatorType {
    return (
      params: {
        limit?: number;
        firstOffset?: boolean;
        clear?: boolean;
        [key: string]: any;
      } = {}
    ) => ({
      type: actionType,
      payload: {
        ...params,
      },
    });
  }

  static makeReset(actionType: string): ActionCreatorType {
    return () => ({
      type: ActionTypeMaker.RESET(actionType),
    });
  }

  static makeCancel(actionType: string): ActionCreatorType {
    return () => ({
      type: ActionTypeMaker.CANCEL(actionType),
    });
  }

  static makeAddLast(
    actionType: string
  ): (data: PagingData) => IAsyncAction | IAsyncPagingAction {
    return (data: PagingData) => ({
      type: ActionTypeMaker.ADD_LAST(actionType),
      payload: data,
    });
  }

  static makeAddFirst(
    actionType: string
  ): (data: PagingData) => IAsyncAction | IAsyncPagingAction {
    return (data: PagingData) => ({
      type: ActionTypeMaker.ADD_FIRST(actionType),
      payload: data,
    });
  }

  static makeRemove(
    actionType: string
  ): (id: number) => IAsyncAction | IAsyncPagingAction {
    return (id: number) => ({
      type: ActionTypeMaker.REMOVE(actionType),
      payload: id,
    });
  }

  static makeUpdate(
    actionType: string
  ): (data: PagingData) => IAsyncAction | IAsyncPagingAction {
    return (data: PagingData) => ({
      type: ActionTypeMaker.UPDATE(actionType),
      payload: data,
    });
  }

  static makeReplace(
    actionType: string
  ): (
    replacingId: number,
    replacedData: PagingData
  ) => IAsyncAction | IAsyncPagingAction {
    return (replacingId, replacedData: PagingData) => ({
      type: ActionTypeMaker.REPLACE(actionType),
      payload: {
        id: replacingId,
        data: replacedData,
      },
    });
  }
}
