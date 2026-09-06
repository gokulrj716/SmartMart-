import express, { Request, Response, NextFunction } from 'express';
import http from 'http';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import apiRouter from './routes/api';
import { db } from './database/db';
import { socketManager } from './sockets/socketManager';

dotenv.config();

const app = express();
const server = http.createServer(app);

const PORT = Number(process.env.PORT) || 5000;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

// Security Headers
app.use(helmet({
  contentSecurityPolicy: false, // Allows flexible development
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}));

// CORS Configuration
app.use(cors({
  origin: '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
}));

// Body Parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Global Rate Limiter for API endpoints
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // 1000 requests per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests, please try again later.' }
});
app.use('/api', limiter);

// Mount API Routes
app.use('/api', apiRouter);

// Health Check Endpoint
app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'HEALTHY',
    service: 'SMARTMART Real-time Supermarket Platform API',
    database: db.isMySQL() ? 'MySQL (Production)' : 'SQLite (Universal Local Fallback)',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

// Sanitized Error Handling Middleware (Never expose raw database or stack traces to client)
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('💥 [Server Unhandled Error]:', err.stack || err.message);

  // Return clean, production-friendly error message
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Unable to complete this operation. Please try again later.',
    code: err.code || 'INTERNAL_SERVER_ERROR'
  });
});

// Initialize Database, WebSockets, and Start Server
async function startServer() {
  try {
    await db.init();
    socketManager.init(server);

    server.listen(PORT, () => {
      console.log(`=======================================================`);
      console.log(`🚀 SMARTMART Supermarket Platform Backend is Running!`);
      console.log(`📡 Port: http://localhost:${PORT}`);
      console.log(`💾 Database Engine: ${db.isMySQL() ? 'MySQL' : 'SQLite Local Fallback'}`);
      console.log(`⚡ Real-Time Socket.IO: Ready`);
      console.log(`🔐 RBAC & JWT Security: Enabled`);
      console.log(`=======================================================`);
    });
  } catch (err: any) {
    console.error('❌ Failed to start SMARTMART Server:', err);
    process.exit(1);
  }
}

startServer();
