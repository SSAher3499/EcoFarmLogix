const express = require('express');
const router = express.Router();
const deviceController = require('../controllers/device.controller');
const { authenticate, superAdminOnly, requireFarmAccess } = require('../middleware/auth.middleware');
const { validate } = require('../validators/auth.validator');
const { 
  updateDeviceSchema, 
  createSensorSchema, 
  createActuatorSchema 
} = require('../validators/device.validator');

// Public route for edge devices (no auth required)
router.get('/mac/:macAddress', deviceController.getDeviceByMac);

// All other routes require authentication
router.use(authenticate);

// Sensor delete route - Super Admin only
router.delete('/sensors/:sensorId', superAdminOnly, deviceController.deleteSensor);

// Actuator delete route - Super Admin only
router.delete('/actuators/:actuatorId', superAdminOnly, deviceController.deleteActuator);

// Device routes
router.get('/:deviceId', deviceController.getDevice);
router.put('/:deviceId', superAdminOnly, validate(updateDeviceSchema), deviceController.updateDevice);
router.delete('/:deviceId', superAdminOnly, deviceController.deleteDevice);

// Sensor routes - Super Admin only
router.post('/:deviceId/sensors', superAdminOnly, validate(createSensorSchema), deviceController.addSensor);

// Actuator routes - Super Admin only
router.post('/:deviceId/actuators', superAdminOnly, validate(createActuatorSchema), deviceController.addActuator);

module.exports = router;