import { combineReducers } from 'redux';
import { createAsyncReducer, createAsyncReducerGroup } from 'redux-kits';
import actionType from './actionType';

const users = createAsyncReducer(actionType.FETCH_USERS);

const reducer = combineReducers({
  users,
  ...createAsyncReducerGroup({
    randomUsers: actionType.FETCH_RANDOM_USERS,
  }),
});

export default reducer;
