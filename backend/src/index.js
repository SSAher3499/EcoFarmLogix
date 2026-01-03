// Load environment variables first
require('dotenv').config();

const express = require('express');
const http = require('http');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { connectDatabase, disconnectDatabase } = require('./config/database');
const routes = require('./routes');
const mqttService = require('./mqtt/mqtt.service');
const websocketService = require('./services/websocket.service');
const schedulerService = require('./services/schedule.service');
const emailService = require('./services/email.service');
const errorLogger = require('./utils/errorLogger');

// Initialize Express app
const app = express();

// Create HTTP server (needed for Socket.io)
const server = http.createServer(app);

// Get port from environment or default to 3000
const PORT = process.env.PORT || 3000;

// ===================
// Middleware Setup
// ===================

app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
}));

app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true
}));

app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files (for WebSocket test page)
app.use(express.static('public'));

// ===================
// Health Check Route
// ===================

app.get('/health', async (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'EcoFarmLogix API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    services: {
      mqtt: mqttService.isConnected ? 'connected' : 'disconnected',
      websocket: websocketService.io ? 'running' : 'stopped',
      websocketClients: websocketService.getConnectedClients()
    }
  });
});

// ===================
// API Routes (v1)
// ===================

app.use('/api/v1', routes);

// ===================
// 404 Handler
// ===================

app.use((req, res) => {
  res.status(404).json({
    status: 'error',
    message: `Route ${req.originalUrl} not found`
  });
});

// ===================
// Global Error Handler
// ===================

app.use((err, req, res, next) => {
  console.error('Error:', err);

  // Log error for admin panel
  errorLogger.log(err, {
    path: req.path,
    method: req.method,
    userId: req.user?.userId,
    body: req.body,
    query: req.query
  });

  const status = err.status || 500;
  const message = err.message || 'Internal server error';

  res.status(status).json({
    status: 'error',
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// ===================
// Start Server
// ===================

async function startServer() {
  // Connect to database
  const dbConnected = await connectDatabase();

  if (!dbConnected) {
    console.error('Failed to connect to database. Exiting...');
    process.exit(1);
  }

  // Initialize Email service
  emailService.initialize();

  // Initialize WebSocket server
  websocketService.initialize(server);

  // Connect to MQTT broker
  try {
    await mqttService.connect();
  } catch (error) {
    console.error('⚠️ MQTT connection failed, continuing without MQTT:', error.message);
  }

  // Start scheduler service
  try {
    schedulerService.start();
  } catch (error) {
    console.error('⚠️ Scheduler failed to start:', error.message);
  }

  // Start HTTP server (not app.listen!)
  server.listen(PORT, () => {
    console.log(`
  ╔═══════════════════════════════════════════════════════════╗
  ║                                                           ║
  ║   🌱 EcoFarmLogix API Server                              ║
  ║                                                           ║
  ║   → Local:      http://localhost:${PORT}                   ║
  ║   → Health:     http://localhost:${PORT}/health            ║
  ║   → API:        http://localhost:${PORT}/api/v1            ║
  ║   → WebSocket:  ws://localhost:${PORT}                     ║
  ║                                                           ║
  ║   → Environment: ${process.env.NODE_ENV || 'development'}                          ║
  ║   → Database:    Connected ✅                             ║
  ║   → MQTT:        ${mqttService.isConnected ? 'Connected ✅' : 'Disconnected ⚠️'}                        ║
  ║   → WebSocket:   Running ✅                               ║
  ║   → Scheduler:   ${schedulerService.isRunning ? 'Running ✅' : 'Stopped ⚠️'}                         ║
  ║                                                           ║
  ╚═══════════════════════════════════════════════════════════╝
    `);
  });
}

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down gracefully...');
  schedulerService.stop();
  mqttService.disconnect();
  await disconnectDatabase();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Shutting down gracefully...');
  schedulerService.stop();
  mqttService.disconnect();
  await disconnectDatabase();
  process.exit(0);
});

// Start the server
startServer();

module.exports = { app, server };