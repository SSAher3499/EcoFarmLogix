const farmService = require('../services/farm.service');

class FarmController {
  
  /**
   * POST /api/v1/farms
   * Super Admin creates farm and assigns to a user
   */
  async createFarm(req, res, next) {
    try {
      // Super Admin can specify userId, otherwise use their own
      const ownerId = req.body.userId || req.user.userId;
      
      const farm = await farmService.createFarm(ownerId, req.body);

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
   * Super Admin sees all farms, others see their own + assigned farms
   */
  async getFarms(req, res, next) {
    try {
      const userRole = req.user.role;
      const userId = req.user.userId;
      
      let farms;
      
      if (userRole === 'SUPER_ADMIN') {
        // Super Admin sees all farms
        farms = await farmService.getAllFarms();
      } else {
        // Others see owned + assigned farms
        farms = await farmService.getUserFarms(userId);
      }

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
      // If Super Admin, don't check ownership
      const userId = req.user.role === 'SUPER_ADMIN' ? null : req.user.userId;
      
      const farm = await farmService.getFarmById(req.params.farmId, userId);

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
      // If Super Admin, don't check ownership
      const userId = req.user.role === 'SUPER_ADMIN' ? null : req.user.userId;
      
      const farm = await farmService.updateFarm(
        req.params.farmId, 
        userId, 
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
   * Super Admin only
   */
  async deleteFarm(req, res, next) {
    try {
      const result = await farmService.deleteFarm(req.params.farmId, null);

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
      // If Super Admin, don't check ownership
      const userId = req.user.role === 'SUPER_ADMIN' ? null : req.user.userId;
      
      const dashboard = await farmService.getFarmDashboard(
        req.params.farmId, 
        userId
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