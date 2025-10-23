const express = require('express');
const router = express.Router();
const empresasController = require('../controllers/empresasController');
const { verifyToken } = require('../middlewares/verifyToken');
const { imageUpload, handleMulterError } = require('../config/multer');

// Obtener todas las empresas (solo admins)
router.get('/', verifyToken, empresasController.getEmpresas);

// Obtener empresas activas (todos los usuarios autenticados)
router.get('/activas', verifyToken, empresasController.getEmpresasActivas);

// Obtener empresa por ID
router.get('/:id', verifyToken, empresasController.getEmpresaPorId);

// Crear nueva empresa (solo admins) - con validación de imágenes
router.post('/', verifyToken, imageUpload.fields([{ name: 'logo', maxCount: 1 }, { name: 'firma', maxCount: 1 }]), handleMulterError, empresasController.crearEmpresa);

// Actualizar empresa (solo admins) - con validación de imágenes
router.put('/:id', verifyToken, imageUpload.fields([{ name: 'logo', maxCount: 1 }, { name: 'firma', maxCount: 1 }]), handleMulterError, empresasController.actualizarEmpresa);

// Cambiar estado de empresa (solo admins)
router.patch('/:id/estado', verifyToken, empresasController.cambiarEstadoEmpresa);

// Eliminar empresa (solo admins)
router.delete('/:id', verifyToken, empresasController.eliminarEmpresa);

module.exports = router;
