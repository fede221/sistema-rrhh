const express = require('express');
const router = express.Router();
const legajosController = require('../controllers/legajosController');
const { verifyToken, verifyAdminRRHH, verifySuperadmin } = require('../middlewares/verifyToken');
const uploadLegajoArchivo = require('../middlewares/uploadLegajoArchivo');

// Rutas existentes
router.get('/mi-legajo', verifyToken, legajosController.obtenerMiLegajo);
router.get('/', verifyToken, legajosController.obtenerTodos);
router.get('/empresas', verifyToken, legajosController.obtenerEmpresas);

// Nuevas rutas para gestión de múltiples legajos
router.get('/mis-legajos', verifyToken, legajosController.getMisLegajos);
router.get('/by-dni/:dni', verifyAdminRRHH, legajosController.getLegajosByDNI);
router.post('/nuevo', verifyToken, legajosController.crearLegajo);
router.put('/actualizar/:id', verifyToken, legajosController.actualizarLegajo);
router.delete('/eliminar/:id', verifyToken, legajosController.eliminarLegajo);

// Rutas de administración
router.post('/', verifyAdminRRHH, legajosController.crearLegajo);
router.put('/:id', verifyToken, verifyAdminRRHH, legajosController.editarLegajo);
router.delete('/:id',verifyToken, verifySuperadmin, legajosController.eliminarLegajo);

router.post('/actualizar-masivo', verifyToken, verifySuperadmin, legajosController.actualizarLegajosMasivo);
router.post('/actualizar-datos-adicionales', verifyToken, verifySuperadmin, legajosController.actualizarDatosAdicionales);

// ========== RUTAS PARA ARCHIVOS ADJUNTOS ==========
// Subir archivo (DNI, títulos, certificados, etc.)
router.post('/:legajo_id/archivos', verifyToken, uploadLegajoArchivo.single('archivo'), legajosController.subirArchivo);

// Listar archivos de un legajo
router.get('/:legajo_id/archivos', verifyToken, legajosController.obtenerArchivos);

// Descargar archivo específico
router.get('/:legajo_id/archivos/:archivo_id/descargar', verifyToken, legajosController.descargarArchivo);

// Eliminar archivo (solo admin)
router.delete('/:legajo_id/archivos/:archivo_id', verifyToken, legajosController.eliminarArchivo);

module.exports = router;