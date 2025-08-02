import axios from 'axios';

/**
 * API Configuration and Axios Instance
 * 
 * This module provides a production-grade Axios instance with:
 * - Environment-based configuration
 * - Request/response interceptors
 * - Token refresh logic
 * - Error handling and retry mechanisms
 * - Security best practices
 */

// Environment configuration
const API_CONFIG = {
  baseURL: 'http://localhost:8000/api',
  timeout: 30000, // 30 seconds
  withCredentials: process.env.NODE_ENV === 'production', // Use cookies in production
};

// Create Axios instance
const api = axios.create({
  baseURL: API_CONFIG.baseURL,
  timeout: API_CONFIG.timeout,
  withCredentials: API_CONFIG.withCredentials,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Custom error class for API errors
export class ApiError extends Error {
  constructor(status, code, message, meta = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.meta = meta;
    this.timestamp = new Date().toISOString();
  }

  static fromAxiosError(error) {
    const response = error.response;
    if (response) {
      const { status, data } = response;
      return new ApiError(
        status,
        data?.code || 'UNKNOWN_ERROR',
        data?.message || error.message,
        data?.meta || {}
      );
    }
    return new ApiError(
      0,
      'NETWORK_ERROR',
      error.message || 'Network error occurred',
      { originalError: error }
    );
  }
}


// Error message mapping
const ERROR_MESSAGES = {
  400: 'Bad Request - Please check your input',
  401: 'Unauthorized - Please log in again',
  403: 'Forbidden - You don\'t have permission to access this resource',
  404: 'Not Found - The requested resource was not found',
  409: 'Conflict - This resource already exists',
  422: 'Validation Error - Please check your input data',
  429: 'Too Many Requests - Please wait before trying again',
  500: 'Internal Server Error - Please try again later',
  502: 'Bad Gateway - Service temporarily unavailable',
  503: 'Service Unavailable - Please try again later',
};

// Token management utilities
export const tokenManager = {
  getAccessToken: () => {
    if (API_CONFIG.withCredentials) {
      // In production, tokens should be in HttpOnly cookies
      return null;
    }
    return localStorage.getItem('accessToken');
  },

  getRefreshToken: () => {
    if (API_CONFIG.withCredentials) {
      return null;
    }
    return localStorage.getItem('refreshToken');
  },

  setTokens: ({ accessToken, refreshToken }) => {
    if (!API_CONFIG.withCredentials) {
      if (accessToken) localStorage.setItem('accessToken', accessToken);
      if (refreshToken) localStorage.setItem('refreshToken', refreshToken);
    }
  },

  clearTokens: () => {
    if (!API_CONFIG.withCredentials) {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
    }
  },

  logout: () => {
    tokenManager.clearTokens();
    // Redirect to login page
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
  },
};

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // Add authorization header
    const accessToken = tokenManager.getAccessToken();
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }

    // Add request ID for tracking
    config.metadata = {
      startTime: new Date(),
      requestId: Math.random().toString(36).substring(7),
    };

    // Log request (sanitized for security)
    if (process.env.NODE_ENV === 'development') {
      console.log(`🚀 API Request [${config.method?.toUpperCase()}] ${config.url}`, {
        requestId: config.metadata.requestId,
        headers: {
          ...config.headers,
          Authorization: config.headers.Authorization ? '[REDACTED]' : undefined,
        },
      });
    }

    return config;
  },
  (error) => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor with token refresh logic
api.interceptors.response.use(
  (response) => {
    // Log successful response
    if (process.env.NODE_ENV === 'development') {
      const duration = new Date() - response.config.metadata.startTime;
      console.log(`✅ API Response [${response.status}] ${response.config.url} (${duration}ms)`);
    }

    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    const response = error.response;

    // Log error response
    if (process.env.NODE_ENV === 'development') {
      const duration = new Date() - originalRequest.metadata.startTime;
      console.error(`❌ API Error [${response?.status || 'NETWORK'}] ${originalRequest.url} (${duration}ms)`, {
        status: response?.status,
        data: response?.data,
        message: error.message,
      });
    }

    // Handle 401 Unauthorized with token refresh
    if (response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      const refreshToken = tokenManager.getRefreshToken();
      if (refreshToken) {
        try {
          // Attempt to refresh token
          const refreshResponse = await axios.post(
            `${API_CONFIG.baseURL}/auth/refresh-token`,
            { refreshToken },
            { withCredentials: API_CONFIG.withCredentials }
          );

          const { accessToken, refreshToken: newRefreshToken } = refreshResponse.data;
          
          // Update tokens
          tokenManager.setTokens({ accessToken, refreshToken: newRefreshToken });

          // Retry original request with new token
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return api(originalRequest);
        } catch (refreshError) {
          console.error('Token refresh failed:', refreshError);
          tokenManager.logout();
          return Promise.reject(ApiError.fromAxiosError(refreshError));
        }
      } else {
        // No refresh token available
        tokenManager.logout();
        return Promise.reject(ApiError.fromAxiosError(error));
      }
    }

    // Handle other errors
    return Promise.reject(ApiError.fromAxiosError(error));
  }
);

// Utility function to handle API errors in components
export const handleApiError = (error) => {
  if (error instanceof ApiError) {
    return {
      status: error.status,
      code: error.code,
      message: error.message || ERROR_MESSAGES[error.status] || 'An unexpected error occurred',
      meta: error.meta,
    };
  }
  
  return {
    status: 0,
    code: 'UNKNOWN_ERROR',
    message: 'An unexpected error occurred',
    meta: { originalError: error },
  };
};

// Export the configured API instance
export default api; 