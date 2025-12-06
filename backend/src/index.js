// Load environment variables first
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { connectDatabase, disconnectDatabase } = require('./config/database');
const routes = require('./routes');

// Initialize Express app
const app = express();

// Get port from environment or default to 3000
const PORT = process.env.PORT || 3000;

// ===================
// Middleware Setup
// ===================

// Security headers
app.use(helmet());

// CORS configuration
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true
}));

// Request logging
app.use(morgan('dev'));

// Parse JSON bodies
app.use(express.json());

// Parse URL-encoded bodies
app.use(express.urlencoded({ extended: true }));

// ===================
// Health Check Route
// ===================

app.get('/health', async (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'EcoFarmLogix API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
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
  ║                                                           ║
  ╚═══════════════════════════════════════════════════════════╝
    `);
  });
}

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down gracefully...');
  await disconnectDatabase();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Shutting down gracefully...');
  await disconnectDatabase();
  process.exit(0);
});

// Start the server
startServer();

module.exports = app;