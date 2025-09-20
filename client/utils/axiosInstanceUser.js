import axios from 'axios';
import store from '../src/store/store.js';
import { userLogout, refreshUserToken } from '../src/store/slice/authSlice.js';

const API_BASE_URL = "http://localhost:3000/api"

const axiosInstanceUser = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

// Request interceptor
axiosInstanceUser.interceptors.request.use(
  (config) => {
    const state = store.getState();
    const token = state.userAuth?.accessToken;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor
axiosInstanceUser.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        await store.dispatch(refreshUserToken()).unwrap();
        
        const newToken = store.getState().userAuth.accessToken;
        if (newToken) {
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return axiosInstanceUser(originalRequest);
        }
      } catch (refreshError) {
        console.error('Token refresh failed:', refreshError);
        store.dispatch(userLogout());
        window.location.href = '/login'; // Redirect to login
      }
    }

    return Promise.reject(error);
  }
);

export default axiosInstanceUser;