const { prisma } = require('../config/database');

class NotificationService {
  /**
   * Create a notification
   */
  async create({ userId, farmId, type, title, message, data }) {
    return prisma.notification.create({
      data: {
        userId,
        farmId,
        type,
        title,
        message,
        data
      }
    });
  }

  /**
   * Create notification for all farm users
   */
  async notifyFarmUsers({ farmId, type, title, message, data }) {
    try {
      // Get farm owner
      const farm = await prisma.farm.findUnique({
        where: { id: farmId },
        select: { userId: true }
      });

      if (!farm) {
        console.warn(`Farm not found: ${farmId}`);
        return;
      }

      // Get farm team members
      const farmUsers = await prisma.farmUser.findMany({
        where: { farmId, isActive: true },
        select: { userId: true }
      });

      // Combine unique user IDs
      const userIds = [...new Set([farm.userId, ...farmUsers.map(fu => fu.userId)])];

      // Create notifications for all users
      const notifications = userIds.map(userId => ({
        userId,
        farmId,
        type,
        title,
        message,
        data
      }));

      return prisma.notification.createMany({ data: notifications });
    } catch (error) {
      console.error('Error creating farm notifications:', error);
    }
  }

  /**
   * Notify about sensor threshold breach
   */
  async notifySensorAlert({ farmId, sensorName, sensorType, value, threshold, condition }) {
    const title = `${sensorName} Alert`;
    const message = `${sensorName} reading (${value}) is ${condition} threshold (${threshold})`;

    return this.notifyFarmUsers({
      farmId,
      type: 'ALERT',
      title,
      message,
      data: { sensorName, sensorType, value, threshold, condition }
    });
  }

  /**
   * Notify about device status change
   */
  async notifyDeviceStatus({ farmId, deviceName, isOnline }) {
    const title = `${deviceName} ${isOnline ? 'Online' : 'Offline'}`;
    const message = `${deviceName} is now ${isOnline ? 'connected' : 'disconnected'}`;

    return this.notifyFarmUsers({
      farmId,
      type: 'DEVICE_STATUS',
      title,
      message,
      data: { deviceName, isOnline }
    });
  }

  /**
   * Notify about automation trigger
   */
  async notifyAutomationTriggered({ farmId, ruleName, actuatorName, action }) {
    const title = `Automation: ${ruleName}`;
    const message = `${actuatorName} turned ${action} by automation rule`;

    return this.notifyFarmUsers({
      farmId,
      type: 'AUTOMATION',
      title,
      message,
      data: { ruleName, actuatorName, action }
    });
  }

  /**
   * Notify about schedule execution
   */
  async notifyScheduleExecuted({ farmId, scheduleName, actuatorName, action }) {
    const title = `Schedule: ${scheduleName}`;
    const message = `${actuatorName} turned ${action} by schedule`;

    return this.notifyFarmUsers({
      farmId,
      type: 'SCHEDULE',
      title,
      message,
      data: { scheduleName, actuatorName, action }
    });
  }
}

module.exports = new NotificationService();
