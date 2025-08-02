// middleware/adminAuth.js
import { APIError } from "../utils/APIError.js";

/**
 * Middleware to check if the authenticated user has admin privileges
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 * @throws {APIError} 403 if user is not an admin
 */
export const isAdmin = (req, res, next) => {
  try {
    // Check if user exists in request (should be set by auth middleware)
    if (!req.user) {
      throw new APIError(401, "Authentication required");
    }

    // Check if user has admin role
    if (req.user.role !== "admin") {
      throw new APIError(403, "Access denied. Admin privileges required");
    }

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Middleware to check if user has specific permissions
 */
export const hasPermission = (permission) => {
  return (req, res, next) => {
    try {
      if (!req.user) {
        throw new APIError(401, "Authentication required");
      }

      if (req.user.role === "admin") {
        return next(); // Admins have all permissions
      }

      if (!req.user.permissions || !req.user.permissions.includes(permission)) {
        throw new APIError(403, `Access denied. ${permission} permission required`);
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

// Legacy export for backward compatibility
export default isAdmin;