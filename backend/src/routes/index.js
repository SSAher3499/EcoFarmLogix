const express = require('express');
const router = express.Router();

// Import route modules
const authRoutes = require('./auth.routes');
const farmRoutes = require('./farm.routes');
const deviceRoutes = require('./device.routes');
const actuatorRoutes = require('./actuator.routes');
const sensorRoutes = require('./sensor.routes');
const historyRoutes = require('./history.routes');
const weatherRoutes = require('./weather.routes');
const automationRoutes = require('./automation.routes');
const userRoutes = require('./user.routes');
const teamRoutes = require('./team.routes');
const serialConfigRoutes = require('./serialConfig.routes');
const scheduleRoutes = require('./schedule.routes');
const notificationRoutes = require('./notification.routes');
const adminRoutes = require('./admin.routes');

// Mount routes
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/weather', weatherRoutes);
router.use('/farms', farmRoutes);
router.use('/devices', deviceRoutes);
router.use('/actuators', actuatorRoutes);
router.use('/sensors', sensorRoutes);
router.use('/notifications', notificationRoutes);
router.use('/admin', adminRoutes);
router.use('/', historyRoutes);
router.use('/', automationRoutes);
router.use('/', teamRoutes);
router.use('/', serialConfigRoutes);
router.use('/', scheduleRoutes);

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
      users: {
        list: 'GET /api/v1/users (Super Admin)',
        get: 'GET /api/v1/users/:userId (Super Admin)',
        create: 'POST /api/v1/users (Super Admin)',
        update: 'PUT /api/v1/users/:userId (Super Admin)',
        resetPassword: 'PUT /api/v1/users/:userId/reset-password (Super Admin)',
        delete: 'DELETE /api/v1/users/:userId (Super Admin)'
      },
      farms: {
        create: 'POST /api/v1/farms (Super Admin)',
        list: 'GET /api/v1/farms',
        get: 'GET /api/v1/farms/:farmId',
        update: 'PUT /api/v1/farms/:farmId',
        delete: 'DELETE /api/v1/farms/:farmId (Super Admin)',
        dashboard: 'GET /api/v1/farms/:farmId/dashboard',
        team: 'GET /api/v1/farms/:farmId/team',
        addTeamMember: 'POST /api/v1/farms/:farmId/team',
        updateTeamMember: 'PUT /api/v1/farms/:farmId/team/:memberId',
        removeTeamMember: 'DELETE /api/v1/farms/:farmId/team/:memberId'
      },
      devices: {
        register: 'POST /api/v1/farms/:farmId/devices (Super Admin)',
        listByFarm: 'GET /api/v1/farms/:farmId/devices',
        get: 'GET /api/v1/devices/:deviceId',
        update: 'PUT /api/v1/devices/:deviceId (Super Admin)',
        delete: 'DELETE /api/v1/devices/:deviceId (Super Admin)',
        addSensor: 'POST /api/v1/devices/:deviceId/sensors (Super Admin)',
        addActuator: 'POST /api/v1/devices/:deviceId/actuators (Super Admin)'
      },
      sensors: {
        readings: 'GET /api/v1/sensors/:sensorId/readings',
        delete: 'DELETE /api/v1/sensors/:sensorId (Super Admin)'
      },
      actuators: {
        control: 'PUT /api/v1/actuators/:actuatorId/control',
        delete: 'DELETE /api/v1/actuators/:actuatorId (Super Admin)'
      },
      weather: {
        byCoords: 'GET /api/v1/weather?lat=XX&lon=YY',
        byCity: 'GET /api/v1/weather/city/:cityName',
        byFarm: 'GET /api/v1/farms/:farmId/weather'
      },
      schedules: {
        listByFarm: 'GET /api/v1/farms/:farmId/schedules',
        create: 'POST /api/v1/farms/:farmId/schedules',
        get: 'GET /api/v1/schedules/:scheduleId',
        update: 'PUT /api/v1/schedules/:scheduleId',
        delete: 'DELETE /api/v1/schedules/:scheduleId',
        toggle: 'POST /api/v1/schedules/:scheduleId/toggle'
      }
    }
  });
});

module.exports = router;