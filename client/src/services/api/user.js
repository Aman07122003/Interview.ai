import api, { handleApiError } from './config.js';

/**
 * User Service
 * 
 * Handles all user-related API calls including:
 * - Profile management
 * - Avatar upload
 * - User statistics
 * - Account operations
 * - Interview history
 */

/**
 * Gets the current user's profile information.
 * @returns {Promise<object>} User profile data
 */
export const getProfile = async () => {
  try {
    const response = await api.get('/user/profile');
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Updates the current user's profile information.
 * @param {object} profileData - Profile data to update
 * @param {string} [profileData.fullName] - User's full name
 * @param {string} [profileData.username] - Username
 * @param {string} [profileData.email] - Email address
 * @param {string} [profileData.phone] - Phone number
 * @param {string} [profileData.bio] - User biography
 * @param {string} [profileData.location] - User location
 * @param {string} [profileData.website] - User website
 * @returns {Promise<object>} Updated user profile
 */
export const updateProfile = async (profileData) => {
  try {
    const response = await api.put('/user/profile', profileData);
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Uploads a new avatar for the current user.
 * @param {File} avatarFile - Avatar image file
 * @returns {Promise<{ avatarUrl: string, message: string }>}
 */
export const uploadAvatar = async (avatarFile) => {
  try {
    const formData = new FormData();
    formData.append('avatar', avatarFile);

    const response = await api.post('/user/avatar', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Removes the current user's avatar.
 * @returns {Promise<{ success: boolean, message: string }>}
 */
export const removeAvatar = async () => {
  try {
    const response = await api.delete('/user/avatar');
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Gets user statistics and analytics.
 * @param {object} [options] - Query options
 * @param {string} [options.period] - Time period (week, month, year, all)
 * @param {string} [options.startDate] - Start date for custom period
 * @param {string} [options.endDate] - End date for custom period
 * @returns {Promise<object>} User statistics
 */
export const getStats = async (options = {}) => {
  try {
    const response = await api.get('/user/stats', { params: options });
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Gets the user's interview history.
 * @param {object} [options] - Query options
 * @param {number} [options.page] - Page number for pagination
 * @param {number} [options.limit] - Number of items per page
 * @param {string} [options.status] - Filter by interview status
 * @param {string} [options.sortBy] - Sort field
 * @param {string} [options.sortOrder] - Sort order (asc, desc)
 * @returns {Promise<{ interviews: Array, pagination: object }>}
 */
export const getInterviews = async (options = {}) => {
  try {
    const response = await api.get('/user/interviews', { params: options });
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Exports user data in the specified format.
 * @param {object} options - Export options
 * @param {string} options.format - Export format (json, csv, pdf)
 * @param {Array<string>} [options.dataTypes] - Types of data to export
 * @param {string} [options.startDate] - Start date for data range
 * @param {string} [options.endDate] - End date for data range
 * @returns {Promise<{ downloadUrl: string, expiresAt: string }>}
 */
export const exportData = async (options) => {
  try {
    const response = await api.post('/user/export', options);
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Gets account information and settings.
 * @returns {Promise<object>} Account information
 */
export const getAccount = async () => {
  try {
    const response = await api.get('/user/account');
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Updates account settings.
 * @param {object} accountData - Account data to update
 * @param {boolean} [accountData.emailNotifications] - Email notification preferences
 * @param {boolean} [accountData.pushNotifications] - Push notification preferences
 * @param {string} [accountData.timezone] - User timezone
 * @param {string} [accountData.language] - Preferred language
 * @param {object} [accountData.privacy] - Privacy settings
 * @returns {Promise<object>} Updated account information
 */
export const updateAccount = async (accountData) => {
  try {
    const response = await api.patch('/user/account', accountData);
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Deactivates the current user's account.
 * @param {object} data - Deactivation data
 * @param {string} data.password - Current password for confirmation
 * @param {string} [data.reason] - Reason for deactivation
 * @returns {Promise<{ success: boolean, message: string }>}
 */
export const deactivateAccount = async (data) => {
  try {
    const response = await api.post('/user/account/deactivate', data);
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Reactivates a deactivated account.
 * @param {object} data - Reactivation data
 * @param {string} data.email - User's email address
 * @param {string} data.token - Reactivation token
 * @returns {Promise<{ success: boolean, message: string }>}
 */
export const reactivateAccount = async (data) => {
  try {
    const response = await api.post('/user/account/reactivate', data);
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Permanently deletes the current user's account.
 * @param {object} data - Deletion confirmation data
 * @param {string} data.password - Current password for confirmation
 * @param {string} data.confirmation - Confirmation text
 * @returns {Promise<{ success: boolean, message: string }>}
 */
export const deleteAccount = async (data) => {
  try {
    const response = await api.delete('/user/account', { data });
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Gets user activity log.
 * @param {object} [options] - Query options
 * @param {number} [options.page] - Page number for pagination
 * @param {number} [options.limit] - Number of items per page
 * @param {string} [options.activityType] - Filter by activity type
 * @param {string} [options.startDate] - Start date for filtering
 * @param {string} [options.endDate] - End date for filtering
 * @returns {Promise<{ activities: Array, pagination: object }>}
 */
export const getActivityLog = async (options = {}) => {
  try {
    const response = await api.get('/user/activity', { params: options });
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Gets user preferences and settings.
 * @returns {Promise<object>} User preferences
 */
export const getPreferences = async () => {
  try {
    const response = await api.get('/user/preferences');
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Updates user preferences.
 * @param {object} preferences - Preferences to update
 * @param {object} [preferences.notifications] - Notification preferences
 * @param {object} [preferences.privacy] - Privacy preferences
 * @param {object} [preferences.interview] - Interview preferences
 * @param {object} [preferences.ui] - UI preferences
 * @returns {Promise<object>} Updated preferences
 */
export const updatePreferences = async (preferences) => {
  try {
    const response = await api.patch('/user/preferences', preferences);
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
}; 