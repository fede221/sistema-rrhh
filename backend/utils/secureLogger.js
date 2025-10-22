/**
 * Logger Seguro - Sanitiza datos sensibles antes de loguear
 *
 * PROBLEMA: console.log puede exponer datos sensibles en logs que pueden ser:
 * - Accedidos por atacantes con acceso al servidor
 * - Enviados a servicios de logging centralizados
 * - Almacenados sin encriptación
 * - Visibles en herramientas de monitoreo
 *
 * SOLUCIÓN: Este logger automáticamente oculta datos sensibles
 */

// Lista de campos sensibles que deben ser ocultados
const SENSITIVE_FIELDS = [
  'password',
  'pass',
  'pwd',
  'secret',
  'token',
  'authorization',
  'auth',
  'cookie',
  'session',
  'apikey',
  'api_key',
  'private_key',
  'privatekey',
  'access_token',
  'refresh_token',
  'jwt',
  'bearer'
];

// Patrones regex para detectar tokens y credenciales
const SENSITIVE_PATTERNS = [
  /Bearer\s+[\w-]+\.[\w-]+\.[\w-]+/gi,  // JWT tokens
  /\b[A-Za-z0-9]{20,}\b/g,              // Tokens largos
  /password\s*=\s*['"][^'"]+['"]/gi,     // password="..."
  /token\s*=\s*['"][^'"]+['"]/gi,        // token="..."
];

/**
 * Sanitiza un objeto ocultando campos sensibles
 * @param {any} data - Dato a sanitizar
 * @param {number} depth - Profundidad actual de recursión
 * @returns {any} - Dato sanitizado
 */
function sanitizeData(data, depth = 0) {
  // Prevenir recursión infinita
  if (depth > 5) {
    return '[Max Depth Reached]';
  }

  // Null o undefined
  if (data === null || data === undefined) {
    return data;
  }

  // String - ocultar si parece sensible
  if (typeof data === 'string') {
    // Si contiene un JWT token
    if (data.match(/^Bearer\s+[\w-]+\.[\w-]+\.[\w-]+$/i)) {
      return 'Bearer [REDACTED]';
    }

    // Si parece un token largo
    if (data.length > 20 && data.match(/^[A-Za-z0-9+/=]+$/)) {
      return `[TOKEN:${data.length} chars]`;
    }

    // Reemplazar patrones sensibles
    let sanitized = data;
    SENSITIVE_PATTERNS.forEach(pattern => {
      sanitized = sanitized.replace(pattern, '[REDACTED]');
    });

    return sanitized;
  }

  // Array - sanitizar cada elemento
  if (Array.isArray(data)) {
    return data.map(item => sanitizeData(item, depth + 1));
  }

  // Object - sanitizar cada propiedad
  if (typeof data === 'object') {
    const sanitized = {};

    for (const key in data) {
      const lowerKey = key.toLowerCase();

      // Si la key es sensible, ocultar el valor
      if (SENSITIVE_FIELDS.some(field => lowerKey.includes(field))) {
        sanitized[key] = '[REDACTED]';
        continue;
      }

      // Sanitizar el valor recursivamente
      sanitized[key] = sanitizeData(data[key], depth + 1);
    }

    return sanitized;
  }

  // Otros tipos (number, boolean, etc.) - retornar tal cual
  return data;
}

/**
 * Sanitiza argumentos de log
 * @param {Array} args - Argumentos a sanitizar
 * @returns {Array} - Argumentos sanitizados
 */
function sanitizeArgs(args) {
  return args.map(arg => {
    if (typeof arg === 'string' || typeof arg === 'object') {
      return sanitizeData(arg);
    }
    return arg;
  });
}

/**
 * Logger seguro
 */
const secureLogger = {
  /**
   * Log nivel INFO - sanitiza automáticamente
   */
  info: (...args) => {
    const sanitized = sanitizeArgs(args);
    console.log('[INFO]', ...sanitized);
  },

  /**
   * Log nivel WARN - sanitiza automáticamente
   */
  warn: (...args) => {
    const sanitized = sanitizeArgs(args);
    console.warn('[WARN]', ...sanitized);
  },

  /**
   * Log nivel ERROR - sanitiza automáticamente
   */
  error: (...args) => {
    const sanitized = sanitizeArgs(args);
    console.error('[ERROR]', ...sanitized);
  },

  /**
   * Log nivel DEBUG - sanitiza automáticamente
   * Solo activo en desarrollo
   */
  debug: (...args) => {
    if (process.env.NODE_ENV === 'development') {
      const sanitized = sanitizeArgs(args);
      console.log('[DEBUG]', ...sanitized);
    }
  },

  /**
   * Log sin sanitización (SOLO para debugging en desarrollo)
   * ⚠️ NUNCA usar en producción con datos sensibles
   */
  unsafeDebug: (...args) => {
    if (process.env.NODE_ENV === 'development') {
      console.log('[UNSAFE-DEBUG]', ...args);
    }
  },

  /**
   * Log de autenticación (sanitiza tokens automáticamente)
   */
  auth: (message, details = {}) => {
    const sanitized = sanitizeData(details);
    console.log('[AUTH]', message, sanitized);
  },

  /**
   * Log de seguridad (siempre se loguea, sanitizado)
   */
  security: (message, details = {}) => {
    const sanitized = sanitizeData(details);
    console.warn('[SECURITY]', message, sanitized);
  }
};

/**
 * Función helper para loguear requests HTTP de forma segura
 */
function logRequest(req, message = 'Request') {
  const safeReq = {
    method: req.method,
    url: req.originalUrl || req.url,
    ip: req.ip || req.connection?.remoteAddress,
    userAgent: req.headers?.['user-agent']
  };

  // Agregar información del usuario si existe (sin datos sensibles)
  if (req.user) {
    safeReq.user = {
      id: req.user.id,
      rol: req.user.rol,
      dni: req.user.dni
    };
  }

  secureLogger.info(message, safeReq);
}

/**
 * Función helper para loguear errores HTTP de forma segura
 */
function logError(req, error, message = 'Error occurred') {
  const safeError = {
    message: error.message,
    code: error.code,
    status: error.status || error.statusCode,
    // No incluir stack trace completo en producción
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
  };

  const safeReq = {
    method: req?.method,
    url: req?.originalUrl || req?.url,
    ip: req?.ip || req?.connection?.remoteAddress
  };

  secureLogger.error(message, { request: safeReq, error: safeError });
}

module.exports = {
  secureLogger,
  sanitizeData,
  logRequest,
  logError,
  // Alias para facilitar uso
  logger: secureLogger
};
