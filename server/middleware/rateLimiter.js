// middleware/rateLimiter.js
import rateLimit from "express-rate-limit";

/**
 * General API rate limiter
 */
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    success: false,
    message: "Too many requests from this IP, please try again later."
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Authentication rate limiter (stricter)
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs
  message: {
    success: false,
    message: "Too many authentication attempts, please try again later."
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Admin routes rate limiter
 */
export const adminLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // limit each IP to 50 requests per windowMs
  message: {
    success: false,
    message: "Too many admin requests, please try again later."
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Generic rate limiter for custom use (matches legacy usage)
 * @param {string} key - Unique key for the limiter (not used in express-rate-limit, for compatibility)
 * @param {number} max - Max requests per window
 * @param {number} windowMs - Window size in ms
 */
export function rateLimiter(key, max, windowMs) {
  return rateLimit({
    windowMs: windowMs || 15 * 60 * 1000,
    max: max || 100,
    message: {
      success: false,
      message: "Too many requests, please try again later."
    },
    standardHeaders: true,
    legacyHeaders: false,
  });
}