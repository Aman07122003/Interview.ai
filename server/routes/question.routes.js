// routes/question.routes.js
import express from "express";
import { auth } from "../middleware/auth.js";
import { isAdmin } from "../middleware/adminAuth.js";
import { rateLimiter } from "../middleware/rateLimiter.js";
import { validateQuestion, validateQuestionUpdate } from "../middleware/validation.js";
import { validationResult } from "express-validator";

// Import question controller methods
import {
  createQuestion,
  getAllQuestions,
  getQuestionById,
  updateQuestion,
  deleteQuestion,
  getQuestionsByCategory,
  getQuestionStats,
  bulkCreateQuestions,
  exportQuestions
} from "../controllers/question.controller.js";

const router = express.Router();

/**
 * @route   GET /api/questions
 * @desc    Get all questions with filtering and pagination
 * @access  Public
 */
router.get('/', getAllQuestions);

/**
 * @route   GET /api/questions/categories
 * @desc    Get all available question categories
 * @access  Public
 */
router.get('/categories', (req, res) => {
  const categories = [
    "javascript", "react", "nodejs", "python", "java", "cpp", 
    "dsa", "oop", "dbms", "system-design", "frontend", "backend",
    "fullstack", "devops", "machine-learning", "general"
  ];
  res.json({ categories });
});

/**
 * @route   GET /api/questions/category/:category
 * @desc    Get questions by specific category
 * @access  Public
 */
router.get('/category/:category', getQuestionsByCategory);

/**
 * @route   GET /api/questions/:id
 * @desc    Get a specific question by ID
 * @access  Public
 */
router.get('/:id', getQuestionById);

// Admin-only routes (require authentication and admin role)
router.use(auth, isAdmin);

/**
 * @route   POST /api/questions
 * @desc    Create a new question
 * @access  Admin Only
 */
router.post('/',
  rateLimiter('createQuestion', 20, 60 * 60 * 1000), // 20 questions per hour
  validateQuestion,
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  },
  createQuestion
);

/**
 * @route   POST /api/questions/bulk
 * @desc    Create multiple questions at once
 * @access  Admin Only
 */
router.post('/bulk',
  rateLimiter('bulkCreate', 5, 60 * 60 * 1000), // 5 bulk operations per hour
  bulkCreateQuestions
);

/**
 * @route   PUT /api/questions/:id
 * @desc    Update an existing question
 * @access  Admin Only
 */
router.put('/:id',
  rateLimiter('updateQuestion', 30, 60 * 60 * 1000), // 30 updates per hour
  validateQuestionUpdate,
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  },
  updateQuestion
);

/**
 * @route   DELETE /api/questions/:id
 * @desc    Delete a question
 * @access  Admin Only
 */
router.delete('/:id',
  rateLimiter('deleteQuestion', 10, 60 * 60 * 1000), // 10 deletions per hour
  deleteQuestion
);

/**
 * @route   GET /api/questions/stats/overview
 * @desc    Get question statistics for admin dashboard
 * @access  Admin Only
 */
router.get('/stats/overview', getQuestionStats);

/**
 * @route   GET /api/questions/export
 * @desc    Export questions to CSV/JSON
 * @access  Admin Only
 */
router.get('/export',
  rateLimiter('exportQuestions', 3, 60 * 60 * 1000), // 3 exports per hour
  exportQuestions
);

export default router; 