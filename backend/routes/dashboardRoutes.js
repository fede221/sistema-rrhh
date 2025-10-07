const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const { verifyToken } = require('../middlewares/verifyToken');

// Obtener estadísticas generales
router.get('/estadisticas', verifyToken, dashboardController.getEstadisticasGenerales);

// Obtener resumen del perfil
router.get('/perfil', verifyToken, dashboardController.getResumenPerfil);

// Obtener alertas y notificaciones
router.get('/alertas', verifyToken, dashboardController.getAlertas);

module.exports = router;
