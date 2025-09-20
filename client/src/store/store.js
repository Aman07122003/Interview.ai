import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slice/authSlice';
import userReducer from './slice/userSlice';
import interviewReducer from './slice/interviewSlice';
import adminAuthReducer from './slice/adminAuthSlice';

const store = configureStore({
    reducer: {
        userAuth: authReducer,
        user: userReducer,
        interview: interviewReducer,
        adminAuth: adminAuthReducer,
    },
});

export default store;