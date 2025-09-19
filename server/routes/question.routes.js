// routes/question.routes.js
import express from "express";
import { auth } from "../middleware/auth.js";
import { isAdmin } from "../middleware/adminAuth.js";
import { rateLimiter } from "../middleware/rateLimiter.js";
import { validateQuestion } from "../middleware/validation.js";
import { validationResult } from "express-validator";

// Import question controller methods
import {
  createQuestion,
  getAllQuestions,
  getQuestionById,
  getQuestionsByCategory,
} from "../controllers/question.controller.js";

const router = express.Router();

router.get('/', getAllQuestions);
router.get('/categories', (req, res) => {
  const categories = [
    "javascript", "react", "nodejs", "python", "java", "cpp", 
    "dsa", "oop", "dbms", "system-design", "frontend", "backend",
    "fullstack", "devops", "machine-learning", "general"
  ];
  res.json({ categories });
});
router.get('/category/:category', getQuestionsByCategory);
router.get('/:id', getQuestionById);

// Admin-only routes (require authentication and admin role)
router.use(auth, isAdmin);
router.post('/create',createQuestion );

export default router; 