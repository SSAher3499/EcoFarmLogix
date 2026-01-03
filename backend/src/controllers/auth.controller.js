const authService = require('../services/auth.service');
const { prisma } = require('../config/database');
const bcrypt = require('bcryptjs');

class AuthController {
  
  /**
   * POST /api/v1/auth/register
   * Register a new user
   */
  async register(req, res, next) {
    try {
      const { email, password, fullName, phone } = req.body;
      
      const result = await authService.register({ 
        email, 
        password, 
        fullName, 
        phone 
      });

      res.status(201).json({
        status: 'success',
        message: 'User registered successfully',
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/auth/login
   * Login user
   */
  async login(req, res, next) {
    try {
      const { email, password } = req.body;
      
      const result = await authService.login({ email, password });

      res.status(200).json({
        status: 'success',
        message: 'Login successful',
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/auth/refresh-token
   * Refresh access token
   */
  async refreshToken(req, res, next) {
    try {
      const { refreshToken } = req.body;
      
      const result = await authService.refreshToken(refreshToken);

      res.status(200).json({
        status: 'success',
        message: 'Token refreshed successfully',
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/auth/logout
   * Logout user
   */
  async logout(req, res, next) {
    try {
      const { refreshToken } = req.body;
      
      const result = await authService.logout(refreshToken);

      res.status(200).json({
        status: 'success',
        ...result
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/auth/logout-all
   * Logout from all devices
   */
  async logoutAll(req, res, next) {
    try {
      const result = await authService.logoutAll(req.user.userId);

      res.status(200).json({
        status: 'success',
        ...result
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/auth/me
   * Get current user profile
   */
  async getMe(req, res, next) {
    try {
      const user = await authService.getUserById(req.user.userId);

      res.status(200).json({
        status: 'success',
        data: { user }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/auth/change-password
   * Change password for logged-in user
   */
  async changePassword(req, res, next) {
    try {
      const { currentPassword, newPassword } = req.body;
      const userId = req.user.userId;

      if (!currentPassword || !newPassword) {
        return res.status(400).json({
          status: 'error',
          message: 'Current password and new password are required'
        });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({
          status: 'error',
          message: 'New password must be at least 6 characters'
        });
      }

      // Get user
      const user = await prisma.user.findUnique({
        where: { id: userId }
      });

      if (!user) {
        return res.status(404).json({
          status: 'error',
          message: 'User not found'
        });
      }

      // Verify current password
      const isValidPassword = await bcrypt.compare(currentPassword, user.passwordHash);
      if (!isValidPassword) {
        return res.status(400).json({
          status: 'error',
          message: 'Current password is incorrect'
        });
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      // Update password
      await prisma.user.update({
        where: { id: userId },
        data: { passwordHash: hashedPassword }
      });

      res.status(200).json({
        status: 'success',
        message: 'Password changed successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  async forgotPassword(req, res, next) {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({
          status: 'error',
          message: 'Email is required'
        });
      }

      // Find user
      const user = await prisma.user.findUnique({
        where: { email: email.toLowerCase() }
      });

      // Always return success (don't reveal if email exists)
      if (!user) {
        return res.status(200).json({
          status: 'success',
          message: 'If an account with that email exists, a password reset link has been sent.'
        });
      }

      // Generate reset token
      const crypto = require('crypto');
      const resetToken = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      // Delete any existing tokens for this user
      await prisma.passwordResetToken.deleteMany({
        where: { userId: user.id }
      });

      // Save new token
      await prisma.passwordResetToken.create({
        data: {
          userId: user.id,
          token: resetToken,
          expiresAt
        }
      });

      // Send email
      const emailService = require('../services/email.service');
      const emailSent = await emailService.sendPasswordResetEmail(
        user.email,
        resetToken,
        user.fullName
      );

      if (!emailSent) {
        console.error('Failed to send password reset email');
      }

      res.status(200).json({
        status: 'success',
        message: 'If an account with that email exists, a password reset link has been sent.'
      });
    } catch (error) {
      next(error);
    }
  }

  async resetPassword(req, res, next) {
    try {
      const { token, newPassword } = req.body;

      if (!token || !newPassword) {
        return res.status(400).json({
          status: 'error',
          message: 'Token and new password are required'
        });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({
          status: 'error',
          message: 'Password must be at least 6 characters'
        });
      }

      // Find valid token
      const resetToken = await prisma.passwordResetToken.findUnique({
        where: { token },
        include: { user: true }
      });

      if (!resetToken) {
        return res.status(400).json({
          status: 'error',
          message: 'Invalid or expired reset token'
        });
      }

      if (resetToken.used) {
        return res.status(400).json({
          status: 'error',
          message: 'This reset link has already been used'
        });
      }

      if (resetToken.expiresAt < new Date()) {
        return res.status(400).json({
          status: 'error',
          message: 'Reset token has expired. Please request a new one.'
        });
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      // Update password and mark token as used
      await prisma.$transaction([
        prisma.user.update({
          where: { id: resetToken.userId },
          data: { passwordHash: hashedPassword }
        }),
        prisma.passwordResetToken.update({
          where: { id: resetToken.id },
          data: { used: true }
        })
      ]);

      res.status(200).json({
        status: 'success',
        message: 'Password has been reset successfully. You can now login with your new password.'
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AuthController();