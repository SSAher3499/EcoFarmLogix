const express = require('express');
const router = express.Router();
const farmController = require('../controllers/farm.controller');
const deviceController = require('../controllers/device.controller');
const { authenticate, requireFarmAccess, superAdminOnly, requirePermission } = require('../middleware/auth.middleware');
const { validate } = require('../validators/auth.validator');
const { createFarmSchema, updateFarmSchema } = require('../validators/farm.validator');
const { registerDeviceSchema, updateDeviceSchema } = require('../validators/device.validator');

// All routes require authentication
router.use(authenticate);

// Farm CRUD routes
// Only Super Admin can create farms
router.post('/', superAdminOnly, validate(createFarmSchema), farmController.createFarm);

// Get farms - Super Admin sees all, others see their own
router.get('/', farmController.getFarms);

// Get single farm - requires farm access
router.get('/:farmId', requireFarmAccess(), farmController.getFarm);

// Update farm - Owner or Super Admin
router.put('/:farmId', requireFarmAccess('OWNER'), validate(updateFarmSchema), farmController.updateFarm);

// Delete farm - Super Admin only
router.delete('/:farmId', superAdminOnly, farmController.deleteFarm);

// Farm dashboard - any farm member can view
router.get('/:farmId/dashboard', requireFarmAccess(), farmController.getDashboard);

// Device routes - Super Admin only for add/delete
router.post('/:farmId/devices', superAdminOnly, validate(registerDeviceSchema), deviceController.registerDevice);
router.get('/:farmId/devices', requireFarmAccess(), deviceController.getDevices);

module.exports = router;