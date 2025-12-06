const { prisma } = require('../config/database');

class FarmService {
  
  /**
   * Create a new farm
   */
  async createFarm(userId, farmData) {
    const farm = await prisma.farm.create({
      data: {
        userId,
        name: farmData.name,
        locationAddress: farmData.locationAddress,
        latitude: farmData.latitude,
        longitude: farmData.longitude,
        areaSqft: farmData.areaSqft,
        farmType: farmData.farmType || 'POLYHOUSE',
        timezone: farmData.timezone || 'Asia/Kolkata'
      },
      include: {
        devices: true
      }
    });

    return farm;
  }

  /**
   * Get all farms for a user
   */
  async getUserFarms(userId) {
    const farms = await prisma.farm.findMany({
      where: { 
        userId,
        isActive: true 
      },
      include: {
        devices: {
          select: {
            id: true,
            macAddress: true,
            deviceName: true,
            deviceType: true,
            isOnline: true,
            lastSeenAt: true
          }
        },
        _count: {
          select: {
            devices: true,
            alerts: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return farms;
  }

  /**
   * Get single farm by ID
   */
  async getFarmById(farmId, userId) {
    const farm = await prisma.farm.findFirst({
      where: { 
        id: farmId,
        userId 
      },
      include: {
        devices: {
          include: {
            sensors: true,
            actuators: true
          }
        },
        _count: {
          select: {
            devices: true,
            alerts: true,
            automationRules: true
          }
        }
      }
    });

    if (!farm) {
      throw { status: 404, message: 'Farm not found' };
    }

    return farm;
  }

  /**
   * Update farm
   */
  async updateFarm(farmId, userId, updateData) {
    // Check if farm exists and belongs to user
    const existingFarm = await prisma.farm.findFirst({
      where: { id: farmId, userId }
    });

    if (!existingFarm) {
      throw { status: 404, message: 'Farm not found' };
    }

    const farm = await prisma.farm.update({
      where: { id: farmId },
      data: updateData,
      include: {
        devices: true
      }
    });

    return farm;
  }

  /**
   * Delete farm (soft delete)
   */
  async deleteFarm(farmId, userId) {
    // Check if farm exists and belongs to user
    const existingFarm = await prisma.farm.findFirst({
      where: { id: farmId, userId }
    });

    if (!existingFarm) {
      throw { status: 404, message: 'Farm not found' };
    }

    // Soft delete - just mark as inactive
    await prisma.farm.update({
      where: { id: farmId },
      data: { isActive: false }
    });

    return { message: 'Farm deleted successfully' };
  }

  /**
   * Get farm dashboard summary
   */
  async getFarmDashboard(farmId, userId) {
    const farm = await this.getFarmById(farmId, userId);

    // Get latest sensor readings
    const devices = await prisma.device.findMany({
      where: { farmId },
      include: {
        sensors: {
          select: {
            id: true,
            sensorType: true,
            sensorName: true,
            unit: true,
            lastReading: true,
            lastReadingAt: true,
            minThreshold: true,
            maxThreshold: true,
            isActive: true
          }
        },
        actuators: {
          select: {
            id: true,
            actuatorType: true,
            actuatorName: true,
            currentState: true,
            lastActionAt: true,
            isActive: true
          }
        }
      }
    });

    // Get recent alerts
    const recentAlerts = await prisma.alert.findMany({
      where: { farmId },
      orderBy: { createdAt: 'desc' },
      take: 10
    });

    // Count online devices
    const onlineDevices = devices.filter(d => d.isOnline).length;
    const totalDevices = devices.length;

    return {
      farm: {
        id: farm.id,
        name: farm.name,
        farmType: farm.farmType,
        location: farm.locationAddress
      },
      stats: {
        totalDevices,
        onlineDevices,
        offlineDevices: totalDevices - onlineDevices,
        totalSensors: devices.reduce((acc, d) => acc + d.sensors.length, 0),
        totalActuators: devices.reduce((acc, d) => acc + d.actuators.length, 0)
      },
      devices,
      recentAlerts
    };
  }
}

module.exports = new FarmService();