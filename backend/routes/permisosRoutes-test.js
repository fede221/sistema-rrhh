const express = require('express');
const router = express.Router();
const {
  getPermisos,
  updatePermiso,
  resetPermisosDefecto
} = require('../controllers/permisosController-simple');
const verifyToken = require('../middlewares/verifyToken');

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

// Obtener todos los permisos
router.get('/', verifyToken, verifySuperAdmin, getPermisos);

// Actualizar un permiso individual
router.put('/:id', verifyToken, verifySuperAdmin, updatePermiso);

// Restablecer permisos por defecto de un rol
router.post('/reset/:rol', verifyToken, verifySuperAdmin, resetPermisosDefecto);

module.exports = router;