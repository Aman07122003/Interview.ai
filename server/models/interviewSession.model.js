import mongoose, { Schema } from "mongoose";
import { Admin } from "./Admin.js";
import { User } from "./User.js"; 
import aggregatePaginate from "mongoose-aggregate-paginate-v2";

const interviewSessionSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    createdBy: { type: Schema.Types.ObjectId, ref: "Admin", required: true },
    participants: [{ type: Schema.Types.ObjectId, ref: "User" }],
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
    type: {
      type: String,
      enum: ["Technical", "Behavioural", "Mixed"],
      default: "Technical",
    },
    questions: [{ text: { type: String, required: true } }],
    status: {
      type: String,
      enum: ["upcoming", "in-progress", "completed"],
      default: "upcoming",
    },
    scheduledAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// ✅ attach plugin so `aggregatePaginate` becomes available
interviewSessionSchema.plugin(aggregatePaginate);

// ============================
// 🔄 Post-save hook: update Admin + Users
// ============================
interviewSessionSchema.post("save", async function (doc, next) {
  try {
    await Admin.findByIdAndUpdate(doc.createdBy, {
      $push: {
        pastSessions: {
          interview: doc._id,
          date: doc.scheduledAt || new Date(),
        },
      },
    });

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
