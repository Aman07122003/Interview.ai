import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axiosInstanceUser from '../../../utils/axiosInstanceUser.js';

// Initial state
const initialState = {
  user: JSON.parse(localStorage.getItem('user')) || null,
  isAuthenticated: !!localStorage.getItem('userAccessToken'),
  accessToken: localStorage.getItem('userAccessToken') || null,
  refreshToken: localStorage.getItem('userRefreshToken') || null,
  loading: false,
  error: null,
};

// ------------------------- Async Thunks -------------------------

export const userRegister = createAsyncThunk(
  '/auth/register',
  async (userData, { rejectWithValue }) => {
    try {
      const response = await axiosInstanceUser.post('/auth/register', userData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: 'Registration failed' });
    }
  }
);

export const userLogin = createAsyncThunk(
  '/auth/login',
  async (userData, { rejectWithValue }) => {
    try {
      const response = await axiosInstanceUser.post('/auth/login', userData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: 'Login failed' });
    }
  }
);

export const userLogout = createAsyncThunk(
  '/auth/logout',
  async (_, { getState, rejectWithValue }) => {
    try {
      const token = getState().userAuth.accessToken || localStorage.getItem("userAccessToken");
      await axiosInstanceUser.post('/auth/logout', null, {
        headers: { Authorization: token ? `Bearer ${token}` : "" },
      });
      return true;
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: 'Logout failed' });
    }
  }
);

export const refreshUserToken = createAsyncThunk(
  'auth/refreshToken',
  async (_, { getState, rejectWithValue }) => {
    try {
      const refreshToken = getState().userAuth.refreshToken || localStorage.getItem('userRefreshToken');
      const response = await axiosInstanceUser.post('/auth/refresh-token', { refreshToken });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: 'Token refresh failed' });
    }
  }
);

export const getCurrentUser = createAsyncThunk(
  '/auth/getCurrentUser',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axiosInstanceUser.get('/auth/me');
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: 'Failed to fetch user' });
    }
  }
);

// ------------------------- Slice -------------------------

const userAuthSlice = createSlice({
  name: 'userAuth',
  initialState,
  reducers: {
    clearError: (state) => { state.error = null; },
    setCredentials: (state, action) => {
      const { user, accessToken, refreshToken } = action.payload;
      state.user = user;
      state.accessToken = accessToken;
      state.refreshToken = refreshToken;
      state.isAuthenticated = !!accessToken;

      if (accessToken) localStorage.setItem('userAccessToken', accessToken);
      if (refreshToken) localStorage.setItem('userRefreshToken', refreshToken);
    },
    logout: (state) => {
      state.user = null;
      state.accessToken = null;
      state.refreshToken = null;
      state.isAuthenticated = false;
      state.error = null;

      localStorage.removeItem('userAccessToken');
      localStorage.removeItem('userRefreshToken');
      localStorage.removeItem('user');
    },
  },
  extraReducers: (builder) => {
    builder
      // User Register
      .addCase(userRegister.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(userRegister.fulfilled, (state) => { state.loading = false; state.error = null; })
      .addCase(userRegister.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || 'Registration failed';
      })

      // User Login
      .addCase(userLogin.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(userLogin.fulfilled, (state, action) => {
        state.loading = false;
        const { user, accessToken, refreshToken } = action.payload;
        state.user = user;
        state.accessToken = accessToken;
        state.refreshToken = refreshToken;
        state.isAuthenticated = !!accessToken;

        if (accessToken) localStorage.setItem('userAccessToken', accessToken);
        if (refreshToken) localStorage.setItem('userRefreshToken', refreshToken);
      })
      .addCase(userLogin.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || action.error?.message || 'Login failed';
      })

      // User Logout
      .addCase(userLogout.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(userLogout.fulfilled, (state) => {
        state.loading = false;
        state.user = null;
        state.accessToken = null;
        state.refreshToken = null;
        state.isAuthenticated = false;

        localStorage.removeItem('userAccessToken');
        localStorage.removeItem('userRefreshToken');
        localStorage.removeItem('user');
      })
      .addCase(userLogout.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || 'Logout failed';
        state.user = null;
        state.accessToken = null;
        state.refreshToken = null;
        state.isAuthenticated = false;

        localStorage.removeItem('userAccessToken');
        localStorage.removeItem('userRefreshToken');
      })

      // Refresh Token
      .addCase(refreshUserToken.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(refreshUserToken.fulfilled, (state, action) => {
        const { accessToken, refreshToken } = action.payload.data || {};
        state.accessToken = accessToken;
        state.refreshToken = refreshToken;
        state.isAuthenticated = !!accessToken;

        if (accessToken) localStorage.setItem('userAccessToken', accessToken);
        if (refreshToken) localStorage.setItem('userRefreshToken', refreshToken);
      })
      .addCase(refreshUserToken.rejected, (state) => {
        state.isAuthenticated = false;
        state.accessToken = null;
        state.refreshToken = null;

        localStorage.removeItem('userAccessToken');
        localStorage.removeItem('userRefreshToken');
      })

      // Get Current User
      .addCase(getCurrentUser.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(getCurrentUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.isAuthenticated = true;
      })
      .addCase(getCurrentUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || 'Failed to fetch user';
        state.user = null;
        state.isAuthenticated = false;

        localStorage.removeItem('userAccessToken');
        localStorage.removeItem('userRefreshToken');
      });
  }
});

export const { clearError, setCredentials, logout } = userAuthSlice.actions;
export default userAuthSlice.reducer;
