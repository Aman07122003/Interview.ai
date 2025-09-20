import axios from 'axios';
import  store  from '../src/store/store.js'; // Import your store
import { logout, refreshAdminToken } from '../src/store/slice/adminAuthSlice.jsx';

const API_BASE_URL = process.env.API_BASE_URL;

// Create axios instance
const axiosInstanceAdmin = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

// Request interceptor to add auth token
axiosInstanceAdmin.interceptors.request.use(
  (config) => {
    const token = store.getState().adminAuth.accessToken;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token refresh
axiosInstanceAdmin.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If error is 401 and we haven't already tried to refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Try to refresh the token
        await store.dispatch(refreshAdminToken()).unwrap();
        
        // Retry the original request with new token
        const newToken = store.getState().adminAuth.accessToken;
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return axiosInstanceAdmin(originalRequest);
      } catch (refreshError) {
        // If refresh fails, logout the user
        store.dispatch(logout());
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default axiosInstanceAdmin;