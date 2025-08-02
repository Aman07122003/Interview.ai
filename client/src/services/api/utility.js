import api, { handleApiError } from './config.js';

/**
 * Utility Service
 * 
 * Handles system utility API calls including:
 * - Health checks and system status
 * - Version information
 * - System configuration
 * - Utility functions
 */

/**
 * Gets system health status.
 * @returns {Promise<{ status: string, timestamp: string, services: object }>}
 */
export const getHealth = async () => {
  try {
    const response = await api.get('/health');
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Gets API version information.
 * @returns {Promise<{ version: string, build: string, environment: string }>}
 */
export const getVersion = async () => {
  try {
    const response = await api.get('/version');
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Pings the server to check connectivity.
 * @returns {Promise<{ pong: boolean, timestamp: string, latency: number }>}
 */
export const ping = async () => {
  try {
    const startTime = Date.now();
    const response = await api.get('/ping');
    const latency = Date.now() - startTime;
    
    return {
      ...response.data,
      latency,
    };
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Uploads a file to the server.
 * @param {File} file - File to upload
 * @param {object} [options] - Upload options
 * @param {string} [options.type] - File type/category
 * @returns {Promise<{ success: boolean, fileId: string, url: string }>}
 */
export const uploadFile = async (file, options = {}) => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    
    if (options.type) formData.append('type', options.type);

    const response = await api.post('/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
}; 