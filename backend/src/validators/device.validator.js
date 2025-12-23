const Joi = require("joi");

// MAC address pattern: XX:XX:XX:XX:XX:XX or XX-XX-XX-XX-XX-XX
const macAddressPattern = /^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/;

const registerDeviceSchema = Joi.object({
  macAddress: Joi.string().pattern(macAddressPattern).required().messages({
    "string.pattern.base": "Invalid MAC address format. Use XX:XX:XX:XX:XX:XX",
    "any.required": "MAC address is required",
  }),

  deviceName: Joi.string().min(2).max(100).required().messages({
    "any.required": "Device name is required",
  }),

  deviceType: Joi.string()
    .valid("GATEWAY", "SENSOR_NODE", "RELAY_NODE", "CAMERA")
    .required()
    .messages({
      "any.required": "Device type is required",
    }),

  firmwareVersion: Joi.string().max(50).optional(),

  config: Joi.object().optional().default({}),
});

const updateDeviceSchema = Joi.object({
  deviceName: Joi.string().min(2).max(100).optional(),

  firmwareVersion: Joi.string().max(50).optional(),

  config: Joi.object().optional(),

  isActive: Joi.boolean().optional(),
});


const createSensorSchema = Joi.object({
  sensorType: Joi.string()
    .valid(
      "TEMPERATURE",
      "HUMIDITY",
      "SOIL_MOISTURE",
      "LIGHT",
      "CO2",
      "PH",
      "EC",
      "PRESSURE",
      "FLOW"
    )
    .required(),
  sensorName: Joi.string().max(100).required(),
  unit: Joi.string().max(20),

  // Connection Type
  connectionType: Joi.string()
    .valid("GPIO", "MODBUS_RTU", "MODBUS_TCP", "ANALOG", "I2C", "SPI")
    .default("GPIO"),

  // Modbus Configuration
  slaveId: Joi.number()
    .integer()
    .min(1)
    .max(247)
    .when("connectionType", {
      is: Joi.string().valid("MODBUS_RTU", "MODBUS_TCP"),
      then: Joi.required(),
      otherwise: Joi.optional(),
    }),
  functionCode: Joi.number()
    .integer()
    .valid(1, 2, 3, 4)
    .when("connectionType", {
      is: Joi.string().valid("MODBUS_RTU", "MODBUS_TCP"),
      then: Joi.required(),
      otherwise: Joi.optional(),
    }),
  registerAddress: Joi.number()
    .integer()
    .min(0)
    .max(65535)
    .when("connectionType", {
      is: Joi.string().valid("MODBUS_RTU", "MODBUS_TCP"),
      then: Joi.required(),
      otherwise: Joi.optional(),
    }),
  registerCount: Joi.number().integer().min(1).max(125).default(1),
  dataType: Joi.string()
    .valid("INT16", "UINT16", "INT32", "UINT32", "FLOAT32", "FLOAT64")
    .default("INT16"),
  byteOrder: Joi.string()
    .valid("AB", "BA", "ABCD", "DCBA", "CDAB", "BADC")
    .default("AB"),
  scaleFactor: Joi.number().default(1),
  decimalPlaces: Joi.number().integer().min(0).max(6).default(1),
  offset: Joi.number().default(0),

  // Thresholds
  minThreshold: Joi.number(),
  maxThreshold: Joi.number(),
  calibrationOffset: Joi.number().default(0),
  readingInterval: Joi.number().integer().min(1).default(60),
});

// Actuator configuration
const createActuatorSchema = Joi.object({
  actuatorType: Joi.string()
    .valid(
      "FAN",
      "EXHAUST_FAN",
      "FOGGER",
      "IRRIGATION_VALVE",
      "SHADE_NET",
      "GROW_LIGHT",
      "HEATER",
      "COOLER",
      "DOSING_PUMP",
      "WATER_PUMP"
    )
    .required(),

  actuatorName: Joi.string().min(2).max(100).required(),

  gpioPin: Joi.number().min(0).max(40).optional(),

  config: Joi.object().optional().default({}),
});

module.exports = {
  registerDeviceSchema,
  updateDeviceSchema,
  createSensorSchema,
  createActuatorSchema,
};
