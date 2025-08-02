#!/usr/bin/env python3
"""
Session Surveillance Microservice
Handles real-time session monitoring, anti-cheating detection, and alert generation
"""

import asyncio
import json
import logging
import os
import time
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
from dataclasses import dataclass, asdict
from enum import Enum

import redis
import pymongo
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
import uvicorn
from motor.motor_asyncio import AsyncIOMotorClient
import numpy as np
from sklearn.ensemble import IsolationForest
import joblib

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Configuration
REDIS_URL = os.getenv('REDIS_URL', 'redis://localhost:6379')
MONGODB_URL = os.getenv('MONGODB_URL', 'mongodb://localhost:27017')
NODEJS_BACKEND_URL = os.getenv('NODEJS_BACKEND_URL', 'http://localhost:5000')

# Thresholds
TAB_SWITCH_THRESHOLD = 3  # Max tab switches per minute
INACTIVITY_THRESHOLD = 30  # Seconds of inactivity
HEARTBEAT_TIMEOUT = 10  # Seconds without heartbeat
SUSPICIOUS_SCORE_THRESHOLD = 0.7  # ML model threshold

class EventType(Enum):
    TAB_SWITCH = "tab_switch"
    INACTIVITY = "inactivity"
    HEARTBEAT = "heartbeat"
    SESSION_START = "session_start"
    SESSION_END = "session_end"
    SCREEN_LOCK = "screen_lock"
    DEVICE_CHANGE = "device_change"
    COPY_PASTE = "copy_paste"
    RIGHT_CLICK = "right_click"
    KEYBOARD_SHORTCUT = "keyboard_shortcut"

class SecurityLevel(Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"

@dataclass
class SessionEvent:
    user_id: str
    session_id: str
    event_type: EventType
    timestamp: datetime
    metadata: Dict[str, Any]
    device_fingerprint: Optional[str] = None
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None

@dataclass
class SecurityAlert:
    alert_id: str
    user_id: str
    session_id: str
    security_level: SecurityLevel
    event_type: EventType
    description: str
    timestamp: datetime
    metadata: Dict[str, Any]
    is_resolved: bool = False

class EventData(BaseModel):
    user_id: str
    session_id: str
    event_type: str
    metadata: Dict[str, Any] = Field(default_factory=dict)
    device_fingerprint: Optional[str] = None
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None

class SessionMonitor:
    def __init__(self):
        self.app = FastAPI(title="Session Surveillance Microservice")
        self.redis_client = redis.Redis.from_url(REDIS_URL, decode_responses=True)
        self.mongo_client = AsyncIOMotorClient(MONGODB_URL)
        self.db = self.mongo_client.session_monitoring
        self.active_sessions: Dict[str, Dict] = {}
        self.ml_model = self._initialize_ml_model()
        
        # Setup CORS
        self.app.add_middleware(
            CORSMiddleware,
            allow_origins=["*"],
            allow_credentials=True,
            allow_methods=["*"],
            allow_headers=["*"],
        )
        
        # Setup routes
        self._setup_routes()
        
    def _initialize_ml_model(self):
        """Initialize ML model for anomaly detection"""
        try:
            # Load pre-trained model if exists
            model_path = "models/anomaly_detector.pkl"
            if os.path.exists(model_path):
                return joblib.load(model_path)
            else:
                # Initialize new model
                model = IsolationForest(contamination=0.1, random_state=42)
                return model
        except Exception as e:
            logger.error(f"Failed to initialize ML model: {e}")
            return None

    def _setup_routes(self):
        """Setup FastAPI routes"""
        
        @self.app.websocket("/ws/session-monitor")
        async def websocket_endpoint(websocket: WebSocket):
            await websocket.accept()
            try:
                while True:
                    data = await websocket.receive_text()
                    event_data = json.loads(data)
                    await self.process_event(event_data)
            except WebSocketDisconnect:
                logger.info("WebSocket disconnected")
            except Exception as e:
                logger.error(f"WebSocket error: {e}")

        @self.app.post("/api/events")
        async def receive_event(event: EventData):
            """Receive events via REST API"""
            try:
                await self.process_event(event.dict())
                return {"status": "success", "message": "Event processed"}
            except Exception as e:
                logger.error(f"Error processing event: {e}")
                raise HTTPException(status_code=500, detail=str(e))

        @self.app.get("/api/sessions/{session_id}/status")
        async def get_session_status(session_id: str):
            """Get session status and alerts"""
            session = self.active_sessions.get(session_id)
            if not session:
                raise HTTPException(status_code=404, detail="Session not found")
            
            alerts = await self.get_session_alerts(session_id)
            return {
                "session_id": session_id,
                "status": session.get("status", "unknown"),
                "last_heartbeat": session.get("last_heartbeat"),
                "alerts": alerts,
                "risk_score": session.get("risk_score", 0.0)
            }

        @self.app.get("/api/admin/sessions")
        async def get_all_sessions():
            """Get all active sessions for admin dashboard"""
            sessions = []
            for session_id, session_data in self.active_sessions.items():
                alerts = await self.get_session_alerts(session_id)
                sessions.append({
                    "session_id": session_id,
                    "user_id": session_data.get("user_id"),
                    "status": session_data.get("status"),
                    "start_time": session_data.get("start_time"),
                    "last_heartbeat": session_data.get("last_heartbeat"),
                    "risk_score": session_data.get("risk_score", 0.0),
                    "alert_count": len(alerts)
                })
            return {"sessions": sessions}

        @self.app.get("/health")
        async def health_check():
            return {"status": "ok"}

    async def process_event(self, event_data: Dict[str, Any]):
        """Process incoming session events"""
        try:
            # Create session event
            event = SessionEvent(
                user_id=event_data["user_id"],
                session_id=event_data["session_id"],
                event_type=EventType(event_data["event_type"]),
                timestamp=datetime.utcnow(),
                metadata=event_data.get("metadata", {}),
                device_fingerprint=event_data.get("device_fingerprint"),
                ip_address=event_data.get("ip_address"),
                user_agent=event_data.get("user_agent")
            )
            
            # Store event in MongoDB
            await self.store_event(event)
            
            # Update active sessions
            await self.update_session_state(event)
            
            # Analyze for suspicious activity
            await self.analyze_security(event)
            
            # Publish to Redis for real-time updates
            await self.publish_event(event)
            
        except Exception as e:
            logger.error(f"Error processing event: {e}")

    async def store_event(self, event: SessionEvent):
        """Store event in MongoDB"""
        try:
            event_doc = {
                "user_id": event.user_id,
                "session_id": event.session_id,
                "event_type": event.event_type.value,
                "timestamp": event.timestamp,
                "metadata": event.metadata,
                "device_fingerprint": event.device_fingerprint,
                "ip_address": event.ip_address,
                "user_agent": event.user_agent
            }
            
            await self.db.session_events.insert_one(event_doc)
            logger.info(f"Stored event: {event.event_type.value} for session {event.session_id}")
            
        except Exception as e:
            logger.error(f"Error storing event: {e}")

    async def update_session_state(self, event: SessionEvent):
        """Update active session state"""
        session_id = event.session_id
        
        if event.event_type == EventType.SESSION_START:
            self.active_sessions[session_id] = {
                "user_id": event.user_id,
                "start_time": event.timestamp,
                "last_heartbeat": event.timestamp,
                "status": "active",
                "risk_score": 0.0,
                "event_count": 0,
                "tab_switches": 0,
                "last_tab_switch": None
            }
            
        elif event.event_type == EventType.HEARTBEAT:
            if session_id in self.active_sessions:
                self.active_sessions[session_id]["last_heartbeat"] = event.timestamp
                
        elif event.event_type == EventType.SESSION_END:
            if session_id in self.active_sessions:
                self.active_sessions[session_id]["status"] = "ended"
                
        elif event.event_type == EventType.TAB_SWITCH:
            if session_id in self.active_sessions:
                session = self.active_sessions[session_id]
                session["tab_switches"] += 1
                session["last_tab_switch"] = event.timestamp
                
        # Update event count
        if session_id in self.active_sessions:
            self.active_sessions[session_id]["event_count"] += 1

    async def analyze_security(self, event: SessionEvent):
        """Analyze event for security threats"""
        session_id = event.session_id
        session = self.active_sessions.get(session_id)
        
        if not session:
            return
            
        alerts = []
        
        # Check for excessive tab switches
        if event.event_type == EventType.TAB_SWITCH:
            time_window = timedelta(minutes=1)
            if session["last_tab_switch"]:
                time_diff = event.timestamp - session["last_tab_switch"]
                if time_diff < time_window and session["tab_switches"] > TAB_SWITCH_THRESHOLD:
                    alerts.append(self._create_alert(
                        event, SecurityLevel.HIGH,
                        f"Excessive tab switching detected: {session['tab_switches']} switches in 1 minute"
                    ))
        
        # Check for inactivity
        if event.event_type == EventType.INACTIVITY:
            if event.metadata.get("duration", 0) > INACTIVITY_THRESHOLD:
                alerts.append(self._create_alert(
                    event, SecurityLevel.MEDIUM,
                    f"User inactive for {event.metadata.get('duration')} seconds"
                ))
        
        # Check for heartbeat timeout
        if session["last_heartbeat"]:
            time_since_heartbeat = datetime.utcnow() - session["last_heartbeat"]
            if time_since_heartbeat.total_seconds() > HEARTBEAT_TIMEOUT:
                alerts.append(self._create_alert(
                    event, SecurityLevel.CRITICAL,
                    f"Heartbeat timeout: {time_since_heartbeat.total_seconds()} seconds"
                ))
        
        # ML-based anomaly detection
        if self.ml_model:
            risk_score = await self._calculate_ml_risk_score(event, session)
            session["risk_score"] = risk_score
            
            if risk_score > SUSPICIOUS_SCORE_THRESHOLD:
                alerts.append(self._create_alert(
                    event, SecurityLevel.HIGH,
                    f"ML model flagged suspicious activity (score: {risk_score:.2f})"
                ))
        
        # Store alerts
        for alert in alerts:
            await self.store_alert(alert)
            
        # Update session risk score
        if alerts:
            session["risk_score"] = max(session["risk_score"], 0.8)

    def _create_alert(self, event: SessionEvent, level: SecurityLevel, description: str) -> SecurityAlert:
        """Create security alert"""
        return SecurityAlert(
            alert_id=f"alert_{int(time.time())}_{event.session_id}",
            user_id=event.user_id,
            session_id=event.session_id,
            security_level=level,
            event_type=event.event_type,
            description=description,
            timestamp=event.timestamp,
            metadata=event.metadata
        )

    async def _calculate_ml_risk_score(self, event: SessionEvent, session: Dict) -> float:
        """Calculate ML-based risk score"""
        try:
            # Extract features for ML model
            features = [
                session.get("event_count", 0),
                session.get("tab_switches", 0),
                session.get("risk_score", 0.0),
                event.metadata.get("duration", 0),
                event.metadata.get("click_count", 0),
                event.metadata.get("keypress_count", 0)
            ]
            
            # Normalize features
            features = np.array(features).reshape(1, -1)
            
            # Get anomaly score (lower = more anomalous)
            if self.ml_model:
                score = self.ml_model.decision_function(features)[0]
                # Convert to risk score (0-1, higher = more risky)
                risk_score = 1 - (score + 0.5)  # Normalize to 0-1
                return max(0.0, min(1.0, risk_score))
            
        except Exception as e:
            logger.error(f"Error calculating ML risk score: {e}")
            
        return 0.0

    async def store_alert(self, alert: SecurityAlert):
        """Store security alert in MongoDB"""
        try:
            alert_doc = asdict(alert)
            alert_doc["security_level"] = alert.security_level.value
            alert_doc["event_type"] = alert.event_type.value
            
            await self.db.security_alerts.insert_one(alert_doc)
            logger.warning(f"Security alert stored: {alert.description}")
            
        except Exception as e:
            logger.error(f"Error storing alert: {e}")

    async def get_session_alerts(self, session_id: str) -> List[Dict]:
        """Get alerts for a specific session"""
        try:
            cursor = self.db.security_alerts.find(
                {"session_id": session_id},
                {"_id": 0}
            ).sort("timestamp", -1).limit(50)
            
            alerts = await cursor.to_list(length=50)
            return alerts
            
        except Exception as e:
            logger.error(f"Error getting session alerts: {e}")
            return []

    async def publish_event(self, event: SessionEvent):
        """Publish event to Redis for real-time updates"""
        try:
            event_data = {
                "user_id": event.user_id,
                "session_id": event.session_id,
                "event_type": event.event_type.value,
                "timestamp": event.timestamp.isoformat(),
                "metadata": event.metadata
            }
            
            # Publish to Redis channel
            self.redis_client.publish("session_events", json.dumps(event_data))
            
        except Exception as e:
            logger.error(f"Error publishing event: {e}")

    async def cleanup_expired_sessions(self):
        """Clean up expired sessions"""
        current_time = datetime.utcnow()
        expired_sessions = []
        
        for session_id, session_data in self.active_sessions.items():
            if session_data.get("status") == "ended":
                expired_sessions.append(session_id)
            elif session_data.get("last_heartbeat"):
                time_since_heartbeat = current_time - session_data["last_heartbeat"]
                if time_since_heartbeat.total_seconds() > 300:  # 5 minutes
                    expired_sessions.append(session_id)
        
        for session_id in expired_sessions:
            del self.active_sessions[session_id]
            logger.info(f"Cleaned up expired session: {session_id}")

    async def start_cleanup_task(self):
        """Start periodic cleanup task"""
        while True:
            await asyncio.sleep(60)  # Run every minute
            await self.cleanup_expired_sessions()

monitor = SessionMonitor()
app = monitor.app

@app.on_event("startup")
async def startup_event():
    asyncio.create_task(monitor.start_cleanup_task()) 