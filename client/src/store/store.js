import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slice/authSlice';
import userReducer from './slice/userSlice';
import interviewReducer from './slice/interviewSlice';

const store = configureStore({
    reducer: {
        auth: authReducer,
        user: userReducer,
        interview: interviewReducer,
    },
});

export default store;