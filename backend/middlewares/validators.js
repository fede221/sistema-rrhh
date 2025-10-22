/**
 * 🛡️ Validadores centralizados usando express-validator
 * Previene inyecciones, datos malformados y ataques de entrada
 */

const { body, param, validationResult } = require('express-validator');
const { validatePassword } = require('../utils/passwordValidator');

/**
 * Middleware para manejar errores de validación
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Errores de validación',
      detalles: errors.array().map(err => ({
        campo: err.path || err.param,
        mensaje: err.msg
      }))
    });
  }
  next();
};

/**
 * Validador personalizado para contraseñas robustas
 */
const isStrongPassword = (value) => {
  const result = validatePassword(value);
  if (!result.valid) {
    throw new Error(result.errors.join('. '));
  }
  return true;
};

/**
 * Validaciones para login
 */
const validateLogin = [
  body('dni')
    .trim()
    .notEmpty().withMessage('DNI es obligatorio')
    .isNumeric().withMessage('DNI debe contener solo números')
    .isLength({ min: 7, max: 8 }).withMessage('DNI debe tener entre 7 y 8 dígitos'),

  body('password')
    .trim()
    .notEmpty().withMessage('Contraseña es obligatoria')
    .isLength({ max: 255 }).withMessage('Contraseña no puede tener más de 255 caracteres'),

  handleValidationErrors
];

/**
 * Validaciones para crear usuario
 */
const validateCreateUser = [
  body('legajo')
    .trim()
    .notEmpty().withMessage('Legajo es obligatorio')
    .isLength({ max: 50 }).withMessage('Legajo no puede tener más de 50 caracteres'),

  body('dni')
    .trim()
    .notEmpty().withMessage('DNI es obligatorio')
    .isNumeric().withMessage('DNI debe contener solo números')
    .isLength({ min: 7, max: 8 }).withMessage('DNI debe tener entre 7 y 8 dígitos'),

  body('nombre')
    .trim()
    .notEmpty().withMessage('Nombre es obligatorio')
    .isLength({ max: 100 }).withMessage('Nombre no puede tener más de 100 caracteres')
    .matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/).withMessage('Nombre solo puede contener letras y espacios'),

  body('apellido')
    .trim()
    .notEmpty().withMessage('Apellido es obligatorio')
    .isLength({ max: 100 }).withMessage('Apellido no puede tener más de 100 caracteres')
    .matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/).withMessage('Apellido solo puede contener letras y espacios'),

  body('correo')
    .trim()
    .notEmpty().withMessage('Correo electrónico es obligatorio')
    .isEmail().withMessage('Formato de correo electrónico inválido')
    .normalizeEmail()
    .isLength({ max: 100 }).withMessage('Correo no puede tener más de 100 caracteres'),

  body('password')
    .trim()
    .notEmpty().withMessage('Contraseña es obligatoria')
    .isLength({ max: 255 }).withMessage('Contraseña no puede tener más de 255 caracteres')
    .custom(isStrongPassword),

  body('rol')
    .trim()
    .notEmpty().withMessage('Rol es obligatorio')
    .isIn(['superadmin', 'admin_rrhh', 'empleado', 'referente_vacaciones', 'referente'])
    .withMessage('Rol inválido'),

  body('cuil')
    .optional()
    .trim()
    .isNumeric().withMessage('CUIL debe contener solo números')
    .isLength({ min: 11, max: 11 }).withMessage('CUIL debe tener exactamente 11 dígitos'),

  handleValidationErrors
];

/**
 * Validaciones para reset password
 */
const validateResetPassword = [
  param('userId')
    .isInt({ min: 1 }).withMessage('ID de usuario inválido'),

  body('nuevaPassword')
    .trim()
    .notEmpty().withMessage('Contraseña es obligatoria')
    .isLength({ max: 255 }).withMessage('Contraseña no puede tener más de 255 caracteres')
    .custom(isStrongPassword),

  handleValidationErrors
];

/**
 * Validaciones para recuperación de contraseña (DNI)
 */
const validateRecoveryDNI = [
  param('dni')
    .trim()
    .notEmpty().withMessage('DNI es obligatorio')
    .isNumeric().withMessage('DNI debe contener solo números')
    .isLength({ min: 7, max: 8 }).withMessage('DNI debe tener entre 7 y 8 dígitos'),

  handleValidationErrors
];

/**
 * Validaciones para validar respuestas de recuperación
 */
const validateRecoveryAnswers = [
  body('userId')
    .isInt({ min: 1 }).withMessage('ID de usuario inválido'),

  body('respuestas')
    .isArray({ min: 3, max: 3 }).withMessage('Debe proporcionar exactamente 3 respuestas')
    .custom((respuestas) => {
      for (const r of respuestas) {
        if (!r.pregunta_id || typeof r.pregunta_id !== 'number') {
          throw new Error('Cada respuesta debe tener un pregunta_id numérico');
        }
        if (!r.respuesta || typeof r.respuesta !== 'string' || r.respuesta.trim().length === 0) {
          throw new Error('Cada respuesta debe tener una respuesta no vacía');
        }
      }
      return true;
    }),

  handleValidationErrors
];

module.exports = {
  validateLogin,
  validateCreateUser,
  validateResetPassword,
  validateRecoveryDNI,
  validateRecoveryAnswers,
  handleValidationErrors
};
