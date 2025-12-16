const express = require('express');
const router = express.Router();
const { prisma } = require('../config/database');
const { hashPassword } = require('../utils/password');
const { authenticate, superAdminOnly, requirePermission } = require('../middleware/auth.middleware');

// All routes require authentication
router.use(authenticate);

/**
 * GET /api/v1/users
 * Get all users (Super Admin only)
 */
router.get('/', superAdminOnly, async (req, res, next) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        fullName: true,
        phone: true,
        role: true,
        isActive: true,
        lastLoginAt: true,
        createdAt: true,
        ownedFarms: {
          select: {
            id: true,
            name: true
          }
        },
        _count: {
          select: {
            ownedFarms: true,
            farmAccess: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({
      status: 'success',
      data: { users, count: users.length }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v1/users/:userId
 * Get user by ID (Super Admin only)
 */
router.get('/:userId', superAdminOnly, async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.params.userId },
      select: {
        id: true,
        email: true,
        fullName: true,
        phone: true,
        role: true,
        isActive: true,
        lastLoginAt: true,
        createdAt: true,
        ownedFarms: {
          select: {
            id: true,
            name: true,
            farmType: true,
            isActive: true
          }
        },
        farmAccess: {
          select: {
            id: true,
            role: true,
            farm: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      }
    });

    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    res.json({
      status: 'success',
      data: { user }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/v1/users
 * Create new user (Super Admin only)
 */
router.post('/', superAdminOnly, async (req, res, next) => {
  try {
    const { email, password, fullName, phone, role } = req.body;

    // Validate
    if (!email || !password || !fullName) {
      return res.status(400).json({
        status: 'error',
        message: 'Email, password, and full name are required'
      });
    }

    // Check if email exists
    const existing = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    });

    if (existing) {
      return res.status(409).json({
        status: 'error',
        message: 'User with this email already exists'
      });
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create user
    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        passwordHash,
        fullName,
        phone,
        role: role || 'FARM_OWNER',
        createdById: req.user.userId
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        phone: true,
        role: true,
        isActive: true,
        createdAt: true
      }
    });

    res.status(201).json({
      status: 'success',
      message: 'User created successfully',
      data: { user }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/v1/users/:userId
 * Update user (Super Admin only)
 */
router.put('/:userId', superAdminOnly, async (req, res, next) => {
  try {
    const { fullName, phone, role, isActive } = req.body;

    const user = await prisma.user.update({
      where: { id: req.params.userId },
      data: {
        fullName,
        phone,
        role,
        isActive
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        phone: true,
        role: true,
        isActive: true,
        updatedAt: true
      }
    });

    res.json({
      status: 'success',
      message: 'User updated successfully',
      data: { user }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/v1/users/:userId/reset-password
 * Reset user password (Super Admin only)
 */
router.put('/:userId/reset-password', superAdminOnly, async (req, res, next) => {
  try {
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({
        status: 'error',
        message: 'Password must be at least 6 characters'
      });
    }

    const passwordHash = await hashPassword(newPassword);

    await prisma.user.update({
      where: { id: req.params.userId },
      data: { passwordHash }
    });

    // Invalidate all refresh tokens
    await prisma.refreshToken.deleteMany({
      where: { userId: req.params.userId }
    });

    res.json({
      status: 'success',
      message: 'Password reset successfully'
    });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/v1/users/:userId
 * Deactivate user (Super Admin only)
 */
router.delete('/:userId', superAdminOnly, async (req, res, next) => {
  try {
    // Don't allow deleting yourself
    if (req.params.userId === req.user.userId) {
      return res.status(400).json({
        status: 'error',
        message: 'You cannot delete your own account'
      });
    }

    await prisma.user.update({
      where: { id: req.params.userId },
      data: { isActive: false }
    });

    // Invalidate all refresh tokens
    await prisma.refreshToken.deleteMany({
      where: { userId: req.params.userId }
    });

    res.json({
      status: 'success',
      message: 'User deactivated successfully'
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;