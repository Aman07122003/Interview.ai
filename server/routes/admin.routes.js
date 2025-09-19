import express from "express";
import {
  registerAdmin,
  loginAdmin,
  logoutAdmin,
  refreshAccessToken,
  createInterviewSession,
  getAdminInterviewSessions,
  getInterviewSession,
  updateInterviewSession,
  deleteInterviewSession,
  updateSessionStatus
} from "../controllers/admin.controller.js";
import { isAdmin } from "../middleware/adminAuth.js";
import { upload } from "../middleware/upload.js";

const router = express.Router();

// ====================================
// 🔐 Authentication Routes (No auth required)
// ====================================
router.route("/register").post(
  upload.fields([
    {
      name: "avatar",
      maxCount: 1,
    },
  ]),
  registerAdmin
);

router.route("/login").post(loginAdmin);

// ====================================
// 🔒 Protected Routes (Auth required)
// ====================================
router.use(isAdmin); // All routes below this require authentication

// Auth routes
router.route("/logout").post(logoutAdmin);
router.route("/refresh-token").post(refreshAccessToken);
router.route("/interview-sessions")
  .post(createInterviewSession)
  .get(getAdminInterviewSessions);

router.route("/interview-sessions/:sessionId")
  .get(getInterviewSession)
  .put(updateInterviewSession)
  .delete(deleteInterviewSession);

router.route("/interview-sessions/:sessionId/status")
  .patch(updateSessionStatus);

export default router;