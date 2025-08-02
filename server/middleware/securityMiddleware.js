// middleware/securityMiddleware.js
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { APIError } from '../utils/APIError.js';
import asyncHandler from '../utils/asyncHandler.js';
import { User } from '../models/User.js';
import sessionMonitor from '../utils/sessionMonitor.js';

/**
 * Enhanced JWT validation with device fingerprinting
 */
export const enhancedAuth = asyncHandler(async (req, res, next) => {
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

    // Check if user is active
    if (!user.isActive) {
      throw new APIError(401, "Account is deactivated");
    }

    // Check if token is blacklisted
    const isBlacklisted = await checkTokenBlacklist(token);
    if (isBlacklisted) {
      throw new APIError(401, "Token has been revoked");
    }

    // Validate device fingerprint if provided
    const deviceFingerprint = req.headers['x-device-fingerprint'];
    if (deviceFingerprint && user.lastDeviceFingerprint) {
      if (deviceFingerprint !== user.lastDeviceFingerprint) {
        // Log suspicious device change
        await logSuspiciousActivity(user._id, 'device_fingerprint_mismatch', {
          expected: user.lastDeviceFingerprint,
          received: deviceFingerprint,
          ip: req.ip,
          userAgent: req.headers['user-agent']
        });
        
        // Optionally block access for security
        if (process.env.STRICT_DEVICE_VALIDATION === 'true') {
          throw new APIError(401, "Device verification failed");
        }
      }
    }

    // Attach user and security context to request
    req.user = user;
    req.securityContext = {
      deviceFingerprint,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      timestamp: new Date()
    };

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
 * Session security middleware for interview sessions
 */
export const sessionSecurity = asyncHandler(async (req, res, next) => {
  const { sessionId } = req.params;
  
  if (!sessionId) {
    throw new APIError(400, "Session ID required");
  }

  // Get session status from monitor
  const sessionStatus = sessionMonitor.getSessionStatus(sessionId);
  
  if (!sessionStatus) {
    throw new APIError(404, "Session not found");
  }

  // Check if session is locked
  if (sessionStatus.status === 'locked') {
    throw new APIError(423, "Session has been locked due to suspicious activity");
  }

  // Check if session belongs to user
  if (sessionStatus.userId !== req.user._id.toString()) {
    throw new APIError(403, "Access denied to this session");
  }

  // Check session timeout
  const now = new Date();
  const timeSinceHeartbeat = now - sessionStatus.lastHeartbeat;
  
  if (timeSinceHeartbeat > 300000) { // 5 minutes
    throw new APIError(408, "Session has expired due to inactivity");
  }

  // Attach session context
  req.sessionContext = {
    sessionId,
    sessionStatus,
    lastActivity: now
  };

  next();
});

/**
 * Device fingerprinting middleware
 */
export const deviceFingerprint = asyncHandler(async (req, res, next) => {
  const fingerprint = req.headers['x-device-fingerprint'];
  
  if (!fingerprint) {
    // Generate fingerprint from request data
    const fingerprintData = {
      userAgent: req.headers['user-agent'],
      acceptLanguage: req.headers['accept-language'],
      acceptEncoding: req.headers['accept-encoding'],
      ip: req.ip,
      timestamp: Date.now()
    };
    
    const generatedFingerprint = crypto
      .createHash('sha256')
      .update(JSON.stringify(fingerprintData))
      .digest('hex');
    
    req.deviceFingerprint = generatedFingerprint;
  } else {
    req.deviceFingerprint = fingerprint;
  }

  next();
});

/**
 * Request throttling by device/IP
 */
export const deviceThrottle = (maxRequests = 100, windowMs = 15 * 60 * 1000) => {
  const requestCounts = new Map();
  
  return asyncHandler(async (req, res, next) => {
    const key = req.deviceFingerprint || req.ip;
    const now = Date.now();
    
    if (!requestCounts.has(key)) {
      requestCounts.set(key, { count: 0, resetTime: now + windowMs });
    }
    
    const record = requestCounts.get(key);
    
    if (now > record.resetTime) {
      record.count = 0;
      record.resetTime = now + windowMs;
    }
    
    record.count++;
    
    if (record.count > maxRequests) {
      throw new APIError(429, "Too many requests from this device");
    }
    
    // Add rate limit headers
    res.set({
      'X-RateLimit-Limit': maxRequests,
      'X-RateLimit-Remaining': maxRequests - record.count,
      'X-RateLimit-Reset': new Date(record.resetTime).toISOString()
    });
    
    next();
  });
};

/**
 * JWT refresh token validation
 */
export const validateRefreshToken = asyncHandler(async (req, res, next) => {
  const { refreshToken } = req.body;
  
  if (!refreshToken) {
    throw new APIError(400, "Refresh token required");
  }

  try {
    // Verify refresh token
    const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
    
    // Get user
    const user = await User.findById(decoded._id);
    if (!user) {
      throw new APIError(401, "Invalid refresh token");
    }

    // Check if refresh token matches
    if (refreshToken !== user.refreshToken) {
      throw new APIError(401, "Invalid refresh token");
    }

    // Check if user is active
    if (!user.isActive) {
      throw new APIError(401, "Account is deactivated");
    }

    req.user = user;
    next();

  } catch (error) {
    if (error.name === "JsonWebTokenError") {
      throw new APIError(401, "Invalid refresh token");
    } else if (error.name === "TokenExpiredError") {
      throw new APIError(401, "Refresh token expired");
    }
    throw error;
  }
});

/**
 * Token blacklist check
 */
const checkTokenBlacklist = async (token) => {
  // In a production environment, you'd check against Redis or database
  // For now, we'll implement a simple in-memory check
  return false;
};

/**
 * Log suspicious activity
 */
const logSuspiciousActivity = async (userId, activityType, metadata) => {
  try {
    // Log to database
    const suspiciousActivity = {
      userId,
      activityType,
      metadata,
      timestamp: new Date(),
      ipAddress: metadata.ip,
      userAgent: metadata.userAgent
    };

    // You can store this in a separate collection
    // await SuspiciousActivity.create(suspiciousActivity);
    
    console.warn('Suspicious activity detected:', suspiciousActivity);
    
  } catch (error) {
    console.error('Error logging suspicious activity:', error);
  }
};

/**
 * Session activity tracking middleware
 */
export const trackSessionActivity = asyncHandler(async (req, res, next) => {
  const originalSend = res.send;
  
  res.send = function(data) {
    // Track successful activity
    if (req.sessionContext && req.user) {
      const activity = {
        userId: req.user._id,
        sessionId: req.sessionContext.sessionId,
        endpoint: req.originalUrl,
        method: req.method,
        timestamp: new Date(),
        statusCode: res.statusCode,
        deviceFingerprint: req.deviceFingerprint
      };
      
      // Send to session monitor
      sessionMonitor.sendEventToPython({
        user_id: req.user._id.toString(),
        session_id: req.sessionContext.sessionId,
        event_type: 'api_activity',
        metadata: activity
      });
    }
    
    originalSend.call(this, data);
  };
  
  next();
});

/**
 * Content Security Policy middleware
 */
export const contentSecurityPolicy = (req, res, next) => {
  res.setHeader('Content-Security-Policy', [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https:",
    "font-src 'self'",
    "connect-src 'self' ws: wss:",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'"
  ].join('; '));
  
  next();
};

/**
 * Security headers middleware
 */
export const securityHeaders = (req, res, next) => {
  // Prevent clickjacking
  res.setHeader('X-Frame-Options', 'DENY');
  
  // Prevent MIME type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');
  
  // Enable XSS protection
  res.setHeader('X-XSS-Protection', '1; mode=block');
  
  // Referrer policy
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Permissions policy
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  
  // Remove server information
  res.removeHeader('X-Powered-By');
  
  next();
};

/**
 * Request sanitization middleware
 */
export const sanitizeRequest = (req, res, next) => {
  // Sanitize request body
  if (req.body) {
    Object.keys(req.body).forEach(key => {
      if (typeof req.body[key] === 'string') {
        // Basic XSS prevention
        req.body[key] = req.body[key]
          .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
          .replace(/javascript:/gi, '')
          .replace(/on\w+\s*=/gi, '');
      }
    });
  }
  
  // Sanitize query parameters
  if (req.query) {
    Object.keys(req.query).forEach(key => {
      if (typeof req.query[key] === 'string') {
        req.query[key] = req.query[key]
          .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
          .replace(/javascript:/gi, '')
          .replace(/on\w+\s*=/gi, '');
      }
    });
  }
  
  next();
};

/**
 * Session timeout middleware
 */
export const sessionTimeout = (timeoutMs = 30 * 60 * 1000) => {
  return asyncHandler(async (req, res, next) => {
    if (req.user && req.sessionContext) {
      const now = new Date();
      const sessionStart = req.sessionContext.sessionStatus.connectedAt;
      const sessionDuration = now - sessionStart;
      
      if (sessionDuration > timeoutMs) {
        throw new APIError(408, "Session has expired");
      }
    }
    
    next();
  });
};

/**
 * Admin session monitoring middleware
 */
export const adminSessionMonitor = asyncHandler(async (req, res, next) => {
  // Only apply to admin routes
  if (req.path.startsWith('/api/admin')) {
    const sessionId = req.headers['x-session-id'];
    
    if (sessionId) {
      const sessionStatus = sessionMonitor.getSessionStatus(sessionId);
      
      if (sessionStatus && sessionStatus.status === 'locked') {
        throw new APIError(423, "Admin session is locked");
      }
    }
  }
  
  next();
});

export default {
  enhancedAuth,
  sessionSecurity,
  deviceFingerprint,
  deviceThrottle,
  validateRefreshToken,
  trackSessionActivity,
  contentSecurityPolicy,
  securityHeaders,
  sanitizeRequest,
  sessionTimeout,
  adminSessionMonitor
}; 