import api, { handleApiError } from './config.js';

/**
 * Question Service
 * 
 * Handles all question-related API calls including:
 * - Question retrieval and filtering
 * - Question categories and topics
 * - Question management (admin)
 * - Question statistics and analytics
 */

/**
 * Gets questions with optional filtering and pagination.
 * @param {object} [options] - Query options
 * @param {number} [options.page] - Page number for pagination
 * @param {number} [options.limit] - Number of items per page
 * @param {string} [options.category] - Filter by category
 * @param {string} [options.difficulty] - Filter by difficulty (easy, medium, hard)
 * @param {Array<string>} [options.topics] - Filter by topics
 * @param {string} [options.search] - Search term for question content
 * @param {string} [options.sortBy] - Sort field
 * @param {string} [options.sortOrder] - Sort order (asc, desc)
 * @param {boolean} [options.includeAnswers] - Include answer data
 * @returns {Promise<{ questions: Array, pagination: object }>}
 */
export const getQuestions = async (options = {}) => {
  try {
    const response = await api.get('/questions', { params: options });
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Gets a specific question by ID.
 * @param {string} questionId - Question ID
 * @param {object} [options] - Query options
 * @param {boolean} [options.includeAnswer] - Include the correct answer
 * @param {boolean} [options.includeAnalytics] - Include question analytics
 * @returns {Promise<object>} Question details
 */
export const getQuestion = async (questionId, options = {}) => {
  try {
    const response = await api.get(`/questions/${questionId}`, { params: options });
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Gets available question categories.
 * @param {object} [options] - Query options
 * @param {boolean} [options.includeStats] - Include category statistics
 * @param {boolean} [options.includeTopics] - Include topics for each category
 * @returns {Promise<{ categories: Array }>}
 */
export const getCategories = async (options = {}) => {
  try {
    const response = await api.get('/questions/categories', { params: options });
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Gets questions from a specific category.
 * @param {string} category - Category name
 * @param {object} [options] - Query options
 * @param {number} [options.page] - Page number for pagination
 * @param {number} [options.limit] - Number of items per page
 * @param {string} [options.difficulty] - Filter by difficulty
 * @param {Array<string>} [options.topics] - Filter by topics
 * @param {string} [options.sortBy] - Sort field
 * @param {string} [options.sortOrder] - Sort order (asc, desc)
 * @returns {Promise<{ questions: Array, pagination: object, category: object }>}
 */
export const getQuestionsByCategory = async (category, options = {}) => {
  try {
    const response = await api.get(`/questions/category/${category}`, { params: options });
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Gets question statistics and overview.
 * @param {object} [options] - Query options
 * @param {string} [options.period] - Time period (week, month, year, all)
 * @param {string} [options.category] - Filter by category
 * @param {string} [options.startDate] - Start date for custom period
 * @param {string} [options.endDate] - End date for custom period
 * @returns {Promise<object>} Question statistics
 */
export const getQuestionStats = async (options = {}) => {
  try {
    const response = await api.get('/questions/stats/overview', { params: options });
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Exports questions in the specified format.
 * @param {object} options - Export options
 * @param {string} options.format - Export format (json, csv, pdf)
 * @param {string} [options.category] - Filter by category
 * @param {string} [options.difficulty] - Filter by difficulty
 * @param {Array<string>} [options.topics] - Filter by topics
 * @param {Array<string>} [options.fields] - Fields to include in export
 * @returns {Promise<{ downloadUrl: string, expiresAt: string }>}
 */
export const exportQuestions = async (options) => {
  try {
    const response = await api.post('/questions/export', options);
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Creates a new question (admin only).
 * @param {object} questionData - Question data
 * @param {string} questionData.question - Question text
 * @param {string} questionData.category - Question category
 * @param {string} questionData.difficulty - Question difficulty
 * @param {Array<string>} questionData.topics - Question topics
 * @param {string} questionData.answer - Correct answer
 * @param {Array<string>} [questionData.options] - Multiple choice options
 * @param {string} [questionData.explanation] - Answer explanation
 * @param {object} [questionData.metadata] - Additional question metadata
 * @returns {Promise<{ success: boolean, question: object }>}
 */
export const createQuestion = async (questionData) => {
  try {
    const response = await api.post('/questions', questionData);
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Updates an existing question (admin only).
 * @param {string} questionId - Question ID
 * @param {object} questionData - Updated question data
 * @returns {Promise<{ success: boolean, question: object }>}
 */
export const updateQuestion = async (questionId, questionData) => {
  try {
    const response = await api.patch(`/questions/${questionId}`, questionData);
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Deletes a question (admin only).
 * @param {string} questionId - Question ID
 * @param {object} [deleteData] - Deletion confirmation data
 * @returns {Promise<{ success: boolean, message: string }>}
 */
export const deleteQuestion = async (questionId, deleteData = {}) => {
  try {
    const response = await api.delete(`/questions/${questionId}`, { data: deleteData });
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Creates multiple questions in bulk (admin only).
 * @param {Array<object>} questions - Array of question data
 * @param {object} [options] - Bulk creation options
 * @param {boolean} [options.validateOnly] - Only validate without creating
 * @param {boolean} [options.skipDuplicates] - Skip duplicate questions
 * @returns {Promise<{ success: boolean, created: number, errors: Array }>}
 */
export const createQuestionsBulk = async (questions, options = {}) => {
  try {
    const response = await api.post('/questions/bulk', { questions, ...options });
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Gets question topics and tags.
 * @param {object} [options] - Query options
 * @param {string} [options.category] - Filter by category
 * @param {boolean} [options.includeStats] - Include topic statistics
 * @returns {Promise<{ topics: Array }>}
 */
export const getTopics = async (options = {}) => {
  try {
    const response = await api.get('/questions/topics', { params: options });
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Gets question difficulty levels.
 * @returns {Promise<{ difficulties: Array }>}
 */
export const getDifficulties = async () => {
  try {
    const response = await api.get('/questions/difficulties');
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Gets random questions for practice.
 * @param {object} options - Practice options
 * @param {number} options.count - Number of questions to get
 * @param {string} [options.category] - Filter by category
 * @param {string} [options.difficulty] - Filter by difficulty
 * @param {Array<string>} [options.topics] - Filter by topics
 * @param {Array<string>} [options.excludeIds] - Question IDs to exclude
 * @returns {Promise<{ questions: Array }>}
 */
export const getRandomQuestions = async (options) => {
  try {
    const response = await api.get('/questions/random', { params: options });
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Submits feedback for a question.
 * @param {string} questionId - Question ID
 * @param {object} feedbackData - Feedback data
 * @param {string} feedbackData.type - Feedback type (report, suggestion, rating)
 * @param {string} feedbackData.content - Feedback content
 * @param {number} [feedbackData.rating] - Question rating (1-5)
 * @returns {Promise<{ success: boolean, message: string }>}
 */
export const submitQuestionFeedback = async (questionId, feedbackData) => {
  try {
    const response = await api.post(`/questions/${questionId}/feedback`, feedbackData);
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Gets question analytics and performance data.
 * @param {string} questionId - Question ID
 * @param {object} [options] - Analytics options
 * @param {string} [options.period] - Time period for analytics
 * @returns {Promise<object>} Question analytics
 */
export const getQuestionAnalytics = async (questionId, options = {}) => {
  try {
    const response = await api.get(`/questions/${questionId}/analytics`, { params: options });
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Searches questions with advanced filters.
 * @param {object} searchOptions - Search options
 * @param {string} searchOptions.query - Search query
 * @param {object} [searchOptions.filters] - Additional filters
 * @param {number} [searchOptions.page] - Page number
 * @param {number} [searchOptions.limit] - Results per page
 * @returns {Promise<{ questions: Array, pagination: object, searchStats: object }>}
 */
export const searchQuestions = async (searchOptions) => {
  try {
    const response = await api.post('/questions/search', searchOptions);
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
}; 