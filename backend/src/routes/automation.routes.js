const express = require('express');
const router = express.Router();
const automationController = require('../controllers/automation.controller');
const { authenticate, requireFarmAccess } = require('../middleware/auth.middleware');
const { prisma } = require('../config/database');

// All routes require authentication
router.use(authenticate);

/**
 * Middleware to check automation permissions based on farm role
 */
const checkAutomationPermission = (action) => {
  return async (req, res, next) => {
    try {
      const { farmId, ruleId } = req.params;
      let targetFarmId = farmId;

      // If ruleId provided, get farmId from rule
      if (ruleId && !farmId) {
        const rule = await prisma.automationRule.findUnique({
          where: { id: ruleId },
          select: { farmId: true }
        });
        if (!rule) {
          return res.status(404).json({ status: 'error', message: 'Rule not found' });
        }
        targetFarmId = rule.farmId;
      }

      // Super Admin can do anything
      if (req.user.role === 'SUPER_ADMIN') {
        return next();
      }

      // Check if user is farm owner
      const farm = await prisma.farm.findFirst({
        where: { id: targetFarmId, userId: req.user.userId }
      });

      if (farm) {
        // Farm owner can do everything
        return next();
      }

      // Check FarmUser access
      const farmUser = await prisma.farmUser.findUnique({
        where: {
          farmId_userId: { farmId: targetFarmId, userId: req.user.userId }
        }
      });

      if (!farmUser || !farmUser.isActive) {
        return res.status(403).json({ status: 'error', message: 'Access denied' });
      }

      // Check permissions based on role and action
      const permissions = {
        MANAGER: ['view', 'create', 'edit', 'toggle'],
        OPERATOR: ['view'],
        VIEWER: ['view']
      };

      const allowedActions = permissions[farmUser.role] || [];

      if (!allowedActions.includes(action)) {
        return res.status(403).json({ 
          status: 'error', 
          message: `You don't have permission to ${action} automation rules` 
        });
      }

      next();
    } catch (error) {
      console.error('Automation permission check error:', error);
      return res.status(500).json({ status: 'error', message: 'Permission check failed' });
    }
  };
};

// Farm-specific routes
router.post('/farms/:farmId/automation-rules', checkAutomationPermission('create'), automationController.createRule);
router.get('/farms/:farmId/automation-rules', checkAutomationPermission('view'), automationController.getFarmRules);
router.get('/farms/:farmId/components', checkAutomationPermission('view'), automationController.getFarmComponents);

// Rule-specific routes
router.get('/automation-rules/:ruleId', checkAutomationPermission('view'), automationController.getRule);
router.put('/automation-rules/:ruleId', checkAutomationPermission('edit'), automationController.updateRule);
router.delete('/automation-rules/:ruleId', checkAutomationPermission('delete'), automationController.deleteRule);
router.patch('/automation-rules/:ruleId/toggle', checkAutomationPermission('toggle'), automationController.toggleRule);

module.exports = router;