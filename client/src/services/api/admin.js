import api, { handleApiError } from './config.js';

/**
 * Admin Service
 * 
 * Handles all admin-related API calls including:
 * - User management and administration
 * - System statistics and analytics
 * - System maintenance and configuration
 * - Administrative functions
 */

/**
 * Gets system-wide statistics and analytics.
 * @param {object} [options] - Query options
 * @param {string} [options.period] - Time period (day, week, month, year)
 * @param {string} [options.startDate] - Start date for custom period
 * @param {string} [options.endDate] - End date for custom period
 * @returns {Promise<object>} System statistics
 */
export const getSystemStats = async (options = {}) => {
  try {
    const response = await api.get('/admin/stats', { params: options });
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Gets all users with pagination and filtering.
 * @param {object} [options] - Query options
 * @param {number} [options.page] - Page number for pagination
 * @param {number} [options.limit] - Number of items per page
 * @param {string} [options.search] - Search term for username/email
 * @param {string} [options.status] - Filter by user status (active, inactive, suspended)
 * @param {string} [options.role] - Filter by user role
 * @param {string} [options.sortBy] - Sort field
 * @param {string} [options.sortOrder] - Sort order (asc, desc)
 * @param {string} [options.startDate] - Start date for registration filter
 * @param {string} [options.endDate] - End date for registration filter
 * @returns {Promise<{ users: Array, pagination: object }>}
 */
export const getUsers = async (options = {}) => {
  try {
    const response = await api.get('/admin/users', { params: options });
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Gets a specific user's details (admin view).
 * @param {string} userId - User ID
 * @param {object} [options] - Query options
 * @param {boolean} [options.includeStats] - Include user statistics
 * @param {boolean} [options.includeActivity] - Include recent activity
 * @returns {Promise<object>} User details
 */
export const getUser = async (userId, options = {}) => {
  try {
    const response = await api.get(`/admin/users/${userId}`, { params: options });
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Updates a user's information (admin only).
 * @param {string} userId - User ID
 * @param {object} userData - User data to update
 * @param {string} [userData.role] - User role
 * @param {string} [userData.status] - User status
 * @param {object} [userData.profile] - Profile information
 * @param {object} [userData.settings] - User settings
 * @returns {Promise<{ success: boolean, user: object }>}
 */
export const updateUser = async (userId, userData) => {
  try {
    const response = await api.patch(`/admin/users/${userId}`, userData);
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Locks/unlocks a user account.
 * @param {string} userId - User ID
 * @param {object} lockData - Lock data
 * @param {boolean} lockData.locked - Whether to lock or unlock
 * @param {string} [lockData.reason] - Reason for locking/unlocking
 * @returns {Promise<{ success: boolean, message: string }>}
 */
export const toggleUserLock = async (userId, lockData) => {
  try {
    const response = await api.post(`/admin/users/${userId}/lock`, lockData);
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Deletes a user account (admin only).
 * @param {string} userId - User ID
 * @param {object} [deleteData] - Deletion confirmation data
 * @param {string} [deleteData.reason] - Reason for deletion
 * @param {boolean} [deleteData.permanent] - Whether to permanently delete
 * @returns {Promise<{ success: boolean, message: string }>}
 */
export const deleteUser = async (userId, deleteData = {}) => {
  try {
    const response = await api.delete(`/admin/users/${userId}`, { data: deleteData });
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Gets active sessions and user activity.
 * @param {object} [options] - Query options
 * @param {number} [options.page] - Page number for pagination
 * @param {number} [options.limit] - Number of items per page
 * @param {string} [options.userId] - Filter by specific user
 * @param {string} [options.status] - Filter by session status
 * @param {string} [options.sortBy] - Sort field
 * @param {string} [options.sortOrder] - Sort order (asc, desc)
 * @returns {Promise<{ sessions: Array, pagination: object }>}
 */
export const getSessions = async (options = {}) => {
  try {
    const response = await api.get('/admin/sessions', { params: options });
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Terminates a user session.
 * @param {string} sessionId - Session ID
 * @param {object} [terminateData] - Termination data
 * @param {string} [terminateData.reason] - Reason for termination
 * @returns {Promise<{ success: boolean, message: string }>}
 */
export const terminateSession = async (sessionId, terminateData = {}) => {
  try {
    const response = await api.post(`/admin/sessions/${sessionId}/terminate`, terminateData);
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Gets system logs and audit trail.
 * @param {object} [options] - Query options
 * @param {number} [options.page] - Page number for pagination
 * @param {number} [options.limit] - Number of items per page
 * @param {string} [options.level] - Log level filter (info, warn, error)
 * @param {string} [options.userId] - Filter by user
 * @param {string} [options.action] - Filter by action type
 * @param {string} [options.startDate] - Start date for filtering
 * @param {string} [options.endDate] - End date for filtering
 * @returns {Promise<{ logs: Array, pagination: object }>}
 */
export const getSystemLogs = async (options = {}) => {
  try {
    const response = await api.get('/admin/logs', { params: options });
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Creates a system backup.
 * @param {object} [backupOptions] - Backup options
 * @param {Array<string>} [backupOptions.include] - Data to include in backup
 * @param {boolean} [backupOptions.compressed] - Whether to compress backup
 * @param {string} [backupOptions.description] - Backup description
 * @returns {Promise<{ success: boolean, backupId: string, downloadUrl: string }>}
 */
export const createBackup = async (backupOptions = {}) => {
  try {
    const response = await api.post('/admin/backup', backupOptions);
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Gets backup history and status.
 * @param {object} [options] - Query options
 * @param {number} [options.page] - Page number for pagination
 * @param {number} [options.limit] - Number of items per page
 * @param {string} [options.status] - Filter by backup status
 * @returns {Promise<{ backups: Array, pagination: object }>}
 */
export const getBackups = async (options = {}) => {
  try {
    const response = await api.get('/admin/backup', { params: options });
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Restores system from a backup.
 * @param {string} backupId - Backup ID
 * @param {object} [restoreOptions] - Restore options
 * @param {Array<string>} [restoreOptions.include] - Data to restore
 * @param {boolean} [restoreOptions.dryRun] - Perform dry run without actual restore
 * @returns {Promise<{ success: boolean, message: string }>}
 */
export const restoreBackup = async (backupId, restoreOptions = {}) => {
  try {
    const response = await api.post(`/admin/backup/${backupId}/restore`, restoreOptions);
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Clears system cache.
 * @param {object} [cacheOptions] - Cache clearing options
 * @param {Array<string>} [cacheOptions.types] - Types of cache to clear
 * @param {boolean} [cacheOptions.all] - Clear all cache
 * @returns {Promise<{ success: boolean, cleared: Array, message: string }>}
 */
export const clearCache = async (cacheOptions = {}) => {
  try {
    const response = await api.post('/admin/cache/clear', cacheOptions);
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Gets system configuration and settings.
 * @returns {Promise<object>} System configuration
 */
export const getSystemConfig = async () => {
  try {
    const response = await api.get('/admin/config');
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Updates system configuration.
 * @param {object} configData - Configuration data to update
 * @returns {Promise<{ success: boolean, config: object }>}
 */
export const updateSystemConfig = async (configData) => {
  try {
    const response = await api.patch('/admin/config', configData);
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Gets system health and status.
 * @returns {Promise<object>} System health information
 */
export const getSystemHealth = async () => {
  try {
    const response = await api.get('/admin/health');
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Sends system-wide notification.
 * @param {object} notificationData - Notification data
 * @param {string} notificationData.title - Notification title
 * @param {string} notificationData.message - Notification message
 * @param {string} [notificationData.type] - Notification type (info, warning, error)
 * @param {Array<string>} [notificationData.userIds] - Specific user IDs to notify
 * @param {object} [notificationData.metadata] - Additional notification metadata
 * @returns {Promise<{ success: boolean, sentTo: number, message: string }>}
 */
export const sendNotification = async (notificationData) => {
  try {
    const response = await api.post('/admin/notifications', notificationData);
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Gets system analytics and insights.
 * @param {object} [options] - Analytics options
 * @param {string} [options.period] - Time period for analytics
 * @param {Array<string>} [options.metrics] - Specific metrics to include
 * @param {string} [options.groupBy] - Grouping field
 * @returns {Promise<object>} System analytics
 */
export const getAnalytics = async (options = {}) => {
  try {
    const response = await api.get('/admin/analytics', { params: options });
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Exports system data for reporting.
 * @param {object} exportOptions - Export options
 * @param {string} exportOptions.format - Export format (json, csv, pdf)
 * @param {Array<string>} exportOptions.dataTypes - Types of data to export
 * @param {string} [exportOptions.startDate] - Start date for data range
 * @param {string} [exportOptions.endDate] - End date for data range
 * @returns {Promise<{ downloadUrl: string, expiresAt: string }>}
 */
export const exportSystemData = async (exportOptions) => {
  try {
    const response = await api.post('/admin/export', exportOptions);
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
}; 