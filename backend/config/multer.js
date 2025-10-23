/**
 * 🛡️ Configuración Segura de Multer para Upload de Archivos
 * Implementa validaciones de tipo MIME, extensión y tamaño
 * Previene uploads maliciosos y ataques de tipo path traversal
 */

const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { log } = require('../utils/logger');
const { uploadLimiter } = require('../middlewares/rateLimiter');

// Crear directorio de uploads si no existe
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  log.info('📁 Directorio de uploads creado', { path: uploadsDir });
}

/**
 * Whitelist de tipos MIME permitidos por categoría
 */
const ALLOWED_MIME_TYPES = {
  images: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],
  documents: [
    'application/pdf',
    'application/msword', // .doc
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
    'application/vnd.ms-excel', // .xls
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
    'text/plain'
  ],
  all: [] // Se llena dinámicamente
};

// Combinar todos los tipos permitidos
ALLOWED_MIME_TYPES.all = [
  ...ALLOWED_MIME_TYPES.images,
  ...ALLOWED_MIME_TYPES.documents
];

/**
 * Whitelist de extensiones permitidas
 */
const ALLOWED_EXTENSIONS = {
  images: ['.jpg', '.jpeg', '.png', '.gif', '.webp'],
  documents: ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.txt'],
  all: []
};

ALLOWED_EXTENSIONS.all = [
  ...ALLOWED_EXTENSIONS.images,
  ...ALLOWED_EXTENSIONS.documents
];

/**
 * Sanitizar nombre de archivo
 * Previene path traversal y caracteres peligrosos
 */
function sanitizeFilename(filename) {
  // Remover path traversal (.., /, \)
  let sanitized = filename.replace(/\.\./g, '').replace(/[\/\\]/g, '');

  // Mantener solo caracteres alfanuméricos, guiones, guiones bajos y puntos
  sanitized = sanitized.replace(/[^a-zA-Z0-9._-]/g, '_');

  // Prevenir múltiples puntos consecutivos
  sanitized = sanitized.replace(/\.{2,}/g, '.');

  // Limitar longitud del nombre
  const ext = path.extname(sanitized);
  const basename = path.basename(sanitized, ext);
  const maxBasenameLength = 200;

  if (basename.length > maxBasenameLength) {
    sanitized = basename.substring(0, maxBasenameLength) + ext;
  }

  return sanitized;
}

/**
 * Configuración de almacenamiento de multer
 */
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    // Sanitizar nombre original
    const sanitizedName = sanitizeFilename(file.originalname);

    // Agregar timestamp para evitar colisiones
    const timestamp = Date.now();
    const ext = path.extname(sanitizedName);
    const basename = path.basename(sanitizedName, ext);

    const filename = `${basename}-${timestamp}${ext}`;

    log.debug('📄 Archivo recibido', {
      original: file.originalname,
      sanitized: filename,
      mimetype: file.mimetype
    });

    cb(null, filename);
  }
});

/**
 * Validador de tipo de archivo
 */
function createFileFilter(allowedTypes = 'all') {
  return function fileFilter(req, file, cb) {
    const ext = path.extname(file.originalname).toLowerCase();
    const mimetype = file.mimetype.toLowerCase();

    // Obtener listas de tipos permitidos según la categoría
    const allowedMimes = ALLOWED_MIME_TYPES[allowedTypes] || ALLOWED_MIME_TYPES.all;
    const allowedExts = ALLOWED_EXTENSIONS[allowedTypes] || ALLOWED_EXTENSIONS.all;

    // Validar MIME type
    const isMimeAllowed = allowedMimes.includes(mimetype);

    // Validar extensión
    const isExtAllowed = allowedExts.includes(ext);

    if (isMimeAllowed && isExtAllowed) {
      log.debug('✅ Archivo validado', {
        filename: file.originalname,
        mimetype: file.mimetype,
        extension: ext
      });
      return cb(null, true);
    }

    // Archivo rechazado
    log.security('❌ Tipo de archivo no permitido', {
      filename: file.originalname,
      mimetype: file.mimetype,
      extension: ext,
      ip: req.ip,
      allowedTypes
    });

    const error = new Error(
      `Tipo de archivo no permitido. Se permiten: ${allowedExts.join(', ')}`
    );
    error.code = 'INVALID_FILE_TYPE';
    cb(error, false);
  };
}

/**
 * Crear configuración de multer con opciones personalizadas
 */
function createUploadConfig(options = {}) {
  const {
    allowedTypes = 'all',        // 'images', 'documents', 'all'
    maxFileSize = 10 * 1024 * 1024,  // 10MB por defecto
    maxFiles = 1,                 // 1 archivo por defecto
    fieldName = 'file'
  } = options;

  return multer({
    storage: storage,
    limits: {
      fileSize: maxFileSize,
      files: maxFiles,
      fields: 10,          // Máximo 10 campos no-file
      parts: maxFiles + 10 // Total de partes (files + fields)
    },
    fileFilter: createFileFilter(allowedTypes)
  });
}

/**
 * Manejador de errores de multer
 */
function handleMulterError(err, req, res, next) {
  if (err instanceof multer.MulterError) {
    // Errores específicos de multer
    let message = 'Error al subir archivo';
    let details = {};

    switch (err.code) {
      case 'LIMIT_FILE_SIZE':
        message = 'El archivo excede el tamaño máximo permitido (10MB)';
        details = { maxSize: '10MB' };
        break;
      case 'LIMIT_FILE_COUNT':
        message = 'Demasiados archivos. Solo se permite un archivo a la vez.';
        break;
      case 'LIMIT_UNEXPECTED_FILE':
        message = 'Campo de archivo inesperado';
        details = { field: err.field };
        break;
      default:
        message = `Error de upload: ${err.message}`;
    }

    log.warn('⚠️  Error de multer', {
      code: err.code,
      message: err.message,
      ip: req.ip
    });

    return res.status(400).json({
      error: message,
      details
    });
  } else if (err) {
    // Otros errores (por ejemplo, INVALID_FILE_TYPE de nuestro fileFilter)
    if (err.code === 'INVALID_FILE_TYPE') {
      return res.status(400).json({
        error: err.message
      });
    }

    log.error('❌ Error inesperado en upload', err);
    return res.status(500).json({
      error: 'Error al procesar el archivo'
    });
  }

  next();
}

/**
 * Configuraciones predefinidas comunes
 */

// Para imágenes (fotos de perfil, logos, etc.)
const imageUpload = createUploadConfig({
  allowedTypes: 'images',
  maxFileSize: 5 * 1024 * 1024, // 5MB para imágenes
  maxFiles: 1
});

// Para documentos (PDFs, Excel, etc.)
const documentUpload = createUploadConfig({
  allowedTypes: 'documents',
  maxFileSize: 10 * 1024 * 1024, // 10MB para documentos
  maxFiles: 1
});

// Para cualquier tipo permitido
const generalUpload = createUploadConfig({
  allowedTypes: 'all',
  maxFileSize: 10 * 1024 * 1024, // 10MB
  maxFiles: 1
});

// Para múltiples archivos
const multipleUpload = createUploadConfig({
  allowedTypes: 'all',
  maxFileSize: 5 * 1024 * 1024, // 5MB por archivo
  maxFiles: 10 // Hasta 10 archivos
});

module.exports = {
  createUploadConfig,
  handleMulterError,
  sanitizeFilename,

  // Configuraciones predefinidas
  imageUpload,
  documentUpload,
  generalUpload,
  multipleUpload,

  // Exportar constantes para referencia
  ALLOWED_MIME_TYPES,
  ALLOWED_EXTENSIONS
};
