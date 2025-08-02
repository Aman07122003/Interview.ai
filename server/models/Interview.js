import mongoose from "mongoose";

/**
 * Interview Schema - AI-evaluated technical interview sessions
 * 
 * This model represents a complete interview session where a user answers
 * multiple questions and receives AI-generated feedback and scoring.
 */
const InterviewSchema = new mongoose.Schema({
  // Reference to the user who took the interview
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: [true, "User reference is required"],
    index: true
  },

  // Interview domain/category
  category: {
    type: String,
    required: [true, "Interview category is required"],
    trim: true,
    lowercase: true,
    enum: {
      values: [
        "javascript", "react", "nodejs", "python", "java", "cpp", 
        "dsa", "oop", "dbms", "system-design", "frontend", "backend",
        "fullstack", "devops", "machine-learning", "general"
      ],
      message: "Invalid interview category. Please choose from the predefined categories."
    }
  },

  // Interview type
  interviewType: {
    type: String,
    enum: ["practice", "assessment", "mock"],
    default: "practice"
  },

  // Array of questions with their answers, AI feedback, and scores
  questions: [{
    // Reference to the original question
    questionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Question",
      required: [true, "Question reference is required"]
    },

    // The actual question text (stored for reference during interview)
    questionText: {
      type: String,
      required: [true, "Question text is required"],
      trim: true
    },

    // User's answer to the question
    answerText: {
      type: String,
      default: null,
      trim: true,
      maxlength: [5000, "Answer cannot exceed 5000 characters"]
    },

    // AI-generated feedback for the answer
    aiFeedback: {
      type: String,
      default: null,
      trim: true,
      maxlength: [2000, "AI feedback cannot exceed 2000 characters"]
    },

    // Score given by AI (0-5 scale)
    score: {
      type: Number,
      default: null,
      min: [0, "Score cannot be less than 0"],
      max: [5, "Score cannot be more than 5"],
      validate: {
        validator: function(value) {
          return value === null || (Number.isInteger(value) || value % 0.5 === 0);
        },
        message: "Score must be a whole number or half-point (e.g., 3.5)"
      }
    },

    // Time taken to answer this question (in seconds)
    timeSpent: {
      type: Number,
      default: 0,
      min: [0, "Time spent cannot be negative"]
    },

    // Question difficulty level
    difficulty: {
      type: String,
      enum: ["easy", "medium", "hard", "expert"],
      default: "medium"
    }
  }],

  // Overall interview score (average of all question scores)
  score: {
    type: Number,
    default: null,
    min: [0, "Overall score cannot be less than 0"],
    max: [5, "Overall score cannot be more than 5"]
  },

  // AI-generated final report summarizing the entire interview
  finalReport: {
    type: String,
    default: null,
    trim: true,
    maxlength: [10000, "Final report cannot exceed 10000 characters"]
  },

  // Interview status
  status: {
    type: String,
    enum: {
      values: ["in-progress", "completed", "abandoned"],
      message: "Status must be either 'in-progress', 'completed', or 'abandoned'"
    },
    default: "in-progress",
    index: true
  },

  // Interview duration (in seconds)
  duration: {
    type: Number,
    default: 0,
    min: [0, "Duration cannot be negative"]
  },

  // Timestamp when interview was completed
  completedAt: {
    type: Date,
    default: null,
    validate: {
      validator: function(value) {
        if (this.status === "completed" && !value) {
          return false;
        }
        if (this.status === "in-progress" && value) {
          return false;
        }
        return true;
      },
      message: "completedAt must be set when status is 'completed' and null when 'in-progress'"
    }
  },

  // Interview settings
  settings: {
    timeLimit: {
      type: Number, // in minutes, 0 = no limit
      default: 0,
      min: [0, "Time limit cannot be negative"]
    },
    allowRetakes: {
      type: Boolean,
      default: true
    },
    showFeedback: {
      type: Boolean,
      default: true
    }
  },

  // Performance metrics
  metrics: {
    totalQuestions: {
      type: Number,
      default: 0
    },
    answeredQuestions: {
      type: Number,
      default: 0
    },
    correctAnswers: {
      type: Number,
      default: 0
    },
    averageTimePerQuestion: {
      type: Number,
      default: 0
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

/**
 * Virtual field to calculate the number of questions answered
 */
InterviewSchema.virtual('questionsAnswered').get(function() {
  return this.questions.filter(q => q.answerText !== null).length;
});

/**
 * Virtual field to calculate the number of questions with scores
 */
InterviewSchema.virtual('questionsScored').get(function() {
  return this.questions.filter(q => q.score !== null).length;
});

/**
 * Virtual field to check if interview is complete
 */
InterviewSchema.virtual('isComplete').get(function() {
  return this.status === "completed";
});

/**
 * Virtual field to calculate completion percentage
 */
InterviewSchema.virtual('completionPercentage').get(function() {
  if (this.questions.length === 0) return 0;
  return Math.round((this.questionsAnswered / this.questions.length) * 100);
});

/**
 * Pre-save middleware to automatically calculate overall score when all questions are scored
 */
InterviewSchema.pre('save', function(next) {
  // Only calculate score if interview is completed and we have scored questions
  if (this.status === "completed" && this.questions.length > 0) {
    const scoredQuestions = this.questions.filter(q => q.score !== null);
    
    if (scoredQuestions.length === this.questions.length) {
      const totalScore = scoredQuestions.reduce((sum, q) => sum + q.score, 0);
      this.score = parseFloat((totalScore / scoredQuestions.length).toFixed(2));
    }
  }
  
  // Set completedAt timestamp when status changes to completed
  if (this.status === "completed" && !this.completedAt) {
    this.completedAt = new Date();
  }

  // Calculate metrics
  this.metrics.totalQuestions = this.questions.length;
  this.metrics.answeredQuestions = this.questionsAnswered;
  this.metrics.correctAnswers = this.questions.filter(q => q.score && q.score >= 3).length;
  
  if (this.metrics.answeredQuestions > 0) {
    const totalTime = this.questions.reduce((sum, q) => sum + (q.timeSpent || 0), 0);
    this.metrics.averageTimePerQuestion = Math.round(totalTime / this.metrics.answeredQuestions);
  }
  
  next();
});

/**
 * Static method to find interviews by user
 */
InterviewSchema.statics.findByUser = function(userId) {
  return this.find({ user: userId }).sort({ createdAt: -1 });
};

/**
 * Static method to find completed interviews by user
 */
InterviewSchema.statics.findCompletedByUser = function(userId) {
  return this.find({ user: userId, status: "completed" }).sort({ completedAt: -1 });
};

/**
 * Instance method to check if all questions are answered
 */
InterviewSchema.methods.allQuestionsAnswered = function() {
  return this.questions.every(q => q.answerText !== null);
};

/**
 * Instance method to check if all questions are scored
 */
InterviewSchema.methods.allQuestionsScored = function() {
  return this.questions.every(q => q.score !== null);
};

// Create indexes for better query performance
InterviewSchema.index({ user: 1, status: 1 });
InterviewSchema.index({ user: 1, createdAt: -1 });
InterviewSchema.index({ status: 1, createdAt: -1 });
InterviewSchema.index({ category: 1, status: 1 });
InterviewSchema.index({ score: -1 });

export const Interview = mongoose.model("Interview", InterviewSchema);