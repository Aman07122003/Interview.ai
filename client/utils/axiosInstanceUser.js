import axios from 'axios';
import store from '../src/store/store.js';
import { userLogout, refreshUserToken } from '../src/store/slice/authSlice.js';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const axiosInstanceUser = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

// Request interceptor
axiosInstanceUser.interceptors.request.use(
  (config) => {
    const state = store.getState();
    let token = state.userAuth?.accessToken;
    if(!token) {
      token = localStorage.getItem('userAccessToken');
    }

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor
// Response interceptor - add detailed logging
axiosInstanceUser.interceptors.response.use(
  (response) => response,
  async (error) => {
    console.log("Interceptor error:", error.response);
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      console.log("Attempting token refresh");
      originalRequest._retry = true;

      try {
        await store.dispatch(refreshUserToken()).unwrap();
        
        const newToken = store.getState().userAuth.accessToken || localStorage.getItem('userAccessToken');
        console.log("New token:", newToken);
        
        if (newToken) {
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return axiosInstanceUser(originalRequest);
        }
      } catch (refreshError) {
        console.error('Token refresh failed:', refreshError);
        store.dispatch(userLogout());
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

export default axiosInstanceUser;