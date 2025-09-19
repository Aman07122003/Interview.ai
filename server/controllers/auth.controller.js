// controllers/auth.controller.js
import asyncHandler from "../utils/asyncHandler.js";
import { User } from "../models/User.js";
import { APIResponse } from "../utils/APIResponse.js";
import { APIError } from "../utils/APIError.js";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

const generateAccessAndRefreshToken = async (userId) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      throw new APIError(400, "Invalid user ID");
    }

    const user = await User.findById(userId);
    if (!user) {
      throw new APIError(404, "User not found");
    }

    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { refreshToken, accessToken };
  } catch (error) {
    throw new APIError(500, "Something went wrong while generating tokens");
  }
};

export const register = asyncHandler(async (req, res) => {
  const { fullName, email, password, role } = req.body;
  const profilePic = req.file; // File uploaded via multer

  // Validate required fields
  if (!fullName || !email || !password) {
    throw new APIError(400, "Full name, email, and password are required");
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new APIError(400, "Invalid email format");
  }

  // Validate password strength
  if (password.length < 8) {
    throw new APIError(400, "Password must be at least 8 characters long");
  }

  // Generate username from fullName (optional, for backward compatibility)
  const username = email.split('@')[0] + '_' + Date.now();

  // Check if user already exists
  const existingUser = await User.findOne({
    email: email.toLowerCase()
  });

  if (existingUser) {
    throw new APIError(409, "User with this email already exists");
  }

  if (profilePic) {
    avatarUrl = await uploadToCloudinary(profilePic.path);
  }  
  
  if (profilePic) {
    // For now, we'll use the default avatar
    // In production, you would upload to cloudinary or similar service
    console.log('Profile picture received:', profilePic.originalname);
    // avatarUrl = await uploadToCloudinary(profilePic.path);
  }

  // Create new user
  const user = await User.create({
    username: username.toLowerCase(),
    email: email.toLowerCase(),
    password,
    fullName,
    role: role || "candidate", // Use the role from form or default to candidate
    avatar: avatarUrl,
  });

  // Remove sensitive fields from response
  const createdUser = await User.findById(user._id).select("-password -refreshToken");

  return res.status(201).json(
    new APIResponse(201, {
      user: createdUser,
      message: "Account created successfully. Please log in."
    }, "User registered successfully")
  );
});

export const login = asyncHandler(async (req, res) => {
  const { email, password, username } = req.body;

  // Validate input
  if ((!email && !username) || !password) {
    throw new APIError(400, "Email/username and password are required");
  }

  // Find user by email or username
  const user = await User.findOne({
    $or: [
      { email: email?.toLowerCase() },
      { username: username?.toLowerCase() }
    ]
  });

  if (!user) {
    throw new APIError(401, "Invalid credentials");
  }

  // Verify password
  const isPasswordValid = await user.isPasswordCorrect(password);
  if (!isPasswordValid) {
    throw new APIError(401, "Invalid credentials");
  }

  // Generate tokens
  const { accessToken, refreshToken } = await generateAccessAndRefreshToken(user._id);

  // Get user data without sensitive fields
  const loggedInUser = await User.findById(user._id).select("-password -refreshToken");

  // Set cookies
  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 24 * 60 * 60 * 1000 // 1 day
  };

  res.cookie("accessToken", accessToken, cookieOptions);
  res.cookie("refreshToken", refreshToken, {
    ...cookieOptions,
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  });

  return res.status(200).json(
    new APIResponse(200, {
      user: loggedInUser,
      accessToken,
      refreshToken
    }, "Login successful")
  );
});

export const logout = asyncHandler(async (req, res) => {
  // Clear refresh token from database
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $unset: { refreshToken: 1 }
    },
    { new: true }
  );

  // Clear cookies
  res.clearCookie("accessToken");
  res.clearCookie("refreshToken");

  return res.status(200).json(
    new APIResponse(200, {}, "Logged out successfully")
  );
});

export const refreshToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken;

  if (!incomingRefreshToken) {
    throw new APIError(401, "Refresh token is required");
  }

  try {
    // Verify refresh token
    const decoded = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET);
    
    const user = await User.findById(decoded._id);
    if (!user) {
      throw new APIError(401, "Invalid refresh token");
    }

    if (incomingRefreshToken !== user.refreshToken) {
      throw new APIError(401, "Refresh token is expired or used");
    }

    // Generate new tokens
    const { accessToken, refreshToken: newRefreshToken } = await generateAccessAndRefreshToken(user._id);

    // Set new cookies
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 24 * 60 * 60 * 1000 // 1 day
    };

    res.cookie("accessToken", accessToken, cookieOptions);
    res.cookie("refreshToken", newRefreshToken, {
      ...cookieOptions,
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    return res.status(200).json(
      new APIResponse(200, {
        accessToken,
        refreshToken: newRefreshToken
      }, "Access token refreshed successfully")
    );

  } catch (error) {
    throw new APIError(401, "Invalid refresh token");
  }
});


export const getProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select("-password -refreshToken");

  return res.status(200).json(
    new APIResponse(200, { user }, "Profile retrieved successfully")
  );
});