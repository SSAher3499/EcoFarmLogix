const automationService = require('../services/automation.service');

class AutomationController {
  
  /**
   * POST /api/v1/farms/:farmId/automation-rules
   */
  async createRule(req, res, next) {
    try {
      const { farmId } = req.params;
      const rule = await automationService.createRule(farmId, req.user.userId, req.body);
      
      res.status(201).json({
        status: 'success',
        message: 'Automation rule created successfully',
        data: { rule }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/farms/:farmId/automation-rules
   */
  async getFarmRules(req, res, next) {
    try {
      const { farmId } = req.params;
      const rules = await automationService.getFarmRules(farmId, req.user.userId);
      
      res.status(200).json({
        status: 'success',
        data: { rules, count: rules.length }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/automation-rules/:ruleId
   */
  async getRule(req, res, next) {
    try {
      const { ruleId } = req.params;
      const rule = await automationService.getRule(ruleId, req.user.userId);
      
      res.status(200).json({
        status: 'success',
        data: { rule }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/v1/automation-rules/:ruleId
   */
  async updateRule(req, res, next) {
    try {
      const { ruleId } = req.params;
      const rule = await automationService.updateRule(ruleId, req.user.userId, req.body);
      
      res.status(200).json({
        status: 'success',
        message: 'Rule updated successfully',
        data: { rule }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/v1/automation-rules/:ruleId
   */
  async deleteRule(req, res, next) {
    try {
      const { ruleId } = req.params;
      const result = await automationService.deleteRule(ruleId, req.user.userId);
      
      res.status(200).json({
        status: 'success',
        ...result
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/v1/automation-rules/:ruleId/toggle
   */
  async toggleRule(req, res, next) {
    try {
      const { ruleId } = req.params;
      const rule = await automationService.toggleRule(ruleId, req.user.userId);
      
      res.status(200).json({
        status: 'success',
        message: `Rule ${rule.isEnabled ? 'enabled' : 'disabled'}`,
        data: { rule }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/farms/:farmId/components
   */
  async getFarmComponents(req, res, next) {
    try {
      const { farmId } = req.params;
      const components = await automationService.getFarmComponents(farmId, req.user.userId);
      
      res.status(200).json({
        status: 'success',
        data: components
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AutomationController();