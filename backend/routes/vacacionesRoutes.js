const express = require('express');
const router = express.Router();
const vacacionesController = require('../controllers/vacacionesController');
const { verifyToken } = require('../middlewares/verifyToken');
const { verifyVacacionesApprover, verifyAdmin } = require('../middlewares/verifyVacacionesPermissions');

// Todas las rutas requieren autenticación básica
router.use(verifyToken);

// ========== RUTAS PARA EMPLEADOS ==========
router.get('/dias-disponibles/:usuario_id', vacacionesController.getDiasDisponibles);
router.post('/crear-solicitud', vacacionesController.crearSolicitud);
router.get('/mis-solicitudes/:usuario_id', vacacionesController.misSolicitudes);
router.get('/historial/:usuario_id', vacacionesController.historialCompleto);
router.get('/resumen/:usuario_id', vacacionesController.getResumen);

// ========== RUTAS PARA REFERENTES ==========
router.get('/pendientes-referente', verifyVacacionesApprover, vacacionesController.solicitudesPendientesReferente);
router.put('/responder-referente/:id', verifyVacacionesApprover, vacacionesController.responderReferente);

// ========== RUTAS PARA RH/ADMIN ==========
router.get('/pendientes-rh', verifyAdmin, vacacionesController.solicitudesPendientesRH);
router.put('/responder-rh/:id', verifyAdmin, vacacionesController.responderRH);

module.exports = router;
