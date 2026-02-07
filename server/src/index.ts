import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import path from 'path';
import { errorHandler } from './middleware/errorHandler';
import { requestLogger } from './middleware/requestLogger';
import { connectDatabase, gracefulShutdown, getConnectionStatus, isConnected } from './config/database';
import logger from './utils/logger';
import authRoutes from './routes/auth';
import articleRoutes from './routes/articles';
import brandVoiceRoutes from './routes/brandVoices';
import processRoutes from './routes/process';
import distributionRoutes from './routes/distribution';
import { initializeSocketHandlers } from './services/socketService';

// Load environment variables
dotenv.config();

const app = express();
const httpServer = createServer(app);

// Socket.IO setup

let allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
];
if (process.env.CLIENT_URL) {
  allowedOrigins = [
    ...allowedOrigins,
    ...process.env.CLIENT_URL.split(',').map(origin => origin.trim()),
  ];
  // Remove duplicates
  allowedOrigins = Array.from(new Set(allowedOrigins));
}
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: [
      process.env.CLIENT_URL || 'http://localhost:5173',
      'http://localhost:5173',
      'http://localhost:3000',
    ],
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Make io accessible to routes
app.set('io', io);

// Middleware
app.use(helmet());
app.use(cors({
  origin: allowedOrigins,
  credentials: true,
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
});
app.use('/api/', limiter);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static files for uploads
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Request logging
app.use(requestLogger);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/articles', articleRoutes);
app.use('/api/brand-voices', brandVoiceRoutes);
app.use('/api/process', processRoutes);
app.use('/api/distribute', distributionRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    database: {
      status: getConnectionStatus(),
      connected: isConnected(),
    },
  });
});

// Error handling
app.use(errorHandler);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.path} not found`,
  });
});

// Server startup
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    // Connect to MongoDB
    await connectDatabase();

    // Start HTTP server
    httpServer.listen(PORT, () => {
      console.log(`
🚀 AI Newsroom Server Started!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🌐 Server:    http://localhost:${PORT}
📊 Health:    http://localhost:${PORT}/api/health
🔌 Socket:    ws://localhost:${PORT}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Environment: ${process.env.NODE_ENV || 'development'}
Database:    ${getConnectionStatus()}
Refreshed Key: ${process.env.OPENAI_API_KEY ? 'Present (' + process.env.OPENAI_API_KEY.substring(0, 5) + '...)' : 'Missing'}
Model:       ${process.env.OPENAI_MODEL || 'default'}
      `);
    });
  } catch (error) {
    logger.error('Failed to start server', { error });
    process.exit(1);
  }
};

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
  logger.error('Unhandled Promise Rejection', { reason, promise });
});

// Handle uncaught exceptions
process.on('uncaughtException', (err: Error) => {
  logger.error('Uncaught Exception', { error: err.message, stack: err.stack });
  gracefulShutdown();
});

// Initialize Socket.IO handlers
initializeSocketHandlers(io);

startServer();

export { app, io };

