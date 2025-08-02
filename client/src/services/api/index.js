/**
 * API Services Index
 * 
 * This module provides a unified interface for all API services.
 * Import specific services or use the default export for all services.
 */

// Import all service modules
export * as auth from './auth.js';
export * as user from './user.js';
export * as interview from './interview.js';
export * as question from './question.js';
export * as admin from './admin.js';
export * as subscription from './subscription.js';
export * as utility from './utility.js';

// Import core configuration and utilities
export { default as api, ApiError, handleApiError, tokenManager } from './config.js';

// Import all services for default export
import * as authService from './auth.js';
import * as userService from './user.js';
import * as interviewService from './interview.js';
import * as questionService from './question.js';
import * as adminService from './admin.js';
import * as subscriptionService from './subscription.js';
import * as utilityService from './utility.js';

// Default export with all services
const apiServices = {
  auth: authService,
  user: userService,
  interview: interviewService,
  question: questionService,
  admin: adminService,
  subscription: subscriptionService,
  utility: utilityService,
};

export default apiServices; 