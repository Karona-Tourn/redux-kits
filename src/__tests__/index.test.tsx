import { actionTypeMaker, getCachedActionTypes } from '../actionKits';
import { createAsyncReducer, createReducers } from '../reducerKits';

describe('Test action types', () => {
  it('Test action type makers', () => {
    const type = 'TYPE';
    expect(actionTypeMaker.PENDING(type)).toBe('TYPE_PENDING');
    expect(actionTypeMaker.SUCCESS(type)).toBe('TYPE_SUCCESS');
    expect(actionTypeMaker.FAIL(type)).toBe('TYPE_FAIL');
    expect(actionTypeMaker.ADD_FIRST(type)).toBe('TYPE_ADD_FIRST');
    expect(actionTypeMaker.ADD_LAST(type)).toBe('TYPE_ADD_LAST');
    expect(actionTypeMaker.REMOVE(type)).toBe('TYPE_REMOVE');
    expect(actionTypeMaker.CANCEL(type)).toBe('TYPE_CANCEL');
    expect(actionTypeMaker.UPDATE(type)).toBe('TYPE_UPDATE');
    expect(actionTypeMaker.REPLACE(type)).toBe('TYPE_REPLACE');
    expect(actionTypeMaker.RESET(type)).toBe('TYPE_RESET');
  });

  it('Test action type is cached', () => {
    actionTypeMaker.PENDING('TYPE');
    expect(getCachedActionTypes()['TYPE'].pending).toBe('TYPE_PENDING');
  });
});

describe('Test reducers', () => {
  it('Test reducer returning unchanged state with an unmatched action', () => {
    const type = '';
    const reducer = createAsyncReducer(type);
    const defaultState = {
      data: null,
      pending: false,
      error: null,
    };
    expect(
      reducer(defaultState, {
        type: 'UNKNOWN',
      })
    ).toBe(defaultState);
  });

  it('Test createReducers', () => {
    const reducer = createReducers({
      volume: ['SET_VOLUME', 1.0],
      mute: ['SET_MUTE', false],
    });

    expect(reducer.volume(1.0, { type: 'SET_VOLUME', payload: 0.5 })).toBe(0.5);
  });

  // it('Test createReducers', () => {});
});
