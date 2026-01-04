const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { prisma } = require('../config/database');
const {
  validate,
  registerSchema,
  loginSchema,
  refreshTokenSchema
} = require('../validators/auth.validator');

// Public routes
router.post('/register', validate(registerSchema), authController.register);
router.post('/login', validate(loginSchema), authController.login);
router.post('/refresh-token', validate(refreshTokenSchema), authController.refreshToken);
router.post('/logout', authController.logout);

// Password reset routes (public)
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);

// Protected routes (require authentication)
router.get('/me', authenticate, authController.getMe);
router.post('/logout-all', authenticate, authController.logoutAll);
router.post('/change-password', authenticate, authController.changePassword);

// Update own profile
router.put('/profile', authenticate, async (req, res, next) => {
  try {
    const { fullName, phone } = req.body;
    const userId = req.user.userId;

    if (!fullName) {
      return res.status(400).json({
        status: 'error',
        message: 'Full name is required'
      });
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        fullName,
        ...(phone !== undefined && { phone })
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        phone: true,
        role: true
      }
    });

    res.json({
      status: 'success',
      message: 'Profile updated successfully',
      data: { user: updatedUser }
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;