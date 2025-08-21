import mongoose, { Schema } from "mongoose";

const resultSchema = new Schema(
  {
    // Link to interview session
    interview: {
      type: Schema.Types.ObjectId,
      ref: "InterviewSession",
      required: true,
    },

    // Candidate who gave the interview
    candidate: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Admin who conducted the interview
    conductedBy: {
      type: Schema.Types.ObjectId,
      ref: "Admin",
      required: true,
    },

    // Interview status
    status: {
      type: String,
      enum: ["in-progress", "completed", "evaluated"],
      default: "in-progress"
    },

    // QnA + evaluation
    responses: [
      {
        question: {
          type: String,
          required: true,
        },
        questionId: {
          type: Schema.Types.ObjectId,
          required: true,
        },
        answer: {
          type: String,
          default: "",
        },
        maxMarks: {
          type: Number,
          default: 10,
        },
        obtainedMarks: {
          type: Number,
          default: 0,
        },
        feedback: {
          type: String,
          default: "",
        },
        timeTaken: {
          type: Number, // in seconds
          default: 0,
        }
      },
    ],

    // Final evaluation summary
    totalObtained: {
      type: Number,
      default: 0,
    },
    totalMarks: {
      type: Number,
      default: function() {
        return this.responses ? this.responses.length * 10 : 0;
      }
    },
    percentage: {
      type: Number,
      default: 0,
    },

    // ChatGPT feedback
    overallFeedback: {
      type: String,
      default: "",
    },
    areasOfImprovement: [{
      type: String
    }],
    strengths: [{
      type: String
    }],
  },
  { timestamps: true }
);

// 🔄 Before save, calculate totals automatically
resultSchema.pre("save", function (next) {
  if (this.responses && this.responses.length > 0) {
    // Calculate total marks based on actual questions
    this.totalMarks = this.responses.length * 10;
    
    this.totalObtained = this.responses.reduce(
      (sum, r) => sum + (r.obtainedMarks || 0),
      0
    );
    
    // Avoid division by zero
    this.percentage = this.totalMarks > 0 
      ? (this.totalObtained / this.totalMarks) * 100 
      : 0;
  }
  next();
});

export const Result = mongoose.model("Result", resultSchema);