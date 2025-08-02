import express from "express";
// In routes/interview.js and routes/question.js
import { feedback } from "../controllers/interviewController.js";

import { validateInterviewAttempt } from "../middleware/validation.js";
import { validationResult } from "express-validator";

const router = express.Router();

router.post('/feedback',
  validateInterviewAttempt,
  (req, res, next) => {
    // Check for validation errors first
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    return feedback(req, res, next);
  });

export default router;

