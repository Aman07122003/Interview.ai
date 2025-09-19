import express from "express";
import { auth } from "../middleware/auth.js";
import {
  startInterview,
  submitAnswer,
  submitInterview,
  getInterviewResult,
} from "../controllers/interview.controller.js";

const router = express.Router();
router.use(auth);

router.post("/:sessionId/start", startInterview);
router.post("/answer", submitAnswer);
router.post("/submit", submitInterview);
router.get("/result/:resultId", getInterviewResult);

export default router;
