import jwt from "jsonwebtoken";
import { User } from "../models/User.js";
import { APIError } from "../utils/APIError.js";
import asyncHandler from "../utils/asyncHandler.js";

export const allowDeactivatedAuth = asyncHandler(async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new APIError(401, "Access token required");
    }
    const token = authHeader.split(" ")[1];
    if (!token) {
      throw new APIError(401, "Access token required");
    }
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    const user = await User.findById(decoded._id).select("-password -refreshToken");
    if (!user) {
      throw new APIError(401, "User not found");
    }
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