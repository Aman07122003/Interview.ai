// routes/user.routes.js
import express from "express";
import { auth } from "../middleware/auth.js";
import { upload } from "../middleware/upload.js";
import { rateLimiter } from "../middleware/rateLimiter.js";
import { validateProfileUpdate } from "../middleware/validation.js";
import { validationResult } from "express-validator";

// Import user controller methods
import {
  getProfile,
  updateProfile,
  uploadAvatar,
  deleteAvatar,
  getUserStats,
  getInterviewHistory,
  deleteAccount,
  deactivateAccount,
  reactivateAccount,
  exportUserData,
  updateUserAvatar
} from "../controllers/user.controller.js";

const router = express.Router();

/**
 * @route   GET /api/user/profile
 * @desc    Get user profile
 * @access  Private
 */
router.get('/profile', auth, getProfile);

/**
 * @route   PUT /api/user/profile
 * @desc    Update user profile
 * @access  Private
 */
router.put('/profile', auth,
  rateLimiter('profileUpdate', 10, 60 * 60 * 1000), // 10 attempts per hour
  validateProfileUpdate,
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  },
  updateProfile
);

/**
 * @route   POST /api/user/avatar
 * @desc    Upload user avatar
 * @access  Private
 */
router.post('/avatar', auth,
  rateLimiter('avatarUpload', 5, 60 * 60 * 1000), // 5 uploads per hour
  upload.single('avatar'),
  uploadAvatar
);

/**
 * @route   DELETE /api/user/avatar
 * @desc    Delete user avatar
 * @access  Private
 */
router.delete('/avatar', auth, deleteAvatar);

/**
 * @route   GET /api/user/stats
 * @desc    Get user statistics
 * @access  Private
 */
router.get('/stats', auth, getUserStats);

/**
 * @route   GET /api/user/interviews
 * @desc    Get user interview history
 * @access  Private
 */
router.get('/interviews', auth, getInterviewHistory);

/**
 * @route   GET /api/user/interviews/:interviewId
 * @desc    Get specific interview details
 * @access  Private
 */
router.get('/interviews/:interviewId', auth, getInterviewHistory);

/**
 * @route   DELETE /api/user/account
 * @desc    Delete user account permanently
 * @access  Private
 */
router.delete('/account', auth,
  rateLimiter('accountAction', 1, 24 * 60 * 60 * 1000), // 1 attempt per day
  deleteAccount
);

/**
 * @route   PUT /api/user/avatar
 * @desc    Update user avatar
 * @access  Private
 */
router.put('/avatar', auth, upload.single('avatar'), updateUserAvatar);


/**
 * @route   GET /api/user/export
 * @desc    Export user data (GDPR compliance)
 * @access  Private
 */
router.get('/export', auth,
  rateLimiter('dataExport', 2, 24 * 60 * 60 * 1000), // 2 exports per day
  exportUserData
);

export default router; 