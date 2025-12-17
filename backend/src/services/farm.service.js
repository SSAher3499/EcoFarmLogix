const { prisma } = require("../config/database");

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
        farmType: farmData.farmType || "POLYHOUSE",
        timezone: farmData.timezone || "Asia/Kolkata",
      },
      include: {
        devices: true,
        owner: {
          select: {
            id: true,
            email: true,
            fullName: true,
          },
        },
      },
    });

    return farm;
  }

  /**
   * Get ALL farms (Super Admin only)
   */
  async getAllFarms() {
    const farms = await prisma.farm.findMany({
      where: {
        isActive: true,
      },
      include: {
        owner: {
          select: {
            id: true,
            email: true,
            fullName: true,
            phone: true,
          },
        },
        devices: {
          select: {
            id: true,
            macAddress: true,
            deviceName: true,
            deviceType: true,
            isOnline: true,
            lastSeenAt: true,
          },
        },
        _count: {
          select: {
            devices: true,
            alerts: true,
            farmUsers: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return farms;
  }

  /**
   * Get farms for a user (owned + assigned via FarmUser)
   */
  async getUserFarms(userId) {
    // Get owned farms
    const ownedFarms = await prisma.farm.findMany({
      where: {
        userId,
        isActive: true,
      },
      include: {
        owner: {
          select: {
            id: true,
            email: true,
            fullName: true,
          },
        },
        devices: {
          select: {
            id: true,
            macAddress: true,
            deviceName: true,
            deviceType: true,
            isOnline: true,
            lastSeenAt: true,
          },
        },
        _count: {
          select: {
            devices: true,
            alerts: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Get assigned farms via FarmUser
    const assignedFarmUsers = await prisma.farmUser.findMany({
      where: {
        userId,
        isActive: true,
      },
      include: {
        farm: {
          include: {
            owner: {
              select: {
                id: true,
                email: true,
                fullName: true,
              },
            },
            devices: {
              select: {
                id: true,
                macAddress: true,
                deviceName: true,
                deviceType: true,
                isOnline: true,
                lastSeenAt: true,
              },
            },
            _count: {
              select: {
                devices: true,
                alerts: true,
              },
            },
          },
        },
      },
    });

    // Combine and mark role
    const assignedFarms = assignedFarmUsers
      .filter((fu) => fu.farm.isActive)
      .map((fu) => ({
        ...fu.farm,
        userRole: fu.role, // Add user's role for this farm
      }));

    // Mark owned farms with OWNER role
    const ownedWithRole = ownedFarms.map((farm) => ({
      ...farm,
      userRole: "OWNER",
    }));

    // Combine, removing duplicates (prefer owned)
    const ownedIds = new Set(ownedFarms.map((f) => f.id));
    const uniqueAssigned = assignedFarms.filter((f) => !ownedIds.has(f.id));

    return [...ownedWithRole, ...uniqueAssigned];
  }

  /**
   * Get single farm by ID
   * If userId is null, skip ownership check (Super Admin)
   */
  async getFarmById(farmId, userId = null) {
    // First, just get the farm
    const farm = await prisma.farm.findUnique({
      where: { id: farmId },
      include: {
        owner: {
          select: {
            id: true,
            email: true,
            fullName: true,
            phone: true,
          },
        },
        devices: {
          include: {
            sensors: true,
            actuators: true,
          },
        },
        farmUsers: {
          where: { isActive: true },
          include: {
            user: {
              select: {
                id: true,
                email: true,
                fullName: true,
              },
            },
          },
        },
        _count: {
          select: {
            devices: true,
            alerts: true,
            automationRules: true,
            farmUsers: true,
          },
        },
      },
    });

    if (!farm) {
      throw { status: 404, message: "Farm not found" };
    }

    // If userId is null (Super Admin), return farm with SUPER_ADMIN role
    if (userId === null) {
      farm.userRole = "SUPER_ADMIN";
      return farm;
    }

    // Check if user is owner
    if (farm.userId === userId) {
      farm.userRole = "OWNER";
      return farm;
    }

    // Check if user has FarmUser access
    const farmUser = await prisma.farmUser.findUnique({
      where: {
        farmId_userId: { farmId, userId },
      },
    });

    if (farmUser && farmUser.isActive) {
      farm.userRole = farmUser.role;
      return farm;
    }

    // User has no access
    throw { status: 404, message: "Farm not found" };
  }

  /**
   * Update farm
   * If userId is null, skip ownership check (Super Admin)
   */
  async updateFarm(farmId, userId = null, updateData) {
    // First get the farm (this also checks access)
    const farm = await prisma.farm.findUnique({
      where: { id: farmId },
    });

    if (!farm) {
      throw { status: 404, message: "Farm not found" };
    }

    // If not Super Admin, check ownership
    if (userId !== null && farm.userId !== userId) {
      throw { status: 404, message: "Farm not found" };
    }

    const updatedFarm = await prisma.farm.update({
      where: { id: farmId },
      data: updateData,
      include: {
        devices: true,
        owner: {
          select: {
            id: true,
            email: true,
            fullName: true,
          },
        },
      },
    });

    return updatedFarm;
  }

  /**
   * Delete farm (soft delete)
   * If userId is null, skip ownership check (Super Admin)
   */
  async deleteFarm(farmId, userId = null) {
    const farm = await prisma.farm.findUnique({
      where: { id: farmId },
    });

    if (!farm) {
      throw { status: 404, message: "Farm not found" };
    }

    // If not Super Admin, check ownership
    if (userId !== null && farm.userId !== userId) {
      throw { status: 404, message: "Farm not found" };
    }

    // Soft delete
    await prisma.farm.update({
      where: { id: farmId },
      data: { isActive: false },
    });

    return { message: "Farm deleted successfully" };
  }

  /**
   * Get farm dashboard summary
   * If userId is null, skip ownership check (Super Admin)
   */
  async getFarmDashboard(farmId, userId = null) {
    // First check access and get farm
    const farm = await this.getFarmById(farmId, userId);

    // Get devices with sensors and actuators
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
            isActive: true,
          },
        },
        actuators: {
          select: {
            id: true,
            actuatorType: true,
            actuatorName: true,
            currentState: true,
            lastActionAt: true,
            isActive: true,
            gpioPin: true,
          },
        },
      },
    });

    // Get recent alerts
    const recentAlerts = await prisma.alert.findMany({
      where: { farmId },
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    // Count online devices
    const onlineDevices = devices.filter((d) => d.isOnline).length;
    const totalDevices = devices.length;

    return {
      farm: {
        id: farm.id,
        name: farm.name,
        farmType: farm.farmType,
        location: farm.locationAddress,
        owner: farm.owner,
        userRole: farm.userRole,
      },
      stats: {
        totalDevices,
        onlineDevices,
        offlineDevices: totalDevices - onlineDevices,
        totalSensors: devices.reduce((acc, d) => acc + d.sensors.length, 0),
        totalActuators: devices.reduce((acc, d) => acc + d.actuators.length, 0),
        teamMembers: farm._count?.farmUsers || 0,
      },
      devices,
      recentAlerts,
    };
  }
}

module.exports = new FarmService();
