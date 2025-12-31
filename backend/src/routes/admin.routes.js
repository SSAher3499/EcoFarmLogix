const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller');
const { authenticate, superAdminOnly } = require('../middleware/auth.middleware');

// All routes require SUPER_ADMIN
router.use(authenticate);
router.use(superAdminOnly);

// System status
router.get('/system-status', adminController.getSystemStatus);

// Recent action logs
router.get('/action-logs', adminController.getActionLogs);

// All users with last login
router.get('/users-overview', adminController.getUsersOverview);

// All devices with status
router.get('/devices-overview', adminController.getDevicesOverview);

// Recent notifications
router.get('/notifications-log', adminController.getNotificationsLog);

// Send test notification
router.post('/test-notification', adminController.sendTestNotification);

// Database stats
router.get('/database-stats', adminController.getDatabaseStats);

// Error logs
router.get('/error-logs', adminController.getErrorLogs);
router.delete('/error-logs', adminController.clearErrorLogs);

module.exports = router;
