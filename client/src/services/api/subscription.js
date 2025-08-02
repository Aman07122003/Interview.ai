import api, { handleApiError } from './config.js';

/**
 * Subscription Service
 * 
 * Handles all subscription-related API calls including:
 * - Subscription plan management
 * - Billing and payment processing
 * - Subscription status and history
 * - Plan upgrades and downgrades
 */

/**
 * Gets available subscription plans.
 * @param {object} [options] - Query options
 * @param {boolean} [options.includeFeatures] - Include detailed feature lists
 * @param {boolean} [options.includePricing] - Include pricing information
 * @param {string} [options.currency] - Currency for pricing (default: USD)
 * @returns {Promise<{ plans: Array }>}
 */
export const getPlans = async (options = {}) => {
  try {
    const response = await api.get('/subscriptions/plans', { params: options });
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Gets the current user's subscription details.
 * @param {object} [options] - Query options
 * @param {boolean} [options.includeHistory] - Include subscription history
 * @param {boolean} [options.includeUsage] - Include usage statistics
 * @returns {Promise<object>} Current subscription details
 */
export const getCurrentSubscription = async (options = {}) => {
  try {
    const response = await api.get('/subscriptions/current', { params: options });
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Creates a new subscription.
 * @param {object} subscriptionData - Subscription data
 * @param {string} subscriptionData.planId - Plan ID to subscribe to
 * @param {string} [subscriptionData.paymentMethodId] - Payment method ID
 * @param {object} [subscriptionData.billingAddress] - Billing address
 * @param {string} [subscriptionData.couponCode] - Coupon code for discount
 * @returns {Promise<{ success: boolean, subscription: object }>}
 */
export const createSubscription = async (subscriptionData) => {
  try {
    const response = await api.post('/subscriptions', subscriptionData);
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Cancels the current subscription.
 * @param {object} [cancelData] - Cancellation data
 * @param {string} [cancelData.reason] - Reason for cancellation
 * @param {boolean} [cancelData.immediate] - Cancel immediately or at period end
 * @returns {Promise<{ success: boolean, message: string }>}
 */
export const cancelSubscription = async (cancelData = {}) => {
  try {
    const response = await api.post('/subscriptions/current/cancel', cancelData);
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Gets subscription billing history.
 * @param {object} [options] - Query options
 * @param {number} [options.page] - Page number for pagination
 * @param {number} [options.limit] - Number of items per page
 * @returns {Promise<{ invoices: Array, pagination: object }>}
 */
export const getBillingHistory = async (options = {}) => {
  try {
    const response = await api.get('/subscriptions/billing-history', { params: options });
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Gets payment methods for the current user.
 * @returns {Promise<{ paymentMethods: Array }>}
 */
export const getPaymentMethods = async () => {
  try {
    const response = await api.get('/subscriptions/payment-methods');
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Gets subscription usage statistics.
 * @param {object} [options] - Query options
 * @param {string} [options.period] - Usage period (current, previous, custom)
 * @returns {Promise<object>} Usage statistics
 */
export const getUsage = async (options = {}) => {
  try {
    const response = await api.get('/subscriptions/usage', { params: options });
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
}; 