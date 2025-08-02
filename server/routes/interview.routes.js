// routes/interview.routes.js
import express from "express";
import { auth } from "../middleware/auth.js";
import { rateLimiter } from "../middleware/rateLimiter.js";
import { validateInterviewStart, validateAnswerSubmission } from "../middleware/validation.js";
import { validationResult } from "express-validator";

// Import interview controller methods
import {
  startInterview,
  submitAnswer,
  submitInterview,
  getInterviewReport,
  getInterviewHistory,
  getInterviewById,
  pauseInterview,
  resumeInterview,
  deleteInterview
} from "../controllers/interview.controller.js";

const router = express.Router();

// Apply authentication middleware to all routes
router.use(auth);

/**
 * @route   POST /api/interview/start
 * @desc    Start a new interview session
 * @access  Private
 */
router.post('/start',
  rateLimiter('startInterview', 100, 60 * 60 * 1000), // 3 interviews per hour
  validateInterviewStart,
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  },
  startInterview
);

/**
 * @route   POST /api/interview/:interviewId/answer
 * @desc    Submit answer for a specific question
 * @access  Private
 */
router.post('/:interviewId/answer',
  rateLimiter('submitAnswer', 20, 60 * 60 * 1000), // 20 answers per hour
  validateAnswerSubmission,
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  },
  submitAnswer
);

/**
 * @route   POST /api/interview/:interviewId/submit
 * @desc    Submit completed interview for final evaluation
 * @access  Private
 */
router.post('/:interviewId/submit',
  rateLimiter('submitInterview', 5, 60 * 60 * 1000), // 5 submissions per hour
  submitInterview
);

/**
 * @route   GET /api/interview/:interviewId
 * @desc    Get interview details by ID
 * @access  Private
 */
router.get('/:interviewId', getInterviewById);

/**
 * @route   GET /api/interview/:interviewId/report
 * @desc    Get detailed interview report
 * @access  Private
 */
router.get('/:interviewId/report', getInterviewReport);

/**
 * @route   GET /api/interview/history
 * @desc    Get user's interview history
 * @access  Private
 */
router.get('/history', getInterviewHistory);

/**
 * @route   POST /api/interview/:interviewId/pause
 * @desc    Pause an ongoing interview
 * @access  Private
 */
router.post('/:interviewId/pause',
  rateLimiter('interviewAction', 10, 60 * 60 * 1000), // 10 actions per hour
  pauseInterview
);

/**
 * @route   POST /api/interview/:interviewId/resume
 * @desc    Resume a paused interview
 * @access  Private
 */
router.post('/:interviewId/resume',
  rateLimiter('interviewAction', 10, 60 * 60 * 1000), // 10 actions per hour
  resumeInterview
);

/**
 * @route   DELETE /api/interview/:interviewId
 * @desc    Delete an interview (only if not completed)
 * @access  Private
 */
router.delete('/:interviewId',
  rateLimiter('deleteInterview', 3, 24 * 60 * 60 * 1000), // 3 deletions per day
  deleteInterview
);

export default router; 