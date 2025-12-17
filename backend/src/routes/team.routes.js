const express = require('express');
const router = express.Router();
const { prisma } = require('../config/database');
const { hashPassword } = require('../utils/password');
const { authenticate } = require('../middleware/auth.middleware');

// All routes require authentication
router.use(authenticate);

/**
 * Middleware to check team management permissions
 */
const checkTeamPermission = (action) => {
  return async (req, res, next) => {
    try {
      const { farmId } = req.params;

      // Super Admin can do anything
      if (req.user.role === 'SUPER_ADMIN') {
        return next();
      }

      // Check if user is farm owner
      const farm = await prisma.farm.findFirst({
        where: { id: farmId, userId: req.user.userId }
      });

      if (farm) {
        // Farm owner can do everything
        return next();
      }

      // Check FarmUser access
      const farmUser = await prisma.farmUser.findUnique({
        where: {
          farmId_userId: { farmId, userId: req.user.userId }
        }
      });

      if (!farmUser || !farmUser.isActive) {
        return res.status(403).json({ status: 'error', message: 'Access denied' });
      }

      // Check permissions based on role and action
      const permissions = {
        MANAGER: ['view'],
        OPERATOR: [],
        VIEWER: []
      };

      const allowedActions = permissions[farmUser.role] || [];

      if (!allowedActions.includes(action)) {
        return res.status(403).json({ 
          status: 'error', 
          message: `You don't have permission to ${action} team members` 
        });
      }

      next();
    } catch (error) {
      console.error('Team permission check error:', error);
      return res.status(500).json({ status: 'error', message: 'Permission check failed' });
    }
  };
};

/**
 * GET /api/v1/farms/:farmId/team
 * Get team members for a farm
 */
router.get('/farms/:farmId/team', checkTeamPermission('view'), async (req, res, next) => {
  try {
    const { farmId } = req.params;

    // Get farm with owner
    const farm = await prisma.farm.findUnique({
      where: { id: farmId },
      select: {
        id: true,
        name: true,
        owner: {
          select: {
            id: true,
            email: true,
            fullName: true,
            phone: true
          }
        }
      }
    });

    if (!farm) {
      return res.status(404).json({ status: 'error', message: 'Farm not found' });
    }

    // Get team members
    const teamMembers = await prisma.farmUser.findMany({
      where: { farmId, isActive: true },
      select: {
        id: true,
        role: true,
        invitedAt: true,
        user: {
          select: {
            id: true,
            email: true,
            fullName: true,
            phone: true,
            lastLoginAt: true
          }
        }
      },
      orderBy: { invitedAt: 'desc' }
    });

    res.json({
      status: 'success',
      data: {
        farm: {
          id: farm.id,
          name: farm.name
        },
        owner: farm.owner,
        teamMembers: teamMembers.map(tm => ({
          id: tm.id,
          role: tm.role,
          invitedAt: tm.invitedAt,
          ...tm.user
        })),
        count: teamMembers.length
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/v1/farms/:farmId/team
 * Add team member to farm (creates user if doesn't exist)
 * Only SUPER_ADMIN and Farm OWNER can add members
 */
router.post('/farms/:farmId/team', checkTeamPermission('invite'), async (req, res, next) => {
  try {
    const { farmId } = req.params;
    const { email, fullName, phone, role, password } = req.body;

    // Validate
    if (!email || !role) {
      return res.status(400).json({
        status: 'error',
        message: 'Email and role are required'
      });
    }

    // Validate role
    const validRoles = ['MANAGER', 'OPERATOR', 'VIEWER'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid role. Must be MANAGER, OPERATOR, or VIEWER'
      });
    }

    // Check if user exists
    let user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    });

    // Create user if doesn't exist
    if (!user) {
      if (!fullName || !password) {
        return res.status(400).json({
          status: 'error',
          message: 'Full name and password required for new user'
        });
      }

      const passwordHash = await hashPassword(password);

      user = await prisma.user.create({
        data: {
          email: email.toLowerCase(),
          passwordHash,
          fullName,
          phone,
          role: 'FARM_OWNER',
          createdById: req.user.userId
        }
      });
    }

    // Check if already a team member
    const existingMember = await prisma.farmUser.findUnique({
      where: {
        farmId_userId: { farmId, userId: user.id }
      }
    });

    if (existingMember) {
      if (!existingMember.isActive) {
        await prisma.farmUser.update({
          where: { id: existingMember.id },
          data: { isActive: true, role }
        });

        return res.json({
          status: 'success',
          message: 'Team member reactivated'
        });
      }

      return res.status(409).json({
        status: 'error',
        message: 'User is already a team member'
      });
    }

    // Add to farm
    const farmUser = await prisma.farmUser.create({
      data: {
        farmId,
        userId: user.id,
        role,
        invitedById: req.user.userId
      },
      select: {
        id: true,
        role: true,
        user: {
          select: {
            id: true,
            email: true,
            fullName: true
          }
        }
      }
    });

    res.status(201).json({
      status: 'success',
      message: 'Team member added successfully',
      data: { teamMember: farmUser }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/v1/farms/:farmId/team/:memberId
 * Update team member role
 * Only SUPER_ADMIN and Farm OWNER can update
 */
router.put('/farms/:farmId/team/:memberId', checkTeamPermission('invite'), async (req, res, next) => {
  try {
    const { memberId } = req.params;
    const { role } = req.body;

    // Validate role
    const validRoles = ['MANAGER', 'OPERATOR', 'VIEWER'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid role. Must be MANAGER, OPERATOR, or VIEWER'
      });
    }

    const farmUser = await prisma.farmUser.update({
      where: { id: memberId },
      data: { role },
      select: {
        id: true,
        role: true,
        user: {
          select: {
            id: true,
            email: true,
            fullName: true
          }
        }
      }
    });

    res.json({
      status: 'success',
      message: 'Team member role updated',
      data: { teamMember: farmUser }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/v1/farms/:farmId/team/:memberId
 * Remove team member from farm
 * Only SUPER_ADMIN and Farm OWNER can remove
 */
router.delete('/farms/:farmId/team/:memberId', checkTeamPermission('invite'), async (req, res, next) => {
  try {
    const { memberId } = req.params;

    await prisma.farmUser.update({
      where: { id: memberId },
      data: { isActive: false }
    });

    res.json({
      status: 'success',
      message: 'Team member removed successfully'
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;