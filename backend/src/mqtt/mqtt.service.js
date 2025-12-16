const mqtt = require("mqtt");
const { MQTT_CONFIG, TOPICS } = require("../config/mqtt");
const { prisma } = require("../config/database");
const { writeSensorData } = require("../config/influxdb");
const websocketService = require("../services/websocket.service");
const automationService = require("../services/automation.service");

class MQTTService {
  constructor() {
    this.client = null;
    this.isConnected = false;
  }

  /**
   * Connect to MQTT broker
   */
  connect() {
    return new Promise((resolve, reject) => {
      console.log("📡 Connecting to MQTT broker...");

      this.client = mqtt.connect(MQTT_CONFIG.brokerUrl, MQTT_CONFIG.options);

      this.client.on("connect", () => {
        this.isConnected = true;
        console.log("✅ MQTT connected to broker");

        this.subscribeToTopics();
        resolve(true);
      });

      this.client.on("error", (error) => {
        console.error("❌ MQTT connection error:", error.message);
        reject(error);
      });

      this.client.on("close", () => {
        this.isConnected = false;
        console.log("📴 MQTT connection closed");
      });

      this.client.on("reconnect", () => {
        console.log("🔄 MQTT reconnecting...");
      });

      this.client.on("message", this.handleMessage.bind(this));
    });
  }

  /**
   * Subscribe to device topics
   */
  subscribeToTopics() {
    const topics = [
      TOPICS.SENSOR_DATA,
      TOPICS.SENSOR_SPECIFIC,
      TOPICS.DEVICE_STATUS,
    ];

    topics.forEach((topic) => {
      this.client.subscribe(topic, (err) => {
        if (err) {
          console.error(`❌ Failed to subscribe to ${topic}:`, err.message);
        } else {
          console.log(`📥 Subscribed to: ${topic}`);
        }
      });
    });
  }

  /**
   * Handle incoming MQTT messages
   */
  async handleMessage(topic, message) {
    try {
      const payload = JSON.parse(message.toString());
      const topicParts = topic.split("/");
      const macAddress = topicParts[1];

      console.log(`📨 MQTT [${topic}]:`, payload);

      if (topic.includes("/sensors")) {
        await this.handleSensorData(macAddress, payload);
      } else if (topic.includes("/status")) {
        await this.handleDeviceStatus(macAddress, payload);
      }
    } catch (error) {
      console.error("❌ Error handling MQTT message:", error.message);
    }
  }

  /**
   * Handle sensor data from devices
   */
  async handleSensorData(macAddress, payload) {
    try {
      const device = await prisma.device.findUnique({
        where: { macAddress: macAddress.toUpperCase() },
        include: {
          farm: true,
          sensors: true,
        },
      });

      if (!device) {
        console.warn(`⚠️ Unknown device: ${macAddress}`);
        return;
      }

      // Update device last seen
      await prisma.device.update({
        where: { id: device.id },
        data: {
          isOnline: true,
          lastSeenAt: new Date(),
        },
      });

      // Collect sensor updates for WebSocket broadcast
      let sensorUpdates = [];

      // Process sensor readings
      if (payload.sensorType && payload.value !== undefined) {
        const update = await this.processSensorReading(
          device,
          payload.sensorType,
          payload.value
        );
        if (update) {
          if (Array.isArray(update)) {
            sensorUpdates = sensorUpdates.concat(update);
          } else {
            sensorUpdates.push(update);
          }
        }
      } else {
        for (const [sensorType, value] of Object.entries(payload)) {
          if (
            value !== null &&
            value !== undefined &&
            sensorType !== "lastUpdate"
          ) {
            const update = await this.processSensorReading(
              device,
              sensorType.toUpperCase(),
              value
            );
            if (update) {
              if (Array.isArray(update)) {
                sensorUpdates = sensorUpdates.concat(update);
              } else {
                sensorUpdates.push(update);
              }
            }
          }
        }
      }

      // Broadcast to WebSocket clients
      if (sensorUpdates.length > 0) {
        console.log(
          `📡 Broadcasting ${sensorUpdates.length} sensor updates to farm: ${device.farmId}`
        );
        websocketService.broadcastSensorData(device.farmId, {
          deviceId: device.id,
          deviceMac: device.macAddress,
          sensors: sensorUpdates,
        });
      }

      console.log(`✅ Sensor data processed for ${macAddress}`);
    } catch (error) {
      console.error("❌ Error processing sensor data:", error.message);
    }
  }

  /**
   * Process individual sensor reading
   */
  async processSensorReading(device, sensorType, value) {
    // Find ALL sensors of this type for this device
    const matchingSensors = device.sensors.filter(
      (s) =>
        s.sensorType === sensorType ||
        s.sensorType === sensorType.toUpperCase() ||
        s.sensorType.toUpperCase().replace("_", "") ===
          sensorType.toUpperCase().replace("_", "")
    );

    if (matchingSensors.length === 0) {
      console.warn(
        `⚠️ Sensor type ${sensorType} not configured for device ${device.macAddress}`
      );
      return null;
    }

    const updates = [];

    // Update ALL matching sensors (in case there are multiple of same type)
    for (const sensor of matchingSensors) {
      const calibratedValue =
        parseFloat(value) + parseFloat(sensor.calibrationOffset || 0);

      // Update PostgreSQL
      await prisma.sensor.update({
        where: { id: sensor.id },
        data: {
          lastReading: calibratedValue,
          lastReadingAt: new Date(),
        },
      });

      // Write to InfluxDB
      await writeSensorData(
        device.farmId,
        device.macAddress,
        sensorType,
        sensor.id,
        calibratedValue,
        sensor.unit
      );

      // Check thresholds
      await this.checkThresholds(device.farm, sensor, calibratedValue);

      // Evaluate automation rules
      await automationService.evaluateSensorRules(
        sensor.id,
        calibratedValue,
        device.farmId
      );

      updates.push({
        sensorId: sensor.id,
        sensorType: sensor.sensorType,
        sensorName: sensor.sensorName,
        value: calibratedValue,
        unit: sensor.unit,
        timestamp: new Date().toISOString(),
      });
    }

    return updates.length === 1 ? updates[0] : updates;
  }

  /**
   * Check sensor thresholds and create alerts
   */
  async checkThresholds(farm, sensor, value) {
    let alertMessage = null;
    let severity = "WARNING";

    if (sensor.maxThreshold && value > parseFloat(sensor.maxThreshold)) {
      alertMessage = `${sensor.sensorName} is too HIGH: ${value}${sensor.unit} (threshold: ${sensor.maxThreshold}${sensor.unit})`;
      severity =
        value > parseFloat(sensor.maxThreshold) * 1.2 ? "CRITICAL" : "WARNING";
    } else if (sensor.minThreshold && value < parseFloat(sensor.minThreshold)) {
      alertMessage = `${sensor.sensorName} is too LOW: ${value}${sensor.unit} (threshold: ${sensor.minThreshold}${sensor.unit})`;
      severity =
        value < parseFloat(sensor.minThreshold) * 0.8 ? "CRITICAL" : "WARNING";
    }

    if (alertMessage) {
      const alert = await prisma.alert.create({
        data: {
          farmId: farm.id,
          alertType: "THRESHOLD",
          severity: severity,
          title: `${sensor.sensorType} Alert`,
          message: alertMessage,
          sensorData: {
            sensorId: sensor.id,
            sensorType: sensor.sensorType,
            value: value,
            unit: sensor.unit,
          },
        },
      });

      // Broadcast alert via WebSocket
      websocketService.broadcastAlert(farm.id, {
        id: alert.id,
        severity: alert.severity,
        title: alert.title,
        message: alert.message,
      });

      console.log(`🚨 Alert created: ${alertMessage}`);
    }
  }

  /**
   * Handle device status updates (including actuator state changes from Pi)
   */
  async handleDeviceStatus(macAddress, payload) {
    try {
      // Handle actuator state change from Pi
      if (payload.type === "actuator_state_change") {
        console.log(
          `📨 Actuator state change from Pi: ${payload.actuatorId} -> ${payload.state}`
        );

        // Update database
        const actuator = await prisma.actuator.update({
          where: { id: payload.actuatorId },
          data: {
            currentState: payload.state,
            lastActionAt: new Date(),
          },
          include: {
            device: {
              include: { farm: true },
            },
          },
        });

        // Log the action
        await prisma.actionLog
          .create({
            data: {
              farmId: actuator.device.farmId,
              actuatorId: payload.actuatorId,
              action: payload.state,
              source: "DEVICE",
            },
          })
          .catch(() => {}); // Ignore if table doesn't exist

        // Broadcast to website via WebSocket
        websocketService.broadcastActuatorState(actuator.device.farmId, {
          actuatorId: payload.actuatorId,
          state: payload.state,
          deviceId: actuator.deviceId,
          gpioPin: payload.gpioPin,
        });

        console.log(
          `✅ Actuator state synced to website: ${actuator.actuatorName} -> ${payload.state}`
        );
        return;
      }

      // Handle regular device status update
      const { online, ipAddress, firmwareVersion } = payload;

      const device = await prisma.device.update({
        where: { macAddress: macAddress.toUpperCase() },
        data: {
          isOnline: online !== false,
          lastSeenAt: new Date(),
          ipAddress: ipAddress || null,
          firmwareVersion: firmwareVersion || undefined,
        },
        include: { farm: true },
      });

      // Broadcast device status via WebSocket
      websocketService.broadcastDeviceStatus(
        device.farmId,
        device.id,
        device.isOnline
      );

      console.log(
        `✅ Device status: ${macAddress} - ${device.isOnline ? "ONLINE" : "OFFLINE"}`
      );
    } catch (error) {
      console.error("❌ Error updating device status:", error.message);
    }
  }

  /**
   * Send command to actuator (called when user controls from website)
   */
  async sendActuatorCommand(macAddress, actuatorId, command, gpioPin = null) {
    if (!this.isConnected) {
      throw new Error("MQTT not connected");
    }

    const topic = TOPICS.ACTUATOR_COMMAND(macAddress);
    const payload = JSON.stringify({
      actuatorId,
      command,
      gpioPin,
      timestamp: new Date().toISOString(),
    });

    return new Promise((resolve, reject) => {
      this.client.publish(topic, payload, { qos: 1 }, (err) => {
        if (err) {
          console.error(
            `❌ Failed to send command to ${macAddress}:`,
            err.message
          );
          reject(err);
        } else {
          console.log(
            `📤 Command sent to Pi: ${macAddress} -> ${actuatorId} -> ${command}`
          );
          resolve(true);
        }
      });
    });
  }

  /**
   * Send configuration update to device
   */
  async sendConfigUpdate(macAddress, config) {
    if (!this.isConnected) {
      throw new Error("MQTT not connected");
    }

    const topic = TOPICS.CONFIG_UPDATE(macAddress);
    const payload = JSON.stringify(config);

    return new Promise((resolve, reject) => {
      this.client.publish(topic, payload, { qos: 1 }, (err) => {
        if (err) {
          reject(err);
        } else {
          console.log(`📤 Config sent to ${macAddress}`);
          resolve(true);
        }
      });
    });
  }

  /**
   * Disconnect from MQTT broker
   */
  disconnect() {
    if (this.client) {
      this.client.end();
      console.log("📴 MQTT disconnected");
    }
  }
}

module.exports = new MQTTService();
