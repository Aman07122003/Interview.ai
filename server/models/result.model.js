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

    // QnA + evaluation
    responses: [
      {
        question: {
          type: String,
          required: true,
        },
        answer: {
          type: String,
          required: true,
        },
        maxMarks: {
          type: Number,
          default: 10,
        },
        obtainedMarks: {
          type: Number,
          default: 0, // evaluated by ChatGPT
        },
      },
    ],

    // Final evaluation summary
    totalObtained: {
      type: Number,
      default: 0,
    },
    totalMarks: {
      type: Number,
      default: 100,
    },
    percentage: {
      type: Number,
      default: 0,
    },

    // ChatGPT feedback
    feedback: {
      type: String,
      default: "",
    },
    areaOfImprovement: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

// 🔄 Before save, calculate percentage automatically
resultSchema.pre("save", function (next) {
  if (this.responses && this.responses.length > 0) {
    this.totalObtained = this.responses.reduce(
      (sum, r) => sum + (r.obtainedMarks || 0),
      0
    );
    this.percentage = (this.totalObtained / this.totalMarks) * 100;
  }
  next();
});

export const Result = mongoose.model("Result", resultSchema);
