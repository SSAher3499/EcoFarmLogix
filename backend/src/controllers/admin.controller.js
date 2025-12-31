const { prisma } = require('../config/database');
const notificationService = require('../services/notification.service');

class AdminController {
  /**
   * GET /api/v1/admin/system-status
   * Get system status
   */
  async getSystemStatus(req, res, next) {
    try {
      // Test database connection
      let dbStatus = 'connected';
      try {
        await prisma.$queryRaw`SELECT 1`;
      } catch (e) {
        dbStatus = 'error: ' + e.message;
      }

      // Get counts
      const [userCount, farmCount, deviceCount, notificationCount] = await Promise.all([
        prisma.user.count(),
        prisma.farm.count(),
        prisma.device.count(),
        prisma.notification.count()
      ]);

      res.json({
        status: 'success',
        data: {
          database: dbStatus,
          mqtt: global.mqttConnected ? 'connected' : 'disconnected',
          serverTime: new Date().toISOString(),
          uptime: process.uptime(),
          nodeVersion: process.version,
          memoryUsage: process.memoryUsage(),
          counts: {
            users: userCount,
            farms: farmCount,
            devices: deviceCount,
            notifications: notificationCount
          }
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/admin/action-logs
   * Get recent action logs
   */
  async getActionLogs(req, res, next) {
    try {
      const { page = 1, limit = 50 } = req.query;
      const skip = (parseInt(page) - 1) * parseInt(limit);

      // Check if ActionLog table exists
      let logs = [];
      let total = 0;

      try {
        [logs, total] = await Promise.all([
          prisma.actionLog.findMany({
            orderBy: { createdAt: 'desc' },
            skip,
            take: parseInt(limit),
            include: {
              user: {
                select: { email: true, fullName: true }
              },
              farm: {
                select: { name: true }
              }
            }
          }),
          prisma.actionLog.count()
        ]);
      } catch (e) {
        // ActionLog table might not exist
        console.log('ActionLog table not found, returning empty array');
      }

      res.json({
        status: 'success',
        data: { logs, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/admin/users-overview
   * Get users overview
   */
  async getUsersOverview(req, res, next) {
    try {
      const users = await prisma.user.findMany({
        select: {
          id: true,
          email: true,
          fullName: true,
          role: true,
          isActive: true,
          createdAt: true,
          lastLoginAt: true,
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
        data: { users, total: users.length }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/admin/devices-overview
   * Get devices overview
   */
  async getDevicesOverview(req, res, next) {
    try {
      const devices = await prisma.device.findMany({
        include: {
          farm: {
            select: { id: true, name: true }
          },
          _count: {
            select: {
              sensors: true,
              actuators: true
            }
          }
        },
        orderBy: { lastSeenAt: 'desc' }
      });

      const online = devices.filter(d => d.isOnline).length;
      const offline = devices.filter(d => !d.isOnline).length;

      res.json({
        status: 'success',
        data: {
          devices,
          total: devices.length,
          online,
          offline
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/admin/notifications-log
   * Get notifications log
   */
  async getNotificationsLog(req, res, next) {
    try {
      const { page = 1, limit = 50 } = req.query;
      const skip = (parseInt(page) - 1) * parseInt(limit);

      const [notifications, total] = await Promise.all([
        prisma.notification.findMany({
          orderBy: { createdAt: 'desc' },
          skip,
          take: parseInt(limit),
          include: {
            user: {
              select: { email: true, fullName: true }
            },
            farm: {
              select: { name: true }
            }
          }
        }),
        prisma.notification.count()
      ]);

      res.json({
        status: 'success',
        data: { notifications, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/admin/test-notification
   * Send test notification
   */
  async sendTestNotification(req, res, next) {
    try {
      const notification = await prisma.notification.create({
        data: {
          userId: req.user.userId,
          type: 'ALERT',
          title: 'Test Notification',
          message: 'This is a test notification from Admin Panel',
          isRead: false
        }
      });

      res.json({
        status: 'success',
        message: 'Test notification sent',
        data: { notification }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/admin/database-stats
   * Get database stats
   */
  async getDatabaseStats(req, res, next) {
    try {
      const stats = await Promise.all([
        prisma.user.count(),
        prisma.farm.count(),
        prisma.device.count(),
        prisma.sensor.count(),
        prisma.actuator.count(),
        prisma.automationRule.count(),
        prisma.schedule.count(),
        prisma.notification.count(),
        prisma.alert.count().catch(() => 0), // Alert table might not exist
      ]);

      // Try to get action log count
      let actionLogCount = 0;
      try {
        actionLogCount = await prisma.actionLog.count();
      } catch (e) {
        // ActionLog table might not exist
      }

      res.json({
        status: 'success',
        data: {
          users: stats[0],
          farms: stats[1],
          devices: stats[2],
          sensors: stats[3],
          actuators: stats[4],
          automationRules: stats[5],
          schedules: stats[6],
          notifications: stats[7],
          alerts: stats[8],
          actionLogs: actionLogCount
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/admin/error-logs
   * Get error logs
   */
  async getErrorLogs(req, res, next) {
    try {
      const errorLogger = require('../utils/errorLogger');
      res.json({
        status: 'success',
        data: { errors: errorLogger.getErrors() }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/v1/admin/error-logs
   * Clear error logs
   */
  async clearErrorLogs(req, res, next) {
    try {
      const errorLogger = require('../utils/errorLogger');
      errorLogger.clear();
      res.json({
        status: 'success',
        message: 'Error logs cleared'
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AdminController();
