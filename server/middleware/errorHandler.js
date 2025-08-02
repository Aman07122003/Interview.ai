// middleware/errorHandler.js
import { APIError } from "../utils/APIError.js";
import { logger } from '../utils/logger.js';

/**
 * Global error handling middleware
 */
export const errorHandler = (err, req, res, next) => {
  let error = err;

  // Log error
  logger.error({
    message: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });

  // Handle different error types
  if (error.name === "CastError") {
    error = new APIError(400, "Invalid ID format");
  } else if (error.name === "ValidationError") {
    const message = Object.values(error.errors).map(val => val.message).join(", ");
    error = new APIError(400, message);
  } else if (error.code === 11000) {
    const field = Object.keys(error.keyValue)[0];
    error = new APIError(409, `${field} already exists`);
  } else if (error.name === "JsonWebTokenError") {
    error = new APIError(401, "Invalid token");
  } else if (error.name === "TokenExpiredError") {
    error = new APIError(401, "Token expired");
  }

  // Send error response
  res.status(error.statusCode || 500).json({
    success: false,
    message: error.message || "Internal server error",
    ...(process.env.NODE_ENV === "development" && { stack: error.stack })
  });
};