const express = require('express');
const router = express.Router();
const deviceController = require('../controllers/device.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { prisma } = require('../config/database');

// All routes require authentication
router.use(authenticate);

// Control actuator
router.put('/:actuatorId/control', deviceController.controlActuator);

/**
 * DELETE /api/v1/actuators/:actuatorId
 * Delete an actuator
 */
router.delete('/:actuatorId', async (req, res, next) => {
  try {
    const { actuatorId } = req.params;

    // Find actuator with device info
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

    // Verify ownership
    if (actuator.device.farm.userId !== req.user.userId) {
      return res.status(403).json({
        status: 'error',
        message: 'Access denied'
      });
    }

    // Delete actuator
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