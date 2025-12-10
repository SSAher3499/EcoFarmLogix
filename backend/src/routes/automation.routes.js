const express = require('express');
const router = express.Router();
const automationController = require('../controllers/automation.controller');
const { authenticate } = require('../middleware/auth.middleware');

// All routes require authentication
router.use(authenticate);

// Farm-specific routes
router.post('/farms/:farmId/automation-rules', automationController.createRule);
router.get('/farms/:farmId/automation-rules', automationController.getFarmRules);
router.get('/farms/:farmId/components', automationController.getFarmComponents);

// Rule-specific routes
router.get('/automation-rules/:ruleId', automationController.getRule);
router.put('/automation-rules/:ruleId', automationController.updateRule);
router.delete('/automation-rules/:ruleId', automationController.deleteRule);
router.patch('/automation-rules/:ruleId/toggle', automationController.toggleRule);

module.exports = router;