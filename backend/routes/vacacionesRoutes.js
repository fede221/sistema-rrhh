const express = require('express');
const router = express.Router();
const vacacionesController = require('../controllers/vacacionesController');
const { verifyToken } = require('../middlewares/verifyToken');
const { verifyVacacionesApprover, verifyAdmin } = require('../middlewares/verifyVacacionesPermissions');

// Todas las rutas requieren autenticación básica
router.use(verifyToken);

// Rutas para empleados (cualquier usuario autenticado)
router.get('/dias-disponibles/:usuario_id', vacacionesController.getDiasDisponibles);
router.get('/mis-solicitudes/:usuario_id', vacacionesController.getMisSolicitudes);
router.get('/historial/:usuario_id', vacacionesController.getHistorial);
router.get('/resumen/:usuario_id', vacacionesController.getResumen);
router.post('/solicitar', vacacionesController.solicitarVacaciones);

// Rutas para referentes de vacaciones (pueden aprobar solicitudes)
router.get('/todas-solicitudes', verifyVacacionesApprover, vacacionesController.getAllSolicitudes);
router.put('/responder/:id', verifyVacacionesApprover, vacacionesController.responderSolicitud);
router.get('/estadisticas/:anio', verifyVacacionesApprover, vacacionesController.getEstadisticas);
router.get('/estadisticas', verifyVacacionesApprover, vacacionesController.getEstadisticas);

// Rutas para administradores (gestión completa del sistema)
router.post('/inicializar', verifyAdmin, vacacionesController.inicializarDiasVacaciones);
router.get('/reporte', verifyAdmin, vacacionesController.generarReporte);
router.get('/buscar-empleado/:dni', verifyAdmin, vacacionesController.buscarEmpleadoPorDni);
router.post('/agregar-dias', verifyAdmin, vacacionesController.agregarDiasAdicionales);
router.post('/asignar-proximo-periodo', verifyAdmin, vacacionesController.asignarVacacionesProximoPeriodo);

module.exports = router;
