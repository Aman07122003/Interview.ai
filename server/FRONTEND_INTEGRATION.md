# Frontend Security Integration Guide

## 🔌 WebSocket Connection

### Basic Connection
```javascript
// Connect to WebSocket with session monitoring
const connectSessionMonitor = (sessionId, userId) => {
  const ws = new WebSocket(`ws://localhost:5000/ws?sessionId=${sessionId}&userId=${userId}`);
  
  ws.onopen = () => {
    console.log('Session monitor connected');
    startHeartbeat(ws);
  };
  
  ws.onmessage = (event) => {
    const message = JSON.parse(event.data);
    handleSessionMessage(message);
  };
  
  ws.onclose = () => {
    console.log('Session monitor disconnected');
  };
  
  return ws;
};
```

### Heartbeat System
```javascript
// Send heartbeat every 5 seconds
const startHeartbeat = (ws) => {
  setInterval(() => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        type: 'heartbeat',
        data: {
          timestamp: Date.now(),
          userActivity: true
        }
      }));
    }
  }, 5000);
};
```

## 🛡️ Security Event Detection

### Tab Switch Detection
```javascript
// Detect tab switches
let isTabActive = true;
let tabSwitchCount = 0;

document.addEventListener('visibilitychange', () => {
  const wasActive = isTabActive;
  isTabActive = !document.hidden;
  
  if (wasActive && !isTabActive) {
    // Tab switched away
    tabSwitchCount++;
    sendSecurityEvent('tab_switch', {
      direction: 'away',
      count: tabSwitchCount,
      timestamp: Date.now()
    });
  } else if (!wasActive && isTabActive) {
    // Tab switched back
    sendSecurityEvent('tab_switch', {
      direction: 'back',
      count: tabSwitchCount,
      timestamp: Date.now()
    });
  }
});
```

### Inactivity Detection
```javascript
// Detect user inactivity
let inactivityTimer;
let lastActivity = Date.now();

const resetInactivityTimer = () => {
  lastActivity = Date.now();
  clearTimeout(inactivityTimer);
  
  inactivityTimer = setTimeout(() => {
    const duration = Date.now() - lastActivity;
    sendSecurityEvent('inactivity', {
      duration: duration,
      timestamp: Date.now()
    });
  }, 30000); // 30 seconds
};

// Track user activity
['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'].forEach(event => {
  document.addEventListener(event, resetInactivityTimer, true);
});
```

### Copy-Paste Prevention
```javascript
// Prevent copy-paste
document.addEventListener('copy', (e) => {
  e.preventDefault();
  sendSecurityEvent('copy_paste', {
    action: 'copy',
    target: e.target.tagName,
    timestamp: Date.now()
  });
  return false;
});

document.addEventListener('paste', (e) => {
  e.preventDefault();
  sendSecurityEvent('copy_paste', {
    action: 'paste',
    target: e.target.tagName,
    timestamp: Date.now()
  });
  return false;
});
```

### Right-Click Prevention
```javascript
// Prevent right-click context menu
document.addEventListener('contextmenu', (e) => {
  e.preventDefault();
  sendSecurityEvent('right_click', {
    target: e.target.tagName,
    coordinates: { x: e.clientX, y: e.clientY },
    timestamp: Date.now()
  });
  return false;
});
```

### Keyboard Shortcut Prevention
```javascript
// Prevent common keyboard shortcuts
document.addEventListener('keydown', (e) => {
  const shortcuts = [
    { key: 'F5', ctrl: false, shift: false },
    { key: 'F11', ctrl: false, shift: false },
    { key: 'F12', ctrl: false, shift: false },
    { key: 'I', ctrl: true, shift: false }, // Ctrl+I (Inspect)
    { key: 'J', ctrl: true, shift: false }, // Ctrl+J (Console)
    { key: 'C', ctrl: true, shift: false }, // Ctrl+C
    { key: 'V', ctrl: true, shift: false }, // Ctrl+V
    { key: 'A', ctrl: true, shift: false }, // Ctrl+A
    { key: 'Z', ctrl: true, shift: false }, // Ctrl+Z
    { key: 'Y', ctrl: true, shift: false }, // Ctrl+Y
    { key: 'U', ctrl: true, shift: false }, // Ctrl+U (View Source)
  ];
  
  const pressedShortcut = shortcuts.find(shortcut => 
    e.key === shortcut.key && 
    e.ctrlKey === shortcut.ctrl && 
    e.shiftKey === shortcut.shift
  );
  
  if (pressedShortcut) {
    e.preventDefault();
    sendSecurityEvent('keyboard_shortcut', {
      key: e.key,
      ctrl: e.ctrlKey,
      shift: e.shiftKey,
      alt: e.altKey,
      timestamp: Date.now()
    });
    return false;
  }
});
```

## 📱 Device Fingerprinting

### Generate Device Fingerprint
```javascript
// Generate device fingerprint
const generateDeviceFingerprint = async () => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  ctx.textBaseline = 'top';
  ctx.font = '14px Arial';
  ctx.fillText('Device fingerprint', 2, 2);
  
  const fingerprint = {
    userAgent: navigator.userAgent,
    language: navigator.language,
    platform: navigator.platform,
    screenResolution: `${screen.width}x${screen.height}`,
    colorDepth: screen.colorDepth,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    canvas: canvas.toDataURL(),
    webgl: getWebGLFingerprint(),
    fonts: await getFontList(),
    plugins: Array.from(navigator.plugins).map(p => p.name),
    mimeTypes: Array.from(navigator.mimeTypes).map(m => m.type)
  };
  
  // Hash the fingerprint
  const fingerprintString = JSON.stringify(fingerprint);
  const hashBuffer = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(fingerprintString));
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  
  return hashHex;
};

// Get WebGL fingerprint
const getWebGLFingerprint = () => {
  const canvas = document.createElement('canvas');
  const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
  
  if (!gl) return null;
  
  return {
    vendor: gl.getParameter(gl.VENDOR),
    renderer: gl.getParameter(gl.RENDERER),
    version: gl.getParameter(gl.VERSION)
  };
};

// Get font list
const getFontList = async () => {
  const baseFonts = ['monospace', 'sans-serif', 'serif'];
  const fontList = ['Arial', 'Verdana', 'Helvetica', 'Times New Roman', 'Courier New'];
  
  const testString = 'mmmmmmmmmmlli';
  const testSize = '72px';
  const h = document.getElementsByTagName('body')[0];
  
  const baseFontsWidth = {};
  const fontWidths = {};
  
  // Get base font widths
  for (const baseFont of baseFonts) {
    const s = document.createElement('span');
    s.style.fontSize = testSize;
    s.style.fontFamily = baseFont;
    s.innerHTML = testString;
    h.appendChild(s);
    baseFontsWidth[baseFont] = s.offsetWidth;
    h.removeChild(s);
  }
  
  // Get font widths
  for (const font of fontList) {
    const s = document.createElement('span');
    s.style.fontSize = testSize;
    s.style.fontFamily = `${font},${baseFonts.join(',')}`;
    s.innerHTML = testString;
    h.appendChild(s);
    fontWidths[font] = s.offsetWidth;
    h.removeChild(s);
  }
  
  return fontWidths;
};
```

## 🔄 Session Management

### Send Security Events
```javascript
// Send security events to backend
const sendSecurityEvent = (eventType, data) => {
  if (window.sessionWebSocket && window.sessionWebSocket.readyState === WebSocket.OPEN) {
    window.sessionWebSocket.send(JSON.stringify({
      type: eventType,
      data: {
        ...data,
        deviceFingerprint: window.deviceFingerprint
      }
    }));
  }
  
  // Also send via REST API as backup
  fetch('/api/session/events', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
      'X-Device-Fingerprint': window.deviceFingerprint
    },
    body: JSON.stringify({
      eventType,
      data,
      sessionId: window.currentSessionId,
      timestamp: Date.now()
    })
  }).catch(console.error);
};
```

### Handle Session Messages
```javascript
// Handle messages from session monitor
const handleSessionMessage = (message) => {
  switch (message.type) {
    case 'session_locked':
      handleSessionLocked(message.data);
      break;
      
    case 'session_terminated':
      handleSessionTerminated(message.data);
      break;
      
    case 'security_alert':
      handleSecurityAlert(message.data);
      break;
      
    case 'warning':
      handleWarning(message.data);
      break;
      
    default:
      console.log('Unknown message type:', message.type);
  }
};

// Handle session locked
const handleSessionLocked = (data) => {
  console.warn('Session locked:', data.reason);
  
  // Show warning to user
  showNotification('warning', 'Session Locked', data.reason);
  
  // Disable form inputs
  disableFormInputs();
  
  // Show lock screen
  showLockScreen(data.reason);
};

// Handle session terminated
const handleSessionTerminated = (data) => {
  console.error('Session terminated:', data.reason);
  
  // Show error to user
  showNotification('error', 'Session Terminated', data.reason);
  
  // Redirect to login
  setTimeout(() => {
    window.location.href = '/login';
  }, 3000);
};

// Handle security alert
const handleSecurityAlert = (data) => {
  console.warn('Security alert:', data);
  
  // Show warning to user
  showNotification('warning', 'Security Alert', data.description);
  
  // Log the alert
  logSecurityAlert(data);
};
```

## 🎨 UI Components

### Lock Screen Component
```javascript
// Lock screen component
const showLockScreen = (reason) => {
  const lockScreen = document.createElement('div');
  lockScreen.id = 'lock-screen';
  lockScreen.innerHTML = `
    <div class="lock-screen-overlay">
      <div class="lock-screen-content">
        <div class="lock-icon">🔒</div>
        <h2>Session Locked</h2>
        <p>${reason}</p>
        <p>Please contact an administrator if you believe this is an error.</p>
        <button onclick="contactAdmin()">Contact Admin</button>
      </div>
    </div>
  `;
  
  document.body.appendChild(lockScreen);
};

// Remove lock screen
const removeLockScreen = () => {
  const lockScreen = document.getElementById('lock-screen');
  if (lockScreen) {
    lockScreen.remove();
  }
};
```

### Notification System
```javascript
// Show notifications
const showNotification = (type, title, message) => {
  const notification = document.createElement('div');
  notification.className = `notification notification-${type}`;
  notification.innerHTML = `
    <div class="notification-header">
      <span class="notification-title">${title}</span>
      <button onclick="this.parentElement.parentElement.remove()">×</button>
    </div>
    <div class="notification-body">${message}</div>
  `;
  
  document.body.appendChild(notification);
  
  // Auto-remove after 5 seconds
  setTimeout(() => {
    if (notification.parentElement) {
      notification.remove();
    }
  }, 5000);
};
```

## 📊 Interview Session Integration

### Initialize Interview Session
```javascript
// Initialize interview session with security
const initializeInterviewSession = async (interviewId) => {
  try {
    // Generate device fingerprint
    window.deviceFingerprint = await generateDeviceFingerprint();
    
    // Start interview
    const response = await fetch('/api/interview/start', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        'X-Device-Fingerprint': window.deviceFingerprint
      },
      body: JSON.stringify({
        category: 'javascript',
        deviceFingerprint: window.deviceFingerprint
      })
    });
    
    const data = await response.json();
    
    if (data.success) {
      window.currentSessionId = data.data.interviewId;
      
      // Connect to session monitor
      window.sessionWebSocket = connectSessionMonitor(
        data.data.interviewId,
        getCurrentUserId()
      );
      
      // Initialize security monitoring
      initializeSecurityMonitoring();
      
      return data.data;
    }
  } catch (error) {
    console.error('Failed to initialize interview session:', error);
    throw error;
  }
};
```

### Submit Answer with Security
```javascript
// Submit answer with security monitoring
const submitAnswer = async (questionId, answerText) => {
  try {
    // Check if session is still active
    if (window.sessionWebSocket?.readyState !== WebSocket.OPEN) {
      throw new Error('Session connection lost');
    }
    
    const response = await fetch(`/api/interview/${window.currentSessionId}/answer`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        'X-Device-Fingerprint': window.deviceFingerprint
      },
      body: JSON.stringify({
        questionId,
        answerText,
        deviceFingerprint: window.deviceFingerprint,
        timestamp: Date.now()
      })
    });
    
    const data = await response.json();
    
    if (data.success) {
      // Log successful submission
      sendSecurityEvent('answer_submitted', {
        questionId,
        answerLength: answerText.length,
        timestamp: Date.now()
      });
      
      return data.data;
    }
  } catch (error) {
    console.error('Failed to submit answer:', error);
    throw error;
  }
};
```

## 🎯 Best Practices

### 1. Always Include Device Fingerprint
```javascript
// Add device fingerprint to all API requests
const apiRequest = async (url, options = {}) => {
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
    'X-Device-Fingerprint': window.deviceFingerprint,
    ...options.headers
  };
  
  return fetch(url, {
    ...options,
    headers
  });
};
```

### 2. Handle Connection Loss
```javascript
// Handle WebSocket connection loss
const handleConnectionLoss = () => {
  console.warn('Session monitor connection lost');
  
  // Try to reconnect
  setTimeout(() => {
    if (window.currentSessionId) {
      window.sessionWebSocket = connectSessionMonitor(
        window.currentSessionId,
        getCurrentUserId()
      );
    }
  }, 5000);
};
```

### 3. Graceful Degradation
```javascript
// Check if security features are available
const isSecurityAvailable = () => {
  return window.sessionWebSocket && 
         window.sessionWebSocket.readyState === WebSocket.OPEN &&
         window.deviceFingerprint;
};

// Fallback for when security is not available
const submitAnswerFallback = async (questionId, answerText) => {
  if (!isSecurityAvailable()) {
    console.warn('Security monitoring not available, using fallback');
    // Use basic submission without security monitoring
  }
  
  return submitAnswer(questionId, answerText);
};
```

## 🔧 Configuration

### Environment Variables
```javascript
// Security configuration
const SECURITY_CONFIG = {
  heartbeatInterval: 5000, // 5 seconds
  inactivityTimeout: 30000, // 30 seconds
  maxTabSwitches: 3, // per minute
  enableCopyPastePrevention: true,
  enableRightClickPrevention: true,
  enableKeyboardShortcutPrevention: true,
  enableDeviceFingerprinting: true
};
```

### Feature Flags
```javascript
// Feature flags for security features
const SECURITY_FEATURES = {
  sessionMonitoring: process.env.REACT_APP_ENABLE_SESSION_MONITORING === 'true',
  deviceFingerprinting: process.env.REACT_APP_ENABLE_DEVICE_FINGERPRINTING === 'true',
  copyPastePrevention: process.env.REACT_APP_ENABLE_COPY_PASTE_PREVENTION === 'true',
  rightClickPrevention: process.env.REACT_APP_ENABLE_RIGHT_CLICK_PREVENTION === 'true'
};
```

This integration guide provides all the necessary code and best practices for implementing the security monitoring system in your frontend application. 