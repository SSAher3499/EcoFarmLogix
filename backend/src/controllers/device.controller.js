const deviceService = require('../services/device.service');

class DeviceController {
  
  /**
   * POST /api/v1/farms/:farmId/devices
   * Register new device by MAC address
   */
  async registerDevice(req, res, next) {
    try {
      const device = await deviceService.registerDevice(
        req.params.farmId,
        req.user.userId,
        req.body
      );

      res.status(201).json({
        status: 'success',
        message: 'Device registered successfully',
        data: { device }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/farms/:farmId/devices
   */
  async getDevices(req, res, next) {
    try {
      const devices = await deviceService.getFarmDevices(
        req.params.farmId,
        req.user.userId
      );

      res.status(200).json({
        status: 'success',
        data: { 
          devices,
          count: devices.length 
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/devices/:deviceId
   */
  async getDevice(req, res, next) {
    try {
      const device = await deviceService.getDeviceById(
        req.params.deviceId,
        req.user.userId
      );

      res.status(200).json({
        status: 'success',
        data: { device }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/v1/devices/:deviceId
   */
  async updateDevice(req, res, next) {
    try {
      const device = await deviceService.updateDevice(
        req.params.deviceId,
        req.user.userId,
        req.body
      );

      res.status(200).json({
        status: 'success',
        message: 'Device updated successfully',
        data: { device }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/v1/devices/:deviceId
   */
  async deleteDevice(req, res, next) {
    try {
      const result = await deviceService.deleteDevice(
        req.params.deviceId,
        req.user.userId
      );

      res.status(200).json({
        status: 'success',
        ...result
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/devices/:deviceId/sensors
   * Add sensor to device
   */
  async addSensor(req, res, next) {
    try {
      const sensor = await deviceService.addSensor(
        req.params.deviceId,
        req.user.userId,
        req.body
      );

      res.status(201).json({
        status: 'success',
        message: 'Sensor added successfully',
        data: { sensor }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/devices/:deviceId/actuators
   * Add actuator to device
   */
  async addActuator(req, res, next) {
    try {
      const actuator = await deviceService.addActuator(
        req.params.deviceId,
        req.user.userId,
        req.body
      );

      res.status(201).json({
        status: 'success',
        message: 'Actuator added successfully',
        data: { actuator }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/v1/actuators/:actuatorId/control
   * Control actuator (turn ON/OFF)
   */
  async controlActuator(req, res, next) {
    try {
      const { state } = req.body;
      
      if (!state || !['ON', 'OFF'].includes(state.toUpperCase())) {
        return res.status(400).json({
          status: 'error',
          message: 'Invalid state. Use ON or OFF'
        });
      }

      const actuator = await deviceService.updateActuatorState(
        req.params.actuatorId,
        state.toUpperCase(),
        req.user.userId
      );

      res.status(200).json({
        status: 'success',
        message: `Actuator turned ${state.toUpperCase()}`,
        data: { actuator }
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new DeviceController();