const express = require('express');
const router = express.Router();
const { prisma } = require('../config/database');
const { authenticate, superAdminOnly } = require('../middleware/auth.middleware');

router.use(authenticate);

/**
 * GET /api/v1/devices/:deviceId/serial-config
 * Get serial port configuration for a device
 */
router.get('/devices/:deviceId/serial-config', async (req, res, next) => {
  try {
    const { deviceId } = req.params;

    let config = await prisma.serialConfig.findUnique({
      where: { deviceId }
    });

    // Return defaults if no config exists
    if (!config) {
      config = {
        deviceId,
        portName: '/dev/ttyUSB0',
        baudRate: 9600,
        dataBits: 8,
        parity: 'none',
        stopBits: 1,
        timeout: 1000,
        retries: 3,
        pollInterval: 5000
      };
    }

    res.json({
      status: 'success',
      data: { config }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/v1/devices/:deviceId/serial-config
 * Update serial port configuration (Super Admin only)
 */
router.put('/devices/:deviceId/serial-config', superAdminOnly, async (req, res, next) => {
  try {
    const { deviceId } = req.params;
    const {
      portName,
      baudRate,
      dataBits,
      parity,
      stopBits,
      timeout,
      retries,
      pollInterval
    } = req.body;

    // Check if device exists
    const device = await prisma.device.findUnique({
      where: { id: deviceId }
    });

    if (!device) {
      return res.status(404).json({
        status: 'error',
        message: 'Device not found'
      });
    }

    // Upsert config
    const config = await prisma.serialConfig.upsert({
      where: { deviceId },
      update: {
        portName,
        baudRate,
        dataBits,
        parity,
        stopBits,
        timeout,
        retries,
        pollInterval
      },
      create: {
        deviceId,
        portName: portName || '/dev/ttyUSB0',
        baudRate: baudRate || 9600,
        dataBits: dataBits || 8,
        parity: parity || 'none',
        stopBits: stopBits || 1,
        timeout: timeout || 1000,
        retries: retries || 3,
        pollInterval: pollInterval || 5000
      }
    });

    res.json({
      status: 'success',
      message: 'Serial configuration updated',
      data: { config }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v1/devices/:deviceId/available-ports
 * Get list of available serial ports (for Pi to report)
 */
router.get('/devices/:deviceId/available-ports', async (req, res, next) => {
  try {
    // This would be populated by the Pi reporting its available ports
    const commonPorts = [
      { path: '/dev/ttyUSB0', description: 'USB Serial Port 0' },
      { path: '/dev/ttyUSB1', description: 'USB Serial Port 1' },
      { path: '/dev/ttyAMA0', description: 'Hardware UART' },
      { path: '/dev/ttyS0', description: 'Mini UART' },
      { path: '/dev/serial0', description: 'Primary UART' }
    ];

    res.json({
      status: 'success',
      data: { ports: commonPorts }
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;