import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import compression from "compression";
import morgan from "morgan";
import http from "http";
import dotenv from "dotenv";
dotenv.config();
import subscriptionRoutes from "./routes/subscription.routes.js";


// Import database connection
import db from "./db/db.js";

// Import routes
import routes from "./routes/index.js";

// Import middleware
import { errorHandler } from "./middleware/errorHandler.js";
import { rateLimiter } from "./middleware/rateLimiter.js";
import { 
  securityHeaders, 
  contentSecurityPolicy, 
  sanitizeRequest,
  deviceFingerprint 
} from "./middleware/securityMiddleware.js";

// Import session monitor
import sessionMonitor from "./utils/sessionMonitor.js";

// Load environment variables

// Initialize database connection
db();

const app = express();

// Create HTTP server for WebSocket support
const server = http.createServer(app);

// Initialize WebSocket session monitor
sessionMonitor.initialize(server);

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  crossOriginEmbedderPolicy: false,
}));

// CORS configuration
app.use(cors({
  origin: [
    process.env.FRONTEND_URL || "http://localhost:3000",
    "http://localhost:5173", // Vite default port
    "http://localhost:4173", // Vite preview port
    "http://127.0.0.1:5173",
    "http://127.0.0.1:4173"
  ],
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "X-Device-Fingerprint"],
}));

// Body parsing middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use('/api/subscription', subscriptionRoutes);

// Cookie parser
app.use(cookieParser());

// Compression middleware
app.use(compression());

// Logging middleware
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
} else {
  app.use(morgan("combined"));
}

// Security middleware stack
app.use(securityHeaders);
app.use(contentSecurityPolicy);
app.use(deviceFingerprint);
app.use(sanitizeRequest);

// Global rate limiting
app.use(rateLimiter('global', 1000, 60 * 1000)); // 1000 requests per minute

// API routes
app.use('/api', routes);



// WebSocket endpoint for session monitoring
app.get('/ws', (req, res) => {
  res.json({
    message: "WebSocket endpoint available at /ws",
    instructions: "Connect with sessionId and userId as query parameters"
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: "Mock Interview Platform API",
    version: "1.0.0",
    status: "running",
    timestamp: new Date().toISOString(),
    documentation: "/api/docs",
    websocket: "/ws",
    security: {
      sessionMonitoring: "enabled",
      deviceFingerprinting: "enabled",
      rateLimiting: "enabled",
      securityHeaders: "enabled"
    }
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  const health = {
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    services: {
      database: 'connected',
      sessionMonitor: sessionMonitor.wss ? 'running' : 'stopped',
      pythonService: 'checking...'
    }
  };

  // Check Python service health
  const pythonServiceUrl = process.env.PYTHON_SERVICE_URL || 'http://localhost:8001';
  fetch(`${pythonServiceUrl}/health`)
    .then(response => {
      if (response.ok) {
        health.services.pythonService = 'online';
      } else {
        health.services.pythonService = 'offline';
      }
    })
    .catch(() => {
      health.services.pythonService = 'offline';
    })
    .finally(() => {
      res.json(health);
    });
});

// Global error handler (should be last)
app.use(errorHandler);

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Promise Rejection:', err);
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Process terminated');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  server.close(() => {
    console.log('Process terminated');
    process.exit(0);
  });
});

const port = process.env.PORT || 5000;

server.listen(port, () => {
  console.log(`🚀 Server running on port ${port}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 API Base URL: http://localhost:${port}/api`);
  console.log(`🏥 Health Check: http://localhost:${port}/health`);
  console.log(`🔌 WebSocket: ws://localhost:${port}/ws`);
  console.log(`🐍 Python Service: ${process.env.PYTHON_SERVICE_URL || 'http://localhost:8001'}`);
  console.log(`🔒 Security Features: Session Monitoring, Device Fingerprinting, Rate Limiting`);
});

