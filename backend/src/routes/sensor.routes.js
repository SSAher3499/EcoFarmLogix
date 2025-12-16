const express = require('express');
const router = express.Router();
const { authenticate, superAdminOnly } = require('../middleware/auth.middleware');
const { getLatestReadings, querySensorData } = require('../config/influxdb');
const { prisma } = require('../config/database');

router.use(authenticate);

/**
 * GET /api/v1/sensors/:sensorId/readings
 * Get sensor readings history
 */
router.get('/:sensorId/readings', async (req, res, next) => {
  try {
    const { sensorId } = req.params;
    const { start = '-24h', end = 'now()' } = req.query;

    // Verify sensor access
    const sensor = await prisma.sensor.findUnique({
      where: { id: sensorId },
      include: {
        device: {
          include: { farm: true }
        }
      }
    });

    if (!sensor) {
      return res.status(404).json({
        status: 'error',
        message: 'Sensor not found'
      });
    }

    // Super Admin can access any sensor
    if (req.user.role !== 'SUPER_ADMIN') {
      // Check if user is farm owner
      if (sensor.device.farm.userId !== req.user.userId) {
        // Check if user has farm access via FarmUser
        const farmUser = await prisma.farmUser.findUnique({
          where: {
            farmId_userId: { 
              farmId: sensor.device.farm.id, 
              userId: req.user.userId 
            }
          }
        });

        if (!farmUser || !farmUser.isActive) {
          return res.status(403).json({
            status: 'error',
            message: 'Access denied'
          });
        }
      }
    }

    // Query InfluxDB
    const readings = await querySensorData(
      sensor.device.farmId,
      sensorId,
      start,
      end
    );

    res.status(200).json({
      status: 'success',
      data: {
        sensor: {
          id: sensor.id,
          name: sensor.sensorName,
          type: sensor.sensorType,
          unit: sensor.unit
        },
        readings,
        count: readings.length
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v1/farms/:farmId/sensors/latest
 * Get latest readings for all sensors in a farm
 */
router.get('/farm/:farmId/latest', async (req, res, next) => {
  try {
    const { farmId } = req.params;

    // Super Admin can access any farm
    if (req.user.role !== 'SUPER_ADMIN') {
      // Verify farm access
      const farm = await prisma.farm.findFirst({
        where: { id: farmId, userId: req.user.userId }
      });

      if (!farm) {
        // Check FarmUser access
        const farmUser = await prisma.farmUser.findUnique({
          where: {
            farmId_userId: { farmId, userId: req.user.userId }
          }
        });

        if (!farmUser || !farmUser.isActive) {
          return res.status(404).json({
            status: 'error',
            message: 'Farm not found'
          });
        }
      }
    }

    // Get latest readings from InfluxDB
    const readings = await getLatestReadings(farmId);

    res.status(200).json({
      status: 'success',
      data: { readings }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/v1/sensors/:sensorId
 * Delete a sensor - Super Admin only
 */
router.delete('/:sensorId', superAdminOnly, async (req, res, next) => {
  try {
    const { sensorId } = req.params;

    const sensor = await prisma.sensor.findUnique({
      where: { id: sensorId }
    });

    if (!sensor) {
      return res.status(404).json({
        status: 'error',
        message: 'Sensor not found'
      });
    }

    await prisma.sensor.delete({
      where: { id: sensorId }
    });

    res.status(200).json({
      status: 'success',
      message: 'Sensor deleted successfully'
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;