const express = require('express');
const router = express.Router();

const {
  getEmpleadosACargo,
  getRecibosEmpleados,
  getEstadisticasEquipo
} = require('../controllers/referenteController');

const { verifyToken } = require('../middlewares/verifyToken');

// Middleware para verificar que sea referente o superadmin
const verifyReferente = (req, res, next) => {
  if (req.user.rol !== 'referente' && req.user.rol !== 'superadmin') {
    return res.status(403).json({
      success: false,
      message: 'Acceso denegado. Solo referentes y superadministradores pueden acceder a esta funcionalidad.'
    });
  }
  next();
};

// Obtener empleados a cargo
router.get('/empleados', verifyToken, verifyReferente, getEmpleadosACargo);

// Obtener recibos de empleados a cargo
router.get('/recibos', verifyToken, verifyReferente, getRecibosEmpleados);

// Obtener estadísticas del equipo
router.get('/estadisticas', verifyToken, verifyReferente, getEstadisticasEquipo);

module.exports = router;