 // models/activityLog.model.js
import mongoose from "mongoose";

/**
 * Session Event Schema
 * Stores all session-related events from frontend
 */
const sessionEventSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  session_id: {
    type: String,
    required: true,
    index: true
  },
  event_type: {
    type: String,
    enum: [
      'session_start',
      'session_end',
      'heartbeat',
      'tab_switch',
      'inactivity',
      'screen_lock',
      'device_change',
      'copy_paste',
      'right_click',
      'keyboard_shortcut',
      'api_activity',
      'session_locked',
      'session_terminated'
    ],
    required: true,
    index: true
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  device_fingerprint: {
    type: String,
    index: true
  },
  ip_address: {
    type: String,
    index: true
  },
  user_agent: {
    type: String
  },
  risk_score: {
    type: Number,
    min: 0,
    max: 1,
    default: 0
  },
  processed_by_python: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Indexes for efficient querying
sessionEventSchema.index({ user_id: 1, timestamp: -1 });
sessionEventSchema.index({ session_id: 1, timestamp: -1 });
sessionEventSchema.index({ event_type: 1, timestamp: -1 });
sessionEventSchema.index({ risk_score: -1, timestamp: -1 });

/**
 * Security Alert Schema
 * Stores security alerts and suspicious activities
 */
const securityAlertSchema = new mongoose.Schema({
  alert_id: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  session_id: {
    type: String,
    required: true,
    index: true
  },
  security_level: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    required: true,
    index: true
  },
  event_type: {
    type: String,
    enum: [
      'excessive_tab_switching',
      'extended_inactivity',
      'copy_paste_detected',
      'keyboard_shortcut_detected',
      'device_change_detected',
      'device_fingerprint_mismatch',
      'heartbeat_timeout',
      'ml_anomaly_detected',
      'admin_action'
    ],
    required: true
  },
  description: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  is_resolved: {
    type: Boolean,
    default: false,
    index: true
  },
  resolved_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  resolved_at: {
    type: Date
  },
  resolution_notes: {
    type: String
  },
  auto_generated: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Indexes for security alerts
securityAlertSchema.index({ user_id: 1, timestamp: -1 });
securityAlertSchema.index({ session_id: 1, timestamp: -1 });
securityAlertSchema.index({ security_level: 1, is_resolved: 1 });
securityAlertSchema.index({ is_resolved: 1, timestamp: -1 });

/**
 * Session Activity Summary Schema
 * Aggregated session data for quick access
 */
const sessionActivitySummarySchema = new mongoose.Schema({
  session_id: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  interview_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Interview'
  },
  start_time: {
    type: Date,
    required: true
  },
  end_time: {
    type: Date
  },
  duration: {
    type: Number, // in seconds
    default: 0
  },
  status: {
    type: String,
    enum: ['active', 'completed', 'locked', 'terminated', 'expired'],
    default: 'active',
    index: true
  },
  total_events: {
    type: Number,
    default: 0
  },
  tab_switches: {
    type: Number,
    default: 0
  },
  max_risk_score: {
    type: Number,
    min: 0,
    max: 1,
    default: 0
  },
  alert_count: {
    type: Number,
    default: 0
  },
  critical_alerts: {
    type: Number,
    default: 0
  },
  device_fingerprint: {
    type: String,
    index: true
  },
  ip_address: {
    type: String
  },
  user_agent: {
    type: String
  },
  last_heartbeat: {
    type: Date
  },
  terminated_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  termination_reason: {
    type: String
  }
}, {
  timestamps: true
});

// Indexes for session summary
sessionActivitySummarySchema.index({ user_id: 1, start_time: -1 });
sessionActivitySummarySchema.index({ status: 1, start_time: -1 });
sessionActivitySummarySchema.index({ max_risk_score: -1, start_time: -1 });

/**
 * Device Fingerprint Schema
 * Track device usage patterns
 */
const deviceFingerprintSchema = new mongoose.Schema({
  fingerprint: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  first_seen: {
    type: Date,
    default: Date.now
  },
  last_seen: {
    type: Date,
    default: Date.now
  },
  total_sessions: {
    type: Number,
    default: 0
  },
  suspicious_activities: {
    type: Number,
    default: 0
  },
  is_trusted: {
    type: Boolean,
    default: false,
    index: true
  },
  device_info: {
    user_agent: String,
    ip_address: String,
    location: String,
    browser: String,
    os: String,
    screen_resolution: String
  },
  risk_score: {
    type: Number,
    min: 0,
    max: 1,
    default: 0
  }
}, {
  timestamps: true
});

// Indexes for device fingerprints
deviceFingerprintSchema.index({ user_id: 1, last_seen: -1 });
deviceFingerprintSchema.index({ is_trusted: 1, risk_score: -1 });

/**
 * Admin Audit Log Schema
 * Track all admin actions for transparency
 */
const adminAuditLogSchema = new mongoose.Schema({
  admin_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  action: {
    type: String,
    enum: [
      'session_lock',
      'session_terminate',
      'user_role_update',
      'user_delete',
      'alert_resolve',
      'system_settings_update',
      'backup_created',
      'cache_cleared'
    ],
    required: true
  },
  target_type: {
    type: String,
    enum: ['session', 'user', 'alert', 'system'],
    required: true
  },
  target_id: {
    type: String,
    required: true,
    index: true
  },
  description: {
    type: String,
    required: true
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  ip_address: {
    type: String
  },
  user_agent: {
    type: String
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  }
}, {
  timestamps: true
});

// Indexes for admin audit logs
adminAuditLogSchema.index({ admin_id: 1, timestamp: -1 });
adminAuditLogSchema.index({ action: 1, timestamp: -1 });
adminAuditLogSchema.index({ target_type: 1, target_id: 1 });

/**
 * System Health Metrics Schema
 * Track system performance and health
 */
const systemHealthMetricsSchema = new mongoose.Schema({
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  },
  active_sessions: {
    type: Number,
    default: 0
  },
  total_events_processed: {
    type: Number,
    default: 0
  },
  alerts_generated: {
    type: Number,
    default: 0
  },
  python_service_status: {
    type: String,
    enum: ['online', 'offline', 'degraded'],
    default: 'online'
  },
  redis_status: {
    type: String,
    enum: ['online', 'offline'],
    default: 'online'
  },
  database_status: {
    type: String,
    enum: ['online', 'offline', 'degraded'],
    default: 'online'
  },
  average_response_time: {
    type: Number,
    default: 0
  },
  error_rate: {
    type: Number,
    default: 0
  },
  memory_usage: {
    type: Number,
    default: 0
  },
  cpu_usage: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Indexes for system health
systemHealthMetricsSchema.index({ timestamp: -1 });

// Create models
export const SessionEvent = mongoose.model('SessionEvent', sessionEventSchema);
export const SecurityAlert = mongoose.model('SecurityAlert', securityAlertSchema);
export const SessionActivitySummary = mongoose.model('SessionActivitySummary', sessionActivitySummarySchema);
export const DeviceFingerprint = mongoose.model('DeviceFingerprint', deviceFingerprintSchema);
export const AdminAuditLog = mongoose.model('AdminAuditLog', adminAuditLogSchema);
export const SystemHealthMetrics = mongoose.model('SystemHealthMetrics', systemHealthMetricsSchema);

// Export all models
export default {
  SessionEvent,
  SecurityAlert,
  SessionActivitySummary,
  DeviceFingerprint,
  AdminAuditLog,
  SystemHealthMetrics
};