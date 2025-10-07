// backend/routes/usuariosRoutes.js
const express = require('express');
const router = express.Router();
const { verifyToken, verifyAdminRRHH, verifySuperadmin } = require('../middlewares/verifyToken');
const usuariosController = require('../controllers/usuariosController');

router.get('/', verifyToken, usuariosController.listarUsuarios);

router.post('/', verifyToken, usuariosController.crearUsuario);

router.put('/:id', verifyToken, usuariosController.editarUsuario);

router.delete('/:id', verifyToken, usuariosController.eliminarUsuario);

router.patch('/:id/activo', verifyToken, usuariosController.toggleActivo);

router.get('/buscar/:dni', usuariosController.buscarPorDni);

router.post('/cambiar-password', usuariosController.cambiarPassword);

router.post('/importar-masivo', verifyToken, verifySuperadmin, usuariosController.importarUsuariosMasivo);

router.post('/actualizar-legajos', verifyToken, verifySuperadmin, usuariosController.actualizarLegajosFaltantes);

// Endpoint para descargar plantilla Excel para carga masiva
router.get('/plantilla-excel', verifyToken, verifyAdminRRHH, usuariosController.descargarPlantillaExcel);

// Endpoint para obtener el legajo completo del usuario autenticado
router.get('/mi-legajo', verifyToken, usuariosController.miLegajo);

module.exports = router;
