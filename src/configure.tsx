import { IAsyncAction, HttpPayload } from './actionKits';
import { WatcherConfig } from './sagaWatcherKits';

export interface IConfig {
  baseUrlSelector?:
    | ((config: WatcherConfig, state: any, action: IAsyncAction) => string)
    | null;
  httpHeaderSelector?:
    | ((
        config: WatcherConfig,
        state: any,
        action: IAsyncAction,
        http: HttpPayload
      ) => Headers)
    | null;

  /**
   * A saga function to be executed between pending status and success/fail status
   */
  middleSagaCallback?:
    | ((config: WatcherConfig, state: any, action: IAsyncAction) => any)
    | null;

  /**
   * A saga function to be executed after fail status detected
   */
  failSagaCallback?:
    | ((config: WatcherConfig, action: IAsyncAction) => any)
    | null;

  /**
   * Custom function for http request
   */
  customFetch?:
    | ((input: RequestInfo, init?: RequestInit) => Promise<any>)
    | null;

  /**
   * Provide a function for transforming http request options before passing the request
   */
  transformHttpRequestOption?:
    | ((config: WatcherConfig, state: any, init?: RequestInit) => RequestInit)
    | null;
}

var _config: IConfig = {
  baseUrlSelector: null,
  httpHeaderSelector: null,
  middleSagaCallback: null,
  failSagaCallback: null,
  customFetch: null,
  transformHttpRequestOption: null,
};

export function configure(config: IConfig): IConfig {
  var _config: IConfig = {
    baseUrlSelector: null,
    httpHeaderSelector: null,
    middleSagaCallback: null,
    failSagaCallback: null,
    customFetch: null,
    transformHttpRequestOption: null,
    ...config,
  };

  return _config;
}

export function getConfig(): IConfig {
  return _config;
}
