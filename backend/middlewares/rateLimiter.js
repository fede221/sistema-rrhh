const rateLimit = require('express-rate-limit');
const { ipKeyGenerator } = require('express-rate-limit');

/**
 * Rate Limiter para protección contra ataques de fuerza bruta y DoS
 * Configuración basada en OWASP Security Best Practices
 */

// Rate limiter estricto para autenticación
// Previene ataques de fuerza bruta en login
const authLimiter = rateLimit({
  windowMs: parseInt(process.env.AUTH_RATE_WINDOW_MS) || 15 * 60 * 1000, // 15 minutos por defecto
  max: parseInt(process.env.AUTH_RATE_MAX_REQUESTS) || 5, // 5 intentos por defecto
  message: {
    error: 'Demasiados intentos de inicio de sesión. Por favor, intenta nuevamente en 15 minutos.',
    retryAfter: '15 minutos'
  },
  standardHeaders: true, // Retorna info de rate limit en headers `RateLimit-*`
  legacyHeaders: false, // Deshabilita headers `X-RateLimit-*`
  skipSuccessfulRequests: false, // Cuenta todos los requests, exitosos o no
  skipFailedRequests: false,
  // Identificar por IP
  keyGenerator: (req) => {
    return req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress;
  },
  handler: (req, res) => {
    console.warn(`🚨 Rate limit excedido para IP: ${req.ip} en ruta: ${req.path}`);
    res.status(429).json({
      error: 'Demasiados intentos de inicio de sesión',
      message: 'Has excedido el límite de intentos. Por favor, intenta nuevamente más tarde.',
      retryAfter: '15 minutos'
    });
  }
});

// Rate limiter para recuperación de contraseña
// Previene enumeración de usuarios y abuso
const passwordRecoveryLimiter = rateLimit({
  windowMs: parseInt(process.env.PASSWORD_RECOVERY_WINDOW_MS) || 60 * 60 * 1000, // 1 hora
  max: parseInt(process.env.PASSWORD_RECOVERY_MAX_REQUESTS) || 3, // 3 intentos por hora
  message: {
    error: 'Demasiados intentos de recuperación de contraseña. Intenta en 1 hora.',
    retryAfter: '1 hora'
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    return req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress;
  },
  handler: (req, res) => {
    console.warn(`🚨 Rate limit de recuperación excedido para IP: ${req.ip}`);
    res.status(429).json({
      error: 'Demasiados intentos de recuperación de contraseña',
      message: 'Has excedido el límite de intentos. Por seguridad, intenta nuevamente en 1 hora.',
      retryAfter: '1 hora'
    });
  }
});

// Rate limiter general para toda la API
// Previene DoS y uso abusivo
const apiLimiter = rateLimit({
  windowMs: parseInt(process.env.API_RATE_WINDOW_MS) || 15 * 60 * 1000, // 15 minutos
  max: parseInt(process.env.API_RATE_MAX_REQUESTS) || 100, // 100 requests por ventana
  message: {
    error: 'Demasiadas solicitudes desde esta IP. Por favor, intenta más tarde.',
    retryAfter: '15 minutos'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
  keyGenerator: (req) => {
    return req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress;
  },
  handler: (req, res) => {
    console.warn(`🚨 Rate limit general excedido para IP: ${req.ip} en ruta: ${req.path}`);
    res.status(429).json({
      error: 'Demasiadas solicitudes',
      message: 'Has excedido el límite de solicitudes permitidas. Por favor, intenta más tarde.',
      retryAfter: '15 minutos'
    });
  }
});

// Rate limiter para operaciones de escritura (POST, PUT, DELETE)
// Más restrictivo que el general
const writeLimiter = rateLimit({
  windowMs: parseInt(process.env.WRITE_RATE_WINDOW_MS) || 15 * 60 * 1000, // 15 minutos
  max: parseInt(process.env.WRITE_RATE_MAX_REQUESTS) || 50, // 50 operaciones de escritura
  message: {
    error: 'Demasiadas operaciones de modificación. Intenta más tarde.',
    retryAfter: '15 minutos'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
  keyGenerator: (req) => {
    return req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress;
  },
  handler: (req, res) => {
    console.warn(`🚨 Rate limit de escritura excedido para IP: ${req.ip} en ${req.method} ${req.path}`);
    res.status(429).json({
      error: 'Demasiadas operaciones de modificación',
      message: 'Has excedido el límite de operaciones permitidas. Por favor, intenta más tarde.',
      retryAfter: '15 minutos'
    });
  }
});

// Rate limiter para uploads de archivos
// Muy restrictivo para prevenir abuso de recursos
const uploadLimiter = rateLimit({
  windowMs: parseInt(process.env.UPLOAD_RATE_WINDOW_MS) || 60 * 60 * 1000, // 1 hora
  max: parseInt(process.env.UPLOAD_RATE_MAX_REQUESTS) || 10, // 10 uploads por hora
  message: {
    error: 'Demasiados archivos cargados. Intenta en 1 hora.',
    retryAfter: '1 hora'
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    return req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress;
  },
  handler: (req, res) => {
    console.warn(`🚨 Rate limit de uploads excedido para IP: ${req.ip}`);
    res.status(429).json({
      error: 'Demasiados archivos cargados',
      message: 'Has excedido el límite de carga de archivos. Por favor, intenta nuevamente en 1 hora.',
      retryAfter: '1 hora'
    });
  }
});

// Función para crear rate limiter personalizado
const createCustomLimiter = (options = {}) => {
  return rateLimit({
    windowMs: options.windowMs || 15 * 60 * 1000,
    max: options.max || 100,
    message: options.message || { error: 'Demasiadas solicitudes' },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => {
      return req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    },
    handler: (req, res) => {
      console.warn(`🚨 Rate limit personalizado excedido para IP: ${req.ip}`);
      res.status(429).json(options.message || { error: 'Demasiadas solicitudes' });
    }
  });
};

module.exports = {
  authLimiter,
  passwordRecoveryLimiter,
  apiLimiter,
  writeLimiter,
  uploadLimiter,
  createCustomLimiter
};
