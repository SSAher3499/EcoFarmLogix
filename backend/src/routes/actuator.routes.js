const express = require('express');
const router = express.Router();
const deviceController = require('../controllers/device.controller');
const { authenticate, superAdminOnly } = require('../middleware/auth.middleware');
const { prisma } = require('../config/database');

// All routes require authentication
router.use(authenticate);

/**
 * PUT /api/v1/actuators/:actuatorId/control
 * Control actuator - requires OPERATOR role or higher
 */
router.put('/:actuatorId/control', async (req, res, next) => {
  try {
    const { actuatorId } = req.params;

    // Get actuator with farm info
    const actuator = await prisma.actuator.findUnique({
      where: { id: actuatorId },
      include: {
        device: {
          include: { farm: true }
        }
      }
    });

    if (!actuator) {
      return res.status(404).json({
        status: 'error',
        message: 'Actuator not found'
      });
    }

    // Super Admin can control any actuator
    if (req.user.role !== 'SUPER_ADMIN') {
      const farmId = actuator.device.farm.id;
      const isOwner = actuator.device.farm.userId === req.user.userId;

      if (!isOwner) {
        // Check FarmUser access
        const farmUser = await prisma.farmUser.findUnique({
          where: {
            farmId_userId: { farmId, userId: req.user.userId }
          }
        });

        if (!farmUser || !farmUser.isActive) {
          return res.status(403).json({
            status: 'error',
            message: 'Access denied'
          });
        }

        // Check if role allows control (VIEWER cannot control)
        if (farmUser.role === 'VIEWER') {
          return res.status(403).json({
            status: 'error',
            message: 'Viewers cannot control actuators'
          });
        }
      }
    }

    // Proceed with control
    deviceController.controlActuator(req, res, next);
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/v1/actuators/:actuatorId
 * Delete an actuator - Super Admin only
 */
router.delete('/:actuatorId', superAdminOnly, async (req, res, next) => {
  try {
    const { actuatorId } = req.params;

    const actuator = await prisma.actuator.findUnique({
      where: { id: actuatorId }
    });

    if (!actuator) {
      return res.status(404).json({
        status: 'error',
        message: 'Actuator not found'
      });
    }

    await prisma.actuator.delete({
      where: { id: actuatorId }
    });

    res.status(200).json({
      status: 'success',
      message: 'Actuator deleted successfully'
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;