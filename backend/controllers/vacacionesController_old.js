const db = require('../config/db');
const { logError } = require('../utils/errorLogger');
const { validarSolicitudVacaciones } = require('../utils/vacacionesUtils');

/**
 * Controller para módulo de vacaciones
 * Ley 20.744 de Argentina - Contrato de Trabajo
 */
const vacacionesController = {
  /**
   * GET /api/vacaciones/dias-disponibles/:usuario_id
   * Obtiene los días disponibles del usuario para el año actual
   */
  getDiasDisponibles(req, res) {
    try {
      const usuario_id = req.user?.id || req.params.usuario_id;
      
      const query = `
        SELECT 
          u.id as usuario_id,
          u.nombre,
          u.apellido,
          YEAR(NOW()) as anio,
          15 as dias_correspondientes,
          COALESCE(SUM(CASE WHEN vs.estado = 'aprobado' THEN vs.dias_solicitados ELSE 0 END), 0) as dias_tomados,
          COALESCE(SUM(CASE WHEN vs.estado IN ('pendiente_referente', 'pendiente_rh') THEN vs.dias_solicitados ELSE 0 END), 0) as dias_pendientes,
          15 - COALESCE(SUM(CASE WHEN vs.estado = 'aprobado' THEN vs.dias_solicitados ELSE 0 END), 0) as dias_disponibles
        FROM usuarios u
        LEFT JOIN vacaciones_solicitadas vs ON u.id = vs.usuario_id AND YEAR(vs.fecha_inicio) = YEAR(NOW())
        WHERE u.id = ?
        GROUP BY u.id, u.nombre, u.apellido
      `;
      
      db.query(query, [usuario_id], (err, results) => {
        if (err) {
          console.error('❌ Error getDiasDisponibles:', err);
          return res.status(500).json({ error: 'Error al obtener días disponibles' });
        }
        
        if (!results || results.length === 0) {
          return res.json([{
            usuario_id: parseInt(usuario_id),
            anio: new Date().getFullYear(),
            dias_correspondientes: 15,
            dias_tomados: 0,
            dias_pendientes: 0,
            dias_disponibles: 15
          }]);
        }
        
        res.json(results[0]);
      });
    } catch (error) {
      console.error('💥 Error en getDiasDisponibles:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  /**
   * POST /api/vacaciones/crear-solicitud
   * Crea una nueva solicitud de vacaciones
   */
  crearSolicitud(req, res) {
    try {
      const usuario_id = req.user?.id;
      const { fecha_inicio, fecha_fin, comentarios } = req.body;

      console.log('🔍 crearSolicitud:', { usuario_id, fecha_inicio, fecha_fin });

      if (!usuario_id) {
        return res.status(401).json({ error: 'Usuario no autenticado' });
      }

      if (!fecha_inicio || !fecha_fin) {
        return res.status(400).json({ error: 'Fechas requeridas' });
      }

      // Validar según Ley 20.744
      const validacion = validarSolicitudVacaciones(fecha_inicio, fecha_fin, false);
      if (!validacion.valido) {
        return res.status(400).json({
          error: 'Solicitud inválida',
          errores: validacion.errores,
          advertencias: validacion.advertencias
        });
      }

      const dias_solicitados = validacion.diasSolicitados;

      // Verificar solapamientos
      const checkQuery = `
        SELECT COUNT(*) as count 
        FROM vacaciones_solicitadas
        WHERE usuario_id = ? 
        AND DATE(fecha_inicio) <= ? 
        AND DATE(fecha_fin) >= ?
        AND estado NOT IN ('rechazado_referente', 'rechazado_rh')
      `;

      db.query(checkQuery, [usuario_id, fecha_fin, fecha_inicio], (err, results) => {
        if (err) {
          console.error('❌ Error en checkQuery:', err);
          return res.status(500).json({ error: 'Error al verificar solicitudes' });
        }

        if (results[0].count > 0) {
          return res.status(400).json({ error: 'Ya existe solicitud en ese período' });
        }

        // Insertar solicitud
        const insertQuery = `
          INSERT INTO vacaciones_solicitadas 
          (usuario_id, fecha_inicio, fecha_fin, dias_solicitados, estado, comentarios_empleado, anio, created_at)
          VALUES (?, ?, ?, ?, 'pendiente_referente', ?, YEAR(?), NOW())
        `;

        db.query(insertQuery, [
          usuario_id,
          fecha_inicio,
          fecha_fin,
          dias_solicitados,
          comentarios || '',
          fecha_inicio
        ], (insertErr, result) => {
          if (insertErr) {
            console.error('❌ Error en INSERT:', insertErr);
            return res.status(500).json({ error: 'Error al crear solicitud' });
          }

          console.log('✅ Solicitud creada:', result.insertId);
          res.status(201).json({
            message: 'Solicitud creada exitosamente',
            solicitud_id: result.insertId,
            estado: 'pendiente_referente'
          });
        });
      });
    } catch (error) {
      console.error('💥 Error en crearSolicitud:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  /**
   * GET /api/vacaciones/mis-solicitudes
   * Obtiene las solicitudes del usuario autenticado
   */
  misSolicitudes(req, res) {
    try {
      const usuario_id = req.user?.id;

      if (!usuario_id) {
        return res.status(401).json({ error: 'Usuario no autenticado' });
      }

      const query = `
        SELECT 
          id,
          usuario_id,
          fecha_inicio,
          fecha_fin,
          dias_solicitados,
          estado,
          comentarios_empleado,
          referente_id,
          rh_id,
          anio,
          created_at
        FROM vacaciones_solicitadas
        WHERE usuario_id = ?
        ORDER BY fecha_inicio DESC
        LIMIT 50
      `;

      db.query(query, [usuario_id], (err, results) => {
        if (err) {
          console.error('❌ Error misSolicitudes:', err);
          return res.status(500).json({ error: 'Error al obtener solicitudes' });
        }

        res.json(results || []);
      });
    } catch (error) {
      console.error('💥 Error en misSolicitudes:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  /**
   * GET /api/vacaciones/historial-completo/:usuario_id
   * Obtiene el historial completo de vacaciones
   */
  historialCompleto(req, res) {
    try {
      const usuario_id = req.user?.id || req.params.usuario_id;

      const query = `
        SELECT 
          YEAR(fecha_inicio) as anio,
          15 as dias_correspondientes,
          COALESCE(SUM(CASE WHEN estado = 'aprobado' THEN dias_solicitados ELSE 0 END), 0) as dias_tomados,
          15 - COALESCE(SUM(CASE WHEN estado = 'aprobado' THEN dias_solicitados ELSE 0 END), 0) as dias_disponibles,
          COUNT(*) as total_solicitudes
        FROM vacaciones_solicitadas
        WHERE usuario_id = ?
        GROUP BY YEAR(fecha_inicio)
        ORDER BY anio DESC
      `;

      db.query(query, [usuario_id], (err, results) => {
        if (err) {
          console.error('❌ Error historialCompleto:', err);
          return res.status(500).json({ error: 'Error al obtener historial' });
        }

        res.json(results || []);
      });
    } catch (error) {
      console.error('💥 Error en historialCompleto:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  /**
   * GET /api/vacaciones/pendientes-referente
   * Obtiene solicitudes pendientes de aprobación del referente
   */
  solicitudesPendientesReferente(req, res) {
    try {
      const referente_id = req.user?.id;

      if (!referente_id) {
        return res.status(401).json({ error: 'Usuario no autenticado' });
      }

      // TODO: Aquí necesitamos una tabla de relación referente-usuarios
      // Por ahora retornar array vacío
      const query = `
        SELECT 
          vs.id,
          vs.usuario_id,
          u.nombre,
          u.apellido,
          vs.fecha_inicio,
          vs.fecha_fin,
          vs.dias_solicitados,
          vs.estado,
          vs.comentarios_empleado,
          vs.created_at
        FROM vacaciones_solicitadas vs
        JOIN usuarios u ON vs.usuario_id = u.id
        WHERE vs.estado = 'pendiente_referente'
        AND vs.referente_id = ?
        ORDER BY vs.created_at DESC
      `;

      db.query(query, [referente_id], (err, results) => {
        if (err) {
          console.error('❌ Error solicitudesPendientesReferente:', err);
          return res.status(500).json({ error: 'Error al obtener solicitudes' });
        }

        res.json(results || []);
      });
    } catch (error) {
      console.error('💥 Error en solicitudesPendientesReferente:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  /**
   * POST /api/vacaciones/responder-referente
   * El referente aprueba o rechaza una solicitud
   */
  responderReferente(req, res) {
    try {
      const referente_id = req.user?.id;
      const { solicitud_id, aprobada, comentarios } = req.body;

      if (!solicitud_id || aprobada === undefined) {
        return res.status(400).json({ error: 'Datos incompletos' });
      }

      const nuevoEstado = aprobada ? 'pendiente_rh' : 'rechazado_referente';

      const updateQuery = `
        UPDATE vacaciones_solicitadas
        SET 
          estado = ?,
          referente_id = ?,
          referente_comentario = ?,
          fecha_referente = NOW()
        WHERE id = ?
      `;

      db.query(updateQuery, [nuevoEstado, referente_id, comentarios || '', solicitud_id], (err) => {
        if (err) {
          console.error('❌ Error responderReferente:', err);
          return res.status(500).json({ error: 'Error al procesar respuesta' });
        }

        res.json({ 
          message: 'Solicitud procesada',
          estado: nuevoEstado 
        });
      });
    } catch (error) {
      console.error('💥 Error en responderReferente:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  /**
   * GET /api/vacaciones/pendientes-rh
   * Obtiene solicitudes pendientes de aprobación de RH
   */
  solicitudesPendientesRH(req, res) {
    try {
      const query = `
        SELECT 
          vs.id,
          vs.usuario_id,
          u.nombre,
          u.apellido,
          vs.fecha_inicio,
          vs.fecha_fin,
          vs.dias_solicitados,
          vs.estado,
          vs.comentarios_empleado,
          vs.referente_id,
          vs.referente_comentario,
          vs.created_at
        FROM vacaciones_solicitadas vs
        JOIN usuarios u ON vs.usuario_id = u.id
        WHERE vs.estado = 'pendiente_rh'
        ORDER BY vs.created_at DESC
      `;

      db.query(query, (err, results) => {
        if (err) {
          console.error('❌ Error solicitudesPendientesRH:', err);
          return res.status(500).json({ error: 'Error al obtener solicitudes' });
        }

        res.json(results || []);
      });
    } catch (error) {
      console.error('💥 Error en solicitudesPendientesRH:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  /**
   * POST /api/vacaciones/responder-rh
   * RH aprueba o rechaza una solicitud
   */
  responderRH(req, res) {
    try {
      const rh_id = req.user?.id;
      const { solicitud_id, aprobada, comentarios } = req.body;

      if (!solicitud_id || aprobada === undefined) {
        return res.status(400).json({ error: 'Datos incompletos' });
      }

      const nuevoEstado = aprobada ? 'aprobado' : 'rechazado_rh';

      const updateQuery = `
        UPDATE vacaciones_solicitadas
        SET 
          estado = ?,
          rh_id = ?,
          rh_comentario = ?,
          fecha_rh = NOW()
        WHERE id = ?
      `;

      db.query(updateQuery, [nuevoEstado, rh_id, comentarios || '', solicitud_id], (err) => {
        if (err) {
          console.error('❌ Error responderRH:', err);
          return res.status(500).json({ error: 'Error al procesar respuesta' });
        }

        res.json({ 
          message: 'Solicitud procesada',
          estado: nuevoEstado 
        });
      });
    } catch (error) {
      console.error('💥 Error en responderRH:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }
};

module.exports = vacacionesController;
