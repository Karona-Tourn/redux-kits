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
} from 'redux-saga/effects';
import { isFalseValue } from './utils';
import qs from 'qs';
import actionTypeMaker from './actionKits';

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
  statuses: ApiStatus | null;
  showGlobalError: boolean;
  mapResultToPayload?:
    | ((state: any, action: any, results: any[] | any) => object)
    | null;
  mapActionToPendingPayload?: ((state: any, action: any) => object) | null;
  resetIfCanceled: boolean;
}

export function parseError(error) {
  return {
    message: error.message,
    status: error.status,
  };
}

var _baseUrlSelector = null;
const setBaseUrlSelector = (selector) => {
  _baseUrlSelector = selector;
};

var _httpHeaderSelector = null;
const setHeaderSelector = (selector) => {
  _httpHeaderSelector = selector;
};

var _executingMiddlewareGenerator = null;
const setExecutingMiddlewareGenerator = (generator) => {
  _executingMiddlewareGenerator = generator;
};

var _failExecutingGenerator = null;
const setFailExecutingGenerator = (generator) => {
  _failExecutingGenerator = generator;
};

export const sagaHttpConfiguration = {
  setBaseUrlSelector,
  setHeaderSelector,
  setExecutingMiddlewareGenerator,
  setFailExecutingGenerator,
};

export function* runApi(config: RunApiConfig, rootAction) {
  const task = yield fork(
    function* (config, rootAction) {
      try {
        const state = yield select();

        if (!isFalseValue(config.statuses.pending)) {
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
        let httpRequests = [];

        if (!isFalseValue(rootAction) && !isFalseValue(rootAction.http)) {
          const state = yield select();

          const baseUrl = _baseUrlSelector
            ? _baseUrlSelector(config, state, rootAction)
            : '';

          httpRequests = httpRequests.concat(
            rootAction.http.map((http) => {
              const { url, params, headers, body, ...rest } = http;
              let query = '';

              if (!isFalseValue(params)) {
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
            config.getApi(state, rootAction).map((e) => call(e))
          );
        }

        const responses = yield all(httpRequests);

        // Find failed response
        const failResponse = responses.find((e) => e.status != 200);

        if (failResponse) {
          const error = yield call([failResponse, 'json']);

          throw {
            message: error.message || 'Something went wrong!',
            status: failResponse.status,
          };
        }

        const datas = yield all(responses.map((e) => call([e, 'json'])));

        const failData = datas.find((e) => !e.success);
        if (failData) {
          throw {
            message: failData.message,
          };
        }

        payload = config.mapResultToPayload
          ? config.mapResultToPayload(
              state,
              rootAction,
              datas.map((e) => e.data)
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
          if (config.resetIfCanceled && !isFalseValue(config.statuses.reset)) {
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
    config.statuses.cancel || '?',
    config.statuses.success,
    config.statuses.fail,
  ]);

  if (action.type == config.statuses.cancel && !isFalseValue(task)) {
    yield cancel(task);
  }

  if (_failExecutingGenerator) {
    if (action.type == config.statuses.fail) {
      yield call(_failExecutingGenerator, config, action);
    }
  }
}

export interface ApiConfig extends RunApiConfig {
  actionPrefix: string | null;
}

export function createAsyncApiWatcher(
  config: ApiConfig = {
    actionPrefix: null,
    getApi: null,
    statuses: null,
    showGlobalError: false,
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
    actionPrefix: null,
    getApi: null,
    statuses: null,
    showGlobalError: false,
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
      let payload = {
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
      let payload = {
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
