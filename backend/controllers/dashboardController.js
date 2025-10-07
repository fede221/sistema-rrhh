const db = require('../config/db');
const { logError } = require('../utils/errorLogger');

// Obtener estadísticas generales del dashboard
exports.getEstadisticasGenerales = async (req, res) => {
  const user = req.user;
  
  try {
    console.log('🔍 Dashboard - Usuario:', user);
    
    const estadisticas = {};
    
    // Estadísticas básicas para todos los usuarios
    const statsBasicas = await new Promise((resolve, reject) => {
      const sql = `
        SELECT 
          (SELECT COUNT(*) FROM usuarios WHERE activo = 1) as usuarios_activos,
          (SELECT COUNT(*) FROM legajos) as total_legajos,
          (SELECT COUNT(*) FROM empresas WHERE activa = 1) as empresas_activas,
          (SELECT COUNT(DISTINCT PeriodoLiquidacion) FROM recibos_excel_raw) as periodos_disponibles
      `;
      
      db.query(sql, (err, results) => {
        if (err) {
          console.log('❌ Error en statsBasicas:', err);
          return reject(err);
        }
        console.log('✅ Stats básicas:', results[0]);
        resolve(results[0]);
      });
    });
    
    estadisticas.basicas = statsBasicas;
    
    // Estadísticas específicas según el rol
    if (user.rol === 'empleado') {
      // Para empleados: sus recibos y estado de legajo
      const misRecibos = await new Promise((resolve, reject) => {
        const sql = `
          SELECT 
            COUNT(*) as total_recibos,
            COUNT(CASE WHEN Firmado = 1 THEN 1 END) as recibos_firmados,
            MAX(PeriodoLiquidacion) as ultimo_periodo
          FROM recibos_excel_raw 
          WHERE DocNumero = ?
        `;
        
        db.query(sql, [user.dni], (err, results) => {
          if (err) return reject(err);
          resolve(results[0]);
        });
      });
      
      estadisticas.empleado = misRecibos;
      
    } else if (user.rol === 'admin_rrhh' || user.rol === 'superadmin') {
      // Para admins: estadísticas detalladas con consultas separadas
      const importacionesHoy = await new Promise((resolve, reject) => {
        db.query("SELECT COUNT(*) as count FROM historial_importaciones_recibos WHERE estado_importacion = 'completada' AND DATE(fecha_importacion) = CURDATE()", (err, results) => {
          if (err) return reject(err);
          resolve(results[0].count);
        });
      });

      const recibosSemana = await new Promise((resolve, reject) => {
        db.query("SELECT COUNT(*) as count FROM historial_importaciones_recibos WHERE DATE(fecha_importacion) >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)", (err, results) => {
          if (err) return reject(err);
          resolve(results[0].count);
        });
      });

      const erroresSemana = await new Promise((resolve, reject) => {
        db.query("SELECT COUNT(*) as count FROM errores WHERE DATE(fecha) >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)", (err, results) => {
          if (err) return reject(err);
          resolve(results[0].count);
        });
      });

      const usuariosNuevosMes = await new Promise((resolve, reject) => {
        db.query("SELECT COUNT(*) as count FROM usuarios WHERE id >= (SELECT MAX(id) - 30 FROM usuarios)", (err, results) => {
          if (err) return reject(err);
          resolve(results[0].count);
        });
      });

      const porcentajeFirmados = await new Promise((resolve, reject) => {
        db.query("SELECT ROUND(AVG(CASE WHEN Firmado = 1 THEN 100 ELSE 0 END), 0) as porcentaje FROM recibos_excel_raw", (err, results) => {
          if (err) return reject(err);
          resolve(results[0].porcentaje || 0);
        });
      });

      const porcentajeUsuarios = await new Promise((resolve, reject) => {
        db.query("SELECT ROUND(AVG(CASE WHEN activo = 1 THEN 100 ELSE 0 END), 0) as porcentaje FROM usuarios", (err, results) => {
          if (err) return reject(err);
          resolve(results[0].porcentaje || 0);
        });
      });

      const porcentajeLegajos = await new Promise((resolve, reject) => {
        db.query("SELECT ROUND(AVG(CASE WHEN telefono_contacto IS NOT NULL AND domicilio IS NOT NULL THEN 100 ELSE 0 END), 0) as porcentaje FROM legajos", (err, results) => {
          if (err) return reject(err);
          resolve(results[0].porcentaje || 0);
        });
      });
      
      // Distribución de usuarios por rol
      const usuariosPorRol = await new Promise((resolve, reject) => {
        const sql = `
          SELECT rol, COUNT(*) as cantidad 
          FROM usuarios 
          WHERE activo = 1 
          GROUP BY rol 
          ORDER BY cantidad DESC
        `;
        
        db.query(sql, (err, results) => {
          if (err) return reject(err);
          resolve(results);
        });
      });
      
      // Estadísticas de recibos por período
      const estadisticasRecibos = await new Promise((resolve, reject) => {
        const sql = `
          SELECT 
            PeriodoLiquidacion,
            COUNT(*) as cantidad,
            COUNT(CASE WHEN Firmado = 1 THEN 1 END) as firmados
          FROM recibos_excel_raw 
          WHERE PeriodoLiquidacion IS NOT NULL
          GROUP BY PeriodoLiquidacion 
          ORDER BY PeriodoLiquidacion DESC 
          LIMIT 6
        `;
        
        db.query(sql, (err, results) => {
          if (err) return reject(err);
          resolve(results);
        });
      });

      // Tendencias simplificadas
      const nuevosUsuarios = await new Promise((resolve, reject) => {
        db.query("SELECT COUNT(*) as count FROM usuarios WHERE id >= (SELECT MAX(id) - 10 FROM usuarios)", (err, results) => {
          if (err) return reject(err);
          resolve(results[0].count);
        });
      });

      const usuariosMesAnterior = await new Promise((resolve, reject) => {
        db.query("SELECT COUNT(*) as count FROM usuarios WHERE id >= (SELECT MAX(id) - 20 FROM usuarios) AND id < (SELECT MAX(id) - 10 FROM usuarios)", (err, results) => {
          if (err) return reject(err);
          resolve(results[0].count);
        });
      });

      const recibosEsteMes = await new Promise((resolve, reject) => {
        db.query("SELECT COUNT(*) as count FROM historial_importaciones_recibos WHERE MONTH(fecha_importacion) = MONTH(NOW()) AND YEAR(fecha_importacion) = YEAR(NOW())", (err, results) => {
          if (err) return reject(err);
          resolve(results[0].count);
        });
      });

      const recibosMesAnterior = await new Promise((resolve, reject) => {
        db.query("SELECT COUNT(*) as count FROM historial_importaciones_recibos WHERE MONTH(fecha_importacion) = MONTH(NOW() - INTERVAL 1 MONTH) AND YEAR(fecha_importacion) = YEAR(NOW() - INTERVAL 1 MONTH)", (err, results) => {
          if (err) return reject(err);
          resolve(results[0].count);
        });
      });

      const firmasCompletadas = await new Promise((resolve, reject) => {
        db.query("SELECT COUNT(*) as count FROM recibos_excel_raw WHERE Firmado = 1", (err, results) => {
          if (err) return reject(err);
          resolve(results[0].count);
        });
      });

      const totalRecibos = await new Promise((resolve, reject) => {
        db.query("SELECT COUNT(*) as count FROM recibos_excel_raw", (err, results) => {
          if (err) return reject(err);
          resolve(results[0].count);
        });
      });

      const erroresPendientes = await new Promise((resolve, reject) => {
        db.query("SELECT COUNT(*) as count FROM errores WHERE DATE(fecha) >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)", (err, results) => {
          if (err) return reject(err);
          resolve(results[0].count);
        });
      });

      const statsAdmin = {
        importaciones_hoy: importacionesHoy,
        recibos_semana: recibosSemana,
        errores_semana: erroresSemana,
        usuarios_nuevos_mes: usuariosNuevosMes,
        porcentaje_firmados: porcentajeFirmados,
        porcentaje_usuarios_activos: porcentajeUsuarios,
        porcentaje_legajos_completos: porcentajeLegajos
      };

      const tendencias = {
        nuevos_usuarios: nuevosUsuarios || 0,
        crecimiento_usuarios: usuariosMesAnterior > 0 ? 
          Math.round(((nuevosUsuarios - usuariosMesAnterior) / usuariosMesAnterior) * 100) : 0,
        recibos_procesados: recibosEsteMes || 0,
        crecimiento_recibos: recibosMesAnterior > 0 ? 
          Math.round(((recibosEsteMes - recibosMesAnterior) / recibosMesAnterior) * 100) : 0,
        firmas_completadas: firmasCompletadas || 0,
        tasa_firmas: totalRecibos > 0 ? 
          Math.round((firmasCompletadas / totalRecibos) * 100) : 0,
        errores_resueltos: Math.max(0, 40 - erroresPendientes),
        errores_pendientes: erroresPendientes || 0
      };
      
      estadisticas.admin = {
        ...statsAdmin,
        recibos_por_periodo: estadisticasRecibos,
        usuarios_por_rol: usuariosPorRol
      };

      estadisticas.tendencias = tendencias;
    }
    
    // Actividad reciente para todos
    const actividadReciente = await new Promise((resolve, reject) => {
      let sql = '';
      let params = [];
      
      if (user.rol === 'empleado') {
        sql = `
          SELECT 
            'recibo' as tipo,
            CONCAT('Recibo del período ', PeriodoLiquidacion) as descripcion,
            CASE 
              WHEN Firmado = 1 THEN 'Firmado'
              ELSE 'Pendiente de firma'
            END as detalle,
            NOW() as fecha
          FROM recibos_excel_raw 
          WHERE DocNumero = ?
          ORDER BY PeriodoLiquidacion DESC 
          LIMIT 5
        `;
        params = [user.dni];
      } else {
        sql = `
          SELECT 
            'importacion' as tipo,
            usuario_importador as detalle,
            fecha_importacion as fecha,
            CONCAT('Importación de ', total_registros, ' recibos - ', estado_importacion) as descripcion
          FROM historial_importaciones_recibos 
          ORDER BY fecha_importacion DESC 
          LIMIT 5
        `;
      }
      
      db.query(sql, params, (err, results) => {
        if (err) return reject(err);
        resolve(results);
      });
    });
    
    estadisticas.actividad_reciente = actividadReciente;
    
    res.json(estadisticas);
    
  } catch (err) {
    logError({ req, mensaje: 'Error al obtener estadísticas del dashboard', detalles: err.stack || String(err) });
    console.error('❌ Error en dashboard:', err);
    res.status(500).json({ error: 'Error al obtener estadísticas' });
  }
};

// Obtener resumen del perfil del usuario
exports.getResumenPerfil = async (req, res) => {
  const user = req.user;
  
  try {
    if (user.rol === 'empleado') {
      // Para empleados: información de su legajo
      const sql = `
        SELECT 
          l.*,
          e.nombre as empresa_nombre,
          e.razon_social as empresa_razon_social
        FROM legajos l
        LEFT JOIN empresas e ON l.empresa_id = e.id
        WHERE l.usuario_id = ?
        LIMIT 1
      `;
      
      db.query(sql, [user.id], (err, results) => {
        if (err) {
          logError({ req, mensaje: 'Error al obtener resumen de perfil', detalles: err.stack || String(err) });
          return res.status(500).json({ error: 'Error al obtener información del perfil' });
        }
        
        if (results.length === 0) {
          return res.json({ mensaje: 'Legajo no encontrado' });
        }
        
        res.json(results[0]);
      });
    } else {
      // Para admins: información básica del usuario
      res.json({
        nombre: user.nombre,
        apellido: user.apellido,
        correo: user.correo,
        rol: user.rol,
        mensaje: 'Perfil de administrador'
      });
    }
    
  } catch (err) {
    logError({ req, mensaje: 'Error inesperado en resumen de perfil', detalles: err.stack || String(err) });
    console.error('❌ Error en resumen de perfil:', err);
    res.status(500).json({ error: 'Error inesperado' });
  }
};

// Obtener alertas y notificaciones
exports.getAlertas = async (req, res) => {
  const user = req.user;
  
  try {
    console.log('🔍 Dashboard getAlertas - Usuario:', user);
    const alertas = [];
    
    if (user.rol === 'empleado') {
      // Alertas para empleados
      
      // Recibos pendientes de firma
      const recibosPendientes = await new Promise((resolve, reject) => {
        const sql = `
          SELECT COUNT(*) as cantidad
          FROM recibos_excel_raw 
          WHERE DocNumero = ? AND (Firmado IS NULL OR Firmado = 0)
        `;
        
        db.query(sql, [user.dni], (err, results) => {
          if (err) return reject(err);
          resolve(results[0].cantidad);
        });
      });
      
      if (recibosPendientes > 0) {
        alertas.push({
          tipo: 'warning',
          titulo: 'Recibos pendientes de firma',
          descripcion: `Tienes ${recibosPendientes} recibos esperando tu firma.`,
          accion: '/recibos',
          icono: 'receipt'
        });
      }
      
      // Verificar si el legajo está completo
      const legajoCompleto = await new Promise((resolve, reject) => {
        const sql = `
          SELECT 
            CASE 
              WHEN telefono_contacto IS NULL OR telefono_contacto = '' THEN 0
              WHEN domicilio IS NULL OR domicilio = '' THEN 0
              WHEN cuenta_bancaria IS NULL OR cuenta_bancaria = '' THEN 0
              ELSE 1
            END as completo
          FROM legajos 
          WHERE usuario_id = ?
        `;
        
        db.query(sql, [user.id], (err, results) => {
          if (err) return reject(err);
          resolve(results[0]?.completo || 0);
        });
      });
      
      if (!legajoCompleto) {
        alertas.push({
          tipo: 'info',
          titulo: 'Completar información personal',
          descripcion: 'Tu legajo tiene información faltante. Complétalo para evitar problemas con los pagos.',
          accion: '/legajo',
          icono: 'person'
        });
      }
      
    } else if (user.rol === 'admin_rrhh' || user.rol === 'superadmin') {
      // Alertas para administradores
      
      // Errores recientes
      const erroresRecientes = await new Promise((resolve, reject) => {
        const sql = `
          SELECT COUNT(*) as cantidad
          FROM errores 
          WHERE DATE(fecha) >= DATE_SUB(CURDATE(), INTERVAL 1 DAY)
        `;
        
        db.query(sql, (err, results) => {
          if (err) return reject(err);
          resolve(results[0].cantidad);
        });
      });
      
      if (erroresRecientes > 10) {
        alertas.push({
          tipo: 'error',
          titulo: 'Errores del sistema',
          descripcion: `Se registraron ${erroresRecientes} errores en las últimas 24 horas.`,
          accion: '/errores-log',
          icono: 'error'
        });
      }
      
      // Importaciones fallidas
      const importacionesFallidas = await new Promise((resolve, reject) => {
        const sql = `
          SELECT COUNT(*) as cantidad
          FROM historial_importaciones_recibos 
          WHERE estado_importacion IN ('error', 'cancelada') 
          AND DATE(fecha_importacion) >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
        `;
        
        db.query(sql, (err, results) => {
          if (err) return reject(err);
          resolve(results[0].cantidad);
        });
      });
      
      if (importacionesFallidas > 0) {
        alertas.push({
          tipo: 'warning',
          titulo: 'Importaciones con problemas',
          descripcion: `${importacionesFallidas} importaciones fallaron en los últimos 7 días.`,
          accion: '/recibos',
          icono: 'upload'
        });
      }
      
      // Usuarios sin legajo
      const usuariosSinLegajo = await new Promise((resolve, reject) => {
        const sql = `
          SELECT COUNT(*) as cantidad
          FROM usuarios u
          LEFT JOIN legajos l ON u.id = l.usuario_id
          WHERE u.activo = 1 AND l.id IS NULL AND u.rol = 'empleado'
        `;
        
        db.query(sql, (err, results) => {
          if (err) return reject(err);
          resolve(results[0].cantidad);
        });
      });
      
      if (usuariosSinLegajo > 0) {
        alertas.push({
          tipo: 'info',
          titulo: 'Usuarios sin legajo',
          descripcion: `${usuariosSinLegajo} usuarios activos no tienen legajo asignado.`,
          accion: '/legajos-admin',
          icono: 'person_add'
        });
      }
    }
    
    res.json(alertas);
    
  } catch (err) {
    console.error('❌ Error completo en getAlertas:', err);
    console.error('❌ Error stack:', err.stack);
    console.error('❌ Usuario que causó el error:', user);
    logError({ req, mensaje: 'Error al obtener alertas del dashboard', detalles: err.stack || String(err) });
    res.status(500).json({ error: 'Error al obtener alertas' });
  }
};
