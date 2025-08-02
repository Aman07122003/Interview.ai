// middleware/validation.js
import { body, param, query } from "express-validator";
import { APIError } from "../utils/APIError.js";
import { validationResult } from "express-validator";

/**
 * Custom validation result handler
 */
export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(error => ({
      field: error.path,
      message: error.msg,
      value: error.value
    }));
    
    throw new APIError(400, "Validation failed", errorMessages);
  }
  next();
};

/**
 * User registration validation
 */
export const validateRegistration = [
  body("email")
    .isEmail()
    .normalizeEmail()
    .withMessage("Valid email is required"),
  
  body("password")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters long")
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage("Password must contain at least one uppercase letter, one lowercase letter, and one number"),
  
  body("fullName")
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage("Full name must be between 2 and 100 characters"),
  
  body("role")
    .optional()
    .isIn(["candidate", "recruiter", "hiring-manager", "student", "user", "admin"])
    .withMessage("Invalid role selected"),
  
  handleValidationErrors
];

/**
 * User login validation
 */
export const validateLogin = [
  body("email")
    .isEmail()
    .normalizeEmail()
    .withMessage("Valid email is required"),
  
  body("password")
    .notEmpty()
    .withMessage("Password is required"),
  
  handleValidationErrors
];

/**
 * Question creation validation
 */
export const validateQuestion = [
  body("questionText")
    .trim()
    .isLength({ min: 10, max: 1000 })
    .withMessage("Question text must be between 10 and 1000 characters"),
  
  body("category")
    .isIn([
      "javascript", "react", "nodejs", "python", "java", "cpp", 
      "dsa", "oop", "dbms", "system-design", "frontend", "backend",
      "fullstack", "devops", "machine-learning", "general"
    ])
    .withMessage("Invalid question category"),
  
  body("difficulty")
    .optional()
    .isIn(["easy", "medium", "hard", "expert"])
    .withMessage("Invalid difficulty level"),
  
  handleValidationErrors
];

/**
 * Interview attempt validation
 */
export const validateInterviewAttempt = [
  body("questionId")
    .isMongoId()
    .withMessage("Valid question ID is required"),
  
  body("answerText")
    .trim()
    .isLength({ min: 1, max: 5000 })
    .withMessage("Answer must be between 1 and 5000 characters"),
  
  handleValidationErrors
];

/**
 * Subscription validation
 */
export const validateSubscription = [
  body("plan")
    .isIn(["free", "basic", "premium", "enterprise"])
    .withMessage("Invalid subscription plan"),
  
  body("expiresAt")
    .isISO8601()
    .withMessage("Valid expiration date is required"),
  
  body("amount")
    .isFloat({ min: 0 })
    .withMessage("Valid amount is required"),
  
  handleValidationErrors
];

/**
 * Payment validation
 */
export const validatePayment = [
  body("amount")
    .isFloat({ min: 0.01 })
    .withMessage("Amount must be a positive number"),
  body("currency")
    .isString()
    .isLength({ min: 3, max: 3 })
    .withMessage("Currency must be a 3-letter code (e.g., USD)"),
  body("method")
    .isIn(["card", "paypal", "stripe", "bank_transfer"])
    .withMessage("Invalid payment method"),
  handleValidationErrors
];

/**
 * ObjectId parameter validation
 */
export const validateObjectId = [
  param("id")
    .isMongoId()
    .withMessage("Valid ID is required"),
  
  handleValidationErrors
];

/**
 * Pagination query validation
 */
export const validatePagination = [
  query("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Page must be a positive integer"),
  
  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("Limit must be between 1 and 100"),
  
  handleValidationErrors
];

/**
 * Password reset validation
 */
export const validatePasswordReset = [
  body("token")
    .notEmpty()
    .withMessage("Reset token is required"),
  body("newPassword")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters long")
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage("Password must contain at least one uppercase letter, one lowercase letter, and one number"),
  handleValidationErrors
];

/**
 * Profile update validation
 */
export const validateProfileUpdate = [
  body("fullName")
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage("Full name must be between 2 and 100 characters"),
  body("email")
    .optional()
    .isEmail()
    .normalizeEmail()
    .withMessage("Valid email is required"),
  body("username")
    .optional()
    .trim()
    .isLength({ min: 3, max: 30 })
    .withMessage("Username must be between 3 and 30 characters")
    .matches(/^[a-zA-Z0-9_-]+$/)
    .withMessage("Username can only contain letters, numbers, underscores, and hyphens"),
  body("description")
    .optional()
    .isLength({ max: 500 })
    .withMessage("Description must be at most 500 characters"),
  body("phone")
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ min: 10, max: 15 })
    .withMessage("Phone number must be between 10 and 15 characters"),
  body("linkedin")
    .optional({ checkFalsy: true })
    .isURL()
    .withMessage("LinkedIn must be a valid URL"),
  body("bio")
    .optional({ checkFalsy: true })
    .isLength({ max: 1000 })
    .withMessage("Bio must be at most 1000 characters"),
  handleValidationErrors
];

/**
 * Answer submission validation
 */
export const validateAnswerSubmission = [
  body("interviewId")
    .notEmpty()
    .withMessage("Interview ID is required"),
  body("questionId")
    .notEmpty()
    .withMessage("Question ID is required"),
  body("answerText")
    .notEmpty()
    .withMessage("Answer text is required"),
  handleValidationErrors
];

/**
 * Interview start validation
 */
export const validateInterviewStart = [
  body("category")
    .notEmpty()
    .withMessage("Category is required")
    .isString()
    .withMessage("Category must be a string"),
  handleValidationErrors
];

/**
 * Question update validation
 */
export const validateQuestionUpdate = [
  body("category")
    .optional()
    .isIn([
      "javascript", "react", "nodejs", "python", "java", "cpp", 
      "dsa", "oop", "dbms", "system-design", "frontend", "backend",
      "fullstack", "devops", "machine-learning", "general"
    ])
    .withMessage("Invalid question category"),
  body("questionText")
    .optional()
    .isLength({ min: 10, max: 1000 })
    .withMessage("Question text must be between 10 and 1000 characters"),
  handleValidationErrors
];

/**
 * System settings update validation (stub)
 */
export const validateSystemSettings = [
  // Add specific validation rules as needed
  handleValidationErrors
];

/**
 * User update validation
 */
export const validateUserUpdate = [
  body("username")
    .optional()
    .trim()
    .isLength({ min: 3, max: 30 })
    .withMessage("Username must be between 3 and 30 characters")
    .matches(/^[a-zA-Z0-9_-]+$/)
    .withMessage("Username can only contain letters, numbers, underscores, and hyphens"),
  body("email")
    .optional()
    .isEmail()
    .normalizeEmail()
    .withMessage("Valid email is required"),
  body("fullName")
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage("Full name must be between 2 and 100 characters"),
  body("role")
    .optional()
    .isIn(["user", "admin"])
    .withMessage("Role must be either 'user' or 'admin'"),
  body("accountType")
    .optional()
    .isIn(["free", "basic", "premium", "enterprise"])
    .withMessage("Invalid account type"),
  handleValidationErrors
];