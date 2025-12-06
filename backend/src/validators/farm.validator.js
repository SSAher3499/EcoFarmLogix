const Joi = require('joi');

const createFarmSchema = Joi.object({
  name: Joi.string()
    .min(2)
    .max(100)
    .required()
    .messages({
      'string.min': 'Farm name must be at least 2 characters',
      'any.required': 'Farm name is required'
    }),
  
  locationAddress: Joi.string()
    .max(500)
    .optional(),
  
  latitude: Joi.number()
    .min(-90)
    .max(90)
    .optional(),
  
  longitude: Joi.number()
    .min(-180)
    .max(180)
    .optional(),
  
  areaSqft: Joi.number()
    .positive()
    .optional(),
  
  farmType: Joi.string()
    .valid('POLYHOUSE', 'GREENHOUSE', 'OPENFIELD', 'SHADENET', 'INDOOR')
    .default('POLYHOUSE'),
  
  timezone: Joi.string()
    .default('Asia/Kolkata')
});

const updateFarmSchema = Joi.object({
  name: Joi.string()
    .min(2)
    .max(100)
    .optional(),
  
  locationAddress: Joi.string()
    .max(500)
    .optional(),
  
  latitude: Joi.number()
    .min(-90)
    .max(90)
    .optional(),
  
  longitude: Joi.number()
    .min(-180)
    .max(180)
    .optional(),
  
  areaSqft: Joi.number()
    .positive()
    .optional(),
  
  farmType: Joi.string()
    .valid('POLYHOUSE', 'GREENHOUSE', 'OPENFIELD', 'SHADENET', 'INDOOR')
    .optional(),
  
  timezone: Joi.string()
    .optional(),
  
  isActive: Joi.boolean()
    .optional()
});

module.exports = {
  createFarmSchema,
  updateFarmSchema
};