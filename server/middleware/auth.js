// middleware/auth.js
import jwt from "jsonwebtoken";
import { User } from "../models/User.js";
import { APIError } from "../utils/APIError.js";
import asyncHandler from "../utils/asyncHandler.js";

/**
 * Authentication middleware to verify JWT tokens and attach user to request
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
export const auth = asyncHandler(async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new APIError(401, "Access token required");
    }

    const token = authHeader.split(" ")[1];

    if (!token) {
      throw new APIError(401, "Access token required");
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

    // Get user from database
    const user = await User.findById(decoded._id).select("-password -refreshToken");
    
    if (!user) {
      throw new APIError(401, "User not found");
    }

    // Attach user to request
    req.user = user;
    next();

  } catch (error) {
    if (error.name === "JsonWebTokenError") {
      throw new APIError(401, "Invalid access token");
    } else if (error.name === "TokenExpiredError") {
      throw new APIError(401, "Access token expired");
    }
    throw error;
  }
});

/**
 * Optional authentication middleware (doesn't throw error if no token)
 */
export const optionalAuth = asyncHandler(async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.split(" ")[1];
      const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
      const user = await User.findById(decoded._id).select("-password -refreshToken");
      
      if (user && user.isActive) {
        req.user = user;
      }
    }
    
    next();
  } catch (error) {
    // Continue without authentication
    next();
  }
});