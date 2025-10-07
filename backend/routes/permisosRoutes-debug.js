const express = require('express');
const router = express.Router();

console.log('🔍 Importando controlador...');
const controlador = require('../controllers/permisosController-simple');
console.log('📋 Controlador importado:', Object.keys(controlador));

const {
  getPermisos,
  updatePermiso,
  resetPermisosDefecto
} = controlador;

console.log('🔍 Funciones extraídas:');
console.log('getPermisos:', typeof getPermisos);
console.log('updatePermiso:', typeof updatePermiso);
console.log('resetPermisosDefecto:', typeof resetPermisosDefecto);

const { verifyToken } = require('../middlewares/verifyToken');
console.log('🔍 verifyToken:', typeof verifyToken);

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

console.log('🔍 verifySuperAdmin:', typeof verifySuperAdmin);

// Ruta de prueba simple
router.get('/test', (req, res) => {
  res.json({ message: 'Test de permisos funcionando' });
});

// Obtener todos los permisos
router.get('/', verifyToken, verifySuperAdmin, getPermisos);

// Actualizar un permiso específico
router.put('/:id', verifyToken, verifySuperAdmin, updatePermiso);

// Restablecer permisos a valores por defecto
router.post('/reset', verifyToken, verifySuperAdmin, resetPermisosDefecto);

// // Actualizar un permiso específico
// router.put('/:id', verifyToken, verifySuperAdmin, updatePermiso);

// // Restablecer permisos a valores por defecto
// router.post('/reset', verifyToken, verifySuperAdmin, resetPermisosDefecto);

module.exports = router;