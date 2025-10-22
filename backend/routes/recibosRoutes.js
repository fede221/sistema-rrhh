
const express = require('express');
const router = express.Router();
const recibosController = require('../controllers/recibosController');
const multer = require('multer');

// 🛡️ Configuración de multer con límites de seguridad
const upload = multer({
  dest: 'uploads/',
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB máximo por archivo
    files: 1 // Solo 1 archivo por request
  }
});

const { verifyToken } = require('../middlewares/verifyToken');

// Obtener HTML del recibo para el usuario autenticado y periodo
router.get('/html', verifyToken, recibosController.generarReciboHTML);

// Ruta para importar recibos

// Importar recibos
router.post('/importar', verifyToken, upload.single('file'), recibosController.importarRecibos);

// Consultar progreso
router.get('/progreso', recibosController.getImportProgress);

// Cancelar importación
router.post('/cancelar', verifyToken, recibosController.cancelImport);

// Obtener recibos del usuario autenticado
router.get('/mis-recibos', verifyToken, recibosController.getMisRecibos);

// Firmar recibo
router.post('/firmar', verifyToken, recibosController.firmarRecibo);

// Historial de importaciones (solo admins)
router.get('/historial', verifyToken, recibosController.getHistorialImportaciones);

// Estadísticas de importaciones (solo admins)
router.get('/estadisticas', verifyToken, recibosController.getEstadisticasImportaciones);

module.exports = router;
