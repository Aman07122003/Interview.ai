import mongoose, { Schema } from "mongoose";
import { Admin } from "./Admin.js";
import { User } from "./User.js"; // import User model

const interviewSessionSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      default: "",
    },

    // linked to admin who created it
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "Admin",
      required: true,
    },

    // users invited to this session
    participants: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    // expertise area (match admin’s expertise enum)
    expertise: {
      type: String,
      enum: [
        "Technical",
        "Behavioural",
        "System Design",
        "Frontend",
        "Backend",
        "DevOps",
        "AI/ML",
        "Data Structures & Algorithms",
        "Soft Skills",
      ],
      required: true,
    },

    // interview type
    type: {
      type: String,
      enum: ["Technical", "Behavioural", "Mixed"],
      default: "Technical",
    },

    // questions (added by admin during creation)
    questions: [
      {
        text: {
          type: String,
          required: true,
        },
      },
    ],

    // session status
    status: {
      type: String,
      enum: ["upcoming", "in-progress", "completed"],
      default: "upcoming",
    },

    // scheduled time (optional)
    scheduledAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// ============================
// 🔄 Post-save hook: update Admin + Users
// ============================
interviewSessionSchema.post("save", async function (doc, next) {
  try {
    // 1. Update Admin's pastSessions
    await Admin.findByIdAndUpdate(doc.createdBy, {
      $push: {
        pastSessions: {
          interview: doc._id,
          date: doc.scheduledAt || new Date(),
        },
      },
    });

    // 2. Update each User's interviewHistory
    if (doc.participants && doc.participants.length > 0) {
      await User.updateMany(
        { _id: { $in: doc.participants } },
        {
          $push: {
            interviewHistory: {
              interview: doc._id,
              createdAt: new Date(),
            },
          },
        }
      );
    }

    next();
  } catch (err) {
    console.error("Error updating Admin/User interview history:", err);
    next(err);
  }
});

export const InterviewSession = mongoose.model(
  "InterviewSession",
  interviewSessionSchema
);
