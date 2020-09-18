import { useEffect, useRef, DependencyList } from 'react';
import { useSelector, DefaultRootState } from 'react-redux';
import _ from 'lodash';

var emptyObject = {};

type Error =
  | {
      status: number;
      message: string;
    }
  | null
  | undefined;

type AsyncEffectCallback =
  | ((isFail: boolean, error: Error) => void | undefined)
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

// = unknown
export function useAsyncReducerEffect<
  TSelected extends TAsyncSelected<TSelected>,
  TState = DefaultRootState
>(
  reducerPath: string,
  extraSelector: (state: TState, destState: TState) => TSelected,
  onFinish: AsyncEffectCallback,
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
  });

  useEffect(() => {
    finishCallback.current = onFinish;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  const isPendingPreviously = usePrevious(ret.isPending, false);

  useEffect(() => {
    if (isPendingPreviously !== ret.isPending && !ret.isPending) {
      finishCallback.current &&
        finishCallback.current(ret.isFail ? true : false, ret.error);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ret.isPending, finishCallback.current]);

  return ret;
}

export function useAsyncPagingReducerEffect<
  TSelected extends TAsyncSelected<TSelected>,
  TState = DefaultRootState
>(
  reducerPath: string,
  extraSelector: (state: TState, destState: TState) => TSelected,
  onFinish: AsyncEffectCallback,
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
