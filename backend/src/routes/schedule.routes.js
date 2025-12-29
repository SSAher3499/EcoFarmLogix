const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth.middleware');
const scheduleController = require('../controllers/schedule.controller');

// All routes require authentication
router.use(authenticate);

// GET /api/v1/farms/:farmId/schedules - Get all schedules for a farm
router.get('/farms/:farmId/schedules', scheduleController.getFarmSchedules.bind(scheduleController));

// POST /api/v1/farms/:farmId/schedules - Create a new schedule
router.post('/farms/:farmId/schedules', scheduleController.createSchedule.bind(scheduleController));

// GET /api/v1/schedules/:scheduleId - Get single schedule
router.get('/schedules/:scheduleId', scheduleController.getSchedule.bind(scheduleController));

// PUT /api/v1/schedules/:scheduleId - Update schedule
router.put('/schedules/:scheduleId', scheduleController.updateSchedule.bind(scheduleController));

// DELETE /api/v1/schedules/:scheduleId - Delete schedule
router.delete('/schedules/:scheduleId', scheduleController.deleteSchedule.bind(scheduleController));

// POST /api/v1/schedules/:scheduleId/toggle - Enable/disable schedule
router.post('/schedules/:scheduleId/toggle', scheduleController.toggleSchedule.bind(scheduleController));

module.exports = router;
