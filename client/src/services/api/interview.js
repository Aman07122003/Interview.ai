import api, { handleApiError } from './config.js';

/**
 * Interview Service
 * 
 * Handles all interview-related API calls including:
 * - Interview session management
 * - Question answering and submission
 * - Interview reports and analytics
 * - Interview history and management
 */

/**
 * Starts a new interview session.
 * @param {object} options - Interview start options
 * @param {string} options.category - Interview category
 * @param {number} [options.questionCount] - Number of questions (default: 10)
 * @param {string} [options.difficulty] - Difficulty level (easy, medium, hard)
 * @param {Array<string>} [options.topics] - Specific topics to focus on
 * @param {object} [options.settings] - Interview settings
 * @returns {Promise<{ interviewId: string, questions: Array, settings: object }>}
 */
export const startInterview = async (options) => {
  try {
    const response = await api.post('/interview/start', options);
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Submits an answer for a specific question in an interview.
 * @param {string} interviewId - Interview session ID
 * @param {object} answerData - Answer data
 * @param {string} answerData.questionId - Question ID
 * @param {string} answerData.answer - User's answer text
 * @param {number} [answerData.timeSpent] - Time spent on question (seconds)
 * @param {object} [answerData.metadata] - Additional answer metadata
 * @returns {Promise<{ success: boolean, feedback?: object, nextQuestion?: object }>}
 */
export const submitAnswer = async (interviewId, answerData) => {
  try {
    const response = await api.post(`/interview/${interviewId}/answer`, answerData);
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Submits the final interview for evaluation.
 * @param {string} interviewId - Interview session ID
 * @param {object} [submissionData] - Additional submission data
 * @param {string} [submissionData.notes] - User notes about the interview
 * @param {object} [submissionData.feedback] - User feedback about the interview
 * @returns {Promise<{ success: boolean, reportId: string, message: string }>}
 */
export const submitInterview = async (interviewId, submissionData = {}) => {
  try {
    const response = await api.post(`/interview/${interviewId}/submit`, submissionData);
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Gets interview details and current state.
 * @param {string} interviewId - Interview session ID
 * @returns {Promise<object>} Interview details and state
 */
export const getInterview = async (interviewId) => {
  try {
    const response = await api.get(`/interview/${interviewId}`);
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Gets the detailed report for a completed interview.
 * @param {string} interviewId - Interview session ID
 * @param {object} [options] - Report options
 * @param {boolean} [options.includeAnswers] - Include detailed answers
 * @param {boolean} [options.includeAnalytics] - Include analytics data
 * @returns {Promise<object>} Interview report
 */
export const getInterviewReport = async (interviewId, options = {}) => {
  try {
    const response = await api.get(`/interview/${interviewId}/report`, { params: options });
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Gets interview history for the current user.
 * @param {object} [options] - Query options
 * @param {number} [options.page] - Page number for pagination
 * @param {number} [options.limit] - Number of items per page
 * @param {string} [options.status] - Filter by status (completed, in-progress, paused)
 * @param {string} [options.category] - Filter by category
 * @param {string} [options.sortBy] - Sort field
 * @param {string} [options.sortOrder] - Sort order (asc, desc)
 * @param {string} [options.startDate] - Start date for filtering
 * @param {string} [options.endDate] - End date for filtering
 * @returns {Promise<{ interviews: Array, pagination: object }>}
 */
export const getInterviewHistory = async (options = {}) => {
  try {
    const response = await api.get('/interview/history', { params: options });
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Pauses an active interview session.
 * @param {string} interviewId - Interview session ID
 * @param {object} [pauseData] - Pause data
 * @param {string} [pauseData.reason] - Reason for pausing
 * @returns {Promise<{ success: boolean, message: string, resumeToken?: string }>}
 */
export const pauseInterview = async (interviewId, pauseData = {}) => {
  try {
    const response = await api.post(`/interview/${interviewId}/pause`, pauseData);
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Resumes a paused interview session.
 * @param {string} interviewId - Interview session ID
 * @param {object} [resumeData] - Resume data
 * @param {string} [resumeData.resumeToken] - Resume token if required
 * @returns {Promise<{ success: boolean, interview: object }>}
 */
export const resumeInterview = async (interviewId, resumeData = {}) => {
  try {
    const response = await api.post(`/interview/${interviewId}/resume`, resumeData);
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Deletes an interview session.
 * @param {string} interviewId - Interview session ID
 * @param {object} [deleteData] - Deletion confirmation data
 * @param {string} [deleteData.reason] - Reason for deletion
 * @returns {Promise<{ success: boolean, message: string }>}
 */
export const deleteInterview = async (interviewId, deleteData = {}) => {
  try {
    const response = await api.delete(`/interview/${interviewId}`, { data: deleteData });
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Exports interview data in the specified format.
 * @param {string} interviewId - Interview session ID
 * @param {object} options - Export options
 * @param {string} options.format - Export format (json, csv, pdf)
 * @param {Array<string>} [options.sections] - Sections to include in export
 * @returns {Promise<{ downloadUrl: string, expiresAt: string }>}
 */
export const exportInterview = async (interviewId, options) => {
  try {
    const response = await api.post(`/interview/${interviewId}/export`, options);
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Gets interview analytics and insights.
 * @param {object} [options] - Analytics options
 * @param {string} [options.period] - Time period (week, month, year, all)
 * @param {string} [options.category] - Filter by category
 * @param {string} [options.startDate] - Start date for custom period
 * @param {string} [options.endDate] - End date for custom period
 * @returns {Promise<object>} Interview analytics
 */
export const getInterviewAnalytics = async (options = {}) => {
  try {
    const response = await api.get('/interview/analytics', { params: options });
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Gets available interview categories and settings.
 * @returns {Promise<{ categories: Array, settings: object }>}
 */
export const getInterviewCategories = async () => {
  try {
    const response = await api.get('/interview/categories');
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Gets interview session statistics.
 * @param {string} interviewId - Interview session ID
 * @returns {Promise<object>} Session statistics
 */
export const getInterviewStats = async (interviewId) => {
  try {
    const response = await api.get(`/interview/${interviewId}/stats`);
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Saves interview progress (auto-save functionality).
 * @param {string} interviewId - Interview session ID
 * @param {object} progressData - Progress data to save
 * @param {Array} progressData.answers - Current answers
 * @param {number} progressData.currentQuestion - Current question index
 * @param {object} progressData.metadata - Additional progress metadata
 * @returns {Promise<{ success: boolean, savedAt: string }>}
 */
export const saveInterviewProgress = async (interviewId, progressData) => {
  try {
    const response = await api.post(`/interview/${interviewId}/progress`, progressData);
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Gets saved interview progress.
 * @param {string} interviewId - Interview session ID
 * @returns {Promise<object>} Saved progress data
 */
export const getInterviewProgress = async (interviewId) => {
  try {
    const response = await api.get(`/interview/${interviewId}/progress`);
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Submits feedback for an interview session.
 * @param {string} interviewId - Interview session ID
 * @param {object} feedbackData - Feedback data
 * @param {number} feedbackData.rating - Overall rating (1-5)
 * @param {string} feedbackData.comment - Feedback comment
 * @param {object} [feedbackData.details] - Detailed feedback
 * @returns {Promise<{ success: boolean, message: string }>}
 */
export const submitInterviewFeedback = async (interviewId, feedbackData) => {
  try {
    const response = await api.post(`/interview/${interviewId}/feedback`, feedbackData);
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
}; 