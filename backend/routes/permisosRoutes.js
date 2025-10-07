const express = require('express');
const router = express.Router();

const { 
  getPermisos, 
  updatePermiso, 
  resetPermisosDefecto,
  getPermisosUsuario,
  agregarPermiso,
  toggleEditarLegajoPropio
} = require('../controllers/permisosController-simple');

const { verifyToken } = require('../middlewares/verifyToken');

// Middleware para verificar que sea superadmin
const verifySuperAdmin = (req, res, next) => {
  if (req.user.rol !== 'superadmin') {
    return res.status(403).json({
      success: false,
      message: 'Acceso denegado. Solo superadministradores pueden gestionar permisos.'
    });
  }
  next();
};

// Ruta de prueba simple
router.get('/test', (req, res) => {
  res.json({ message: 'Test de permisos funcionando' });
});

// Obtener todos los permisos (solo superadmin)
router.get('/', verifyToken, verifySuperAdmin, getPermisos);

// Obtener permisos del usuario actual
router.get('/usuario', verifyToken, getPermisosUsuario);

// Actualizar un permiso específico
router.put('/:id', verifyToken, verifySuperAdmin, updatePermiso);

// Restablecer permisos a valores por defecto
router.post('/reset', verifyToken, verifySuperAdmin, resetPermisosDefecto);

// Agregar un nuevo permiso
router.post('/agregar', verifyToken, verifySuperAdmin, agregarPermiso);

// Gestionar permiso específico para editar legajo propio (admin_rrhh)
router.put('/admin-rrhh/editar-legajo-propio', verifyToken, verifySuperAdmin, toggleEditarLegajoPropio);

module.exports = router;