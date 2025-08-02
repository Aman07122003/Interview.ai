import { WebSocketServer } from 'ws';
import Redis from 'ioredis';
import axios from 'axios';
import { logger } from './logger.js';

class SessionMonitor {
  constructor() {
    this.wss = null;
    this.redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
    this.pythonServiceUrl = process.env.PYTHON_SERVICE_URL || 'http://localhost:8001';
    this.activeConnections = new Map(); // sessionId -> WebSocket
    this.sessionData = new Map(); // sessionId -> session info
    this.heartbeatIntervals = new Map(); // sessionId -> interval
    
    // Configuration
    this.HEARTBEAT_INTERVAL = 5000; // 5 seconds
    this.INACTIVITY_TIMEOUT = 30000; // 30 seconds
    this.MAX_TAB_SWITCHES = 3; // per minute
  }

  /**
   * Initialize WebSocket server
   */
  initialize(server) {
    this.wss = new WebSocketServer({ server });
    
    this.wss.on('connection', (ws, req) => {
      this.handleConnection(ws, req);
    });

    // Subscribe to Redis events from Python service
    this.subscribeToRedisEvents();
    
    logger.info('Session Monitor WebSocket server initialized');
  }

  /**
   * Handle new WebSocket connection
   */
  handleConnection(ws, req) {
    const sessionId = this.extractSessionId(req);
    const userId = this.extractUserId(req);
    
    if (!sessionId || !userId) {
      ws.close(1008, 'Missing session or user information');
      return;
    }

    // Store connection
    this.activeConnections.set(sessionId, ws);
    this.sessionData.set(sessionId, {
      userId,
      sessionId,
      connectedAt: new Date(),
      lastHeartbeat: new Date(),
      tabSwitches: 0,
      lastTabSwitch: null,
      status: 'active'
    });

    // Start heartbeat monitoring
    this.startHeartbeatMonitoring(sessionId);

    // Send session start event to Python service
    this.sendEventToPython({
      user_id: userId,
      session_id: sessionId,
      event_type: 'session_start',
      metadata: {
        ip_address: req.socket.remoteAddress,
        user_agent: req.headers['user-agent'],
        connected_at: new Date().toISOString()
      }
    });

    // Handle incoming messages
    ws.on('message', (data) => {
      try {
        const message = JSON.parse(data);
        this.handleMessage(sessionId, message);
      } catch (error) {
        logger.error(`Error parsing message from session ${sessionId}:`, error);
      }
    });

    // Handle connection close
    ws.on('close', () => {
      this.handleDisconnection(sessionId);
    });

    // Handle errors
    ws.on('error', (error) => {
      logger.error(`WebSocket error for session ${sessionId}:`, error);
      this.handleDisconnection(sessionId);
    });

    logger.info(`Session ${sessionId} connected for user ${userId}`);
  }

  /**
   * Handle incoming WebSocket messages
   */
  handleMessage(sessionId, message) {
    const session = this.sessionData.get(sessionId);
    if (!session) return;

    const { type, data } = message;

    switch (type) {
      case 'heartbeat':
        this.handleHeartbeat(sessionId, data);
        break;
        
      case 'tab_switch':
        this.handleTabSwitch(sessionId, data);
        break;
        
      case 'inactivity':
        this.handleInactivity(sessionId, data);
        break;
        
      case 'screen_lock':
        this.handleScreenLock(sessionId, data);
        break;
        
      case 'copy_paste':
        this.handleCopyPaste(sessionId, data);
        break;
        
      case 'right_click':
        this.handleRightClick(sessionId, data);
        break;
        
      case 'keyboard_shortcut':
        this.handleKeyboardShortcut(sessionId, data);
        break;
        
      case 'device_change':
        this.handleDeviceChange(sessionId, data);
        break;
        
      default:
        logger.warn(`Unknown message type: ${type} from session ${sessionId}`);
    }
  }

  /**
   * Handle heartbeat from frontend
   */
  handleHeartbeat(sessionId, data) {
    const session = this.sessionData.get(sessionId);
    if (!session) return;

    session.lastHeartbeat = new Date();
    
    // Send heartbeat event to Python service
    this.sendEventToPython({
      user_id: session.userId,
      session_id: sessionId,
      event_type: 'heartbeat',
      metadata: {
        timestamp: new Date().toISOString(),
        ...data
      }
    });
  }

  /**
   * Handle tab switch detection
   */
  handleTabSwitch(sessionId, data) {
    const session = this.sessionData.get(sessionId);
    if (!session) return;

    const now = new Date();
    session.tabSwitches++;
    
    // Reset counter if more than 1 minute has passed
    if (session.lastTabSwitch) {
      const timeDiff = now - session.lastTabSwitch;
      if (timeDiff > 60000) { // 1 minute
        session.tabSwitches = 1;
      }
    }
    
    session.lastTabSwitch = now;

    // Check for excessive tab switching
    if (session.tabSwitches > this.MAX_TAB_SWITCHES) {
      this.flagSuspiciousActivity(sessionId, 'excessive_tab_switching', {
        tab_switches: session.tabSwitches,
        time_window: '1 minute'
      });
    }

    // Send event to Python service
    this.sendEventToPython({
      user_id: session.userId,
      session_id: sessionId,
      event_type: 'tab_switch',
      metadata: {
        tab_switches: session.tabSwitches,
        timestamp: now.toISOString(),
        ...data
      }
    });
  }

  /**
   * Handle inactivity detection
   */
  handleInactivity(sessionId, data) {
    const session = this.sessionData.get(sessionId);
    if (!session) return;

    const duration = data.duration || 0;
    
    if (duration > this.INACTIVITY_TIMEOUT) {
      this.flagSuspiciousActivity(sessionId, 'extended_inactivity', {
        duration_seconds: duration
      });
    }

    this.sendEventToPython({
      user_id: session.userId,
      session_id: sessionId,
      event_type: 'inactivity',
      metadata: {
        duration: duration,
        timestamp: new Date().toISOString(),
        ...data
      }
    });
  }

  /**
   * Handle screen lock detection
   */
  handleScreenLock(sessionId, data) {
    const session = this.sessionData.get(sessionId);
    if (!session) return;

    this.sendEventToPython({
      user_id: session.userId,
      session_id: sessionId,
      event_type: 'screen_lock',
      metadata: {
        timestamp: new Date().toISOString(),
        ...data
      }
    });
  }

  /**
   * Handle copy-paste detection
   */
  handleCopyPaste(sessionId, data) {
    const session = this.sessionData.get(sessionId);
    if (!session) return;

    this.flagSuspiciousActivity(sessionId, 'copy_paste_detected', data);

    this.sendEventToPython({
      user_id: session.userId,
      session_id: sessionId,
      event_type: 'copy_paste',
      metadata: {
        timestamp: new Date().toISOString(),
        ...data
      }
    });
  }

  /**
   * Handle right-click detection
   */
  handleRightClick(sessionId, data) {
    const session = this.sessionData.get(sessionId);
    if (!session) return;

    this.sendEventToPython({
      user_id: session.userId,
      session_id: sessionId,
      event_type: 'right_click',
      metadata: {
        timestamp: new Date().toISOString(),
        ...data
      }
    });
  }

  /**
   * Handle keyboard shortcut detection
   */
  handleKeyboardShortcut(sessionId, data) {
    const session = this.sessionData.get(sessionId);
    if (!session) return;

    this.flagSuspiciousActivity(sessionId, 'keyboard_shortcut_detected', data);

    this.sendEventToPython({
      user_id: session.userId,
      session_id: sessionId,
      event_type: 'keyboard_shortcut',
      metadata: {
        timestamp: new Date().toISOString(),
        ...data
      }
    });
  }

  /**
   * Handle device change detection
   */
  handleDeviceChange(sessionId, data) {
    const session = this.sessionData.get(sessionId);
    if (!session) return;

    this.flagSuspiciousActivity(sessionId, 'device_change_detected', data);

    this.sendEventToPython({
      user_id: session.userId,
      session_id: sessionId,
      event_type: 'device_change',
      metadata: {
        timestamp: new Date().toISOString(),
        ...data
      }
    });
  }

  /**
   * Flag suspicious activity
   */
  flagSuspiciousActivity(sessionId, activityType, metadata) {
    const session = this.sessionData.get(sessionId);
    if (!session) return;

    logger.warn(`Suspicious activity detected in session ${sessionId}: ${activityType}`, metadata);

    // Send alert to admin dashboard
    this.sendAlertToAdmin({
      sessionId,
      userId: session.userId,
      activityType,
      metadata,
      timestamp: new Date().toISOString()
    });

    // Optionally lock session
    if (this.shouldLockSession(activityType)) {
      this.lockSession(sessionId, activityType);
    }
  }

  /**
   * Determine if session should be locked
   */
  shouldLockSession(activityType) {
    const criticalActivities = [
      'excessive_tab_switching',
      'copy_paste_detected',
      'keyboard_shortcut_detected',
      'device_change_detected'
    ];
    
    return criticalActivities.includes(activityType);
  }

  /**
   * Lock session
   */
  lockSession(sessionId, reason) {
    const ws = this.activeConnections.get(sessionId);
    if (!ws) return;

    const session = this.sessionData.get(sessionId);
    if (!session) return;

    session.status = 'locked';
    
    // Send lock notification to frontend
    ws.send(JSON.stringify({
      type: 'session_locked',
      data: {
        reason,
        timestamp: new Date().toISOString()
      }
    }));

    logger.warn(`Session ${sessionId} locked due to: ${reason}`);
  }

  /**
   * Start heartbeat monitoring for a session
   */
  startHeartbeatMonitoring(sessionId) {
    const interval = setInterval(() => {
      const session = this.sessionData.get(sessionId);
      if (!session) {
        clearInterval(interval);
        return;
      }

      const now = new Date();
      const timeSinceHeartbeat = now - session.lastHeartbeat;

      if (timeSinceHeartbeat > this.INACTIVITY_TIMEOUT) {
        logger.warn(`Session ${sessionId} heartbeat timeout`);
        this.handleDisconnection(sessionId);
      }
    }, this.HEARTBEAT_INTERVAL);

    this.heartbeatIntervals.set(sessionId, interval);
  }

  /**
   * Handle session disconnection
   */
  handleDisconnection(sessionId) {
    const session = this.sessionData.get(sessionId);
    if (!session) return;

    // Clear heartbeat interval
    const interval = this.heartbeatIntervals.get(sessionId);
    if (interval) {
      clearInterval(interval);
      this.heartbeatIntervals.delete(sessionId);
    }

    // Send session end event to Python service
    this.sendEventToPython({
      user_id: session.userId,
      session_id: sessionId,
      event_type: 'session_end',
      metadata: {
        duration: new Date() - session.connectedAt,
        reason: 'disconnection',
        timestamp: new Date().toISOString()
      }
    });

    // Clean up
    this.activeConnections.delete(sessionId);
    this.sessionData.delete(sessionId);

    logger.info(`Session ${sessionId} disconnected`);
  }

  /**
   * Send event to Python microservice
   */
  async sendEventToPython(eventData) {
    try {
      await axios.post(`${this.pythonServiceUrl}/api/events`, eventData, {
        timeout: 5000,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    } catch (error) {
      logger.error('Failed to send event to Python service:', error.message);
    }
  }

  /**
   * Subscribe to Redis events from Python service
   */
  subscribeToRedisEvents() {
    const subscriber = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
    
    subscriber.subscribe('session_events', (err) => {
      if (err) {
        logger.error('Failed to subscribe to Redis events:', err);
        return;
      }
      logger.info('Subscribed to session events from Python service');
    });

    subscriber.on('message', (channel, message) => {
      try {
        const event = JSON.parse(message);
        this.handlePythonEvent(event);
      } catch (error) {
        logger.error('Error parsing Redis event:', error);
      }
    });
  }

  /**
   * Handle events from Python service
   */
  handlePythonEvent(event) {
    const { session_id, event_type, metadata } = event;
    
    // Handle different event types
    switch (event_type) {
      case 'security_alert':
        this.handleSecurityAlert(session_id, metadata);
        break;
        
      case 'session_terminated':
        this.terminateSession(session_id, metadata);
        break;
        
      default:
        logger.info(`Received event from Python service: ${event_type}`);
    }
  }

  /**
   * Handle security alerts from Python service
   */
  handleSecurityAlert(sessionId, metadata) {
    const ws = this.activeConnections.get(sessionId);
    if (!ws) return;

    // Send alert to frontend
    ws.send(JSON.stringify({
      type: 'security_alert',
      data: metadata
    }));

    logger.warn(`Security alert for session ${sessionId}:`, metadata);
  }

  /**
   * Terminate session
   */
  terminateSession(sessionId, metadata) {
    const ws = this.activeConnections.get(sessionId);
    if (!ws) return;

    // Send termination notice to frontend
    ws.send(JSON.stringify({
      type: 'session_terminated',
      data: metadata
    }));

    // Close connection
    ws.close(1000, 'Session terminated by admin');

    logger.warn(`Session ${sessionId} terminated:`, metadata);
  }

  /**
   * Send alert to admin dashboard
   */
  sendAlertToAdmin(alertData) {
    // Publish to Redis for admin dashboard
    this.redis.publish('admin_alerts', JSON.stringify(alertData));
  }

  /**
   * Get session status
   */
  getSessionStatus(sessionId) {
    return this.sessionData.get(sessionId);
  }

  /**
   * Get all active sessions
   */
  getAllSessions() {
    const sessions = [];
    for (const [sessionId, session] of this.sessionData) {
      sessions.push({
        sessionId,
        userId: session.userId,
        status: session.status,
        connectedAt: session.connectedAt,
        lastHeartbeat: session.lastHeartbeat,
        tabSwitches: session.tabSwitches
      });
    }
    return sessions;
  }

  /**
   * Extract session ID from request
   */
  extractSessionId(req) {
    const url = new URL(req.url, 'http://localhost');
    return url.searchParams.get('sessionId');
  }

  /**
   * Extract user ID from request
   */
  extractUserId(req) {
    const url = new URL(req.url, 'http://localhost');
    return url.searchParams.get('userId');
  }

  /**
   * Broadcast message to all connected sessions
   */
  broadcast(message) {
    this.wss.clients.forEach((client) => {
      if (client.readyState === WebSocketServer.OPEN) {
        client.send(JSON.stringify(message));
      }
    });
  }

  /**
   * Send message to specific session
   */
  sendToSession(sessionId, message) {
    const ws = this.activeConnections.get(sessionId);
    if (ws && ws.readyState === WebSocketServer.OPEN) {
      ws.send(JSON.stringify(message));
    }
  }
}

// Create singleton instance
const sessionMonitor = new SessionMonitor();

export default sessionMonitor; 