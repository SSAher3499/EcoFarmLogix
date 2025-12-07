const express = require('express');
const router = express.Router();
const historyController = require('../controllers/history.controller');
const { authenticate } = require('../middleware/auth.middleware');

// All routes require authentication
router.use(authenticate);

// Sensor history
router.get('/sensors/:sensorId/history', historyController.getSensorHistory);

// Farm history (all sensors)
router.get('/farms/:farmId/history', historyController.getFarmHistory);

// Export farm history as CSV
router.get('/farms/:farmId/history/export', historyController.exportFarmHistory);

module.exports = router;