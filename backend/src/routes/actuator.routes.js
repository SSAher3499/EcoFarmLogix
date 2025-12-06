const express = require('express');
const router = express.Router();
const deviceController = require('../controllers/device.controller');
const { authenticate } = require('../middleware/auth.middleware');

// All routes require authentication
router.use(authenticate);

// Control actuator
router.put('/:actuatorId/control', deviceController.controlActuator);

module.exports = router;