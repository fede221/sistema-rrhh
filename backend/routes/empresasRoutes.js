const express = require('express');
const router = express.Router();
const empresasController = require('../controllers/empresasController');
const { verifyToken } = require('../middlewares/verifyToken');
const multer = require('multer');

// 🛡️ Configuración de multer con límites de seguridad para imágenes
const upload = multer({
  dest: 'uploads/',
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB máximo por imagen (logo/firma)
    files: 2 // Máximo 2 archivos (logo + firma)
  }
});

// Obtener todas las empresas (solo admins)
router.get('/', verifyToken, empresasController.getEmpresas);

// Obtener empresas activas (todos los usuarios autenticados)
router.get('/activas', verifyToken, empresasController.getEmpresasActivas);

// Obtener empresa por ID
router.get('/:id', verifyToken, empresasController.getEmpresaPorId);

// Crear nueva empresa (solo admins)
router.post('/', verifyToken, upload.fields([{ name: 'logo', maxCount: 1 }, { name: 'firma', maxCount: 1 }]), empresasController.crearEmpresa);

// Actualizar empresa (solo admins)
router.put('/:id', verifyToken, upload.fields([{ name: 'logo', maxCount: 1 }, { name: 'firma', maxCount: 1 }]), empresasController.actualizarEmpresa);

// Cambiar estado de empresa (solo admins)
router.patch('/:id/estado', verifyToken, empresasController.cambiarEstadoEmpresa);

// Eliminar empresa (solo admins)
router.delete('/:id', verifyToken, empresasController.eliminarEmpresa);

module.exports = router;
