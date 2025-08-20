import mongoose, { Schema } from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

const adminSchema = new Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    fullName: {
      type: String,
      required: true,
      trim: true,
    },
    avatar: {
      type: String, // Cloudinary URL
      required: true,
    },
    phone: {
      type: String,
    },
    company: {
      type: String,
      required: true,
      trim: true,
    },
    position: {
      type: String,
      default: "",
    },

    // expertise as enum
    expertise: [
      {
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
    ],

    password: {
      type: String,
      required: true,
    },
    refreshToken: {
      type: String,
    },

    pastSessions: [
      {
        interview: {
          type: Schema.Types.ObjectId,
          ref: "Interview",
        },
        date: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  { timestamps: true }
);

// ============================
// 🔐 Password encryption middleware
// ============================
adminSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// ============================
// 🔑 Password verification
// ============================
adminSchema.methods.isPasswordCorrect = async function (password) {
  return await bcrypt.compare(password, this.password);
};

// ============================
// 🎟 Access token generation
// ============================
adminSchema.methods.generateAccessToken = function () {
  return jwt.sign(
    {
      _id: this._id,
      email: this.email,
      username: this.username,
      role: "admin", // always admin
    },
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: process.env.ACCESS_TOKEN_EXPIRY }
  );
};

// ============================
// 🔄 Refresh token generation
// ============================
adminSchema.methods.generateRefreshToken = function () {
  return jwt.sign(
    {
      _id: this._id,
    },
    process.env.REFRESH_TOKEN_SECRET,
    { expiresIn: process.env.REFRESH_TOKEN_EXPIRY }
  );
};

// ============================
// 📌 Indexes for faster queries
// ============================
adminSchema.index({ username: 1, email: 1 });

export const Admin = mongoose.model("Admin", adminSchema);
