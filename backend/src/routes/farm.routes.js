const express = require('express');
const router = express.Router();
const farmController = require('../controllers/farm.controller');
const deviceController = require('../controllers/device.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { validate } = require('../validators/auth.validator');
const { createFarmSchema, updateFarmSchema } = require('../validators/farm.validator');
const { registerDeviceSchema, updateDeviceSchema } = require('../validators/device.validator');

// All routes require authentication
router.use(authenticate);

// Farm CRUD routes
router.post('/', validate(createFarmSchema), farmController.createFarm);
router.get('/', farmController.getFarms);
router.get('/:farmId', farmController.getFarm);
router.put('/:farmId', validate(updateFarmSchema), farmController.updateFarm);
router.delete('/:farmId', farmController.deleteFarm);

// Farm dashboard
router.get('/:farmId/dashboard', farmController.getDashboard);

// Device routes under farm
router.post('/:farmId/devices', validate(registerDeviceSchema), deviceController.registerDevice);
router.get('/:farmId/devices', deviceController.getDevices);

module.exports = router;