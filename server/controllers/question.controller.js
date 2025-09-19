// controllers/question.controller.js
import asyncHandler from "../utils/asyncHandler.js";
import { APIResponse } from "../utils/APIResponse.js";
import { APIError } from "../utils/APIError.js";
import mongoose from "mongoose";


export const createQuestion = asyncHandler(async (req, res) => {
  const { 
    category, 
    difficulty,
    title,
    description,
    tags,
   } = req.body;

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