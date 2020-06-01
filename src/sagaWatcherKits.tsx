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

export interface ApiStatus {
  pending?: string | null;
  success: string | null;
  fail: string | null;
  reset?: string | null;
  cancel?: string | null;
}

type ApiRequest = () => Promise<any>;

export interface RunApiConfig {
  getApi: ((state: any, action: any) => ApiRequest[]) | null;
  statuses?: ApiStatus | null;
  mapResultToPayload?:
    | ((state: any, action: any, results: any[] | any) => object)
    | null;
  mapActionToPendingPayload?: ((state: any, action: any) => object) | null;
  resetIfCanceled?: boolean;
}

export interface ApiConfig extends RunApiConfig {
  actionPrefix: string;
}

type HttpPayload = {
  url: string;
  headers: Headers;
  method: 'GET' | 'POST' | 'DELETE' | 'UPDATE';
  params: object;
  body: object;
};

export function parseError(error: { message: string; status: number }) {
  return {
    message: error.message,
    status: error.status,
  };
}

type BaseUrlSelector =
  | ((config: ApiConfig, state: any, action: IAsyncAction) => string)
  | null;
var _baseUrlSelector: BaseUrlSelector = null;
const setBaseUrlSelector = (selector: BaseUrlSelector) => {
  _baseUrlSelector = selector;
};

type HttpHeaderSelector =
  | ((
      config: ApiConfig,
      state: any,
      action: IAsyncAction,
      http: HttpPayload
    ) => Headers)
  | null;
var _httpHeaderSelector: HttpHeaderSelector = null;
const setHeaderSelector = (selector: HttpHeaderSelector) => {
  _httpHeaderSelector = selector;
};

type ExecutingMiddlewareGenerator =
  | ((
      config: ApiConfig,
      state: any,
      action: IAsyncAction,
      http: HttpPayload
    ) => any)
  | null;
var _executingMiddlewareGenerator: ((...args: any[]) => any) | null = null;
const setExecutingMiddlewareGenerator = (
  generator: ExecutingMiddlewareGenerator
) => {
  _executingMiddlewareGenerator = generator;
};

type FailExecutingGeneratorType =
  | ((config: ApiConfig, action: IAsyncAction) => any)
  | null;
var _failExecutingGenerator: ((...args: any[]) => any) | null = null;
const setFailExecutingGenerator = (generator: FailExecutingGeneratorType) => {
  _failExecutingGenerator = generator;
};

export const sagaHttpConfiguration = {
  setBaseUrlSelector,
  setHeaderSelector,
  setExecutingMiddlewareGenerator,
  setFailExecutingGenerator,
};

export function* runApi(config: RunApiConfig, rootAction: IAsyncAction) {
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
        if (_executingMiddlewareGenerator) {
          yield call(_executingMiddlewareGenerator, config, state, rootAction);
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

        if (config.getApi) {
          httpRequests = httpRequests.concat(
            config
              .getApi(state, rootAction)
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

  if (_failExecutingGenerator) {
    if (action.type == config?.statuses?.fail) {
      yield call(_failExecutingGenerator, config, action);
    }
  }
}

export function createAsyncApiWatcher(
  config: ApiConfig = {
    actionPrefix: '',
    getApi: null,
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
          },
        },
        action
      );
    });
  };
}

export function createAsyncPagingApiWatcher(
  config: ApiConfig = {
    actionPrefix: '',
    getApi: null,
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
