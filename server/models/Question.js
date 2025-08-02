import mongoose from "mongoose";

/**
 * Question Schema - Technical interview questions
 * 
 * This model represents individual questions that can be used in technical interviews.
 * Questions are categorized by technology/domain and managed by admins.
 */
const QuestionSchema = new mongoose.Schema({
  // Question category/domain
  category: {
    type: String,
    required: [true, "Question category is required"],
    trim: true,
    lowercase: true,
    enum: {
      values: [
        "javascript", "react", "nodejs", "python", "java", "cpp", 
        "dsa", "oop", "dbms", "system-design", "frontend", "backend",
        "fullstack", "devops", "machine-learning", "general"
      ],
      message: "Invalid category. Please choose from the predefined categories."
    },
    index: true
  },

  // The actual question text
  questionText: {
    type: String,
    required: [true, "Question text is required"],
    trim: true,
    maxlength: [1000, "Question text cannot exceed 1000 characters"],
    minlength: [10, "Question text must be at least 10 characters long"]
  },

  // Question difficulty level
  difficulty: {
    type: String,
    enum: ["easy", "medium", "hard", "expert"],
    default: "medium",
    index: true
  },

  // Question type
  questionType: {
    type: String,
    enum: ["multiple-choice", "coding", "system-design", "behavioral", "theoretical"],
    default: "theoretical"
  },

  // Expected answer or key points (for AI evaluation)
  expectedAnswer: {
    type: String,
    trim: true,
    maxlength: [2000, "Expected answer cannot exceed 2000 characters"]
  },

  // Tags for better categorization
  tags: {
    type: [String],
    default: [],
    validate: {
      validator: function(tags) {
        return tags.every(tag => typeof tag === 'string' && tag.trim().length > 0);
      },
      message: "All tags must be non-empty strings"
    }
  },

  // Question status
  status: {
    type: String,
    enum: ["active", "inactive", "draft"],
    default: "active",
    index: true
  },

  // Usage statistics
  usageCount: {
    type: Number,
    default: 0,
    min: [0, "Usage count cannot be negative"]
  },

  // Average score from interviews
  averageScore: {
    type: Number,
    default: 0,
    min: [0, "Average score cannot be negative"],
    max: [5, "Average score cannot exceed 5"]
  },

  // Reference to the admin who created this question
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Admin",
    required: [true, "Question creator reference is required"],
    index: true
  },

  // Question metadata
  estimatedTime: {
    type: Number, // in minutes
    default: 5,
    min: [1, "Estimated time must be at least 1 minute"]
  },

  // Question priority/weight
  priority: {
    type: Number,
    default: 1,
    min: [1, "Priority must be at least 1"],
    max: [10, "Priority cannot exceed 10"]
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

/**
 * Virtual field to check if question is frequently used
 */
QuestionSchema.virtual('isPopular').get(function() {
  return this.usageCount > 10;
});

/**
 * Virtual field to get question complexity
 */
QuestionSchema.virtual('complexity').get(function() {
  const difficultyScores = { easy: 1, medium: 2, hard: 3, expert: 4 };
  return difficultyScores[this.difficulty] || 2;
});

/**
 * Static method to find questions by category
 */
QuestionSchema.statics.findByCategory = function(category) {
  return this.find({ category: category.toLowerCase(), status: "active" });
};

/**
 * Static method to find random questions
 */
QuestionSchema.statics.findRandom = function(category, limit = 10) {
  return this.aggregate([
    { $match: { category: category.toLowerCase(), status: "active" } },
    { $sample: { size: limit } }
  ]);
};

// Create indexes for better query performance
QuestionSchema.index({ category: 1, difficulty: 1 });
QuestionSchema.index({ category: 1, status: 1 });
QuestionSchema.index({ createdBy: 1, createdAt: -1 });
QuestionSchema.index({ usageCount: -1 });
QuestionSchema.index({ averageScore: -1 });

export const Question = mongoose.model("Question", QuestionSchema);