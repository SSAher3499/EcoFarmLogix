const express = require('express');
const router = express.Router();

// Import route modules
const authRoutes = require('./auth.routes');

// Mount routes
router.use('/auth', authRoutes);

// API info route
router.get('/', (req, res) => {
  res.json({
    message: 'Welcome to EcoFarmLogix API',
    version: '1.0.0',
    endpoints: {
      auth: {
        register: 'POST /api/v1/auth/register',
        login: 'POST /api/v1/auth/login',
        refreshToken: 'POST /api/v1/auth/refresh-token',
        logout: 'POST /api/v1/auth/logout',
        me: 'GET /api/v1/auth/me (protected)',
        logoutAll: 'POST /api/v1/auth/logout-all (protected)'
      }
    }
  });
});

module.exports = router;