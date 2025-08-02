// controllers/auth.controller.js
import asyncHandler from "../utils/asyncHandler.js";
import { User } from "../models/User.js";
import { APIResponse } from "../utils/APIResponse.js";
import { APIError } from "../utils/APIError.js";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import bcrypt from "bcrypt";
import crypto from "crypto";

/**
 * Helper function to generate access and refresh tokens
 */
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

/**
 * @route   POST /api/auth/register
 * @method  POST
 * @access  Public
 * @desc    Register a new user
 */
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

  // Handle profile picture upload
  let avatarUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`; // Default avatar
  
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

/**
 * @route   POST /api/auth/login
 * @method  POST
 * @access  Public
 * @desc    Login user
 */
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

/**
 * @route   POST /api/auth/logout
 * @method  POST
 * @access  Private
 * @desc    Logout user
 */
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

/**
 * @route   POST /api/auth/refresh-token
 * @method  POST
 * @access  Public
 * @desc    Refresh access token
 */
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

/**
 * @route   POST /api/auth/forgot-password
 * @method  POST
 * @access  Public
 * @desc    Send password reset email
 */
export const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    throw new APIError(400, "Email is required");
  }

  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) {
    // Don't reveal if user exists or not for security
    return res.status(200).json(
      new APIResponse(200, {}, "If an account with that email exists, a reset link has been sent")
    );
  }

  // Generate reset token
  const resetToken = crypto.randomBytes(32).toString("hex");
  const resetTokenExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  // Save reset token to user (hashed)
  user.resetPasswordToken = crypto.createHash("sha256").update(resetToken).digest("hex");
  user.resetPasswordExpiry = resetTokenExpiry;
  await user.save({ validateBeforeSave: false });

  // TODO: Send email with reset link
  // const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;
  // await sendEmail({
  //   email: user.email,
  //   subject: "Password Reset Request",
  //   message: `You requested a password reset. Click this link: ${resetUrl}`
  // });

  return res.status(200).json(
    new APIResponse(200, {}, "Password reset email sent successfully")
  );
});

/**
 * @route   POST /api/auth/reset-password
 * @method  POST
 * @access  Public
 * @desc    Reset password with token
 */
export const resetPassword = asyncHandler(async (req, res) => {
  const { token, newPassword } = req.body;

  if (!token || !newPassword) {
    throw new APIError(400, "Token and new password are required");
  }

  if (newPassword.length < 8) {
    throw new APIError(400, "Password must be at least 8 characters long");
  }

  // Hash the token to compare with stored hash
  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

  const user = await User.findOne({
    resetPasswordToken: hashedToken,
    resetPasswordExpiry: { $gt: Date.now() }
  });

  if (!user) {
    throw new APIError(400, "Invalid or expired reset token");
  }

  // Update password and clear reset token
  user.password = newPassword;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpiry = undefined;
  await user.save();

  return res.status(200).json(
    new APIResponse(200, {}, "Password reset successfully")
  );
});

/**
 * @route   PUT /api/auth/change-password
 * @method  PUT
 * @access  Private
 * @desc    Change password for authenticated user
 */
export const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    throw new APIError(400, "Current password and new password are required");
  }

  if (newPassword.length < 8) {
    throw new APIError(400, "New password must be at least 8 characters long");
  }

  const user = await User.findById(req.user._id);
  const isPasswordCorrect = await user.isPasswordCorrect(currentPassword);

  if (!isPasswordCorrect) {
    throw new APIError(401, "Current password is incorrect");
  }

  // Update password
  user.password = newPassword;
  await user.save();

  return res.status(200).json(
    new APIResponse(200, {}, "Password changed successfully")
  );
});

/**
 * @route   GET /api/auth/profile
 * @method  GET
 * @access  Private
 * @desc    Get current user profile
 */
export const getProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select("-password -refreshToken");

  return res.status(200).json(
    new APIResponse(200, { user }, "Profile retrieved successfully")
  );
});

/**
 * @route   PUT /api/auth/profile
 * @method  PUT
 * @access  Private
 * @desc    Update current user profile
 */
export const updateProfile = asyncHandler(async (req, res) => {
  const { fullName, email, username, description } = req.body;

  if (!fullName && !email && !username && !description) {
    throw new APIError(400, "At least one field is required for update");
  }

  const user = await User.findById(req.user._id);

  // Update fields if provided
  if (fullName) user.fullName = fullName;
  if (description) user.description = description;

  // Check email uniqueness if updating
  if (email && email !== user.email) {
    const emailExists = await User.findOne({ email: email.toLowerCase() });
    if (emailExists) {
      throw new APIError(409, "Email already in use");
    }
    user.email = email.toLowerCase();
  }

  // Check username uniqueness if updating
  if (username && username !== user.username) {
    const usernameExists = await User.findOne({ username: username.toLowerCase() });
    if (usernameExists) {
      throw new APIError(409, "Username already taken");
    }
    user.username = username.toLowerCase();
  }

  await user.save();

  const updatedUser = await User.findById(user._id).select("-password -refreshToken");

  return res.status(200).json(
    new APIResponse(200, { user: updatedUser }, "Profile updated successfully")
  );
});

/**
 * @route   POST /api/auth/resend-verification
 * @method  POST
 * @access  Public
 * @desc    Resend account verification email
 */
export const resendVerificationEmail = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    throw new APIError(400, "Email is required");
  }

  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) {
    // Don't reveal if user exists or not for security
    return res.status(200).json(
      new APIResponse(200, {}, "If an account with that email exists, a verification link has been sent.")
    );
  }

  // Generate a new verification token (simulate)
  const verificationToken = crypto.randomBytes(32).toString("hex");
  user.verificationToken = crypto.createHash("sha256").update(verificationToken).digest("hex");
  user.verificationTokenExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
  await user.save({ validateBeforeSave: false });

  // TODO: Send email with verification link
  // const verifyUrl = `${process.env.FRONTEND_URL}/verify-email/${verificationToken}`;
  // await sendEmail({
  //   email: user.email,
  //   subject: "Verify Your Account",
  //   message: `Click this link to verify your account: ${verifyUrl}`
  // });

  return res.status(200).json(
    new APIResponse(200, {}, "Verification email sent successfully.")
  );
});

/**
 * @route   POST /api/auth/verify-email
 * @method  POST
 * @access  Public
 * @desc    Verify user email with token
 */
export const verifyEmail = asyncHandler(async (req, res) => {
  const { token } = req.body;

  if (!token) {
    throw new APIError(400, "Verification token is required");
  }

  // Hash the token to compare with stored hash
  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

  // Find user with matching verification token and not expired
  const user = await User.findOne({
    verificationToken: hashedToken,
    verificationTokenExpiry: { $gt: Date.now() },
  });

  if (!user) {
    throw new APIError(400, "Invalid or expired verification token");
  }

  // Mark user as verified
  user.isVerified = true;
  user.verificationToken = undefined;
  user.verificationTokenExpiry = undefined;
  await user.save();

  return res.status(200).json(
    new APIResponse(200, {}, "Email verified successfully. You can now log in.")
  );
});
