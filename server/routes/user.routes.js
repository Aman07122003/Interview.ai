// routes/user.routes.js
import express from "express";
import { auth } from "../middleware/auth.js";
import { upload } from "../middleware/upload.js";
import { rateLimiter } from "../middleware/rateLimiter.js";
import { validateProfileUpdate } from "../middleware/validation.js";
import { validationResult } from "express-validator";

// Import user controller methods
import {
  updateUserProfile,
  updateUserAvatar,
  getUserProfile,
  getInterviewHistory,
  uploadAvatar,
  getUserStats,
} from "../controllers/user.controller.js";

const router = express.Router();


router.get('/profile', auth, getUserProfile);
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
  updateUserProfile
);
router.post('/avatar', auth,
  rateLimiter('avatarUpload', 5, 60 * 60 * 1000), // 5 uploads per hour
  upload.single('avatar'),
  uploadAvatar
);
router.get('/stats', auth, getUserStats);
router.get('/interviews', auth, getInterviewHistory);
router.get('/interviews/:interviewId', auth, getInterviewHistory);
router.put('/avatar', auth, upload.single('avatar'), updateUserAvatar);

export default router; 