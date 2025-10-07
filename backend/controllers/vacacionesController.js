const db = require('../config/db');
const { logError } = require('../utils/errorLogger');
const { 
  calcularDiasPorAntiguedad, 
  calcularAntiguedad, 
  validarSolicitudVacaciones,
  verificarRequisitosMínimos 
} = require('../utils/vacacionesUtils');

const vacacionesController = {
  // Obtener días disponibles del usuario con cálculo mejorado
  getDiasDisponibles(req, res) {
    try {
      const { usuario_id } = req.params;
      
      const query = `
        SELECT 
          va.*,
          l.fecha_ingreso,
          e.nombre as empresa_nombre,
          COALESCE(SUM(CASE WHEN vs.estado = 'aprobado' THEN vs.dias_solicitados ELSE 0 END), 0) as dias_tomados,
          COALESCE(SUM(CASE WHEN vs.estado = 'pendiente' THEN vs.dias_solicitados ELSE 0 END), 0) as dias_pendientes,
          (va.dias_correspondientes + va.dias_acumulados_previos + va.dias_no_tomados_año_anterior - 
           COALESCE(SUM(CASE WHEN vs.estado = 'aprobado' THEN vs.dias_solicitados ELSE 0 END), 0)) as dias_disponibles
        FROM vacaciones_anuales va
        INNER JOIN usuarios u ON va.usuario_id = u.id
        LEFT JOIN legajos l ON u.id = l.usuario_id
        LEFT JOIN empresas e ON l.empresa_id = e.id
        LEFT JOIN vacaciones_solicitadas vs ON va.usuario_id = vs.usuario_id AND YEAR(vs.fecha_inicio) = va.anio
        WHERE va.usuario_id = ?
        GROUP BY va.id, va.usuario_id, va.anio, va.dias_correspondientes, va.dias_acumulados_previos, va.dias_no_tomados_año_anterior, l.fecha_ingreso, e.nombre
        ORDER BY va.anio DESC
      `;
      
      db.query(query, [usuario_id], (err, results) => {
        if (err) {
          logError({
            req,
            mensaje: 'Error al obtener días disponibles',
            detalles: err.stack
          });
          return res.status(500).json({ error: 'Error interno del servidor' });
        }
        
        // Enriquecer datos con cálculos de antigüedad
        const resultadosEnriquecidos = results.map(row => {
          const antiguedad = row.fecha_ingreso ? calcularAntiguedad(row.fecha_ingreso) : 0;
          const diasPorAntiguedad = calcularDiasPorAntiguedad(antiguedad);
          
          return {
            ...row,
            antiguedad_años: antiguedad,
            dias_por_antiguedad: diasPorAntiguedad
          };
        });
        
        res.json(resultadosEnriquecidos);
      });
    } catch (error) {
      logError({
        req,
        mensaje: 'Error al obtener días disponibles',
        detalles: error.stack
      });
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  // Solicitar vacaciones con validaciones mejoradas
  solicitarVacaciones(req, res) {
    try {
      const { usuario_id, fecha_inicio, fecha_fin, comentarios } = req.body;
      
      // Validar solicitud según legislación argentina (modo flexible)
      const validacion = validarSolicitudVacaciones(fecha_inicio, fecha_fin, false);
      
      if (!validacion.valido) {
        return res.status(400).json({ 
          error: 'Solicitud inválida',
          errores: validacion.errores 
        });
      }
      
      const dias_solicitados = validacion.diasSolicitados;
      
      // Obtener información del usuario y verificar disponibilidad
      const userQuery = `
        SELECT 
          l.fecha_ingreso,
          va.dias_correspondientes,
          va.dias_acumulados_previos,
          va.dias_no_tomados_año_anterior,
          COALESCE(SUM(CASE WHEN vs.estado = 'aprobado' THEN vs.dias_solicitados ELSE 0 END), 0) as dias_ya_tomados
        FROM usuarios u
        INNER JOIN vacaciones_anuales va ON u.id = va.usuario_id
        LEFT JOIN legajos l ON u.id = l.usuario_id
        LEFT JOIN vacaciones_solicitadas vs ON va.usuario_id = vs.usuario_id AND YEAR(vs.fecha_inicio) = va.anio
        WHERE u.id = ? AND va.anio = YEAR(?)
        GROUP BY u.id, l.fecha_ingreso, va.dias_correspondientes, va.dias_acumulados_previos, va.dias_no_tomados_año_anterior
      `;
      
      db.query(userQuery, [usuario_id, fecha_inicio], (err, userResult) => {
        if (err) {
          logError({
            req,
            mensaje: 'Error al verificar disponibilidad',
            detalles: err.stack
          });
          return res.status(500).json({ error: 'Error interno del servidor' });
        }
        
        if (userResult.length === 0) {
          return res.status(400).json({ error: 'No se encontraron días asignados para este año' });
        }
        
        const userData = userResult[0];
        const antiguedad = userData.fecha_ingreso ? calcularAntiguedad(userData.fecha_ingreso) : 0;
        const diasDisponibles = userData.dias_correspondientes + 
                               userData.dias_acumulados_previos + 
                               userData.dias_no_tomados_año_anterior - 
                               userData.dias_ya_tomados;
        
        if (diasDisponibles < dias_solicitados) {
          return res.status(400).json({ 
            error: `No tienes suficientes días disponibles. Disponibles: ${diasDisponibles}, solicitados: ${dias_solicitados}` 
          });
        }
        
        // Crear la solicitud
        const insertQuery = `
          INSERT INTO vacaciones_solicitadas 
          (usuario_id, anio, fecha_inicio, fecha_fin, dias_solicitados, estado, comentarios, antiguedad_años, fecha_solicitud)
          VALUES (?, YEAR(?), ?, ?, ?, 'pendiente', ?, ?, NOW())
        `;
        
        db.query(insertQuery, [usuario_id, fecha_inicio, fecha_inicio, fecha_fin, dias_solicitados, comentarios, antiguedad], (insertErr, result) => {
          if (insertErr) {
            logError({
              req,
              mensaje: 'Error al crear solicitud',
              detalles: insertErr.stack
            });
            return res.status(500).json({ error: 'Error interno del servidor' });
          }
          
          // Registrar en historial
          const historialQuery = `
            INSERT INTO vacaciones_historial 
            (solicitud_id, accion, realizado_por, fecha, comentarios)
            VALUES (?, 'creado', ?, NOW(), 'Solicitud creada por el usuario')
          `;
          
          db.query(historialQuery, [result.insertId, usuario_id], (histErr) => {
            if (histErr) {
              console.warn('Error al registrar historial:', histErr.message);
            }
            
            res.json({ 
              message: 'Solicitud de vacaciones creada exitosamente',
              id: result.insertId,
              dias_solicitados,
              dias_disponibles_restantes: diasDisponibles - dias_solicitados
            });
          });
        });
      });
    } catch (error) {
      logError({
        req,
        mensaje: 'Error al solicitar vacaciones',
        detalles: error.stack
      });
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  // Obtener solicitudes del usuario
  getMisSolicitudes(req, res) {
    try {
      const { usuario_id } = req.params;
      
      const query = `
        SELECT 
          vs.*,
          u.nombre as nombre_usuario,
          u.apellido as apellido_usuario
        FROM vacaciones_solicitadas vs
        INNER JOIN usuarios u ON vs.usuario_id = u.id
        WHERE vs.usuario_id = ?
        ORDER BY vs.fecha_solicitud DESC
      `;
      
      db.query(query, [usuario_id], (err, results) => {
        if (err) {
          logError({
            req,
            mensaje: 'Error al obtener mis solicitudes',
            detalles: err.stack
          });
          return res.status(500).json({ error: 'Error interno del servidor' });
        }
        
        // Sanitizar datos para evitar valores null/undefined en el frontend
        const sanitizedResults = results.map(row => ({
          ...row,
          estado: row.estado || 'pendiente',
          comentarios: row.comentarios || '',
          observaciones: row.observaciones || '',
          nombre_usuario: row.nombre_usuario || '',
          apellido_usuario: row.apellido_usuario || ''
        }));
        
        res.json(sanitizedResults);
      });
    } catch (error) {
      logError({
        req,
        mensaje: 'Error al obtener mis solicitudes',
        detalles: error.stack
      });
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  // Obtener todas las solicitudes (para administradores)
  getAllSolicitudes(req, res) {
    try {
      const query = `
        SELECT 
          vs.*,
          u.nombre as nombre_usuario,
          u.apellido as apellido_usuario,
          u.dni,
          e.nombre as nombre_empresa
        FROM vacaciones_solicitadas vs
        INNER JOIN usuarios u ON vs.usuario_id = u.id
        LEFT JOIN legajos l ON u.id = l.usuario_id
        LEFT JOIN empresas e ON l.empresa_id = e.id
        ORDER BY vs.fecha_solicitud DESC
      `;
      
      db.query(query, (err, results) => {
        if (err) {
          logError({
            req,
            mensaje: 'Error al obtener todas las solicitudes',
            detalles: err.stack
          });
          return res.status(500).json({ error: 'Error interno del servidor' });
        }
        
        // Sanitizar datos para evitar valores null/undefined en el frontend
        const sanitizedResults = results.map(row => ({
          ...row,
          estado: row.estado || 'pendiente',
          comentarios: row.comentarios || '',
          observaciones: row.observaciones || '',
          nombre_usuario: row.nombre_usuario || '',
          apellido_usuario: row.apellido_usuario || '',
          dni: row.dni || '',
          nombre_empresa: row.nombre_empresa || 'Sin empresa'
        }));
        
        res.json(sanitizedResults);
      });
    } catch (error) {
      logError({
        req,
        mensaje: 'Error al obtener todas las solicitudes',
        detalles: error.stack
      });
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  // Aprobar o rechazar solicitud con historial detallado
  responderSolicitud(req, res) {
    try {
      const { id } = req.params;
      const { estado, comentarios } = req.body;
      const aprobado_por = req.user ? req.user.id : 1; // Del middleware de autenticación
      
      if (!['aprobado', 'rechazado'].includes(estado)) {
        return res.status(400).json({ error: 'Estado inválido' });
      }
      
      // Obtener la solicitud actual
      const getSolicitudQuery = `
        SELECT vs.*, u.nombre, u.apellido 
        FROM vacaciones_solicitadas vs
        INNER JOIN usuarios u ON vs.usuario_id = u.id
        WHERE vs.id = ?
      `;
      
      db.query(getSolicitudQuery, [id], (err, solicitudResult) => {
        if (err) {
          logError({
            req,
            mensaje: 'Error al obtener solicitud',
            detalles: err.stack
          });
          return res.status(500).json({ error: 'Error interno del servidor' });
        }
        
        if (solicitudResult.length === 0) {
          return res.status(404).json({ error: 'Solicitud no encontrada' });
        }
        
        const solicitud = solicitudResult[0];
        
        // Verificar si la solicitud ya fue respondida
        if (solicitud.estado !== 'pendiente') {
          return res.status(400).json({ error: 'Esta solicitud ya fue respondida' });
        }
        
        // Actualizar la solicitud
        const updateQuery = `
          UPDATE vacaciones_solicitadas 
          SET estado = ?, observaciones = ?, aprobado_por = ?, fecha_respuesta = NOW()
          WHERE id = ?
        `;
        
        db.query(updateQuery, [estado, comentarios, aprobado_por, id], (updateErr) => {
          if (updateErr) {
            logError({
              req,
              mensaje: 'Error al actualizar solicitud',
              detalles: updateErr.stack
            });
            return res.status(500).json({ error: 'Error interno del servidor' });
          }
          
          // Registrar en historial
          const accionHistorial = estado === 'aprobado' ? 'aprobado' : 'rechazado';
          const historialQuery = `
            INSERT INTO vacaciones_historial 
            (solicitud_id, accion, realizado_por, fecha, comentarios)
            VALUES (?, ?, ?, NOW(), ?)
          `;
          
          const comentarioHistorial = comentarios || `Solicitud ${estado}`;
          
          db.query(historialQuery, [id, accionHistorial, aprobado_por, comentarioHistorial], (histErr) => {
            if (histErr) {
              console.warn('Error al registrar historial:', histErr.message);
            }
            
            // Si se aprueba, mostrar log
            if (estado === 'aprobado') {
              console.log(`✅ Vacaciones aprobadas para ${solicitud.nombre} ${solicitud.apellido}: ${solicitud.dias_solicitados} días`);
            }
            
            res.json({ 
              message: `Solicitud ${estado} exitosamente`,
              solicitud_id: id,
              usuario: `${solicitud.nombre} ${solicitud.apellido}`,
              dias_afectados: solicitud.dias_solicitados
            });
          });
        });
      });
    } catch (error) {
      logError({
        req,
        mensaje: 'Error al responder solicitud',
        detalles: error.stack
      });
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  // Obtener historial de vacaciones
  getHistorial(req, res) {
    try {
      const { usuario_id } = req.params;
      
      const query = `
        SELECT 
          vh.*,
          vs.fecha_inicio,
          vs.fecha_fin,
          vs.dias_solicitados,
          u.nombre as nombre_usuario,
          u.apellido as apellido_usuario,
          ur.nombre as realizado_por_nombre,
          ur.apellido as realizado_por_apellido
        FROM vacaciones_historial vh
        INNER JOIN vacaciones_solicitadas vs ON vh.solicitud_id = vs.id
        INNER JOIN usuarios u ON vs.usuario_id = u.id
        LEFT JOIN usuarios ur ON vh.realizado_por = ur.id
        WHERE vs.usuario_id = ?
        ORDER BY vh.fecha DESC
      `;
      
      db.query(query, [usuario_id], (err, results) => {
        if (err) {
          logError({
            req,
            mensaje: 'Error al obtener historial',
            detalles: err.stack
          });
          return res.status(500).json({ error: 'Error interno del servidor' });
        }
        
        // Sanitizar datos para evitar valores null/undefined en el frontend
        const sanitizedResults = results.map(row => ({
          ...row,
          accion: row.accion || '',
          comentarios: row.comentarios || '',
          nombre_usuario: row.nombre_usuario || '',
          apellido_usuario: row.apellido_usuario || '',
          realizado_por_nombre: row.realizado_por_nombre || '',
          realizado_por_apellido: row.realizado_por_apellido || ''
        }));
        
        res.json(sanitizedResults);
      });
    } catch (error) {
      logError({
        req,
        mensaje: 'Error al obtener historial',
        detalles: error.stack
      });
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  // Obtener resumen de vacaciones por usuario
  getResumen(req, res) {
    try {
      const { usuario_id } = req.params;
      const año_actual = new Date().getFullYear();
      
      const query = `
        SELECT 
          va.anio,
          va.dias_correspondientes,
          va.dias_acumulados_previos,
          va.dias_no_tomados_año_anterior,
          COALESCE(SUM(CASE WHEN vs.estado = 'aprobado' THEN vs.dias_solicitados ELSE 0 END), 0) as dias_tomados,
          COALESCE(SUM(CASE WHEN vs.estado = 'pendiente' THEN vs.dias_solicitados ELSE 0 END), 0) as dias_pendientes,
          (va.dias_correspondientes + va.dias_acumulados_previos + va.dias_no_tomados_año_anterior - 
           COALESCE(SUM(CASE WHEN vs.estado = 'aprobado' THEN vs.dias_solicitados ELSE 0 END), 0)) as dias_disponibles
        FROM vacaciones_anuales va
        LEFT JOIN vacaciones_solicitadas vs ON va.usuario_id = vs.usuario_id AND YEAR(vs.fecha_inicio) = va.anio
        WHERE va.usuario_id = ?
        GROUP BY va.id, va.anio, va.dias_correspondientes, va.dias_acumulados_previos, va.dias_no_tomados_año_anterior
        ORDER BY va.anio DESC
      `;
      
      db.query(query, [usuario_id], (err, results) => {
        if (err) {
          logError({
            req,
            mensaje: 'Error al obtener resumen',
            detalles: err.stack
          });
          return res.status(500).json({ error: 'Error interno del servidor' });
        }
        res.json(results);
      });
    } catch (error) {
      logError({
        req,
        mensaje: 'Error al obtener resumen',
        detalles: error.stack
      });
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  // Inicializar días de vacaciones para un usuario
  inicializarDiasVacaciones(req, res) {
    try {
      const { usuario_id, anio, fecha_ingreso } = req.body;
      
      if (!fecha_ingreso) {
        return res.status(400).json({ error: 'Fecha de ingreso es requerida' });
      }
      
      const antiguedad = calcularAntiguedad(fecha_ingreso);
      const diasCorrespondientes = calcularDiasPorAntiguedad(antiguedad);
      
      // Verificar si ya existe registro para este año
      const checkQuery = 'SELECT id FROM vacaciones_anuales WHERE usuario_id = ? AND anio = ?';
      
      db.query(checkQuery, [usuario_id, anio], (err, existingResult) => {
        if (err) {
          logError({
            req,
            mensaje: 'Error al verificar registro existente',
            detalles: err.stack
          });
          return res.status(500).json({ error: 'Error interno del servidor' });
        }
        
        if (existingResult.length > 0) {
          return res.status(400).json({ error: 'Ya existe un registro de vacaciones para este año' });
        }
        
        // Obtener días no tomados del año anterior si existe
        const previousYearQuery = `
          SELECT 
            (dias_correspondientes + dias_acumulados_previos + dias_no_tomados_año_anterior - 
             COALESCE(SUM(vs.dias_solicitados), 0)) as dias_no_tomados
          FROM vacaciones_anuales va
          LEFT JOIN vacaciones_solicitadas vs ON va.usuario_id = vs.usuario_id 
            AND vs.estado = 'aprobado' AND YEAR(vs.fecha_inicio) = va.anio
          WHERE va.usuario_id = ? AND va.anio = ?
          GROUP BY va.id
        `;
        
        db.query(previousYearQuery, [usuario_id, anio - 1], (prevErr, previousResult) => {
          if (prevErr) {
            console.warn('Error al obtener datos del año anterior:', prevErr.message);
          }
          
          const diasAcumulados = previousResult && previousResult.length > 0 && previousResult[0].dias_no_tomados > 0 
            ? previousResult[0].dias_no_tomados 
            : 0;
          
          // Crear registro de vacaciones anuales
          const insertQuery = `
            INSERT INTO vacaciones_anuales 
            (usuario_id, anio, dias_correspondientes, dias_acumulados_previos, dias_no_tomados_año_anterior)
            VALUES (?, ?, ?, 0, ?)
          `;
          
          db.query(insertQuery, [usuario_id, anio, diasCorrespondientes, diasAcumulados], (insertErr, result) => {
            if (insertErr) {
              logError({
                req,
                mensaje: 'Error al crear registro de vacaciones',
                detalles: insertErr.stack
              });
              return res.status(500).json({ error: 'Error interno del servidor' });
            }
            
            res.json({
              message: 'Días de vacaciones inicializados exitosamente',
              id: result.insertId,
              anio,
              antiguedad_años: antiguedad,
              dias_correspondientes: diasCorrespondientes,
              dias_acumulados_año_anterior: diasAcumulados,
              total_disponible: diasCorrespondientes + diasAcumulados
            });
          });
        });
      });
      
    } catch (error) {
      logError({
        req,
        mensaje: 'Error al inicializar días de vacaciones',
        detalles: error.stack
      });
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  // Obtener estadísticas de vacaciones para administradores
  getEstadisticas(req, res) {
    try {
      const anio = req.params.anio || new Date().getFullYear();
      
      const query = `
        SELECT 
          COUNT(DISTINCT va.usuario_id) as total_empleados,
          SUM(va.dias_correspondientes) as total_dias_asignados,
          COUNT(CASE WHEN vs.estado = 'pendiente' THEN 1 END) as solicitudes_pendientes,
          COUNT(CASE WHEN vs.estado = 'aprobado' THEN 1 END) as solicitudes_aprobadas,
          COUNT(CASE WHEN vs.estado = 'rechazado' THEN 1 END) as solicitudes_rechazadas,
          SUM(CASE WHEN vs.estado = 'aprobado' THEN vs.dias_solicitados ELSE 0 END) as total_dias_tomados,
          AVG(CASE WHEN vs.estado = 'aprobado' THEN vs.dias_solicitados END) as promedio_dias_por_solicitud
        FROM vacaciones_anuales va
        LEFT JOIN vacaciones_solicitadas vs ON va.usuario_id = vs.usuario_id AND va.anio = YEAR(vs.fecha_inicio)
        WHERE va.anio = ?
      `;
      
      db.query(query, [anio], (err, results) => {
        if (err) {
          logError({
            req,
            mensaje: 'Error al obtener estadísticas generales',
            detalles: err.stack
          });
          return res.status(500).json({ error: 'Error interno del servidor' });
        }
        
        // Estadísticas por empresa
        const empresaQuery = `
          SELECT 
            e.nombre as empresa,
            COUNT(DISTINCT va.usuario_id) as empleados,
            SUM(va.dias_correspondientes) as dias_asignados,
            COUNT(CASE WHEN vs.estado = 'pendiente' THEN 1 END) as pendientes,
            COUNT(CASE WHEN vs.estado = 'aprobado' THEN 1 END) as aprobadas
          FROM vacaciones_anuales va
          INNER JOIN usuarios u ON va.usuario_id = u.id
          LEFT JOIN legajos l ON u.id = l.usuario_id
          LEFT JOIN empresas e ON l.empresa_id = e.id
          LEFT JOIN vacaciones_solicitadas vs ON va.usuario_id = vs.usuario_id AND va.anio = YEAR(vs.fecha_inicio)
          WHERE va.anio = ?
          GROUP BY e.id, e.nombre
          ORDER BY empleados DESC
        `;
        
        db.query(empresaQuery, [anio], (empErr, empresaResults) => {
          if (empErr) {
            logError({
              req,
              mensaje: 'Error al obtener estadísticas por empresa',
              detalles: empErr.stack
            });
            return res.status(500).json({ error: 'Error interno del servidor' });
          }
          
          res.json({
            estadisticas_generales: results[0],
            estadisticas_por_empresa: empresaResults,
            anio: anio
          });
        });
      });
      
    } catch (error) {
      logError({
        req,
        mensaje: 'Error al obtener estadísticas',
        detalles: error.stack
      });
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  // Generar reporte de vacaciones
  generarReporte(req, res) {
    try {
      const { anio, empresa_id, formato } = req.query;
      const añoConsulta = anio || new Date().getFullYear();
      
      let whereClause = 'WHERE va.anio = ?';
      let queryParams = [añoConsulta];
      
      if (empresa_id) {
        whereClause += ' AND l.empresa_id = ?';
        queryParams.push(empresa_id);
      }
      
      const query = `
        SELECT 
          u.legajo,
          u.dni,
          u.nombre,
          u.apellido,
          e.nombre as empresa,
          l.fecha_ingreso,
          va.anio,
          va.dias_correspondientes,
          va.dias_acumulados_previos,
          va.dias_no_tomados_año_anterior,
          COALESCE(SUM(CASE WHEN vs.estado = 'aprobado' THEN vs.dias_solicitados ELSE 0 END), 0) as dias_tomados,
          COALESCE(SUM(CASE WHEN vs.estado = 'pendiente' THEN vs.dias_solicitados ELSE 0 END), 0) as dias_pendientes,
          (va.dias_correspondientes + va.dias_acumulados_previos + va.dias_no_tomados_año_anterior - 
           COALESCE(SUM(CASE WHEN vs.estado = 'aprobado' THEN vs.dias_solicitados ELSE 0 END), 0)) as dias_disponibles
        FROM vacaciones_anuales va
        INNER JOIN usuarios u ON va.usuario_id = u.id
        LEFT JOIN legajos l ON u.id = l.usuario_id
        LEFT JOIN empresas e ON l.empresa_id = e.id
        LEFT JOIN vacaciones_solicitadas vs ON va.usuario_id = vs.usuario_id AND YEAR(vs.fecha_inicio) = va.anio
        ${whereClause}
        GROUP BY va.id, u.id, e.nombre
        ORDER BY e.nombre, u.apellido, u.nombre
      `;
      
      db.query(query, queryParams, (err, results) => {
        if (err) {
          logError({
            req,
            mensaje: 'Error al generar reporte',
            detalles: err.stack
          });
          return res.status(500).json({ error: 'Error interno del servidor' });
        }
        
        // Enriquecer con cálculos de antigüedad
        const reporteCompleto = results.map(row => {
          const antiguedad = row.fecha_ingreso ? calcularAntiguedad(row.fecha_ingreso) : 0;
          return {
            ...row,
            antiguedad_años: antiguedad,
            dias_por_antiguedad_teorico: calcularDiasPorAntiguedad(antiguedad)
          };
        });
        
        res.json({
          reporte: reporteCompleto,
          metadata: {
            anio: añoConsulta,
            empresa_filtro: empresa_id || 'todas',
            total_empleados: reporteCompleto.length,
            fecha_generacion: new Date().toISOString()
          }
        });
      });
      
    } catch (error) {
      logError({
        req,
        mensaje: 'Error al generar reporte',
        detalles: error.stack
      });
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  // Buscar empleado por DNI para gestión de vacaciones
  buscarEmpleadoPorDni(req, res) {
    try {
      const { dni } = req.params;
      const añoActual = new Date().getFullYear();
      
      const query = `
        SELECT 
          u.id,
          u.legajo,
          u.dni,
          u.nombre,
          u.apellido,
          l.fecha_ingreso,
          e.nombre as empresa_nombre,
          va.anio,
          va.dias_correspondientes,
          va.dias_acumulados_previos,
          va.dias_no_tomados_año_anterior,
          COALESCE(SUM(CASE WHEN vs.estado = 'aprobado' THEN vs.dias_solicitados ELSE 0 END), 0) as dias_tomados,
          COALESCE(SUM(CASE WHEN vs.estado = 'pendiente' THEN vs.dias_solicitados ELSE 0 END), 0) as dias_pendientes,
          (va.dias_correspondientes + va.dias_acumulados_previos + va.dias_no_tomados_año_anterior - 
           COALESCE(SUM(CASE WHEN vs.estado = 'aprobado' THEN vs.dias_solicitados ELSE 0 END), 0)) as dias_disponibles
        FROM usuarios u
        LEFT JOIN legajos l ON u.id = l.usuario_id
        LEFT JOIN empresas e ON l.empresa_id = e.id
        LEFT JOIN vacaciones_anuales va ON u.id = va.usuario_id AND va.anio = ?
        LEFT JOIN vacaciones_solicitadas vs ON va.usuario_id = vs.usuario_id AND YEAR(vs.fecha_inicio) = va.anio
        WHERE u.dni = ? AND u.activo = 1
        GROUP BY u.id, u.legajo, u.dni, u.nombre, u.apellido, l.fecha_ingreso, e.nombre, va.anio, va.dias_correspondientes, va.dias_acumulados_previos, va.dias_no_tomados_año_anterior
        ORDER BY va.anio DESC
      `;
      
      db.query(query, [añoActual, dni], (err, results) => {
        if (err) {
          logError({
            req,
            mensaje: 'Error al buscar empleado por DNI',
            detalles: err.stack
          });
          return res.status(500).json({ error: 'Error interno del servidor' });
        }
        
        if (results.length === 0) {
          return res.status(404).json({ error: 'No se encontró empleado con ese DNI' });
        }
        
        const empleado = results[0];
        
        // Calcular antigüedad si hay fecha de ingreso
        if (empleado.fecha_ingreso) {
          const antiguedad = calcularAntiguedad(empleado.fecha_ingreso);
          empleado.antiguedad_años = antiguedad;
          empleado.dias_por_antiguedad = calcularDiasPorAntiguedad(antiguedad);
        }
        
        res.json(empleado);
      });
    } catch (error) {
      logError({
        req,
        mensaje: 'Error al buscar empleado por DNI',
        detalles: error.stack
      });
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  // Agregar días adicionales de vacaciones
  agregarDiasAdicionales(req, res) {
    try {
      const { usuario_id, dias_adicionales, motivo, anio } = req.body;
      const agregado_por = req.user ? req.user.id : 1; // Del middleware de autenticación
      
      if (!usuario_id || !dias_adicionales || dias_adicionales <= 0) {
        return res.status(400).json({ error: 'Datos inválidos' });
      }
      
      const añoConsulta = anio || new Date().getFullYear();
      
      // Verificar si existe registro de vacaciones para este año
      const checkQuery = 'SELECT id, dias_acumulados_previos FROM vacaciones_anuales WHERE usuario_id = ? AND anio = ?';
      
      db.query(checkQuery, [usuario_id, añoConsulta], (err, existingResult) => {
        if (err) {
          logError({
            req,
            mensaje: 'Error al verificar registro de vacaciones',
            detalles: err.stack
          });
          return res.status(500).json({ error: 'Error interno del servidor' });
        }
        
        if (existingResult.length === 0) {
          return res.status(404).json({ error: 'No se encontró registro de vacaciones para este año' });
        }
        
        const registroExistente = existingResult[0];
        const nuevoDiasAcumulados = registroExistente.dias_acumulados_previos + parseInt(dias_adicionales);
        
        // Actualizar los días acumulados
        const updateQuery = `
          UPDATE vacaciones_anuales 
          SET dias_acumulados_previos = ?
          WHERE usuario_id = ? AND anio = ?
        `;
        
        db.query(updateQuery, [nuevoDiasAcumulados, usuario_id, añoConsulta], (updateErr) => {
          if (updateErr) {
            logError({
              req,
              mensaje: 'Error al actualizar días adicionales',
              detalles: updateErr.stack
            });
            return res.status(500).json({ error: 'Error interno del servidor' });
          }
          
          // Registrar en historial (opcional - crear tabla de historial de ajustes si no existe)
          const historialQuery = `
            INSERT INTO vacaciones_ajustes_historial 
            (usuario_id, anio, dias_agregados, motivo, realizado_por, fecha)
            VALUES (?, ?, ?, ?, ?, NOW())
          `;
          
          db.query(historialQuery, [usuario_id, añoConsulta, dias_adicionales, motivo || 'Días adicionales agregados', agregado_por], (histErr) => {
            if (histErr) {
              console.warn('Error al registrar historial de ajuste:', histErr.message);
              // No fallar la operación principal por error en historial
            }
            
            res.json({
              message: 'Días adicionales agregados exitosamente',
              usuario_id,
              dias_agregados: dias_adicionales,
              nuevo_total_acumulados: nuevoDiasAcumulados,
              anio: añoConsulta
            });
          });
        });
      });
    } catch (error) {
      logError({
        req,
        mensaje: 'Error al agregar días adicionales',
        detalles: error.stack
      });
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  // Asignar vacaciones para el próximo período (proceso anual)
  asignarVacacionesProximoPeriodo(req, res) {
    try {
      console.log('🔍 Iniciando asignarVacacionesProximoPeriodo');
      console.log('📋 Datos recibidos:', req.body);
      console.log('👤 Usuario:', req.user);
      
      const { anio_destino } = req.body;
      
      if (!anio_destino || anio_destino <= new Date().getFullYear()) {
        console.log('❌ Año inválido:', anio_destino);
        return res.status(400).json({ 
          error: 'Debe especificar un año futuro válido' 
        });
      }

      console.log(`🚀 Iniciando asignación de vacaciones para el año ${anio_destino}...`);

      // Verificar si ya existen asignaciones para ese año
      const verificarQuery = `
        SELECT COUNT(*) as count FROM vacaciones_anuales 
        WHERE anio = ?
      `;
      
      console.log('🔍 Verificando asignaciones existentes...');
      
      db.query(verificarQuery, [anio_destino], (err, verificarResult) => {
        if (err) {
          console.error('❌ Error en verificación:', err);
          logError({
            req,
            mensaje: 'Error al verificar asignaciones existentes',
            detalles: err.stack
          });
          return res.status(500).json({ error: 'Error interno del servidor' });
        }
        
        console.log('✅ Verificación completada:', verificarResult[0]);
        
        if (verificarResult[0].count > 0) {
          console.log('⚠️ Ya existen asignaciones para el año:', anio_destino);
          return res.status(400).json({ 
            error: `Ya existen asignaciones de vacaciones para el año ${anio_destino}` 
          });
        }

        // Obtener todos los empleados activos con legajo
        const empleadosQuery = `
          SELECT 
            u.id, 
            u.nombre, 
            u.apellido, 
            u.dni,
            CONCAT('LEG-', LPAD(u.id, 4, '0')) as legajo,
            l.fecha_ingreso,
            e.nombre as empresa_nombre,
            TIMESTAMPDIFF(YEAR, l.fecha_ingreso, MAKEDATE(?, 1)) as antiguedad_años
          FROM usuarios u
          INNER JOIN legajos l ON u.id = l.usuario_id
          INNER JOIN empresas e ON l.empresa_id = e.id
          WHERE u.activo = 1 
          AND l.fecha_ingreso < MAKEDATE(?, 1)
          AND l.fecha_ingreso IS NOT NULL
          ORDER BY u.apellido, u.nombre
        `;
        
        console.log('🔍 Obteniendo empleados activos...');
        
        db.query(empleadosQuery, [anio_destino, anio_destino], (empErr, empleados) => {
          if (empErr) {
            console.error('❌ Error obteniendo empleados:', empErr);
            logError({
              req,
              mensaje: 'Error al obtener empleados',
              detalles: empErr.stack
            });
            return res.status(500).json({ error: 'Error interno del servidor' });
          }
          
          console.log(`✅ Empleados encontrados: ${empleados.length}`);
          
          if (empleados.length === 0) {
            console.log('⚠️ No se encontraron empleados activos');
            return res.status(404).json({ 
              error: 'No se encontraron empleados activos para asignar vacaciones' 
            });
          }

          let procesados = 0;
          let errores = [];
          const anioAnterior = anio_destino - 1;
          const totalEmpleados = empleados.length;

          console.log(`🚀 Iniciando procesamiento de ${totalEmpleados} empleados`);

          // Función para procesar un empleado
          const procesarEmpleado = (index) => {
            if (index >= empleados.length) {
              // Todos los empleados procesados
              const resultado = {
                success: true,
                message: `Asignación completada para el año ${anio_destino}`,
                procesados: procesados,
                total: totalEmpleados,
                errores: errores
              };

              console.log('🎉 Resultado final:', resultado);
              return res.json(resultado);
            }

            const empleado = empleados[index];
            console.log(`👤 Procesando empleado ${index + 1}/${totalEmpleados}: ${empleado.nombre} ${empleado.apellido}`);

            // Calcular días según antigüedad (Ley Argentina)
            let diasCorrespondientes = 14; // Menos de 5 años
            if (empleado.antiguedad_años >= 20) {
              diasCorrespondientes = 35;
            } else if (empleado.antiguedad_años >= 10) {
              diasCorrespondientes = 28;
            } else if (empleado.antiguedad_años >= 5) {
              diasCorrespondientes = 21;
            }

            console.log(`📅 Empleado: ${empleado.nombre} - Antigüedad: ${empleado.antiguedad_años} años - Días: ${diasCorrespondientes}`);

            // Obtener días acumulados del año anterior
            const acumuladosQuery = `
              SELECT 
                COALESCE(
                  (va.dias_correspondientes + COALESCE(va.dias_acumulados_previos, 0) + COALESCE(va.dias_adicionales, 0)) - 
                  COALESCE((
                    SELECT SUM(vs.dias_solicitados) 
                    FROM vacaciones_solicitadas vs
                    WHERE vs.usuario_id = ? AND vs.anio = ? AND vs.estado = 'aprobado'
                  ), 0), 
                  0
                ) as dias_acumulados
              FROM vacaciones_anuales va
              WHERE va.usuario_id = ? AND va.anio = ?
            `;
            
            db.query(acumuladosQuery, [empleado.id, anioAnterior, empleado.id, anioAnterior], (acErr, acumuladosResult) => {
              // No fallar si no hay datos del año anterior
              const diasAcumulados = acumuladosResult && acumuladosResult.length > 0 ? 
                Math.max(0, acumuladosResult[0].dias_acumulados || 0) : 0;

              console.log(`💰 Días acumulados para ${empleado.nombre}: ${diasAcumulados}`);

              // Crear registro para el nuevo año
              const insertQuery = `
                INSERT INTO vacaciones_anuales 
                (usuario_id, anio, dias_correspondientes, dias_acumulados_previos, dias_adicionales, created_at, updated_at)
                VALUES (?, ?, ?, ?, 0, NOW(), NOW())
              `;
              
              console.log(`💾 Insertando registro para ${empleado.nombre}...`);
              
              db.query(insertQuery, [empleado.id, anio_destino, diasCorrespondientes, diasAcumulados], (insertErr, insertResult) => {
                if (insertErr) {
                  console.error(`❌ Error insertando para ${empleado.nombre}:`, insertErr.message);
                  errores.push({
                    empleado: `${empleado.nombre} ${empleado.apellido}`,
                    error: insertErr.message
                  });
                } else {
                  console.log(`✅ Registro creado para ${empleado.nombre}`);
                  
                  // Registrar en historial
                  const historialQuery = `
                    INSERT INTO vacaciones_ajustes_historial 
                    (usuario_id, anio, dias_agregados, motivo, realizado_por, fecha)
                    VALUES (?, ?, ?, ?, ?, NOW())
                  `;
                  
                  db.query(historialQuery, [
                    empleado.id,
                    anio_destino,
                    diasCorrespondientes,
                    `Asignación automática período ${anio_destino} - ${empleado.antiguedad_años} años antigüedad`,
                    req.user.id
                  ], (histErr) => {
                    if (histErr) {
                      console.warn('⚠️ Error en historial para', empleado.nombre, ':', histErr.message);
                      // No fallar por error en historial
                    } else {
                      console.log(`📝 Historial registrado para ${empleado.nombre}`);
                    }
                  });

                  procesados++;
                  console.log(`✅ Procesado: ${empleado.nombre} ${empleado.apellido} - ${diasCorrespondientes} días (${empleado.antiguedad_años} años)`);
                }

                // Procesar siguiente empleado
                console.log(`⏭️ Continuando con empleado ${index + 2}...`);
                procesarEmpleado(index + 1);
              });
            });
          };

          // Iniciar procesamiento
          console.log('🚀 Iniciando procesamiento...');
          procesarEmpleado(0);
        });
      });

    } catch (error) {
      console.error('💥 Error general en asignarVacacionesProximoPeriodo:', error);
      logError({
        req,
        mensaje: 'Error en asignación de vacaciones',
        detalles: error.stack
      });
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }
};

module.exports = vacacionesController;
