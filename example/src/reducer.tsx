import { combineReducers } from 'redux';
import { createAsyncReducer } from 'redux-kit';
import actionType from './actionType';

const users = createAsyncReducer(actionType.FETCH_USERS);

const reducer = combineReducers({ users });

export default reducer;
