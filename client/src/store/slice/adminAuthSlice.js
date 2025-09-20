import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axiosInstanceAdmin from '../../../utils/axiosInstanceAdmin';

// Async thunk for admin registration
export const registerAdmin = createAsyncThunk( '/admin/register',
  async (formData) => {
    try {
      const response = await axiosInstanceAdmin.post('/admin/register', formData,);
      return response.data;
    } catch (error) {
      return error.response?.data?.message || error.message || 'Registration failed. Please try again.'
    }
  }
);

// Async thunk for admin login
export const loginAdmin = createAsyncThunk( '/admin/login',
  async (credentials) => {
    try {
      const response = await axiosInstanceAdmin.post('/admin/login', credentials);
      return response.data;
    } catch (error) {
      return error.response?.data?.message || error.message || 'Login failed. Please try again.'
    }
  }
);

// Async thunk for creating interview session
export const createInterviewSession = createAsyncThunk('admin/interview-sessions',
  async (sessionData) => {
    try {
      const response = await axiosInstanceAdmin.post('admin/interview-sessions', sessionData);
      return response.data;
    } catch (error) {
      return error.response?.data?.message || error.message || 'Failed to create interview session'
    }
  }
);

// Async thunk for admin logout
export const logoutAdmin = createAsyncThunk('/admin/logout',
  async () => {
    try {
      const response = await axiosInstanceAdmin.post('/admin/logout');
      return response.data;
    } catch (error) {
      return error.response?.data?.message || error.message || 'Logout failed. Please try again.'
    }
  }
);

// Get admin interview sessions
export const getAdminInterviewSessions = createAsyncThunk( '/admin/interview-sessions', 
  async () => {
    try {
      const response = await axiosInstanceAdmin.get('/admin/interview-sessions');
      return response.data;
    } catch (error) {
      throw error.response?.data?.message || error.message || 'Failed to fetch interview sessions';
    }
  }
);

// Async thunk for refreshing token
export const refreshAdminToken = createAsyncThunk( '/admin/refresh-token',
  async () => {
    try {
      const response = await axiosInstanceAdmin.post('/admin/refresh-token');
      return response.data;
    } catch (error) {
      throw error.response?.data?.message || error.message || 'Token refresh failed. Please login again.';
    }
  }
);

// Async thunk for getting current admin
export const getCurrentAdmin = createAsyncThunk('/admin/profile',
  async () => {
    try {
      const response = await axiosInstanceAdmin.get('/admin/profile');
      return response.data;
    } catch (error) {
      return error.response?.data?.message || error.message || 'Failed to fetch admin profile'
    }
  }
);

const initialState = {
  admin: null,
  interviewSessions: [],
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
      state.interviewSessions = [];
      state.accessToken = null;
      state.refreshToken = null;
      state.isAuthenticated = false;
      state.error = null;
      
      // Remove tokens from localStorage
      localStorage.removeItem('adminAccessToken');
      localStorage.removeItem('adminRefreshToken');
    },
    clearInterviewSessions: (state) => {
      state.interviewSessions = [];
    }
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
      })
      .addCase(registerAdmin.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload.message || 'Registration failed';
      })
      
      // Login Admin
      .addCase(loginAdmin.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loginAdmin.fulfilled, (state, action) => {
        state.isLoading = false;
        state.error = null;
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
      
      // Create Interview Session
      .addCase(createInterviewSession.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createInterviewSession.fulfilled, (state, action) => {
        state.isLoading = false;
        state.interviewSessions = [action.payload.data, ...state.interviewSessions];
      })
      .addCase(createInterviewSession.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Logout Admin
      .addCase(logoutAdmin.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(logoutAdmin.fulfilled, (state) => {
        state.isLoading = false;
        state.admin = null;
        state.interviewSessions = [];
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
        state.error = action.payload.message || 'Logout failed';
        state.admin = null;
        state.interviewSessions = [];
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
      })
      
      // Get Admin Interview Sessions
      .addCase(getAdminInterviewSessions.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getAdminInterviewSessions.fulfilled, (state, action) => {
        state.isLoading = false;
        state.interviewSessions = action.payload.data.sessions || action.payload.data;
      })
      .addCase(getAdminInterviewSessions.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
  },
});

export default adminAuthSlice.reducer;