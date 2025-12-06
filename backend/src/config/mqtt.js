const mqtt = require('mqtt');

// MQTT Configuration
const MQTT_CONFIG = {
  brokerUrl: process.env.MQTT_BROKER_URL || 'mqtt://localhost:1883',
  options: {
    clientId: `ecofarm_backend_${Date.now()}`,
    clean: true,
    connectTimeout: 4000,
    reconnectPeriod: 1000,
    username: process.env.MQTT_USERNAME || '',
    password: process.env.MQTT_PASSWORD || ''
  }
};

// Topic patterns
const TOPICS = {
  // Subscribe patterns (from devices)
  SENSOR_DATA: 'farm/+/sensors',           // + is wildcard for MAC address
  SENSOR_SPECIFIC: 'farm/+/sensors/+',     // Specific sensor type
  DEVICE_STATUS: 'farm/+/status',          // Device online/offline
  
  // Publish patterns (to devices)
  ACTUATOR_COMMAND: (mac) => `farm/${mac}/actuators/command`,
  CONFIG_UPDATE: (mac) => `farm/${mac}/config`
};

module.exports = {
  MQTT_CONFIG,
  TOPICS
};