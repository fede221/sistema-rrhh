const joi = require('joi');
const { AppError } = require('./error-handling');

// Esquemas de validación
const schemas = {
  login: joi.object({
    dni: joi.string().pattern(/^\d{7,8}$/).required(),
    password: joi.string().min(6).required()
  }),

  createUser: joi.object({
    dni: joi.string().pattern(/^\d{7,8}$/).required(),
    nombre: joi.string().min(2).max(50).required(),
    apellido: joi.string().min(2).max(50).required(),
    email: joi.string().email().required(),
    rol: joi.string().valid('empleado', 'referente', 'admin_rrhh', 'superadmin').required(),
    empresa_id: joi.number().integer().positive().required()
  }),

  updateUser: joi.object({
    nombre: joi.string().min(2).max(50),
    apellido: joi.string().min(2).max(50),
    email: joi.string().email(),
    rol: joi.string().valid('empleado', 'referente', 'admin_rrhh', 'superadmin'),
    empresa_id: joi.number().integer().positive(),
    activo: joi.boolean()
  }),

  solicitarVacaciones: joi.object({
    fecha_inicio: joi.date().min('now').required(),
    fecha_fin: joi.date().greater(joi.ref('fecha_inicio')).required(),
    dias_solicitados: joi.number().integer().min(1).max(30).required(),
    observaciones: joi.string().max(500).allow('')
  })
};

// Middleware de validación
const validateRequest = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body);
    
    if (error) {
      const message = error.details[0].message;
      return next(new AppError(`Datos inválidos: ${message}`, 400));
    }
    
    next();
  };
};

// Sanitización de entrada
const sanitizeInput = (req, res, next) => {
  // Remover campos peligrosos
  const dangerousFields = ['__proto__', 'constructor', 'prototype'];
  
  const sanitizeObject = (obj) => {
    for (const key in obj) {
      if (dangerousFields.includes(key)) {
        delete obj[key];
      } else if (typeof obj[key] === 'object' && obj[key] !== null) {
        sanitizeObject(obj[key]);
      } else if (typeof obj[key] === 'string') {
        // Sanitizar HTML básico
        obj[key] = obj[key].replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
      }
    }
  };

  if (req.body) sanitizeObject(req.body);
  if (req.query) sanitizeObject(req.query);
  if (req.params) sanitizeObject(req.params);

  next();
};

module.exports = {
  schemas,
  validateRequest,
  sanitizeInput
};