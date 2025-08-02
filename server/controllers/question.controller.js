// controllers/question.controller.js
import asyncHandler from "../utils/asyncHandler.js";
import { Question } from "../models/Question.js";
import { APIResponse } from "../utils/APIResponse.js";
import { APIError } from "../utils/APIError.js";
import mongoose from "mongoose";

/**
 * @route   POST /api/questions
 * @method  POST
 * @access  Admin Only
 * @desc    Create a new question for the technical interview platform
 */
export const createQuestion = asyncHandler(async (req, res) => {
  const { category, questionText } = req.body;

  // Validate required fields
  if (!category || !questionText) {
    throw new APIError(400, "Category and questionText are required fields");
  }

  // Validate category enum values (matching Interview model categories)
  const validCategories = [
    "javascript", "react", "nodejs", "python", "java", "cpp", 
    "dsa", "oop", "dbms", "system-design", "frontend", "backend",
    "fullstack", "devops", "machine-learning", "general"
  ];

  if (!validCategories.includes(category.toLowerCase())) {
    throw new APIError(400, `Invalid category. Must be one of: ${validCategories.join(", ")}`);
  }

  // Validate question text length
  if (questionText.trim().length < 10) {
    throw new APIError(400, "Question text must be at least 10 characters long");
  }

  if (questionText.trim().length > 1000) {
    throw new APIError(400, "Question text cannot exceed 1000 characters");
  }

  // Create the question
  const question = await Question.create({
    category: category.toLowerCase(),
    questionText: questionText.trim(),
    createdBy: req.user._id, // Admin who created the question
  });

  return res.status(201).json(
    new APIResponse(201, {
      question: {
        id: question._id,
        category: question.category,
        questionText: question.questionText,
        createdBy: question.createdBy,
        createdAt: question.createdAt,
      },
    }, "Question created successfully")
  );
});

/**
 * @route   GET /api/questions
 * @method  GET
 * @access  Public
 * @desc    Fetch all questions with optional category filtering
 */
export const getAllQuestions = asyncHandler(async (req, res) => {
  const { category, page = 1, limit = 20, sortBy = "createdAt", sortOrder = "desc" } = req.query;

  // Build filter object
  const filter = {};
  if (category) {
    filter.category = category.toLowerCase();
  }

  // Validate pagination parameters
  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  
  if (pageNum < 1 || limitNum < 1 || limitNum > 100) {
    throw new APIError(400, "Invalid pagination parameters. Page must be >= 1, limit must be between 1-100");
  }

  // Validate sort parameters
  const validSortFields = ["createdAt", "category", "questionText"];
  const validSortOrders = ["asc", "desc"];
  
  if (!validSortFields.includes(sortBy)) {
    throw new APIError(400, `Invalid sort field. Must be one of: ${validSortFields.join(", ")}`);
  }
  
  if (!validSortOrders.includes(sortOrder)) {
    throw new APIError(400, "Invalid sort order. Must be 'asc' or 'desc'");
  }

  // Build sort object
  const sort = {};
  sort[sortBy] = sortOrder === "desc" ? -1 : 1;

  // Calculate skip value for pagination
  const skip = (pageNum - 1) * limitNum;

  // Execute query with pagination
  const questions = await Question.find(filter)
    .sort(sort)
    .skip(skip)
    .limit(limitNum)
    .select("_id category questionText createdAt")
    .lean();

  // Get total count for pagination metadata
  const totalQuestions = await Question.countDocuments(filter);
  const totalPages = Math.ceil(totalQuestions / limitNum);

  return res.status(200).json(
    new APIResponse(200, {
      questions,
      pagination: {
        currentPage: pageNum,
        totalPages,
        totalQuestions,
        hasNextPage: pageNum < totalPages,
        hasPrevPage: pageNum > 1,
      },
    }, "Questions retrieved successfully")
  );
});

/**
 * @route   GET /api/questions/:id
 * @method  GET
 * @access  Public
 * @desc    Get a specific question by its ID
 */
export const getQuestionById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Validate ObjectId format
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new APIError(400, "Invalid question ID format");
  }

  // Find the question
  const question = await Question.findById(id)
    .select("_id category questionText createdAt updatedAt")
    .lean();

  if (!question) {
    throw new APIError(404, "Question not found");
  }

  return res.status(200).json(
    new APIResponse(200, { question }, "Question retrieved successfully")
  );
});

/**
 * @route   PUT /api/questions/:id
 * @method  PUT
 * @access  Admin Only
 * @desc    Update an existing question's category and/or questionText
 */
export const updateQuestion = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { category, questionText } = req.body;

  // Validate ObjectId format
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new APIError(400, "Invalid question ID format");
  }

  // Check if at least one field is provided for update
  if (!category && !questionText) {
    throw new APIError(400, "At least one field (category or questionText) is required for update");
  }

  // Validate category if provided
  if (category) {
    const validCategories = [
      "javascript", "react", "nodejs", "python", "java", "cpp", 
      "dsa", "oop", "dbms", "system-design", "frontend", "backend",
      "fullstack", "devops", "machine-learning", "general"
    ];

    if (!validCategories.includes(category.toLowerCase())) {
      throw new APIError(400, `Invalid category. Must be one of: ${validCategories.join(", ")}`);
    }
  }

  // Validate question text if provided
  if (questionText) {
    if (questionText.trim().length < 10) {
      throw new APIError(400, "Question text must be at least 10 characters long");
    }

    if (questionText.trim().length > 1000) {
      throw new APIError(400, "Question text cannot exceed 1000 characters");
    }
  }

  // Build update object
  const updateData = {};
  if (category) updateData.category = category.toLowerCase();
  if (questionText) updateData.questionText = questionText.trim();

  // Find and update the question
  const updatedQuestion = await Question.findByIdAndUpdate(
    id,
    updateData,
    { 
      new: true, // Return the updated document
      runValidators: true // Run schema validators
    }
  ).select("_id category questionText createdAt updatedAt");

  if (!updatedQuestion) {
    throw new APIError(404, "Question not found");
  }

  return res.status(200).json(
    new APIResponse(200, {
      question: updatedQuestion,
    }, "Question updated successfully")
  );
});

/**
 * @route   DELETE /api/questions/:id
 * @method  DELETE
 * @access  Admin Only
 * @desc    Delete a question by its ID
 */
export const deleteQuestion = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Validate ObjectId format
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new APIError(400, "Invalid question ID format");
  }

  // Check if question exists before deletion
  const question = await Question.findById(id);
  if (!question) {
    throw new APIError(404, "Question not found");
  }

  // TODO: Add check for questions being used in active interviews
  // This prevents deletion of questions that are currently being used
  
  // Delete the question
  await Question.findByIdAndDelete(id);

  return res.status(200).json(
    new APIResponse(200, {
      deletedQuestionId: id,
    }, "Question deleted successfully")
  );
});

/**
 * @route   GET /api/questions/categories
 * @method  GET
 * @access  Public
 * @desc    Get all available question categories with question counts
 */
export const getQuestionCategories = asyncHandler(async (req, res) => {
  const categories = await Question.aggregate([
    {
      $group: {
        _id: "$category",
        count: { $sum: 1 }
      }
    },
    {
      $sort: { count: -1 }
    }
  ]);

  const categoryStats = categories.map(cat => ({
    category: cat._id,
    questionCount: cat.count
  }));

  return res.status(200).json(
    new APIResponse(200, {
      categories: categoryStats,
      totalCategories: categories.length,
    }, "Question categories retrieved successfully")
  );
});

/**
 * @route   POST /api/questions/bulk
 * @method  POST
 * @access  Admin Only
 * @desc    Bulk create questions
 */
export const bulkCreateQuestions = asyncHandler(async (req, res) => {
  const { questions } = req.body;

  if (!Array.isArray(questions) || questions.length === 0) {
    throw new APIError(400, "Questions array is required and cannot be empty");
  }

  const validCategories = [
    "javascript", "react", "nodejs", "python", "java", "cpp", 
    "dsa", "oop", "dbms", "system-design", "frontend", "backend",
    "fullstack", "devops", "machine-learning", "general"
  ];

  const toInsert = questions.map(q => {
    if (!q.category || !q.questionText) {
      throw new APIError(400, "Each question must have a category and questionText");
    }
    if (!validCategories.includes(q.category.toLowerCase())) {
      throw new APIError(400, `Invalid category: ${q.category}`);
    }
    if (q.questionText.trim().length < 10 || q.questionText.trim().length > 1000) {
      throw new APIError(400, "Question text must be between 10 and 1000 characters");
    }
    return {
      category: q.category.toLowerCase(),
      questionText: q.questionText.trim(),
      createdBy: req.user._id
    };
  });

  const createdQuestions = await Question.insertMany(toInsert);

  return res.status(201).json(
    new APIResponse(201, {
      questions: createdQuestions
    }, "Questions created successfully")
  );
});

/**
 * @route   GET /api/questions/export
 * @method  GET
 * @access  Admin Only
 * @desc    Export all questions as JSON
 */
export const exportQuestions = asyncHandler(async (req, res) => {
  const questions = await Question.find().lean();

  res.setHeader('Content-Disposition', 'attachment; filename="questions.json"');
  res.setHeader('Content-Type', 'application/json');
  return res.status(200).send(JSON.stringify(questions, null, 2));
});

/**
 * @route   GET /api/questions/stats
 * @method  GET
 * @access  Admin Only
 * @desc    Get question statistics
 */
export const getQuestionStats = asyncHandler(async (req, res) => {
  const totalQuestions = await Question.countDocuments();
  const questionsPerCategory = await Question.aggregate([
    { $group: { _id: "$category", count: { $sum: 1 } } },
    { $sort: { count: -1 } }
  ]);
  const mostRecent = await Question.findOne().sort({ createdAt: -1 }).select("createdAt");

  return res.status(200).json(
    new APIResponse(200, {
      totalQuestions,
      questionsPerCategory,
      mostRecentQuestionDate: mostRecent ? mostRecent.createdAt : null
    }, "Question statistics fetched successfully")
  );
});

/**
 * @route   GET /api/questions/category/:category
 * @method  GET
 * @access  Public
 * @desc    Get all questions by category
 */
export const getQuestionsByCategory = asyncHandler(async (req, res) => {
  const { category } = req.params;
  if (!category) {
    throw new APIError(400, "Category is required");
  }
  const questions = await Question.find({ category: category.toLowerCase() })
    .select("_id category questionText createdAt")
    .lean();
  return res.status(200).json(
    new APIResponse(200, { questions }, "Questions fetched by category successfully")
  );
});

