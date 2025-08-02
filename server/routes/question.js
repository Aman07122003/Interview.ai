// server/routes/question.js
import express from "express";
import adminAuth from "../middleware/adminAuth.js";

import { createQuestion } from "../controllers/questionController.js";

import { validateQuestion } from "../middleware/validation.js";
import { validationResult } from "express-validator";

const router = express.Router();

// This route is for admins only
router.post('/questions',
  adminAuth,
  validateQuestion,
  (req, res, next) => {
    // Check for validation errors first
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    return createQuestion(req, res, next);
  });

export default router;
