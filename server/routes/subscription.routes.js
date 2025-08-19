// routes/subscription.routes.js
import express from "express";
import { auth } from "../middleware/auth.js";
import { isAdmin } from "../middleware/adminAuth.js";
import { rateLimiter } from "../middleware/rateLimiter.js";
import { validateSubscription, validatePayment } from "../middleware/validation.js";
import { validationResult } from "express-validator";

// Import subscription controller methods
import {
  createSubscription,
  getAllSubscriptions,
  getSubscriptionById,
  updateSubscription,
  deleteSubscription,
  getUserSubscription,
  cancelSubscription,
  reactivateSubscription,
  upgradeSubscription,
  downgradeSubscription,
  getSubscriptionStats,
  processPayment,
  getPaymentHistory,
  refundPayment,
  exportSubscriptionData,
  getAllPlans
} from "../controllers/subscription.controller.js";

const router = express.Router();

router.get("/plans", getAllPlans);
// Apply authentication middleware to all routes
router.use(auth);

/**
 * @route   POST /api/subscriptions
 * @desc    Create a new subscription with Razorpay order
 * @access  Private (User or Admin)
 */
router.post('/', auth, createSubscription);

/**
 * @route   GET /api/subscriptions
 * @desc    Get all subscriptions with filtering
 * @access  Admin Only
 */
router.get('/', getAllSubscriptions);

/**
 * @route   POST /api/subscriptions/upgrade
 * @desc    Upgrade user subscription
 * @access  Private
 */
router.post('/upgrade',
  rateLimiter('subscriptionAction', 3, 60 * 60 * 1000), // 3 actions per hour
  validateSubscription,
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  },
  upgradeSubscription
);

/**
 * @route   POST /api/subscriptions/downgrade
 * @desc    Downgrade user subscription
 * @access  Private
 */
router.post('/downgrade',
  rateLimiter('subscriptionAction', 3, 60 * 60 * 1000), // 3 actions per hour
  validateSubscription,
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  },
  downgradeSubscription
);

/**
 * @route   POST /api/subscriptions/cancel
 * @desc    Cancel user subscription
 * @access  Private
 */
router.post('/cancel',
  rateLimiter('subscriptionAction', 2, 24 * 60 * 60 * 1000), // 2 cancellations per day
  cancelSubscription
);

/**
 * @route   POST /api/subscriptions/reactivate
 * @desc    Reactivate cancelled subscription
 * @access  Private
 */
router.post('/reactivate',
  rateLimiter('subscriptionAction', 3, 60 * 60 * 1000), // 3 actions per hour
  reactivateSubscription
);

/**
 * @route   POST /api/subscriptions/payment
 * @desc    Process payment for subscription
 * @access  Private
 */
router.post('/payment',
  rateLimiter('payment', 5, 60 * 60 * 1000), // 5 payments per hour
  validatePayment,
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  },
  processPayment
);

/**
 * @route   GET /api/subscriptions/payment/history
 * @desc    Get user's payment history
 * @access  Private
 */
router.get('/payment/history', getPaymentHistory);

// Admin-only routes (require admin role)
//router.use(isAdmin);

/**
 * @route   GET /api/subscriptions/stats/overview
 * @desc    Get subscription statistics
 * @access  Admin Only
 */
router.get('/stats/overview', getSubscriptionStats);

/**
 * @route   GET /api/subscriptions/export
 * @desc    Export subscription data
 * @access  Admin Only
 */
router.get('/export',
  rateLimiter('exportSubscriptions', 3, 60 * 60 * 1000), // 3 exports per hour
  exportSubscriptionData
);

/**
 * @route   POST /api/subscriptions/payment/:id/refund
 * @desc    Refund a payment
 * @access  Admin Only
 */
router.post('/payment/:id/refund',
  rateLimiter('refund', 5, 60 * 60 * 1000), // 5 refunds per hour
  refundPayment
);

/**
 * @route   POST /api/subscriptions
 * @desc    Create a new subscription (admin only)
 * @access  Admin Only
 */
router.post('/',
  rateLimiter('createSubscription', 20, 60 * 60 * 1000), // 20 creations per hour
  validateSubscription,
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  },
  createSubscription
);

/**
 * @route   GET /api/subscriptions/:id
 * @desc    Get specific subscription details
 * @access  Admin Only
 */
router.get('/:id', getSubscriptionById);

/**
 * @route   PUT /api/subscriptions/:id
 * @desc    Update subscription details
 * @access  Admin Only
 */
router.put('/:id',
  rateLimiter('updateSubscription', 30, 60 * 60 * 1000), // 30 updates per hour
  validateSubscription,
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  },
  updateSubscription
);

/**
 * @route   DELETE /api/subscriptions/:id
 * @desc    Delete subscription
 * @access  Admin Only
 */
router.delete('/:id',
  rateLimiter('deleteSubscription', 10, 60 * 60 * 1000), // 10 deletions per hour
  deleteSubscription
);

export default router; 