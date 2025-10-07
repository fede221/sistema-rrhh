const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const bcrypt = require('bcrypt');
const crypto = require('crypto');

// Rate limiting por endpoint
const createRateLimit = (windowMs, max, message) => 
  rateLimit({
    windowMs,
    max,
    message: { error: message },
    standardHeaders: true,
    legacyHeaders: false
  });

// Rate limits específicos
const rateLimits = {
  // Login muy restrictivo
  login: createRateLimit(15 * 60 * 1000, 5, 'Demasiados intentos de login'),
  
  // APIs generales
  api: createRateLimit(15 * 60 * 1000, 100, 'Demasiadas peticiones'),
  
  // Uploads de archivos
  upload: createRateLimit(60 * 60 * 1000, 10, 'Demasiadas subidas de archivos')
};

// Configuración de seguridad con Helmet
const securityMiddleware = [
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", 'fonts.googleapis.com'],
        fontSrc: ["'self'", 'fonts.gstatic.com'],
        imgSrc: ["'self'", 'data:', 'blob:'],
        scriptSrc: ["'self'"],
        objectSrc: ["'none'"],
        upgradeInsecureRequests: [],
      },
    },
    crossOriginEmbedderPolicy: false
  })
];

// Generador de JWT secreto seguro
const generateSecureSecret = () => {
  return crypto.randomBytes(64).toString('hex');
};

// Hash seguro de contraseñas
const hashPassword = async (password) => {
  const saltRounds = 12; // Aumentar de 10 a 12 para mayor seguridad
  return await bcrypt.hash(password, saltRounds);
};

// Validación de fortaleza de contraseña
const validatePasswordStrength = (password) => {
  const minLength = 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasNonalphas = /\W/.test(password);

  return {
    isValid: password.length >= minLength && hasUpperCase && hasLowerCase && hasNumbers && hasNonalphas,
    errors: [
      ...(password.length < minLength ? ['Mínimo 8 caracteres'] : []),
      ...(!hasUpperCase ? ['Debe incluir mayúsculas'] : []),
      ...(!hasLowerCase ? ['Debe incluir minúsculas'] : []),
      ...(!hasNumbers ? ['Debe incluir números'] : []),
      ...(!hasNonalphas ? ['Debe incluir símbolos'] : [])
    ]
  };
};

// Middleware para logging de actividades sensibles
const auditLogger = (action) => (req, res, next) => {
  const originalSend = res.send;
  
  res.send = function(data) {
    // Log solo si la operación fue exitosa
    if (res.statusCode < 400) {
      console.log(`🔍 AUDIT: ${action}`, {
        user: req.user?.id,
        userRole: req.user?.rol,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        timestamp: new Date().toISOString(),
        endpoint: req.originalUrl,
        method: req.method
      });
    }
    
    originalSend.call(this, data);
  };
  
  next();
};

module.exports = {
  rateLimits,
  securityMiddleware,
  generateSecureSecret,
  hashPassword,
  validatePasswordStrength,
  auditLogger
};