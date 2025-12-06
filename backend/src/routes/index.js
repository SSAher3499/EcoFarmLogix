const express = require('express');
const router = express.Router();

// Import route modules
const authRoutes = require('./auth.routes');
const farmRoutes = require('./farm.routes');
const deviceRoutes = require('./device.routes');
const actuatorRoutes = require('./actuator.routes');
const sensorRoutes = require('./sensor.routes');

// Mount routes
router.use('/auth', authRoutes);
router.use('/farms', farmRoutes);
router.use('/devices', deviceRoutes);
router.use('/actuators', actuatorRoutes);
router.use('/sensors', sensorRoutes);

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
        me: 'GET /api/v1/auth/me'
      },
      farms: {
        create: 'POST /api/v1/farms',
        list: 'GET /api/v1/farms',
        get: 'GET /api/v1/farms/:farmId',
        update: 'PUT /api/v1/farms/:farmId',
        delete: 'DELETE /api/v1/farms/:farmId',
        dashboard: 'GET /api/v1/farms/:farmId/dashboard'
      },
      devices: {
        register: 'POST /api/v1/farms/:farmId/devices',
        listByFarm: 'GET /api/v1/farms/:farmId/devices',
        get: 'GET /api/v1/devices/:deviceId',
        update: 'PUT /api/v1/devices/:deviceId',
        delete: 'DELETE /api/v1/devices/:deviceId',
        addSensor: 'POST /api/v1/devices/:deviceId/sensors',
        addActuator: 'POST /api/v1/devices/:deviceId/actuators'
      },
      sensors: {
        readings: 'GET /api/v1/sensors/:sensorId/readings',
        latestByFarm: 'GET /api/v1/sensors/farm/:farmId/latest'
      },
      actuators: {
        control: 'PUT /api/v1/actuators/:actuatorId/control'
      }
    }
  });
});

module.exports = router;