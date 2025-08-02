import api, { tokenManager, handleApiError } from './config.js';


/**
 * Authentication Service
 * 
 * Handles all authentication-related API calls including:
 * - User registration and login
 * - Token management and refresh
 * - Password reset and email verification
 * - Account management
 */

/**
 * Registers a new user account.
 * @param {object} userData - User registration data
 * @param {string} userData.username - Unique username
 * @param {string} userData.email - User's email address
 * @param {string} userData.password - User's password
 * @param {string} userData.fullName - User's full name
 * @returns {Promise<{ success: boolean, message: string, user?: object }>}
 */
export const register = async (userData) => {
  try {
    const response = await api.post('/auth/register', userData);
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Authenticates a user and returns access/refresh tokens.
 * @param {object} credentials - Login credentials
 * @param {string} credentials.email - User's email address
 * @param {string} credentials.password - User's password
 * @returns {Promise<{ accessToken: string, refreshToken: string, user: object }>}
 */
export const login = async (credentials) => {
  try {
    const response = await api.post('/auth/login', credentials);
    const { accessToken, refreshToken, user } = response.data;
    console.log(response.data);
    
    // Store tokens
    tokenManager.setTokens({ accessToken, refreshToken });
    
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Logs out the current user and clears authentication tokens.
 * @returns {Promise<{ success: boolean, message: string }>}
 */
export const logout = async () => {
  try {
    const response = await api.post('/auth/logout');
    
    // Clear tokens regardless of server response
    tokenManager.clearTokens();
    
    return response.data;
  } catch (error) {
    // Clear tokens even if logout request fails
    tokenManager.clearTokens();
    throw handleApiError(error);
  }
};

/**
 * Refreshes the access token using a refresh token.
 * @param {string} refreshToken - The refresh token
 * @returns {Promise<{ accessToken: string, refreshToken: string }>}
 */
export const refreshToken = async (refreshToken) => {
  try {
    const response = await api.post('/auth/refresh-token', { refreshToken });
    const { accessToken, refreshToken: newRefreshToken } = response.data;
    
    // Update stored tokens
    tokenManager.setTokens({ accessToken, refreshToken: newRefreshToken });
    
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Gets the current authenticated user's profile.
 * @returns {Promise<object>} User profile data
 */
export const getCurrentUser = async () => {
  try {
    const response = await api.get('/auth/me');
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Initiates the forgot password process.
 * @param {object} data - Forgot password data
 * @param {string} data.email - User's email address
 * @returns {Promise<{ success: boolean, message: string }>}
 */
export const forgotPassword = async (data) => {
  try {
    const response = await api.post('/auth/forgot-password', data);
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Resets the user's password using a reset token.
 * @param {object} data - Password reset data
 * @param {string} data.token - Password reset token
 * @param {string} data.password - New password
 * @param {string} data.confirmPassword - Password confirmation
 * @returns {Promise<{ success: boolean, message: string }>}
 */
export const resetPassword = async (data) => {
  try {
    const response = await api.post('/auth/reset-password', data);
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Changes the current user's password.
 * @param {object} data - Password change data
 * @param {string} data.currentPassword - Current password
 * @param {string} data.newPassword - New password
 * @param {string} data.confirmPassword - Password confirmation
 * @returns {Promise<{ success: boolean, message: string }>}
 */
export const changePassword = async (data) => {
  try {
    const response = await api.post('/auth/change-password', data);
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Verifies a user's email address.
 * @param {object} data - Email verification data
 * @param {string} data.token - Email verification token
 * @returns {Promise<{ success: boolean, message: string }>}
 */
export const verifyEmail = async (data) => {
  try {
    const response = await api.post('/auth/verify-email', data);
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Resends email verification to the current user.
 * @returns {Promise<{ success: boolean, message: string }>}
 */
export const resendVerification = async () => {
  try {
    const response = await api.post('/auth/resend-verification');
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Utility function to check if user is authenticated.
 * @returns {boolean} True if user has valid tokens
 */
export const isAuthenticated = () => {
  const accessToken = tokenManager.getAccessToken();
  return !!accessToken;
};

/**
 * Utility function to get stored tokens.
 * @returns {object} Current tokens
 */
export const getTokens = () => ({
  accessToken: tokenManager.getAccessToken(),
  refreshToken: tokenManager.getRefreshToken(),
});

/**
 * Utility function to set tokens manually.
 * @param {object} tokens - Tokens to set
 * @param {string} tokens.accessToken - Access token
 * @param {string} tokens.refreshToken - Refresh token
 */
export const setTokens = (tokens) => {
  tokenManager.setTokens(tokens);
};

/**
 * Utility function to clear all authentication data.
 */
export const clearAuth = () => {
  tokenManager.clearTokens();
}; 