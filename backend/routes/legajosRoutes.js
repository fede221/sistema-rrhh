const express = require('express');
const router = express.Router();
const legajosController = require('../controllers/legajosController');
const { verifyToken, verifyAdminRRHH, verifySuperadmin } = require('../middlewares/verifyToken');

// Rutas existentes
router.get('/mi-legajo', verifyToken, legajosController.obtenerMiLegajo);
router.put('/mi-legajo/datos-personales', verifyToken, legajosController.actualizarMisDatosPersonales);
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

module.exports = router;