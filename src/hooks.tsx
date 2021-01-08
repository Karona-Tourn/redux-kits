import { useEffect, useRef, DependencyList } from 'react';
import { useSelector, DefaultRootState, shallowEqual } from 'react-redux';
import _ from 'lodash';

var emptyObject = {};

type Error =
  | {
      status: number;
      message: string;
    }
  | null
  | undefined;

type AsyncEffectCallback<T> =
  | ((isFail: boolean, error: Error, selectData: T) => void | undefined)
  | null
  | undefined;

type TAsyncSelected<T> = {
  [P in keyof T]?: T[P];
} & {
  isPending?: boolean;
  isFail?: boolean;
  error?: Error;
  hasMore?: boolean;
};

export function usePrevious(value: any, defaultValue: any = undefined) {
  const ref = useRef(defaultValue);

  useEffect(() => {
    ref.current = value;
  });

  return ref.current;
}

/**
 *
 * @param reducerPath
 * @param extraSelector
 * @param onFinish
 * @param deps
 */
export function useAsyncReducerEffect<
  TSelected extends TAsyncSelected<TSelected>,
  TState = DefaultRootState
>(
  reducerPath: string,
  extraSelector: (state: TState, destState: TState) => TSelected,
  onFinish: AsyncEffectCallback<TAsyncSelected<TSelected>>,
  deps?: DependencyList
): TAsyncSelected<TSelected> {
  const finishCallback = useRef(onFinish);

  const ret = useSelector((state: TState) => {
    const destState = _.get(state, reducerPath);

    return {
      isPending: destState.pending ? true : false,
      isFail: destState.error ? true : false,
      error: destState.error,
      ...(extraSelector ? extraSelector(state, destState) : emptyObject),
    } as TSelected;
  }, shallowEqual);

  useEffect(() => {
    finishCallback.current = onFinish;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  const isPendingPreviously = usePrevious(ret.isPending, false);

  useEffect(() => {
    if (isPendingPreviously !== ret.isPending && !ret.isPending) {
      finishCallback.current &&
        finishCallback.current(ret.isFail ? true : false, ret.error, ret);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ret.isPending, finishCallback.current]);

  return ret;
}

/**
 *
 * @param reducerPath string as a path to async paging reducer. Path is separated by dot (.)
 * @param extraSelector function as a state selector
 * @param onFinish
 * @param deps
 */
export function useAsyncPagingReducerEffect<
  TSelected extends TAsyncSelected<TSelected>,
  TState = DefaultRootState
>(
  reducerPath: string,
  extraSelector: (state: TState, destState: TState) => TSelected,
  onFinish: AsyncEffectCallback<TAsyncSelected<TSelected>>,
  deps?: DependencyList
): TAsyncSelected<TSelected> {
  return useAsyncReducerEffect<TSelected, TState>(
    reducerPath,
    (state: TState, destState: TState) => {
      const ds: any = destState;

      return {
        hasMore: ds.hasMore ? true : false,
        ...(extraSelector ? extraSelector(state, destState) : emptyObject),
      } as TSelected;
    },
    onFinish,
    deps
  );
}
