// Load environment variables first
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { connectDatabase, disconnectDatabase } = require('./config/database');
const routes = require('./routes');
const mqttService = require('./mqtt/mqtt.service');

// Initialize Express app
const app = express();

// Get port from environment or default to 3000
const PORT = process.env.PORT || 3000;

// ===================
// Middleware Setup
// ===================

app.use(helmet());

app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true
}));

app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ===================
// Health Check Route
// ===================

app.get('/health', async (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'EcoFarmLogix API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    mqtt: mqttService.isConnected ? 'connected' : 'disconnected'
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

  // Connect to MQTT broker
  try {
    await mqttService.connect();
  } catch (error) {
    console.error('⚠️ MQTT connection failed, continuing without MQTT:', error.message);
  }

  // Start Express server
  app.listen(PORT, () => {
    console.log(`
  ╔═══════════════════════════════════════════════════════════╗
  ║                                                           ║
  ║   🌱 EcoFarmLogix API Server                              ║
  ║                                                           ║
  ║   → Local:      http://localhost:${PORT}                   ║
  ║   → Health:     http://localhost:${PORT}/health            ║
  ║   → API:        http://localhost:${PORT}/api/v1            ║
  ║                                                           ║
  ║   → Environment: ${process.env.NODE_ENV || 'development'}                          ║
  ║   → Database:    Connected ✅                             ║
  ║   → MQTT:        ${mqttService.isConnected ? 'Connected ✅' : 'Disconnected ⚠️'}                        ║
  ║                                                           ║
  ╚═══════════════════════════════════════════════════════════╝
    `);
  });
}

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down gracefully...');
  mqttService.disconnect();
  await disconnectDatabase();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Shutting down gracefully...');
  mqttService.disconnect();
  await disconnectDatabase();
  process.exit(0);
});

// Start the server
startServer();

module.exports = app;