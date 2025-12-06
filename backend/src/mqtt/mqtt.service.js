const mqtt = require('mqtt');
const { MQTT_CONFIG, TOPICS } = require('../config/mqtt');
const { prisma } = require('../config/database');
const { writeSensorData } = require('../config/influxdb');

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
      console.log('📡 Connecting to MQTT broker...');
      
      this.client = mqtt.connect(MQTT_CONFIG.brokerUrl, MQTT_CONFIG.options);

      this.client.on('connect', () => {
        this.isConnected = true;
        console.log('✅ MQTT connected to broker');
        
        // Subscribe to topics
        this.subscribeToTopics();
        resolve(true);
      });

      this.client.on('error', (error) => {
        console.error('❌ MQTT connection error:', error.message);
        reject(error);
      });

      this.client.on('close', () => {
        this.isConnected = false;
        console.log('📴 MQTT connection closed');
      });

      this.client.on('reconnect', () => {
        console.log('🔄 MQTT reconnecting...');
      });

      // Handle incoming messages
      this.client.on('message', this.handleMessage.bind(this));
    });
  }

  /**
   * Subscribe to device topics
   */
  subscribeToTopics() {
    const topics = [
      TOPICS.SENSOR_DATA,
      TOPICS.SENSOR_SPECIFIC,
      TOPICS.DEVICE_STATUS
    ];

    topics.forEach(topic => {
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
      
      // Extract MAC address from topic
      // Topic format: farm/{MAC_ADDRESS}/sensors or farm/{MAC_ADDRESS}/status
      const topicParts = topic.split('/');
      const macAddress = topicParts[1];

      console.log(`📨 Message received on ${topic}:`, payload);

      // Route message to appropriate handler
      if (topic.includes('/sensors')) {
        await this.handleSensorData(macAddress, payload);
      } else if (topic.includes('/status')) {
        await this.handleDeviceStatus(macAddress, payload);
      }
    } catch (error) {
      console.error('❌ Error handling MQTT message:', error.message);
    }
  }

  /**
   * Handle sensor data from devices
   */
  async handleSensorData(macAddress, payload) {
    try {
      // Find device by MAC address
      const device = await prisma.device.findUnique({
        where: { macAddress: macAddress.toUpperCase() },
        include: { 
          farm: true,
          sensors: true 
        }
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
          lastSeenAt: new Date() 
        }
      });

      // Process sensor readings
      // Payload format: { temperature: 28.5, humidity: 65, soil_moisture: 45 }
      // OR: { sensorType: "TEMPERATURE", value: 28.5 }
      
      if (payload.sensorType && payload.value !== undefined) {
        // Single sensor reading
        await this.processSensorReading(device, payload.sensorType, payload.value);
      } else {
        // Multiple sensor readings
        for (const [sensorType, value] of Object.entries(payload)) {
          if (value !== null && value !== undefined) {
            await this.processSensorReading(device, sensorType.toUpperCase(), value);
          }
        }
      }

      console.log(`✅ Sensor data processed for device ${macAddress}`);
    } catch (error) {
      console.error('❌ Error processing sensor data:', error.message);
    }
  }

  /**
   * Process individual sensor reading
   */
  async processSensorReading(device, sensorType, value) {
    // Find matching sensor
    const sensor = device.sensors.find(s => 
      s.sensorType === sensorType || 
      s.sensorType === sensorType.toUpperCase().replace('_', '')
    );

    if (!sensor) {
      console.warn(`⚠️ Sensor type ${sensorType} not configured for device ${device.macAddress}`);
      return;
    }

    // Apply calibration offset
    const calibratedValue = parseFloat(value) + parseFloat(sensor.calibrationOffset || 0);

    // Update sensor last reading in PostgreSQL
    await prisma.sensor.update({
      where: { id: sensor.id },
      data: {
        lastReading: calibratedValue,
        lastReadingAt: new Date()
      }
    });

    // Write to InfluxDB for time-series storage
    await writeSensorData(
      device.farmId,
      device.macAddress,
      sensorType,
      sensor.id,
      calibratedValue,
      sensor.unit
    );

    // Check thresholds and create alerts if needed
    await this.checkThresholds(device.farm, sensor, calibratedValue);
  }

  /**
   * Check sensor thresholds and create alerts
   */
  async checkThresholds(farm, sensor, value) {
    let alertMessage = null;
    let severity = 'WARNING';

    if (sensor.maxThreshold && value > parseFloat(sensor.maxThreshold)) {
      alertMessage = `${sensor.sensorName} is too HIGH: ${value}${sensor.unit} (threshold: ${sensor.maxThreshold}${sensor.unit})`;
      severity = value > parseFloat(sensor.maxThreshold) * 1.2 ? 'CRITICAL' : 'WARNING';
    } else if (sensor.minThreshold && value < parseFloat(sensor.minThreshold)) {
      alertMessage = `${sensor.sensorName} is too LOW: ${value}${sensor.unit} (threshold: ${sensor.minThreshold}${sensor.unit})`;
      severity = value < parseFloat(sensor.minThreshold) * 0.8 ? 'CRITICAL' : 'WARNING';
    }

    if (alertMessage) {
      await prisma.alert.create({
        data: {
          farmId: farm.id,
          alertType: 'THRESHOLD',
          severity: severity,
          title: `${sensor.sensorType} Alert`,
          message: alertMessage,
          sensorData: {
            sensorId: sensor.id,
            sensorType: sensor.sensorType,
            value: value,
            unit: sensor.unit
          }
        }
      });
      
      console.log(`🚨 Alert created: ${alertMessage}`);
    }
  }

  /**
   * Handle device status updates
   */
  async handleDeviceStatus(macAddress, payload) {
    try {
      const { online, ipAddress, firmwareVersion, uptime } = payload;

      await prisma.device.update({
        where: { macAddress: macAddress.toUpperCase() },
        data: {
          isOnline: online !== false,
          lastSeenAt: new Date(),
          ipAddress: ipAddress || null,
          firmwareVersion: firmwareVersion || undefined
        }
      });

      console.log(`✅ Device status updated: ${macAddress} - ${online ? 'ONLINE' : 'OFFLINE'}`);
    } catch (error) {
      console.error('❌ Error updating device status:', error.message);
    }
  }

  /**
   * Send command to actuator
   */
  async sendActuatorCommand(macAddress, actuatorId, command) {
    if (!this.isConnected) {
      throw new Error('MQTT not connected');
    }

    const topic = TOPICS.ACTUATOR_COMMAND(macAddress);
    const payload = JSON.stringify({
      actuatorId,
      command,
      timestamp: new Date().toISOString()
    });

    return new Promise((resolve, reject) => {
      this.client.publish(topic, payload, { qos: 1 }, (err) => {
        if (err) {
          console.error(`❌ Failed to send command to ${macAddress}:`, err.message);
          reject(err);
        } else {
          console.log(`📤 Command sent to ${macAddress}:`, payload);
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
      throw new Error('MQTT not connected');
    }

    const topic = TOPICS.CONFIG_UPDATE(macAddress);
    const payload = JSON.stringify(config);

    return new Promise((resolve, reject) => {
      this.client.publish(topic, payload, { qos: 1 }, (err) => {
        if (err) {
          reject(err);
        } else {
          console.log(`📤 Config sent to ${macAddress}:`, config);
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
      console.log('📴 MQTT disconnected');
    }
  }
}

// Export singleton instance
module.exports = new MQTTService();