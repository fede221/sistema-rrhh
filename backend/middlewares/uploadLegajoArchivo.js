const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configuración de almacenamiento para archivos de legajos
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const legajoId = req.params.legajo_id || req.body.legajo_id;
    const uploadPath = path.join(__dirname, '../uploads/legajos', legajoId.toString());
    
    // Crear directorio si no existe
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const tipoDoc = req.body.tipo_documento || 'documento';
    const timestamp = Date.now();
    const extension = path.extname(file.originalname);
    const nombreSinExt = path.basename(file.originalname, extension);
    const nombreLimpio = nombreSinExt.replace(/[^a-zA-Z0-9]/g, '_');
    
    cb(null, `${tipoDoc}_${nombreLimpio}_${timestamp}${extension}`);
  }
});

// Filtro para tipos de archivos permitidos
const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Tipo de archivo no permitido. Solo se aceptan: JPG, PNG, GIF, PDF, DOC, DOCX'), false);
  }
};

// Configuración de multer para legajos
const uploadLegajoArchivo = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB máximo
  }
});

module.exports = uploadLegajoArchivo;
