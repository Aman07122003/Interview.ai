import express from "express";
import { auth } from "../middleware/auth.js";
import {
  startInterview,
  submitAnswer,
  submitInterview,
  getInterviewResult,
} from "../controllers/interview.controller.js";

const router = express.Router();

// All interview routes need authentication
router.use(auth);

/**
 * @route   POST /api/interviews/:sessionId/start
 * @desc    Start or resume an interview session
 */
router.post("/:sessionId/start", startInterview);

/**
 * @route   POST /api/interviews/answer
 * @desc    Submit answer for a single question
 */
router.post("/answer", submitAnswer);

/**
 * @route   POST /api/interviews/submit
 * @desc    Submit the interview and trigger AI evaluation
 */
router.post("/submit", submitInterview);

/**
 * @route   GET /api/interviews/result/:resultId
 * @desc    Get evaluated interview result (candidate or interviewer can fetch)
 */
router.get("/result/:resultId", getInterviewResult);

export default router;
