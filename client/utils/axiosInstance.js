import axios from 'axios';
import store from '../src/store/store.js'; // Import your Redux store
import { logout, refreshToken } from '../src/store/slice/authSlice.jsx'; // <-- use user slice

const API_BASE_URL = process.env.API_BASE_URL;

// Create axios instance for normal user
const axiosInstanceUser = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

// Request interceptor to add auth token
axiosInstanceUser.interceptors.request.use(
  (config) => {
    const token = store.getState().auth.accessToken; // <-- user auth state
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle token refresh
axiosInstanceUser.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Handle expired access token
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Dispatch refresh token from user slice
        await store.dispatch(refreshToken()).unwrap();

        // Get updated access token
        const newToken = store.getState().auth.accessToken;
        originalRequest.headers.Authorization = `Bearer ${newToken}`;

        // Retry the original request
        return axiosInstanceUser(originalRequest);
      } catch (refreshError) {
        // If refresh fails, logout user
        store.dispatch(logout());
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default axiosInstanceUser;
