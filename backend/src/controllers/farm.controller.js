const farmService = require('../services/farm.service');

class FarmController {
  
  /**
   * POST /api/v1/farms
   */
  async createFarm(req, res, next) {
    try {
      const farm = await farmService.createFarm(req.user.userId, req.body);

      res.status(201).json({
        status: 'success',
        message: 'Farm created successfully',
        data: { farm }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/farms
   */
  async getFarms(req, res, next) {
    try {
      const farms = await farmService.getUserFarms(req.user.userId);

      res.status(200).json({
        status: 'success',
        data: { 
          farms,
          count: farms.length 
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/farms/:farmId
   */
  async getFarm(req, res, next) {
    try {
      const farm = await farmService.getFarmById(req.params.farmId, req.user.userId);

      res.status(200).json({
        status: 'success',
        data: { farm }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/v1/farms/:farmId
   */
  async updateFarm(req, res, next) {
    try {
      const farm = await farmService.updateFarm(
        req.params.farmId, 
        req.user.userId, 
        req.body
      );

      res.status(200).json({
        status: 'success',
        message: 'Farm updated successfully',
        data: { farm }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/v1/farms/:farmId
   */
  async deleteFarm(req, res, next) {
    try {
      const result = await farmService.deleteFarm(req.params.farmId, req.user.userId);

      res.status(200).json({
        status: 'success',
        ...result
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/farms/:farmId/dashboard
   */
  async getDashboard(req, res, next) {
    try {
      const dashboard = await farmService.getFarmDashboard(
        req.params.farmId, 
        req.user.userId
      );

      res.status(200).json({
        status: 'success',
        data: dashboard
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new FarmController();