import { ActionTypeMaker } from '../actionKits';
import {
  createAsyncPagingReducer,
  createAsyncReducer,
  createReducerBatch,
} from '../reducerKits';

describe('Test createAsyncReducer', () => {
  const type = 'TYPE';
  const defaultState = {
    data: null,
    pending: false,
    error: null,
  };
  const reducer = createAsyncReducer(type);

  it('Test reducer returning unchanged state with an unmatched action', () => {
    expect(
      reducer(defaultState, {
        type: 'ANOTHER_TYPE',
      })
    ).toBe(defaultState);
  });
  it('Test pending reducer', () => {
    expect(
      reducer(defaultState, {
        type: ActionTypeMaker.PENDING(type),
      })
    ).toMatchObject({
      pending: true,
    });
  });
  it('Test success reducer', () => {
    expect(
      reducer(defaultState, {
        type: ActionTypeMaker.SUCCESS(type),
        payload: [10],
      })
    ).toMatchObject({
      pending: false,
      error: null,
      data: [10],
    });
  });
  it('Test fail reducer', () => {
    expect(
      reducer(defaultState, {
        type: ActionTypeMaker.FAIL(type),
        payload: 'failed!',
      })
    ).toMatchObject({
      pending: false,
      error: 'failed!',
    });
  });
  it('Test reset reducer', () => {
    expect(
      reducer(
        { ...defaultState, data: 'any data' },
        {
          type: ActionTypeMaker.RESET(type),
        }
      )
    ).toEqual(defaultState);
  });
});

describe('Test createAsyncPagingReducer', () => {
  const type = 'TYPE';
  const defaultState = {
    data: [],
    offset: 0,
    pending: false,
    error: null,
    hasMore: true,
  };
  const testingData = [
    {
      id: 1,
      name: 'Karona',
    },
  ];
  const reducer = createAsyncPagingReducer(type);

  it('Test reducer returning unchanged state with an unmatched action', () => {
    expect(
      reducer(defaultState, {
        type: 'ANOTHER_TYPE',
        payload: {
          data: testingData,
        },
      })
    ).toBe(defaultState);
  });
  it('Test pending reducer', () => {
    expect(
      reducer(
        { ...defaultState, data: testingData, offset: 1 },
        {
          type: ActionTypeMaker.PENDING(type),
          payload: {
            clear: true,
          },
        }
      )
    ).toMatchObject({
      pending: true,
      data: [],
      offset: 0,
      hasMore: true,
    });
  });
  it('Test success reducer', () => {
    expect(
      reducer(defaultState, {
        type: ActionTypeMaker.SUCCESS(type),
        payload: {
          data: testingData,
          firstOffset: false,
        },
      })
    ).toMatchObject({
      pending: false,
      error: null,
      data: testingData,
      offset: 1,
      hasMore: true,
    });
  });
  it('Test fail reducer', () => {
    expect(
      reducer(defaultState, {
        type: ActionTypeMaker.FAIL(type),
        payload: {
          message: 'failed!',
        },
      })
    ).toMatchObject({
      pending: false,
      error: {
        message: 'failed!',
      },
    });
  });
  it('Test reset reducer', () => {
    expect(
      reducer(
        {
          ...defaultState,
          data: testingData,
          offset: 1,
        },
        {
          type: ActionTypeMaker.RESET(type),
          payload: {},
        }
      )
    ).toEqual(defaultState);
  });
  it('Test add last reducer', () => {
    const newState = reducer(
      {
        ...defaultState,
        data: testingData,
        offset: 1,
      },
      {
        type: ActionTypeMaker.ADD_LAST(type),
        payload: {
          id: 2,
          value: 100,
        },
      }
    );
    expect(newState.data.length).toBe(2);
    expect(newState.offset).toBe(2);
  });
  it('Test add first reducer', () => {
    const newState = reducer(
      {
        ...defaultState,
        data: testingData,
        offset: 1,
      },
      {
        type: ActionTypeMaker.ADD_FIRST(type),
        payload: {
          id: 2,
          value: 100,
        },
      }
    );
    expect(newState.data.length).toBe(2);
    expect(newState.offset).toBe(2);
  });
  it('Test replace reducer', () => {
    const newState = reducer(
      {
        ...defaultState,
        data: testingData,
        offset: 1,
      },
      {
        type: ActionTypeMaker.REPLACE(type),
        payload: {
          id: 1,
          data: {
            id: 10,
            value: 100,
          },
        },
      }
    );
    expect(newState.data.length).toBe(1);
    expect(newState.offset).toBe(1);
    expect(newState.data[0]).toEqual({
      id: 10,
      value: 100,
    });
  });
  it('Test remove reducer', () => {
    let newState = reducer(
      {
        ...defaultState,
        data: testingData,
        offset: 1,
      },
      {
        type: ActionTypeMaker.REMOVE(type),
        payload: 10,
      }
    );

    expect(newState.data.length).toBe(1);
    expect(newState.offset).toBe(1);

    newState = reducer(
      {
        ...defaultState,
        data: testingData,
        offset: 1,
      },
      {
        type: ActionTypeMaker.REMOVE(type),
        payload: 1,
      }
    );
    expect(newState.data.length).toBe(0);
    expect(newState.offset).toBe(0);
  });
});

it('Test createReducerBatch', () => {
  const reducer = createReducerBatch({
    volume: ['SET_VOLUME', 1.0],
    mute: ['SET_MUTE', false],
  });

  expect(reducer).toHaveProperty('volume');
  expect(reducer).toHaveProperty('mute');

  expect(reducer.volume(1.0, { type: '?' })).toBe(1.0);
  expect(reducer.mute(false, { type: '?' })).toBeFalsy();

  expect(reducer.volume(1.0, { type: 'SET_VOLUME', payload: 0.5 })).toBe(0.5);
  expect(reducer.mute(false, { type: 'SET_MUTE', payload: true })).toBeTruthy();
});
