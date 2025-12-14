const { prisma } = require("../config/database");

class DeviceService {
  /**
   * Register a new device to a farm (by MAC address)
   */
  async registerDevice(farmId, userId, deviceData) {
    // Verify farm belongs to user
    const farm = await prisma.farm.findFirst({
      where: { id: farmId, userId },
    });

    if (!farm) {
      throw { status: 404, message: "Farm not found" };
    }

    // Normalize MAC address (uppercase, colons)
    const macAddress = deviceData.macAddress.toUpperCase().replace(/-/g, ":");

    // Check if device with this MAC already exists
    const existingDevice = await prisma.device.findUnique({
      where: { macAddress },
    });

    if (existingDevice) {
      throw {
        status: 409,
        message: "Device with this MAC address already registered",
      };
    }

    // Create device
    const device = await prisma.device.create({
      data: {
        farmId,
        macAddress,
        deviceName: deviceData.deviceName,
        deviceType: deviceData.deviceType,
        firmwareVersion: deviceData.firmwareVersion,
        config: deviceData.config || {},
      },
    });

    return device;
  }

  /**
   * Get all devices for a farm
   */
  async getFarmDevices(farmId, userId) {
    // Verify farm belongs to user
    const farm = await prisma.farm.findFirst({
      where: { id: farmId, userId },
    });

    if (!farm) {
      throw { status: 404, message: "Farm not found" };
    }

    const devices = await prisma.device.findMany({
      where: { farmId },
      include: {
        sensors: true,
        actuators: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return devices;
  }

  /**
   * Get device by ID
   */
  async getDeviceById(deviceId, userId) {
    const device = await prisma.device.findUnique({
      where: { id: deviceId },
      include: {
        farm: true,
        sensors: true,
        actuators: true,
      },
    });

    if (!device) {
      throw { status: 404, message: "Device not found" };
    }

    // Verify ownership
    if (device.farm.userId !== userId) {
      throw { status: 403, message: "Access denied" };
    }

    return device;
  }


  /**
   * Get device by MAC address (public - for edge devices)
   */
  async getDeviceByMacPublic(macAddress) {
    const normalizedMac = macAddress.toUpperCase().replace(/-/g, ":");

    const device = await prisma.device.findUnique({
      where: { macAddress: normalizedMac },
      include: {
        farm: {
          select: {
            id: true,
            name: true,
          },
        },
        sensors: {
          where: { isActive: true },
          select: {
            id: true,
            sensorType: true,
            sensorName: true,
            unit: true,
            lastReading: true,
            minThreshold: true,
            maxThreshold: true,
          },
        },
        actuators: {
          where: { isActive: true },
          select: {
            id: true,
            actuatorType: true,
            actuatorName: true,
            gpioPin: true,
            currentState: true,
          },
        },
      },
    });

    return device;
  }

  /**
   * Update device
   */
  async updateDevice(deviceId, userId, updateData) {
    const device = await this.getDeviceById(deviceId, userId);

    const updatedDevice = await prisma.device.update({
      where: { id: deviceId },
      data: updateData,
      include: {
        sensors: true,
        actuators: true,
      },
    });

    return updatedDevice;
  }

  /**
   * Update device status (called by device/MQTT)
   */
  async updateDeviceStatus(macAddress, status) {
    const normalizedMac = macAddress.toUpperCase().replace(/-/g, ":");

    const device = await prisma.device.update({
      where: { macAddress: normalizedMac },
      data: {
        isOnline: status.isOnline,
        lastSeenAt: new Date(),
        ipAddress: status.ipAddress,
        firmwareVersion: status.firmwareVersion,
      },
    });

    return device;
  }

  /**
   * Delete device
   */
  async deleteDevice(deviceId, userId) {
    await this.getDeviceById(deviceId, userId);

    await prisma.device.delete({
      where: { id: deviceId },
    });

    return { message: "Device deleted successfully" };
  }

  /**
   * Add sensor to device
   */
  async addSensor(deviceId, userId, sensorData) {
    await this.getDeviceById(deviceId, userId);

    const sensor = await prisma.sensor.create({
      data: {
        deviceId,
        sensorType: sensorData.sensorType,
        sensorName: sensorData.sensorName,
        unit: sensorData.unit,
        minThreshold: sensorData.minThreshold,
        maxThreshold: sensorData.maxThreshold,
        calibrationOffset: sensorData.calibrationOffset || 0,
        readingInterval: sensorData.readingInterval || 60,
      },
    });

    return sensor;
  }

  /**
   * Add actuator to device
   */
  async addActuator(deviceId, userId, actuatorData) {
    await this.getDeviceById(deviceId, userId);

    const actuator = await prisma.actuator.create({
      data: {
        deviceId,
        actuatorType: actuatorData.actuatorType,
        actuatorName: actuatorData.actuatorName,
        gpioPin: actuatorData.gpioPin,
        config: actuatorData.config || {},
      },
    });

    return actuator;
  }

  /**
   * Update sensor reading (called by MQTT handler)
   */
  async updateSensorReading(sensorId, value) {
    const sensor = await prisma.sensor.update({
      where: { id: sensorId },
      data: {
        lastReading: value,
        lastReadingAt: new Date(),
      },
    });

    return sensor;
  }

  /**
   * Update actuator state
   */
  async updateActuatorState(actuatorId, state, userId = null) {
    const actuator = await prisma.actuator.update({
      where: { id: actuatorId },
      data: {
        currentState: state,
        lastActionAt: new Date(),
      },
      include: {
        device: {
          include: { farm: true },
        },
      },
    });

    // Log the action
    await prisma.actionLog.create({
      data: {
        farmId: actuator.device.farmId,
        actuatorId: actuatorId,
        userId: userId,
        action: state,
        source: userId ? "MANUAL" : "SYSTEM",
      },
    });

    return actuator;
  }
}

module.exports = new DeviceService();
