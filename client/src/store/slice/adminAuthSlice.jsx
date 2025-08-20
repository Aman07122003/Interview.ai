import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

// Base URL for API calls
const API_BASE_URL = 'http://localhost:3000/api';

// Async thunk for admin registration
export const registerAdmin = createAsyncThunk(
  'adminAuth/register',
  async (formData, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/admin/register`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        withCredentials: true,
      });

      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 
        error.message || 
        'Registration failed. Please try again.'
      );
    }
  }
);

// Async thunk for admin login
export const loginAdmin = createAsyncThunk(
  'adminAuth/login',
  async (credentials, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/admin/login`, credentials, {
        headers: {
          'Content-Type': 'application/json',
        },
        withCredentials: true,
      });

      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 
        error.message || 
        'Login failed. Please try again.'
      );
    }
  }
);

// Async thunk for admin logout
export const logoutAdmin = createAsyncThunk(
  'adminAuth/logout',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/admin/logout`, {}, {
        withCredentials: true,
      });

      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 
        error.message || 
        'Logout failed. Please try again.'
      );
    }
  }
);

// Async thunk for refreshing token
export const refreshAdminToken = createAsyncThunk(
  'adminAuth/refreshToken',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/admin/refresh-token`, {}, {
        withCredentials: true,
      });

      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 
        error.message || 
        'Token refresh failed. Please login again.'
      );
    }
  }
);

// Async thunk for getting current admin
export const getCurrentAdmin = createAsyncThunk(
  'adminAuth/getCurrentAdmin',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/admin/profile`, {
        withCredentials: true,
      });

      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 
        error.message || 
        'Failed to fetch admin profile'
      );
    }
  }
);

const initialState = {
  admin: null,
  accessToken: localStorage.getItem('adminAccessToken') || null,
  refreshToken: localStorage.getItem('adminRefreshToken') || null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
};

const adminAuthSlice = createSlice({
  name: 'adminAuth',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setCredentials: (state, action) => {
      const { admin, accessToken, refreshToken } = action.payload;
      state.admin = admin;
      state.accessToken = accessToken;
      state.refreshToken = refreshToken;
      state.isAuthenticated = true;
      
      // Store tokens in localStorage
      if (accessToken) {
        localStorage.setItem('adminAccessToken', accessToken);
      }
      if (refreshToken) {
        localStorage.setItem('adminRefreshToken', refreshToken);
      }
    },
    logout: (state) => {
      state.admin = null;
      state.accessToken = null;
      state.refreshToken = null;
      state.isAuthenticated = false;
      
      // Remove tokens from localStorage
      localStorage.removeItem('adminAccessToken');
      localStorage.removeItem('adminRefreshToken');
    },
  },
  extraReducers: (builder) => {
    builder
      // Register Admin
      .addCase(registerAdmin.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(registerAdmin.fulfilled, (state, action) => {
        state.isLoading = false;
        state.error = null;
        // You might want to automatically login after registration
        // or redirect to login page
      })
      .addCase(registerAdmin.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Login Admin
      .addCase(loginAdmin.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loginAdmin.fulfilled, (state, action) => {
        state.isLoading = false;
        state.error = null;
        const { admin, accessToken, refreshToken } = action.payload.data;
        state.admin = admin;
        state.accessToken = accessToken;
        state.refreshToken = refreshToken;
        state.isAuthenticated = true;
        
        // Store tokens in localStorage
        if (accessToken) {
          localStorage.setItem('adminAccessToken', accessToken);
        }
        if (refreshToken) {
          localStorage.setItem('adminRefreshToken', refreshToken);
        }
      })
      .addCase(loginAdmin.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
        state.admin = null;
        state.accessToken = null;
        state.refreshToken = null;
        state.isAuthenticated = false;
        
        // Clear tokens from localStorage on login failure
        localStorage.removeItem('adminAccessToken');
        localStorage.removeItem('adminRefreshToken');
      })
      
      // Logout Admin
      .addCase(logoutAdmin.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(logoutAdmin.fulfilled, (state) => {
        state.isLoading = false;
        state.admin = null;
        state.accessToken = null;
        state.refreshToken = null;
        state.isAuthenticated = false;
        state.error = null;
        
        // Remove tokens from localStorage
        localStorage.removeItem('adminAccessToken');
        localStorage.removeItem('adminRefreshToken');
      })
      .addCase(logoutAdmin.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
        // Still logout even if the server call fails
        state.admin = null;
        state.accessToken = null;
        state.refreshToken = null;
        state.isAuthenticated = false;
        
        localStorage.removeItem('adminAccessToken');
        localStorage.removeItem('adminRefreshToken');
      })
      
      // Refresh Token
      .addCase(refreshAdminToken.fulfilled, (state, action) => {
        const { accessToken, refreshToken } = action.payload.data;
        state.accessToken = accessToken;
        state.refreshToken = refreshToken;
        
        if (accessToken) {
          localStorage.setItem('adminAccessToken', accessToken);
        }
        if (refreshToken) {
          localStorage.setItem('adminRefreshToken', refreshToken);
        }
      })
      .addCase(refreshAdminToken.rejected, (state) => {
        state.accessToken = null;
        state.refreshToken = null;
        state.isAuthenticated = false;
        
        localStorage.removeItem('adminAccessToken');
        localStorage.removeItem('adminRefreshToken');
      })
      
      // Get Current Admin
      .addCase(getCurrentAdmin.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getCurrentAdmin.fulfilled, (state, action) => {
        state.isLoading = false;
        state.admin = action.payload.data;
        state.isAuthenticated = true;
      })
      .addCase(getCurrentAdmin.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
        state.admin = null;
        state.isAuthenticated = false;
        
        // Clear tokens if getting current admin fails
        localStorage.removeItem('adminAccessToken');
        localStorage.removeItem('adminRefreshToken');
      });
  },
});

export const { clearError, setCredentials, logout } = adminAuthSlice.actions;

// Selectors
export const selectAdmin = (state) => state.adminAuth.admin;
export const selectAdminAccessToken = (state) => state.adminAuth.accessToken;
export const selectAdminIsAuthenticated = (state) => state.adminAuth.isAuthenticated;
export const selectAdminIsLoading = (state) => state.adminAuth.isLoading;
export const selectAdminError = (state) => state.adminAuth.error;

export default adminAuthSlice.reducer;