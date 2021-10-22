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
  takeLeading,
  takeEvery,
} from 'redux-saga/effects';
import qs from 'qs';
import {
  ActionTypeMaker,
  IAsyncAction,
  HttpPayload,
  BasicAsyncActionTypes,
} from './actionKits';
import { getConfig } from './configure';
import {
  HttpStatusCodes,
  isHttpJsonResponse,
  isHttpResponse,
  parseError,
} from './utils';

export interface FailResult {
  message: string;
  status?: boolean;
}

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
 * Note: it will be used by [[runAsync]]
 */
export interface IAsyncStatus {
  pending?: string;
  success: string;
  fail: string;
  reset?: string;
  cancel?: string;
}

export type PromiseFunction = () => Promise<any>;

export interface IAsyncConfig {
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
    | ((
        state: any,
        action: any,
        results: any[] | any,
        rawResults: any[]
      ) => { data?: any } | any)
    | null;

  mapFailToPayload?:
    | ((data: {
        state: any;
        action: any;
        error: any;
        rawError: any;
      }) => {
        [key: string]: any;
        error: any;
      })
    | null;
  /**
   * @deprecated Use [[mapPendingToPayload]] instead
   */
  mapActionToPendingPayload?: ((state: any, action: any) => object) | null;

  /**
   * Map dispatched action to pending payload to be stored in reducer with a matched action type ending with `_PENDING`.
   * Reference information [[createAsyncReducer]] or [[createAsyncPagingReducer]]
   */
  mapPendingToPayload?: ((state: any, action: any) => object) | null;
  /**
   * Tell if need to reset a reducer when dispatching a action type action type ending with `_CANCEL`
   * Reference information [[createAsyncReducer]] or [[createAsyncPagingReducer]]
   */
  resetIfCanceled?: boolean;

  /**
   * Tell whether or not after spawning a task once, it blocks until spawned saga completes and then starts to listen for a task again.
   * It is a choice of using between [takeLatest](https://redux-saga.js.org/docs/api/) and [takeLeading](https://redux-saga.js.org/docs/api/) in redux saga
   */
  listenOnceAtTime?: boolean;

  /**
   * Tell if array of promise tasks or http tasks should run in parallel or sequence
   */
  runInSequence?: boolean;

  takeType?: 'leading' | 'latest' | 'every';
}

export interface WatcherConfig extends IAsyncConfig {
  /**
   * Main action type corresponding to action type prefix in [[createAsyncPagingReducer]] or [[createAsyncReducer]]
   */
  actionPrefix: string;
}

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
 *      pending: ActionTypeMaker.PENDING('FETCH_CART'),
 *      success: ActionTypeMaker.SUCCESS('FETCH_CART'),
 *      fail: ActionTypeMaker.FAIL('FETCH_CART'),
 *      reset: ActionTypeMaker.RESET('FETCH_CART'),
 *      cancel: ActionTypeMaker.CANCEL('FETCH_CART'),
 *    }
 *   });
 *
 *  // Wait if success or fail
 *  yield take([ActionTypeMaker.SUCCESS('FETCH_CART'), ActionTypeMaker.FAIL('FETCH_CART')])
 * }
 * ```
 */
export function* runAsync(config: IAsyncConfig, rootAction: IAsyncAction) {
  if (!config.statuses) {
    config.statuses = {
      success: BasicAsyncActionTypes.SUCCESS,
      fail: BasicAsyncActionTypes.FAIL,
      cancel: BasicAsyncActionTypes.CANCEL,
    };
  }

  const task = yield fork(
    function* (_config: IAsyncConfig, _rootAction: IAsyncAction) {
      try {
        let state = yield select();

        if (_config?.statuses?.pending) {
          const pendingAction: any = {
            type: _config.statuses.pending,
            key: _rootAction?.key,
          };

          if (_config.mapPendingToPayload) {
            pendingAction.payload = _config.mapPendingToPayload(
              state,
              _rootAction
            );
          }

          yield put(pendingAction);
        }

        const middleSagaCallback = getConfig().middleSagaCallback;

        // Execute generator function middleware
        if (middleSagaCallback) {
          yield call(
            middleSagaCallback,
            _config as WatcherConfig,
            state,
            _rootAction
          );
        }

        let payload = null;
        let httpRequests: CallEffect[] = [];

        // Handle http request tasks
        if (_rootAction && _rootAction.http) {
          state = yield select();

          const baseUrlSelector = getConfig().baseUrlSelector;

          const baseUrl = baseUrlSelector
            ? baseUrlSelector(_config as WatcherConfig, state, _rootAction)
            : '';

          httpRequests = httpRequests.concat(
            _rootAction.http.map((http: HttpPayload) => {
              let { url, params, headers, body, method, ...rest } = http;
              const hasFormData = body instanceof FormData;

              let query = '';

              if (params) {
                query = `?${qs.stringify(params)}`;
              }

              const httpHeaderSelector = getConfig().httpHeaderSelector;

              const baseHeaders = httpHeaderSelector
                ? httpHeaderSelector(
                    _config as WatcherConfig,
                    state,
                    _rootAction,
                    http
                  )
                : ({} as Headers);

              const transformHttpRequestOptions = getConfig()
                .transformHttpRequestOption;

              // Get fetch function for http request
              const f = getConfig().customFetch ?? fetch;

              url = `${baseUrl}${url}${query}`;

              let reqInit: RequestInit = {
                headers: headers
                  ? {
                      ...baseHeaders,
                      ...headers,
                    }
                  : baseHeaders,
                method,
                ...rest,
              };

              if (transformHttpRequestOptions) {
                reqInit.body = body as any;

                reqInit =
                  transformHttpRequestOptions(
                    _config as WatcherConfig,
                    state,
                    reqInit
                  ) ?? reqInit;
              } else {
                reqInit.body =
                  method === 'GET'
                    ? null
                    : !body
                    ? ''
                    : typeof body === 'string' || hasFormData
                    ? (body as FormData)
                    : JSON.stringify(body);
              }

              return call(f, url, reqInit);
            })
          );
        }

        // Handle general promise tasks
        if (_config.getPromises) {
          httpRequests = httpRequests.concat(
            _config
              .getPromises(state, _rootAction)
              .map((e: () => Promise<any>) => call(e))
          );
        }

        let responses: any = null;

        if (_config.runInSequence) {
          responses = [];

          for (let req of httpRequests) {
            const httpRes = yield req;
            responses.push(httpRes);
          }
        } else {
          responses = yield all(httpRequests);
        }

        // Find failed http response
        const failHttpResponse = responses.find(
          (e: any) => isHttpResponse(e) && e.status !== HttpStatusCodes.OK
        );

        // Handle throwing error exception in case there is failed http response
        if (failHttpResponse) {
          let error: any = null;

          if (isHttpJsonResponse(failHttpResponse)) {
            error = yield call([failHttpResponse, 'json']);
          } else {
            error = yield call([failHttpResponse, 'text']);
          }

          throw {
            message:
              typeof error === 'string'
                ? error
                : error?.message
                ? error?.message
                : error?.error
                ? error?.error
                : 'Something went wrong!',
            status: failHttpResponse.status,
          };
        }

        const datas = yield all(
          responses.map((e: any) => {
            if (isHttpResponse(e)) {
              if (isHttpJsonResponse(e)) {
                return call([e, 'json']);
              } else if (e.text) {
                return call([e, 'text']);
              }
            }

            return call(function* (p) {
              return p;
            }, e);
          })
        );

        const transformFailResult = getConfig().transformFailResult;

        if (transformFailResult) {
          datas.forEach((e: any, index: number) => {
            const failResult = transformFailResult(e);

            if (failResult) {
              throw {
                status: responses[index].status,
                ...failResult,
              };
            }
          });
        }

        payload = _config.mapResultToPayload
          ? _config.mapResultToPayload(
              state,
              _rootAction,
              datas.map(getConfig().transformSuccessResult),
              datas
            )
          : datas.length === 1
          ? getConfig().transformSuccessResult?.(datas[0], 0, datas)
          : datas;

        yield put({
          type: _config?.statuses?.success,
          payload,
          key: _rootAction?.key,
        });
      } catch (error) {
        let err: any = parseError(error);

        if (_config.mapFailToPayload) {
          const state = yield select();

          err = _config.mapFailToPayload({
            state,
            action: _rootAction,
            error: err,
            rawError: error,
          });
        }

        yield put({
          type: _config?.statuses?.fail,
          payload: err,
          key: _rootAction?.key,
        });
      } finally {
        if (yield cancelled()) {
          if (_config.resetIfCanceled && _config?.statuses?.reset) {
            yield put({
              type: _config.statuses.reset,
              key: _rootAction?.key,
            });
          }
        }
      }
    },
    config,
    rootAction
  );

  const action = yield take([
    config.statuses?.cancel ?? BasicAsyncActionTypes.CANCEL,
    config.statuses.success,
    config.statuses.fail,
  ]);

  if (action.type === config?.statuses?.cancel && task) {
    yield cancel(task);
  }

  const failSagaCallback: any = getConfig().failSagaCallback;

  if (failSagaCallback) {
    if (action.type === config?.statuses?.fail) {
      yield call(failSagaCallback, config, action);
    }
  }
}

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
 * function* rootSaga() {
 *  yield all([
 *    watchFetchCart()
 *  ]);
 * }
 *
 * // Reducer
 * const carts = createAsyncReducer('FETCH_CART')
 * ```
 */
export function createAsyncWatcher(
  config: WatcherConfig = {
    actionPrefix: '',
    getPromises: null,
    statuses: null,
    mapResultToPayload: null,
    mapPendingToPayload: null,
    mapActionToPendingPayload: null,
    resetIfCanceled: true,
    listenOnceAtTime: false,
  }
) {
  const {
    actionPrefix,
    statuses,
    takeType,
    mapPendingToPayload,
    mapActionToPendingPayload,
    ...restConfig
  } = config;

  const takeTask = takeType
    ? takeType === 'latest'
      ? takeLatest
      : takeType === 'leading'
      ? takeLeading
      : takeEvery
    : config.listenOnceAtTime
    ? takeLeading
    : takeLatest;

  const _mapPendingToPayload = mapPendingToPayload ?? mapActionToPendingPayload;

  return function* () {
    yield takeTask(actionPrefix, function* (action) {
      yield call(
        runAsync,
        {
          ...restConfig,
          mapPendingToPayload: (state, action) => {
            let payload: any = action.payload ?? {};

            if (_mapPendingToPayload) {
              payload = {
                ...payload,
                ...(_mapPendingToPayload(state, action) ?? {}),
              };
            }
            return payload;
          },
          statuses: {
            pending: ActionTypeMaker.PENDING(actionPrefix),
            success: ActionTypeMaker.SUCCESS(actionPrefix),
            fail: ActionTypeMaker.FAIL(actionPrefix),
            cancel: ActionTypeMaker.CANCEL(actionPrefix),
            reset: ActionTypeMaker.RESET(actionPrefix),
            ...(statuses || {}),
          },
        },
        action
      );
    });
  };
}

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
 * function* rootSaga() {
 *  yield all([
 *    watchFetchCart()
 *  ]);
 * }
 *
 * // Reducer
 * const products = createAsyncPagingReducer('FETCH_PRODUCTS');
 * ```
 */
export function createAsyncPagingWatcher(
  config: WatcherConfig = {
    actionPrefix: '',
    getPromises: null,
    statuses: null,
    mapResultToPayload: null,
    mapPendingToPayload: null,
    mapActionToPendingPayload: null,
    resetIfCanceled: true,
    listenOnceAtTime: false,
  }
) {
  const {
    mapResultToPayload,
    mapActionToPendingPayload,
    mapPendingToPayload,
    ...restConfig
  } = config;

  const _mapPendingToPayload = mapPendingToPayload ?? mapActionToPendingPayload;

  return createAsyncWatcher({
    ...restConfig,
    mapPendingToPayload: (state, action) => {
      let payload: any = {
        clear: action.payload.clear,
        firstOffset: action.payload.firstOffset ?? true,
      };

      payload.clear = payload.clear ?? false;

      if (_mapPendingToPayload) {
        payload = {
          ...payload,
          ...(_mapPendingToPayload(state, action) ?? {}),
        };
      }
      return payload;
    },
    mapResultToPayload: (state, action, data, rawData) => {
      let payload: any = {
        firstOffset: action.payload.firstOffset ?? true,
      };

      if (mapResultToPayload) {
        payload = {
          ...payload,
          ...mapResultToPayload(state, action, data, rawData),
        };
      } else {
        payload.data = data;
      }

      return payload;
    },
  });
}
