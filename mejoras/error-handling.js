// Middleware centralizado de manejo de errores
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

// Logger mejorado
const logger = {
  info: (message, meta = {}) => {
    console.log(`ℹ️  ${new Date().toISOString()} - INFO: ${message}`, meta);
  },
  error: (message, error = {}) => {
    console.error(`❌ ${new Date().toISOString()} - ERROR: ${message}`, {
      stack: error.stack,
      ...error
    });
  },
  warn: (message, meta = {}) => {
    console.warn(`⚠️  ${new Date().toISOString()} - WARN: ${message}`, meta);
  }
};

// Middleware global de errores
const globalErrorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log del error
  logger.error('Error caught by global handler', {
    message: error.message,
    stack: error.stack,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip
  });

  // Errores de validación MySQL
  if (err.code === 'ER_DUP_ENTRY') {
    const message = 'Recurso duplicado';
    error = new AppError(message, 400);
  }

  // Error de JWT
  if (err.name === 'JsonWebTokenError') {
    const message = 'Token inválido';
    error = new AppError(message, 401);
  }

  // Error de token expirado
  if (err.name === 'TokenExpiredError') {
    const message = 'Token expirado';
    error = new AppError(message, 401);
  }

  sendErrorResponse(error, res);
};

const sendErrorResponse = (err, res) => {
  // Errores operacionales - enviar al cliente
  if (err.isOperational) {
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message
    });
  } else {
    // Errores de programación - no exponer detalles
    res.status(500).json({
      status: 'error',
      message: 'Algo salió mal!'
    });
  }
};

module.exports = {
  AppError,
  logger,
  globalErrorHandler
};