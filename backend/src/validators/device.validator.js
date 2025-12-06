const Joi = require('joi');

// MAC address pattern: XX:XX:XX:XX:XX:XX or XX-XX-XX-XX-XX-XX
const macAddressPattern = /^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/;

const registerDeviceSchema = Joi.object({
  macAddress: Joi.string()
    .pattern(macAddressPattern)
    .required()
    .messages({
      'string.pattern.base': 'Invalid MAC address format. Use XX:XX:XX:XX:XX:XX',
      'any.required': 'MAC address is required'
    }),
  
  deviceName: Joi.string()
    .min(2)
    .max(100)
    .required()
    .messages({
      'any.required': 'Device name is required'
    }),
  
  deviceType: Joi.string()
    .valid('GATEWAY', 'SENSOR_NODE', 'RELAY_NODE', 'CAMERA')
    .required()
    .messages({
      'any.required': 'Device type is required'
    }),
  
  firmwareVersion: Joi.string()
    .max(50)
    .optional(),
  
  config: Joi.object()
    .optional()
    .default({})
});

const updateDeviceSchema = Joi.object({
  deviceName: Joi.string()
    .min(2)
    .max(100)
    .optional(),
  
  firmwareVersion: Joi.string()
    .max(50)
    .optional(),
  
  config: Joi.object()
    .optional(),
  
  isActive: Joi.boolean()
    .optional()
});

// Sensor configuration
const createSensorSchema = Joi.object({
  sensorType: Joi.string()
    .valid(
      'TEMPERATURE', 'HUMIDITY', 'SOIL_MOISTURE', 'SOIL_TEMPERATURE',
      'LIGHT', 'CO2', 'PH', 'EC', 'WATER_FLOW', 'WATER_LEVEL',
      'RAIN', 'WIND_SPEED', 'PRESSURE'
    )
    .required(),
  
  sensorName: Joi.string()
    .min(2)
    .max(100)
    .required(),
  
  unit: Joi.string()
    .max(20)
    .required(),
  
  minThreshold: Joi.number()
    .optional(),
  
  maxThreshold: Joi.number()
    .optional(),
  
  calibrationOffset: Joi.number()
    .default(0),
  
  readingInterval: Joi.number()
    .min(1)
    .max(3600)
    .default(60)
});

// Actuator configuration
const createActuatorSchema = Joi.object({
  actuatorType: Joi.string()
    .valid(
      'FAN', 'EXHAUST_FAN', 'FOGGER', 'IRRIGATION_VALVE',
      'SHADE_NET', 'GROW_LIGHT', 'HEATER', 'COOLER',
      'DOSING_PUMP', 'WATER_PUMP'
    )
    .required(),
  
  actuatorName: Joi.string()
    .min(2)
    .max(100)
    .required(),
  
  gpioPin: Joi.number()
    .min(0)
    .max(40)
    .optional(),
  
  config: Joi.object()
    .optional()
    .default({})
});

module.exports = {
  registerDeviceSchema,
  updateDeviceSchema,
  createSensorSchema,
  createActuatorSchema
};