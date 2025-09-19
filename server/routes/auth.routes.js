// routes/auth.routes.js
import express from "express";
import { auth } from "../middleware/auth.js";
import { validateRegistration, validateLogin } from "../middleware/validation.js";
import { validationResult } from "express-validator";
import { uploadAvatar } from "../middleware/upload.js";

// Import auth controller methods
import {
  register,
  login,
  logout,
  refreshToken,
} from "../controllers/auth.controller.js";

import { getCurrentUser } from "../controllers/user.controller.js";

const router = express.Router();

router.post('/register', 
  uploadAvatar, // Handle profile picture upload
  validateRegistration,
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  },
  register
);
router.post('/login',
  validateLogin,
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  },
  login
);
router.post('/logout', auth, logout);
router.post('/refresh-token', refreshToken);
router.get('/me', auth, getCurrentUser);
export default router; 