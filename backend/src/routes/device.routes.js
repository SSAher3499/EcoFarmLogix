const express = require('express');
const router = express.Router();
const deviceController = require('../controllers/device.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { validate } = require('../validators/auth.validator');
const { 
  updateDeviceSchema, 
  createSensorSchema, 
  createActuatorSchema 
} = require('../validators/device.validator');

// Public route for edge devices (no auth required)
router.get('/devices/mac/:macAddress', deviceController.getDeviceByMac);

// All routes require authentication
router.use(authenticate);

// Device routes
router.get('/:deviceId', deviceController.getDevice);
router.put('/:deviceId', validate(updateDeviceSchema), deviceController.updateDevice);
router.delete('/:deviceId', deviceController.deleteDevice);

// Sensor routes
router.post('/:deviceId/sensors', validate(createSensorSchema), deviceController.addSensor);

// Actuator routes
router.post('/:deviceId/actuators', validate(createActuatorSchema), deviceController.addActuator);

module.exports = router;