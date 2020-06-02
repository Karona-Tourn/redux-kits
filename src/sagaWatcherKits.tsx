import {
  all,
  takeLatest,
  fork,
  call,
  put,
  select,
  take,
  cancelled,
  cancel,
  CallEffect,
} from 'redux-saga/effects';
import qs from 'qs';
import { actionTypeMaker } from './actionKits';
import { IAsyncAction } from './reducerKits';

/**
 * Instance object that will become:
 *
 * ```javascript
 * // Example
 * {
 *  pending: 'FETCH_CART_PENDING',
 *  success: 'FETCH_CART_SUCCESS',
 *  fail: 'FETCH_CART_FAIL',
 *  reset: 'FETCH_CART_RESET',
 *  cancel: 'FETCH_CART_CANCEL'
 * }
 * ```
 *
 * Note: it will be used by [[runApi]]
 */
export interface IAsyncStatus {
  pending?: string | null;
  success: string | null;
  fail: string | null;
  reset?: string | null;
  cancel?: string | null;
}

export type PromiseFunction = () => Promise<any>;

export interface IAsyncConfig {
  /**
   * @deprecated Use [[getPromises]] instead
   */
  getApi?: ((state: any, action: any) => PromiseFunction[]) | null;
  getPromises?: ((state: any, action: any) => PromiseFunction[]) | null;

  /**
   * Statues to be override
   */
  statuses?: IAsyncStatus | null;
  /**
   * Map results from finished promises to a payload to be stored in reducer with a matched action type ending with `_SUCCESS`.
   * Reference information [[createAsyncReducer]] or [[createAsyncPagingReducer]]
   */
  mapResultToPayload?:
    | ((state: any, action: any, results: any[] | any) => object)
    | null;
  /**
   * Map dispatched action to pending payload to be stored in reducer with a matched action type ending with `_PENDING`.
   * Reference information [[createAsyncReducer]] or [[createAsyncPagingReducer]]
   */
  mapActionToPendingPayload?: ((state: any, action: any) => object) | null;
  /**
   * Tell if need to reset a reducer when dispatching a action type action type ending with `_CANCEL`
   * Reference information [[createAsyncReducer]] or [[createAsyncPagingReducer]]
   */
  resetIfCanceled?: boolean;
}

export interface WatcherConfig extends IAsyncConfig {
  /**
   * Main action type corresponding to action type prefix in [[createAsyncPagingReducer]] or [[createAsyncReducer]]
   */
  actionPrefix: string;
}

export type HttpPayload = {
  url: string;
  headers?: Headers;
  method: 'GET' | 'POST' | 'DELETE' | 'UPDATE';
  params?: object;
  body?: object;
};

/**
 * @ignore
 */
export function parseError(error: { message: string; status: number }) {
  return {
    message: error.message,
    status: error.status,
  };
}

type BaseUrlSelector =
  | ((config: WatcherConfig, state: any, action: IAsyncAction) => string)
  | null;
var _baseUrlSelector: BaseUrlSelector = null;
const setBaseUrlSelector = (selector: BaseUrlSelector) => {
  _baseUrlSelector = selector;
};

export type HttpHeaderSelector =
  | ((
      config: WatcherConfig,
      state: any,
      action: IAsyncAction,
      http: HttpPayload
    ) => Headers)
  | null;
var _httpHeaderSelector: HttpHeaderSelector = null;
const setHeaderSelector = (selector: HttpHeaderSelector) => {
  _httpHeaderSelector = selector;
};

export type MiddleSagaCallback =
  | ((
      config: WatcherConfig,
      state: any,
      action: IAsyncAction,
      http: HttpPayload
    ) => any)
  | null;
var _middleSagaCallback: ((...args: any[]) => any) | null = null;

/**
 * Set a saga function to be executed between pending status and success/fail status
 *
 * @param saga Saga function
 */
export const setMiddleSagaCallback = (saga: MiddleSagaCallback) => {
  _middleSagaCallback = saga;
};

type FailSagaCallback =
  | ((config: WatcherConfig, action: IAsyncAction) => any)
  | null;
var _failSagaCallback: ((...args: any[]) => any) | null = null;

/**
 * Set a saga function to be executed after fail status detected
 *
 * @param saga Saga function
 */
export const setFailSagaCallback = (saga: FailSagaCallback) => {
  _failSagaCallback = saga;
};

/**
 * @deprecated This will be removed soon. use [[setFailSagaCallback]], [[setMiddleSagaCallback]], [[setHeaderSelector]] and [[setBaseUrlSelector]] directly instead.
 */
export const sagaConfiguration = {
  setBaseUrlSelector,
  setHeaderSelector,
  setExecutingMiddlewareGenerator: setMiddleSagaCallback,
  setFailExecutingGenerator: setFailSagaCallback,
};

/**
 * @deprecated The function will be removed soon. Use [[sagaConfiguration]] instead.
 */
export const sagaHttpConfiguration = sagaConfiguration;

/**
 * Function for helping running async task having status pending, success, fail and cancel
 *
 * @param config
 * @param rootAction
 *
 * ```javascript
 * // Example
 * function* saga() {
 *  const task = yield fork(runAsync, {
 *    getPromises: () => [() => api.fetchCart()],
 *    statuses: {
 *      pending: actionTypeMaker.PENDING('FETCH_CART'),
 *      success: actionTypeMaker.SUCCESS('FETCH_CART'),
 *      fail: actionTypeMaker.FAIL('FETCH_CART'),
 *      reset: actionTypeMaker.RESET('FETCH_CART'),
 *      cancel: actionTypeMaker.CANCEL('FETCH_CART'),
 *    }
 *   });
 * 
 *  // Wait if success or fail
 *  yield take([actionTypeMaker.SUCCESS('FETCH_CART'), actionTypeMaker.FAIL('FETCH_CART')])
 * }
 * ```
 */
export function* runAsync(config: IAsyncConfig, rootAction: IAsyncAction) {
  if (!config.getPromises) {
    config.getPromises = config.getApi;
  }

  const task = yield fork(
    function* (config, rootAction) {
      try {
        const state = yield select();

        if (config.statuses.pending) {
          if (config.mapActionToPendingPayload) {
            yield put({
              type: config.statuses.pending,
              payload: config.mapActionToPendingPayload(state, rootAction),
            });
          } else {
            yield put({
              type: config.statuses.pending,
            });
          }
        }

        // Execute generator function middleware
        if (_middleSagaCallback) {
          yield call(_middleSagaCallback, config, state, rootAction);
        }

        let payload = null;
        let httpRequests: CallEffect[] = [];

        if (rootAction && rootAction.http) {
          const state = yield select();

          const baseUrl = _baseUrlSelector
            ? _baseUrlSelector(config, state, rootAction)
            : '';

          httpRequests = httpRequests.concat(
            rootAction.http.map((http: HttpPayload) => {
              const { url, params, headers, body, ...rest } = http;
              let query = '';

              if (params) {
                query = `?${qs.stringify(params)}`;
              }

              const baseHeaders = _httpHeaderSelector
                ? _httpHeaderSelector(config, state, rootAction, http)
                : {};

              return call(fetch, `${baseUrl}${url}${query}`, {
                headers: {
                  ...baseHeaders,
                  ...headers,
                },
                ...rest,
                body: JSON.stringify(body),
              });
            })
          );
        }

        if (config.getPromises) {
          httpRequests = httpRequests.concat(
            config
              .getPromises(state, rootAction)
              .map((e: () => Promise<any>) => call(e))
          );
        }

        const responses = yield all(httpRequests);

        // Find failed response
        const failResponse = responses.find((e: any) => e.status != 200);

        if (failResponse) {
          const error: any = yield call([failResponse, 'json']);

          throw {
            message: error.message || 'Something went wrong!',
            status: failResponse.status,
          };
        }

        const datas = yield all(responses.map((e: any) => call([e, 'json'])));

        const failData = datas.find((e: any) => !e.success);
        if (failData) {
          throw {
            message: failData.message,
          };
        }

        payload = config.mapResultToPayload
          ? config.mapResultToPayload(
              state,
              rootAction,
              datas.map((e: any) => e.data)
            )
          : datas.length == 1
          ? datas[0].data
          : datas;

        yield put({
          type: config.statuses.success,
          payload,
        });
      } catch (error) {
        const err = parseError(error);
        yield put({
          type: config.statuses.fail,
          payload: err,
        });
      } finally {
        if (yield cancelled()) {
          if (config.resetIfCanceled && config.statuses.reset) {
            yield put({
              type: config.statuses.reset,
            });
          }
        }
      }
    },
    config,
    rootAction
  );

  const action = yield take([
    config.statuses?.cancel || '?',
    config.statuses?.success || '',
    config.statuses?.fail || '',
  ]);

  if (action.type == config?.statuses?.cancel && task) {
    yield cancel(task);
  }

  if (_failSagaCallback) {
    if (action.type == config?.statuses?.fail) {
      yield call(_failSagaCallback, config, action);
    }
  }
}

/**
 *
 * @deprecated The function will be removed soon. Use [[runAsync]] instead.
 */
export const runApi = runAsync;

/**
 * Create a saga watcher. It works closely with the function [[createAsyncReducer]] creating a reducer with the same matched prefix action type
 *
 * @param {WatcherConfig} config
 * 
 * ```javascript
 * // Saga watcher
 * const watchFetchCart = createAsyncWatcher({
 *  actionPrefix: 'FETCH_CART',
 *  getPromises: () => [() => api.fetchCart()]
 * });
 * 
 * // Reducer
 * const carts = createAsyncReducer('FETCH_CART')
 * ```
 */
export function createAsyncWatcher(
  config: WatcherConfig = {
    actionPrefix: '',
    getApi: null,
    getPromises: null,
    statuses: null,
    mapResultToPayload: null,
    mapActionToPendingPayload: null,
    resetIfCanceled: true,
  }
) {
  const { actionPrefix, statuses, ...restConfig } = config;

  return function* () {
    yield takeLatest(actionPrefix, function* (action) {
      yield call(
        runApi,
        {
          ...restConfig,
          statuses: {
            pending: actionTypeMaker.PENDING(actionPrefix),
            success: actionTypeMaker.SUCCESS(actionPrefix),
            fail: actionTypeMaker.FAIL(actionPrefix),
            cancel: actionTypeMaker.CANCEL(actionPrefix),
            reset: actionTypeMaker.RESET(actionPrefix),
            ...(statuses || {}),
          },
        },
        action
      );
    });
  };
}

/**
 * Create a saga watcher. It works closely with the function [[createAsyncReducer]] creating a reducer with the same matched prefix action type
 *
 * @deprecated The function will be removed soon. Use [[createAsyncWatcher]] instead.
 */
export const createAsyncApiWatcher = createAsyncWatcher;

/**
 * Create a saga watcher. It works closely with the function [[createAsyncPagingReducer]] creating a reducer with the same matched prefix action type
 *
 * @param {WatcherConfig} config
 * 
 * ```javascript
 * // Saga watcher
 * const watchFetchCart = createAsyncPagingWatcher({
 *  actionPrefix: 'FETCH_PRODUCTS',
 *  getPromises: (state, action) => [() => api.fetchProduct({ limit: action.payload.limit, offset: action.payload.firstOffset ? 0 : state.products.offset })]
 * });
 * 
 * // Reducer
 * const products = createAsyncPagingReducer('FETCH_PRODUCTS');
 * ```
 */
export function createAsyncPagingWatcher(
  config: WatcherConfig = {
    actionPrefix: '',
    getApi: null,
    getPromises: null,
    statuses: null,
    mapResultToPayload: null,
    mapActionToPendingPayload: null,
    resetIfCanceled: true,
  }
) {
  const {
    mapResultToPayload,
    mapActionToPendingPayload,
    ...restConfig
  } = config;

  return createAsyncApiWatcher({
    ...restConfig,
    mapActionToPendingPayload: (state, action) => {
      let payload: any = {
        cleanPrevious: action.payload.cleanPrevious,
      };
      if (mapActionToPendingPayload) {
        payload = {
          ...payload,
          ...mapActionToPendingPayload(state, action),
        };
      }
      return payload;
    },
    mapResultToPayload: (state, action, data) => {
      let payload: any = {
        firstOffset: action.payload.firstOffset,
      };

      if (mapResultToPayload) {
        payload = {
          ...payload,
          ...mapResultToPayload(state, action, data),
        };
      } else {
        payload.data = data;
      }

      return payload;
    },
  });
}

/**
 * Create a saga watcher. It works closely with the function [[createAsyncPagingReducer]] creating a reducer with the same matched prefix action type
 *
 * @deprecated The function will be removed soon. Use [[createAsyncPagingWatcher]] instead.
 */
export const createAsyncPagingApiWatcher = createAsyncPagingWatcher;
