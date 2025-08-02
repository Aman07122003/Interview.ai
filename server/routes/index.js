// routes/index.js
import express from "express";
import { errorHandler } from "../middleware/errorHandler.js";
import { rateLimiter } from "../middleware/rateLimiter.js";

// Import all route modules
import authRoutes from "./auth.routes.js";
import userRoutes from "./user.routes.js";
import interviewRoutes from "./interview.routes.js";
import questionRoutes from "./question.routes.js";
import adminRoutes from "./admin.routes.js";
import subscriptionRoutes from "./subscription.routes.js";

const router = express.Router();

// Apply global rate limiting to all routes
router.use(rateLimiter('global', 1000, 60 * 1000)); // 1000 requests per minute

// Health check endpoint
router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// API version info
router.get('/version', (req, res) => {
  res.json({
    version: '1.0.0',
    api: 'Mock Interview Platform API',
    documentation: '/api/docs'
  });
});

// Mount route modules
router.use('/auth', authRoutes);
router.use('/user', userRoutes);
router.use('/interview', interviewRoutes);
router.use('/questions', questionRoutes);
router.use('/admin', adminRoutes);
router.use('/subscriptions', subscriptionRoutes);

// 404 handler for undefined routes
router.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
    error: 'Not Found',
    statusCode: 404
  });
});

// Global error handler (should be last)
router.use(errorHandler);

export default router; 