const { prisma } = require('../config/database');

class NotificationController {
  /**
   * GET /api/v1/notifications
   * Get user's notifications with pagination
   */
  async getNotifications(req, res, next) {
    try {
      const userId = req.user.userId;
      const { page = 1, limit = 20, unreadOnly = false } = req.query;
      const skip = (parseInt(page) - 1) * parseInt(limit);

      const where = { userId };
      if (unreadOnly === 'true') {
        where.isRead = false;
      }

      const [notifications, total] = await Promise.all([
        prisma.notification.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          skip,
          take: parseInt(limit),
          include: {
            farm: {
              select: { id: true, name: true }
            }
          }
        }),
        prisma.notification.count({ where })
      ]);

      res.status(200).json({
        status: 'success',
        data: {
          notifications,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / parseInt(limit))
          }
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/notifications/unread-count
   * Get unread count
   */
  async getUnreadCount(req, res, next) {
    try {
      const count = await prisma.notification.count({
        where: {
          userId: req.user.userId,
          isRead: false
        }
      });

      res.status(200).json({
        status: 'success',
        data: { count }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/v1/notifications/:notificationId/read
   * Mark single notification as read
   */
  async markAsRead(req, res, next) {
    try {
      const { notificationId } = req.params;
      const userId = req.user.userId;

      await prisma.notification.updateMany({
        where: {
          id: notificationId,
          userId
        },
        data: { isRead: true }
      });

      res.status(200).json({
        status: 'success',
        message: 'Notification marked as read'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/v1/notifications/read-all
   * Mark all as read
   */
  async markAllAsRead(req, res, next) {
    try {
      await prisma.notification.updateMany({
        where: {
          userId: req.user.userId,
          isRead: false
        },
        data: { isRead: true }
      });

      res.status(200).json({
        status: 'success',
        message: 'All notifications marked as read'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/v1/notifications/:notificationId
   * Delete single notification
   */
  async deleteNotification(req, res, next) {
    try {
      const { notificationId } = req.params;

      await prisma.notification.deleteMany({
        where: {
          id: notificationId,
          userId: req.user.userId
        }
      });

      res.status(200).json({
        status: 'success',
        message: 'Notification deleted'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/v1/notifications
   * Clear all notifications
   */
  async clearAll(req, res, next) {
    try {
      await prisma.notification.deleteMany({
        where: { userId: req.user.userId }
      });

      res.status(200).json({
        status: 'success',
        message: 'All notifications cleared'
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new NotificationController();
