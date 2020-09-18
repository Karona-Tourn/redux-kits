# redux-kits

Sorry the lack of the documents because this package is target for my personal usage. In case you found it is useful for you, so it can be a right one for you.

You also need to install [redux-saga](https://redux-saga.js.org).

Document [here](https://karona-tourn.github.io/redux-kits)

## Installation

```sh
npm install redux-kits
```

or

```sh
yarn add redux-kits
```

## Motiviation

```javascript
// Action
const fetchCart = () => ({
  type: 'FETCH_CART',
});
```

```javascript
// Previously, I wrote the following code

// Reducer
const carts = (state = { data: null, pending: false, error: null }, action) => {
  switch (action.type) {
    case 'FETCH_CART_PENDING':
    // return updated state telling fetching cart is pending
    case 'FETCH_CART_SUCCESS':
    // return updated state with provided data of payload
    case 'FETCH_CART_FAIL':
    // return updated state with error data
    default:
      return state;
  }
};

// Saga
function* watchFetchCart() {
  yield takeLatest('FETCH_CART', function* () {
    try {
      yield put({ type: 'FETCH_CART_PENDING' });

      // Request to server to fetch cart data

      yield put({ type: 'FETCH_CART_SUCCESS', payload: response });
    } catch (error) {
      yield put({ type: 'FETCH_CART_FAIL', payload: error });
    }
  });
}
```

```javascript
import {
  createAsyncReducer,
  createAsyncPagingReducer,
  createAsyncWatcher,
  createAsyncPagingWatcher,
  ActionTypeMaker,
  ActionCreator,
} from 'redux-kits';

// Now, I wrote the following code
// Reducer
const carts = createAsyncReducer('FETCH_CART');

// Saga
const watchFetchCart = createAsyncWatcher({
  actionPrefix: 'FETCH_CART',
  getPromises: () => [() => fetch('fetch cart url')],
});
```

```javascript
// More advance code working with pagination

// Actions
const fetchCart = ({ firstOffset, limit, clear }) => ({
  type: 'FETCH_CART',
  payload: {
    firstOffset,
    limit,
    clear,
  },
});

const removeCart = (id) => ({
  type: ActionTypeMaker.REMOVE('FETCH_CART'),
  payload: id,
});

const addCart = ({ id, itemName }) => ({
  type: ActionTypeMaker.ADD_LAST('FETCH_CART'),
  payload: {
    id,
    itemName,
  },
});

const clearCart = () => ({
  type: ActionTypeMaker.RESET('FETCH_CART'),
});

// Reducer
const carts = createAsyncPagingReducer('FETCH_CART');

// Saga
const watchFetchCart = createAsyncPagingWatcher({
  actionPrefix: 'FETCH_CART',
  getPromises: (state, action) => [
    () =>
      fetch(
        `fetch_cart_url?offset=${
          action.payload.firstOffset ? 0 : state.carts.offset
        }&limit=${action.payload.limit}`
      ),
  ],
  mapResultToPayload: (state, action, results) => ({
    data: results[0],
  }),
});
```

## License

MIT
