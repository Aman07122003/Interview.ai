// routes/admin.routes.js
import express from "express";
import { auth } from "../middleware/auth.js";
import { isAdmin } from "../middleware/adminAuth.js";
import { rateLimiter } from "../middleware/rateLimiter.js";
import { validateUserUpdate, validateSystemSettings } from "../middleware/validation.js";
import { validationResult } from "express-validator";
import sessionMonitor from "../utils/sessionMonitor.js";
import axios from "axios";

// Import admin controller methods
import {
  getAdminStats,
  getAllUsers,
  updateUserRole,
  deleteUser,
  getUserDetails,
  getSystemStats,
  getRecentActivity,
  exportUserData,
  getInterviewStats,
  getQuestionStats,
  getSubscriptionStats,
  updateSystemSettings,
  getSystemLogs,
  clearSystemCache,
  backupDatabase
} from "../controllers/admin.controller.js";

const router = express.Router();

// Apply authentication and admin authorization to all routes
router.use(auth, isAdmin);

/**
 * @route   GET /api/admin/stats
 * @desc    Get admin dashboard statistics
 * @access  Admin Only
 */
router.get('/stats', getAdminStats);

/**
 * @route   GET /api/admin/stats/system
 * @desc    Get system performance statistics
 * @access  Admin Only
 */
router.get('/stats/system', getSystemStats);

/**
 * @route   GET /api/admin/stats/interviews
 * @desc    Get interview-specific statistics
 * @access  Admin Only
 */
router.get('/stats/interviews', getInterviewStats);

/**
 * @route   GET /api/admin/stats/questions
 * @desc    Get question-specific statistics
 * @access  Admin Only
 */
router.get('/stats/questions', getQuestionStats);

/**
 * @route   GET /api/admin/stats/subscriptions
 * @desc    Get subscription-specific statistics
 * @access  Admin Only
 */
router.get('/stats/subscriptions', getSubscriptionStats);

/**
 * @route   GET /api/admin/activity
 * @desc    Get recent system activity
 * @access  Admin Only
 */
router.get('/activity', getRecentActivity);

// Session Monitoring Routes

/**
 * @route   GET /api/admin/sessions
 * @desc    Get all active sessions for admin dashboard
 * @access  Admin Only
 */
router.get('/sessions', async (req, res) => {
  try {
    const sessions = sessionMonitor.getAllSessions();
    
    // Get additional data from Python service
    const pythonServiceUrl = process.env.PYTHON_SERVICE_URL || 'http://localhost:8001';
    let pythonSessions = [];
    
    try {
      const response = await axios.get(`${pythonServiceUrl}/api/admin/sessions`);
      pythonSessions = response.data.sessions || [];
    } catch (error) {
      console.warn('Python service unavailable, using local session data only');
    }
    
    // Merge session data
    const enrichedSessions = sessions.map(session => {
      const pythonSession = pythonSessions.find(ps => ps.session_id === session.sessionId);
      return {
        ...session,
        riskScore: pythonSession?.risk_score || 0.0,
        alertCount: pythonSession?.alert_count || 0,
        pythonStatus: pythonSession?.status || 'unknown'
      };
    });
    
    res.json({
      success: true,
      statusCode: 200,
      data: {
        sessions: enrichedSessions,
        totalActive: enrichedSessions.filter(s => s.status === 'active').length,
        totalLocked: enrichedSessions.filter(s => s.status === 'locked').length,
        highRiskSessions: enrichedSessions.filter(s => s.riskScore > 0.7).length
      },
      message: "Sessions retrieved successfully"
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      statusCode: 500,
      error: "Failed to retrieve sessions",
      message: error.message
    });
  }
});

/**
 * @route   GET /api/admin/sessions/:sessionId
 * @desc    Get detailed session information
 * @access  Admin Only
 */
router.get('/sessions/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    // Get local session data
    const localSession = sessionMonitor.getSessionStatus(sessionId);
    
    if (!localSession) {
      return res.status(404).json({
        success: false,
        statusCode: 404,
        error: "Session not found",
        message: "Session does not exist or has expired"
      });
    }
    
    // Get detailed data from Python service
    const pythonServiceUrl = process.env.PYTHON_SERVICE_URL || 'http://localhost:8001';
    let pythonSessionData = null;
    let alerts = [];
    
    try {
      const [sessionResponse, alertsResponse] = await Promise.all([
        axios.get(`${pythonServiceUrl}/api/sessions/${sessionId}/status`),
        axios.get(`${pythonServiceUrl}/api/sessions/${sessionId}/alerts`)
      ]);
      
      pythonSessionData = sessionResponse.data;
      alerts = alertsResponse.data.alerts || [];
    } catch (error) {
      console.warn('Python service unavailable for detailed session data');
    }
    
    res.json({
      success: true,
      statusCode: 200,
      data: {
        sessionId,
        userId: localSession.userId,
        status: localSession.status,
        connectedAt: localSession.connectedAt,
        lastHeartbeat: localSession.lastHeartbeat,
        tabSwitches: localSession.tabSwitches,
        riskScore: pythonSessionData?.risk_score || 0.0,
        alerts: alerts,
        pythonStatus: pythonSessionData?.status || 'unknown'
      },
      message: "Session details retrieved successfully"
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      statusCode: 500,
      error: "Failed to retrieve session details",
      message: error.message
    });
  }
});

/**
 * @route   POST /api/admin/sessions/:sessionId/lock
 * @desc    Lock a session due to suspicious activity
 * @access  Admin Only
 */
router.post('/sessions/:sessionId/lock',
  rateLimiter('sessionAction', 10, 60 * 60 * 1000), // 10 actions per hour
  async (req, res) => {
    try {
      const { sessionId } = req.params;
      const { reason } = req.body;
      
      const session = sessionMonitor.getSessionStatus(sessionId);
      if (!session) {
        return res.status(404).json({
          success: false,
          statusCode: 404,
          error: "Session not found",
          message: "Session does not exist or has expired"
        });
      }
      
      // Lock session
      sessionMonitor.lockSession(sessionId, reason || 'Admin action');
      
      // Send event to Python service
      const pythonServiceUrl = process.env.PYTHON_SERVICE_URL || 'http://localhost:8001';
      try {
        await axios.post(`${pythonServiceUrl}/api/events`, {
          user_id: session.userId,
          session_id: sessionId,
          event_type: 'session_locked',
          metadata: {
            reason: reason || 'Admin action',
            admin_id: req.user._id,
            timestamp: new Date().toISOString()
          }
        });
      } catch (error) {
        console.warn('Failed to send lock event to Python service');
      }
      
      res.json({
        success: true,
        statusCode: 200,
        data: {
          sessionId,
          status: 'locked',
          reason: reason || 'Admin action'
        },
        message: "Session locked successfully"
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        statusCode: 500,
        error: "Failed to lock session",
        message: error.message
      });
    }
  }
);

/**
 * @route   POST /api/admin/sessions/:sessionId/terminate
 * @desc    Terminate a session immediately
 * @access  Admin Only
 */
router.post('/sessions/:sessionId/terminate',
  rateLimiter('sessionAction', 5, 60 * 60 * 1000), // 5 terminations per hour
  async (req, res) => {
    try {
      const { sessionId } = req.params;
      const { reason } = req.body;
      
      const session = sessionMonitor.getSessionStatus(sessionId);
      if (!session) {
        return res.status(404).json({
          success: false,
          statusCode: 404,
          error: "Session not found",
          message: "Session does not exist or has expired"
        });
      }
      
      // Terminate session
      sessionMonitor.terminateSession(sessionId, {
        reason: reason || 'Admin termination',
        admin_id: req.user._id,
        timestamp: new Date().toISOString()
      });
      
      res.json({
        success: true,
        statusCode: 200,
        data: {
          sessionId,
          status: 'terminated',
          reason: reason || 'Admin termination'
        },
        message: "Session terminated successfully"
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        statusCode: 500,
        error: "Failed to terminate session",
        message: error.message
      });
    }
  }
);

/**
 * @route   GET /api/admin/security/alerts
 * @desc    Get security alerts and suspicious activities
 * @access  Admin Only
 */
router.get('/security/alerts', async (req, res) => {
  try {
    const { page = 1, limit = 50, severity, resolved } = req.query;
    
    // Get alerts from Python service
    const pythonServiceUrl = process.env.PYTHON_SERVICE_URL || 'http://localhost:8001';
    let alerts = [];
    
    try {
      const response = await axios.get(`${pythonServiceUrl}/api/admin/alerts`, {
        params: { page, limit, severity, resolved }
      });
      alerts = response.data.alerts || [];
    } catch (error) {
      console.warn('Python service unavailable for alerts');
    }
    
    res.json({
      success: true,
      statusCode: 200,
      data: {
        alerts,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(alerts.length / parseInt(limit)),
          totalAlerts: alerts.length
        }
      },
      message: "Security alerts retrieved successfully"
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      statusCode: 500,
      error: "Failed to retrieve security alerts",
      message: error.message
    });
  }
});

/**
 * @route   GET /api/admin/security/events
 * @desc    Get security events log
 * @access  Admin Only
 */
router.get('/security/events', async (req, res) => {
  try {
    const { page = 1, limit = 100, eventType, userId, sessionId, startDate, endDate } = req.query;
    
    // Get events from Python service
    const pythonServiceUrl = process.env.PYTHON_SERVICE_URL || 'http://localhost:8001';
    let events = [];
    
    try {
      const response = await axios.get(`${pythonServiceUrl}/api/admin/events`, {
        params: { page, limit, event_type: eventType, user_id: userId, session_id: sessionId, start_date: startDate, end_date: endDate }
      });
      events = response.data.events || [];
    } catch (error) {
      console.warn('Python service unavailable for events');
    }
    
    res.json({
      success: true,
      statusCode: 200,
      data: {
        events,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(events.length / parseInt(limit)),
          totalEvents: events.length
        }
      },
      message: "Security events retrieved successfully"
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      statusCode: 500,
      error: "Failed to retrieve security events",
      message: error.message
    });
  }
});

/**
 * @route   POST /api/admin/security/alerts/:alertId/resolve
 * @desc    Mark a security alert as resolved
 * @access  Admin Only
 */
router.post('/security/alerts/:alertId/resolve',
  rateLimiter('alertAction', 20, 60 * 60 * 1000), // 20 actions per hour
  async (req, res) => {
    try {
      const { alertId } = req.params;
      const { resolution } = req.body;
      
      // Resolve alert in Python service
      const pythonServiceUrl = process.env.PYTHON_SERVICE_URL || 'http://localhost:8001';
      
      try {
        await axios.post(`${pythonServiceUrl}/api/admin/alerts/${alertId}/resolve`, {
          resolution: resolution || 'Resolved by admin',
          admin_id: req.user._id,
          timestamp: new Date().toISOString()
        });
        
        res.json({
          success: true,
          statusCode: 200,
          data: { alertId, status: 'resolved' },
          message: "Alert resolved successfully"
        });
      } catch (error) {
        throw new Error('Failed to resolve alert in Python service');
      }
    } catch (error) {
      res.status(500).json({
        success: false,
        statusCode: 500,
        error: "Failed to resolve alert",
        message: error.message
      });
    }
  }
);

/**
 * @route   GET /api/admin/security/dashboard
 * @desc    Get security dashboard overview
 * @access  Admin Only
 */
router.get('/security/dashboard', async (req, res) => {
  try {
    const sessions = sessionMonitor.getAllSessions();
    const pythonServiceUrl = process.env.PYTHON_SERVICE_URL || 'http://localhost:8001';
    
    let securityStats = {
      activeSessions: sessions.filter(s => s.status === 'active').length,
      lockedSessions: sessions.filter(s => s.status === 'locked').length,
      highRiskSessions: 0,
      totalAlerts: 0,
      criticalAlerts: 0,
      recentEvents: []
    };
    
    try {
      const response = await axios.get(`${pythonServiceUrl}/api/admin/security/stats`);
      const pythonStats = response.data;
      
      securityStats = {
        ...securityStats,
        highRiskSessions: pythonStats.high_risk_sessions || 0,
        totalAlerts: pythonStats.total_alerts || 0,
        criticalAlerts: pythonStats.critical_alerts || 0,
        recentEvents: pythonStats.recent_events || []
      };
    } catch (error) {
      console.warn('Python service unavailable for security stats');
    }
    
    res.json({
      success: true,
      statusCode: 200,
      data: securityStats,
      message: "Security dashboard data retrieved successfully"
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      statusCode: 500,
      error: "Failed to retrieve security dashboard",
      message: error.message
    });
  }
});

// User Management Routes

/**
 * @route   GET /api/admin/users
 * @desc    Get all users with filtering and pagination
 * @access  Admin Only
 */
router.get('/users', getAllUsers);

/**
 * @route   GET /api/admin/users/:id
 * @desc    Get detailed user information
 * @access  Admin Only
 */
router.get('/users/:id', getUserDetails);

/**
 * @route   PUT /api/admin/users/:id/role
 * @desc    Update user role
 * @access  Admin Only
 */
router.put('/users/:id/role',
  rateLimiter('updateUserRole', 20, 60 * 60 * 1000), // 20 updates per hour
  validateUserUpdate,
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  },
  updateUserRole
);

/**
 * @route   DELETE /api/admin/users/:id
 * @desc    Delete user account
 * @access  Admin Only
 */
router.delete('/users/:id',
  rateLimiter('deleteUser', 5, 60 * 60 * 1000), // 5 deletions per hour
  deleteUser
);

/**
 * @route   GET /api/admin/users/:id/export
 * @desc    Export user data
 * @access  Admin Only
 */
router.get('/users/:id/export',
  rateLimiter('exportUserData', 10, 60 * 60 * 1000), // 10 exports per hour
  exportUserData
);

// System Management Routes

/**
 * @route   PUT /api/admin/settings
 * @desc    Update system settings
 * @access  Admin Only
 */
router.put('/settings',
  rateLimiter('updateSettings', 5, 60 * 60 * 1000), // 5 updates per hour
  validateSystemSettings,
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  },
  updateSystemSettings
);

/**
 * @route   GET /api/admin/logs
 * @desc    Get system logs
 * @access  Admin Only
 */
router.get('/logs', getSystemLogs);

/**
 * @route   POST /api/admin/cache/clear
 * @desc    Clear system cache
 * @access  Admin Only
 */
router.post('/cache/clear',
  rateLimiter('clearCache', 3, 60 * 60 * 1000), // 3 clears per hour
  clearSystemCache
);

/**
 * @route   POST /api/admin/backup
 * @desc    Create database backup
 * @access  Admin Only
 */
router.post('/backup',
  rateLimiter('backupDatabase', 2, 24 * 60 * 60 * 1000), // 2 backups per day
  backupDatabase
);

export default router; 