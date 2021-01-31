import { ActionCreator, ActionTypeMaker } from '../actionKits';

describe('Test action creator maker', function () {
  it('Make reset action creator', function () {
    const action = ActionCreator.makeReset('TYPE')();
    expect(action.type).toBe(ActionTypeMaker.RESET('TYPE'));
    expect(action.payload).toBeUndefined();
  });
  it('Make cancel action creator', function () {
    const action = ActionCreator.makeCancel('TYPE')();
    expect(action.type).toBe(ActionTypeMaker.CANCEL('TYPE'));
    expect(action.payload).toBeUndefined();
  });
  it('Make remove action creator', function () {
    const action = ActionCreator.makeRemove('TYPE')(10);
    expect(action.type).toBe(ActionTypeMaker.REMOVE('TYPE'));
    expect(action.payload).toBe(10);
  });
  it('Make update action creator', function () {
    const action = ActionCreator.makeUpdate('TYPE')({
      id: 10,
      name: 'John',
    });
    expect(action.type).toBe(ActionTypeMaker.UPDATE('TYPE'));
    expect(action.payload).toEqual({
      id: 10,
      name: 'John',
    });
  });
  it('Make replace action creator', function () {
    const action = ActionCreator.makeReplace('TYPE')(10, {
      id: 20,
      name: 'Karona',
    });
    expect(action.type).toBe(ActionTypeMaker.REPLACE('TYPE'));
    expect(action.payload).toEqual({
      id: 10,
      data: {
        id: 20,
        name: 'Karona',
      },
    });
  });
  it('Make add last action creator', function () {
    const action = ActionCreator.makeAddLast('TYPE')({
      id: 20,
      name: 'Karona',
    });
    expect(action.type).toBe(ActionTypeMaker.ADD_LAST('TYPE'));
    expect(action.payload).toEqual({
      id: 20,
      name: 'Karona',
    });
  });
  it('Make add first action creator', function () {
    const action = ActionCreator.makeAddFirst('TYPE')({
      id: 20,
      name: 'Karona',
    });
    expect(action.type).toBe(ActionTypeMaker.ADD_FIRST('TYPE'));
    expect(action.payload).toEqual({
      id: 20,
      name: 'Karona',
    });
  });
  it('Make http paging action creator', function () {
    const action = ActionCreator.makeHttpPagingFetch('TYPE')({
      limit: 10,
      firstOffset: true,
      clear: true,
    });
    expect(action.type).toBe('TYPE');
    expect(action.payload).toEqual({
      limit: 10,
      firstOffset: true,
      clear: true,
    });
  });
  it('Test async basic action types', function () {
    expect(ActionTypeMaker.createAsyncActionTypes('TEST')).toEqual({
      pending: 'TEST_PENDING',
      success: 'TEST_SUCCESS',
      fail: 'TEST_FAIL',
    });
  });
});
