import mongoose from "mongoose";

const InterviewAttemptSchema = new mongoose.Schema({ 
  candidate: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User",
    required: true 
  },
  question: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Question",
    required: true 
  },
  answer: { type: String, required: true },
  evaluation: { 
    score: Number,
    feedback: String,
  },
  topic: { 
    type: String, 
    enum: ['DSA', 'OOP', 'DBMS', 'General'], 
    default: 'General'
  },
  createdAt: { type: Date, default: Date.now },
});

// Each candidate can have many interview attempts
export default mongoose.model("InterviewAttempt", InterviewAttemptSchema);
