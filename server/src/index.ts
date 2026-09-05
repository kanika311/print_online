import http from 'http';
import path from 'path';
import express from 'express';
import cors from 'cors';
import { Server as SocketIOServer } from 'socket.io';
import dotenv from 'dotenv';
import { connectMongo } from './db/mongoClient';
import { SocketService } from './services/socketService';
import { StorageService } from './services/storageService';
import { authRouter } from './routes/authRoutes';
import { shopRouter } from './routes/shopRoutes';
import { orderRouter } from './routes/orderRoutes';
import { adminRouter } from './routes/adminRoutes';
import { chatRouter } from './routes/chatRoutes';
import { notificationRouter } from './routes/notificationRoutes';

dotenv.config();

const app = express();
const server = http.createServer(app);

const PORT = process.env.PORT || 5000;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:3000';

// Setup Socket.io
const io = new SocketIOServer(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
  },
});
SocketService.initialize(io);

// Middlewares
app.use(cors({ origin: '*' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files statically
const uploadsPath = path.resolve(__dirname, '../uploads');
app.use('/uploads', express.static(uploadsPath));

// API Routes
app.use('/api/auth', authRouter);
app.use('/api/shops', shopRouter);
app.use('/api/orders', orderRouter);
app.use('/api/admin', adminRouter);
app.use('/api/chat', chatRouter);
app.use('/api/notifications', notificationRouter);

// Health check endpoint
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'online',
    platform: 'PrintPorter Backend API',
    database: 'MongoDB Document Store + 2dsphere GeoJSON',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

// Initialize MongoDB & Server
async function startServer() {
  await connectMongo();
  StorageService.startPrivacyCleaner();

  server.listen(PORT, () => {
    console.log('====================================================');
    console.log(`🚀 PrintPorter Server is running on port ${PORT}`);
    console.log(`📡 WebSocket Realtime Server is active`);
    console.log(`📂 Uploads directory: ${uploadsPath}`);
    console.log(`🌐 Health check: http://localhost:${PORT}/api/health`);
    console.log('====================================================');
  });
}

startServer();
