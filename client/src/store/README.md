# Redux Store & Slice Conventions

## Overview
This directory contains the global Redux state management setup for the application, using [Redux Toolkit](https://redux-toolkit.js.org/) and [redux-persist](https://github.com/rt2zz/redux-persist). All global state is managed here, while local UI state should remain in React components.

---

## Directory Structure

```
store/
  ├── store.js         # Redux store configuration
  └── slice/
      ├── authSlice.js     # Authentication state (tokens, user)
      ├── userSlice.js     # User profile state (name, avatar, bio, etc.)
      ├── interviewSlice.js# Interview session state
      └── ...              # Future feature slices
```

---

## Store Setup (`store.js`)
- Uses `configureStore` from Redux Toolkit for best practices and devtools.
- Integrates `redux-persist` to persist only critical slices (e.g., `auth`).
- Combines all feature slices using `combineReducers`.
- Adds logger middleware in development for debugging.
- Exports both `store` and `persistor` for use in the app root.

**Example:**
```js
import { store, persistor } from './store';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';

<Provider store={store}>
  <PersistGate loading={null} persistor={persistor}>
    <App />
  </PersistGate>
</Provider>
```

---

## Slice Conventions

### 1. **File Naming & Location**
- Each feature/domain gets its own file in `store/slice/` (e.g., `userSlice.js`).
- Use `.js` (or `.ts` for TypeScript) for all slice files.

### 2. **Slice Structure**
- Use `createSlice` from Redux Toolkit.
- State shape should include:
  - Domain data (e.g., `user`, `profile`, `current`)
  - `status`: `'idle' | 'loading' | 'succeeded' | 'failed'` (or more granular if needed)
  - `error`: For error messages
  - Additional status fields for complex flows (e.g., `submissionStatus`)
- Always provide a `reset...State` reducer to clear the slice (useful on logout or error).

### 3. **Async Logic**
- Use `createAsyncThunk` for all async actions (API calls, etc.).
- **Never** call Axios or fetch directly in slices—always use the modular API layer in `src/services/api/`.
- Handle `pending`, `fulfilled`, and `rejected` states in `extraReducers` for each thunk.
- Store errors in state for UI feedback.

### 4. **Persistence**
- Only persist slices that are critical for user experience (e.g., `auth`).
- Add slices to the `whitelist` in `persistConfig` in `store.js` if they should be persisted.
- Do **not** persist volatile or sensitive state (e.g., interview sessions).

### 5. **Selectors**
- Export selector functions for computed/derived state (optionally using `reselect`).
- Example: `export const selectCurrentUser = (state) => state.user.profile;`

### 6. **Extensibility**
- To add a new slice:
  1. Create a new file in `store/slice/` (e.g., `featureSlice.js`).
  2. Define state, reducers, and thunks as above.
  3. Import and add the reducer to `rootReducer` in `store.js`.
  4. (Optional) Add to `persistConfig.whitelist` if persistence is needed.

---

## Best Practices
- Keep global state minimal—only what is needed across pages/components.
- Use local React state for UI-only or ephemeral data.
- Use thunks for all async logic; keep reducers pure and synchronous.
- Add comments and JSDoc for complex logic or state fields.
- Write unit tests for reducers and thunks.
- Use TypeScript for type safety if possible.

---

## Questions?
For questions or onboarding, see the main project README or contact the frontend lead. 