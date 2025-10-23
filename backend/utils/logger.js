/**
 * 🔍 Sistema de Logging Profesional con Winston
 * Reemplaza console.log con logging estructurado, niveles y rotación de archivos
 */

const winston = require('winston');
const path = require('path');

// Crear directorio de logs si no existe
const logsDir = path.join(__dirname, '../logs');
const fs = require('fs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Definir niveles personalizados
const customLevels = {
  levels: {
    error: 0,
    warn: 1,
    security: 2,
    info: 3,
    http: 4,
    debug: 5
  },
  colors: {
    error: 'red',
    warn: 'yellow',
    security: 'magenta',
    info: 'green',
    http: 'cyan',
    debug: 'blue'
  }
};

winston.addColors(customLevels.colors);

// Formato personalizado para consola
const consoleFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.colorize({ all: true }),
  winston.format.printf(({ timestamp, level, message, ...metadata }) => {
    let msg = `${timestamp} [${level}]: ${message}`;

    // Agregar metadata si existe
    if (Object.keys(metadata).length > 0) {
      // Filtrar metadata sensible
      const sanitized = sanitizeMetadata(metadata);
      if (Object.keys(sanitized).length > 0) {
        msg += ` ${JSON.stringify(sanitized)}`;
      }
    }

    return msg;
  })
);

// Formato para archivos (JSON estructurado)
const fileFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.metadata(),
  winston.format.json()
);

// Función para sanitizar metadata sensible
function sanitizeMetadata(metadata) {
  const sensitiveKeys = ['password', 'token', 'secret', 'authorization', 'cookie'];
  const sanitized = { ...metadata };

  Object.keys(sanitized).forEach(key => {
    const lowerKey = key.toLowerCase();
    if (sensitiveKeys.some(sensitive => lowerKey.includes(sensitive))) {
      sanitized[key] = '[REDACTED]';
    }
  });

  return sanitized;
}

// Crear logger principal
const logger = winston.createLogger({
  levels: customLevels.levels,
  level: process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug'),
  format: fileFormat,
  transports: [
    // Errores en archivo separado
    new winston.transports.File({
      filename: path.join(logsDir, 'error.log'),
      level: 'error',
      maxsize: 10485760, // 10MB
      maxFiles: 5,
      tailable: true
    }),

    // Logs de seguridad en archivo separado
    new winston.transports.File({
      filename: path.join(logsDir, 'security.log'),
      level: 'security',
      maxsize: 10485760, // 10MB
      maxFiles: 5,
      tailable: true
    }),

    // Todos los logs combinados
    new winston.transports.File({
      filename: path.join(logsDir, 'combined.log'),
      maxsize: 10485760, // 10MB
      maxFiles: 10,
      tailable: true
    })
  ],

  // Manejar excepciones no capturadas
  exceptionHandlers: [
    new winston.transports.File({
      filename: path.join(logsDir, 'exceptions.log'),
      maxsize: 10485760,
      maxFiles: 3
    })
  ],

  // Manejar rechazos de promesas no capturados
  rejectionHandlers: [
    new winston.transports.File({
      filename: path.join(logsDir, 'rejections.log'),
      maxsize: 10485760,
      maxFiles: 3
    })
  ]
});

// En desarrollo, también loguear a consola
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: consoleFormat
  }));
}

// En producción, consola con formato simple
if (process.env.NODE_ENV === 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
      winston.format.printf(({ timestamp, level, message }) => {
        return `${timestamp} [${level.toUpperCase()}]: ${message}`;
      })
    ),
    level: 'info' // Solo info y superiores en consola de producción
  }));
}

// Métodos de conveniencia con contexto
const log = {
  /**
   * Log general informativo
   */
  info: (message, metadata = {}) => {
    logger.info(message, sanitizeMetadata(metadata));
  },

  /**
   * Log de errores
   */
  error: (message, error = null, metadata = {}) => {
    const errorData = error ? {
      message: error.message,
      stack: error.stack,
      ...metadata
    } : metadata;

    logger.error(message, sanitizeMetadata(errorData));
  },

  /**
   * Log de advertencias
   */
  warn: (message, metadata = {}) => {
    logger.warn(message, sanitizeMetadata(metadata));
  },

  /**
   * Log de seguridad (autenticación, autorización, etc.)
   */
  security: (message, metadata = {}) => {
    logger.log('security', message, sanitizeMetadata(metadata));
  },

  /**
   * Log de requests HTTP
   */
  http: (message, metadata = {}) => {
    logger.http(message, sanitizeMetadata(metadata));
  },

  /**
   * Log de debug (solo en desarrollo)
   */
  debug: (message, metadata = {}) => {
    logger.debug(message, sanitizeMetadata(metadata));
  },

  /**
   * Log de eventos de autenticación
   */
  auth: (message, metadata = {}) => {
    logger.log('security', `[AUTH] ${message}`, sanitizeMetadata(metadata));
  },

  /**
   * Log de operaciones de base de datos
   */
  db: (message, metadata = {}) => {
    logger.debug(`[DB] ${message}`, sanitizeMetadata(metadata));
  },

  /**
   * Log de inicio de aplicación
   */
  startup: (message, metadata = {}) => {
    logger.info(`[STARTUP] ${message}`, metadata);
  },

  /**
   * Log de operaciones de API
   */
  api: (message, metadata = {}) => {
    logger.info(`[API] ${message}`, sanitizeMetadata(metadata));
  }
};

// Exportar logger principal y métodos de conveniencia
module.exports = {
  logger,
  log,
  // Compatibilidad con secureLogger existente
  default: log
};
