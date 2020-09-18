import { ActionTypeMaker, getCachedActionTypes } from '../actionKits';

describe('Test action types', () => {
  it('Test action type makers', () => {
    const type = 'TYPE';
    expect(ActionTypeMaker.PENDING(type)).toBe('TYPE_PENDING');
    expect(ActionTypeMaker.SUCCESS(type)).toBe('TYPE_SUCCESS');
    expect(ActionTypeMaker.FAIL(type)).toBe('TYPE_FAIL');
    expect(ActionTypeMaker.ADD_FIRST(type)).toBe('TYPE_ADD_FIRST');
    expect(ActionTypeMaker.ADD_LAST(type)).toBe('TYPE_ADD_LAST');
    expect(ActionTypeMaker.REMOVE(type)).toBe('TYPE_REMOVE');
    expect(ActionTypeMaker.CANCEL(type)).toBe('TYPE_CANCEL');
    expect(ActionTypeMaker.UPDATE(type)).toBe('TYPE_UPDATE');
    expect(ActionTypeMaker.REPLACE(type)).toBe('TYPE_REPLACE');
    expect(ActionTypeMaker.RESET(type)).toBe('TYPE_RESET');
  });

  it('Test action type is cached', () => {
    ActionTypeMaker.PENDING('TYPE');
    expect(getCachedActionTypes().TYPE.pending).toBe('TYPE_PENDING');
  });
});
