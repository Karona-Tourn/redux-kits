import { registerRootComponent } from 'expo';
import React from 'react';
import App from './src/App';
import { Provider } from 'react-redux';
import createSagaMiddleware from 'redux-saga';
import { createStore, applyMiddleware } from 'redux';
import reducer from './src/reducer';
import saga from './src/saga';

const sagaMiddleware = createSagaMiddleware();

const store = createStore(reducer, applyMiddleware(sagaMiddleware));

sagaMiddleware.run(saga);

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in the Expo client or in a native build,
// the environment is set up appropriately
registerRootComponent(() => (
  <Provider store={store}>
    <App />
  </Provider>
));
