const db = require('../config/db');

// Obtener empleados a cargo del referente
const getEmpleadosACargo = (req, res) => {
  try {
    const { id: referenteId, rol } = req.user;

    let query, queryParams;

    if (rol === 'superadmin') {
      // Superadmin puede ver todos los empleados
      query = `
        SELECT 
          u.id,
          u.nombre,
          u.apellido,
          u.dni,
          l.fecha_ingreso,
          u.activo,
          COUNT(DISTINCT r.id) as total_recibos,
          MAX(r.PeriodoLiquidacion) as ultimo_periodo
        FROM usuarios u
        LEFT JOIN legajos l ON u.id = l.usuario_id
        LEFT JOIN recibos_excel_raw r ON (
          r.Legajo = u.legajo 
          OR r.Legajo = l.numero_legajo 
          OR r.Legajo = REPLACE(REPLACE(l.numero_legajo, 'R0', ''), 'R', '')
        )
        WHERE u.rol = 'empleado'
        GROUP BY u.id, u.nombre, u.apellido, u.dni, l.fecha_ingreso, u.activo
        ORDER BY u.apellido, u.nombre
      `;
      queryParams = [];
    } else {
      // Referente solo ve sus empleados asignados
      query = `
        SELECT 
          u.id,
          u.nombre,
          u.apellido,
          u.dni,
          l.fecha_ingreso,
          u.activo,
          COUNT(DISTINCT r.id) as total_recibos,
          MAX(r.PeriodoLiquidacion) as ultimo_periodo
        FROM usuarios u
        LEFT JOIN legajos l ON u.id = l.usuario_id
        LEFT JOIN recibos_excel_raw r ON (
          r.Legajo = u.legajo 
          OR r.Legajo = l.numero_legajo 
          OR r.Legajo = REPLACE(REPLACE(l.numero_legajo, 'R0', ''), 'R', '')
        )
        WHERE u.referente_id = ? AND u.rol = 'empleado'
        GROUP BY u.id, u.nombre, u.apellido, u.dni, l.fecha_ingreso, u.activo
        ORDER BY u.apellido, u.nombre
      `;
      queryParams = [referenteId];
    }

    db.query(query, queryParams, (err, results) => {
      if (err) {
        console.error('Error al obtener empleados a cargo:', err);
        return res.status(500).json({
          success: false,
          message: 'Error al obtener empleados a cargo',
          error: err.message
        });
      }

      res.json({
        success: true,
        data: results
      });
    });

  } catch (error) {
    console.error('Error al obtener empleados a cargo:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener empleados a cargo',
      error: error.message
    });
  }
};

// Obtener recibos de empleados a cargo
const getRecibosEmpleados = (req, res) => {
  try {
    const { id: referenteId, rol } = req.user;
    const { empleadoId, periodo } = req.query;

    let query = `
      SELECT 
        r.*,
        u.id as empleado_id,
        u.nombre,
        u.apellido,
        e.nombre as empresa_nombre,
        e.razon_social as empresa_razon_social,
        e.cuit as empresa_cuit,
        e.direccion as empresa_direccion,
        e.logo_url as empresa_logo_url,
        e.firma_url as empresa_firma_url,
        r.PeriodoLiquidacion as periodo,
        r.fecha_firma,
        r.tipo_liquidacion,
        l.numero_legajo
      FROM recibos_excel_raw r
      INNER JOIN usuarios u ON r.Legajo = u.legajo
      LEFT JOIN legajos l ON r.DocNumero = l.nro_documento AND (r.Legajo = l.numero_legajo OR r.Legajo = REPLACE(REPLACE(l.numero_legajo, 'R0', ''), 'R', ''))
      LEFT JOIN empresas e ON l.empresa_id = e.id
    `;

    let params = [];

    if (rol === 'superadmin') {
      // Superadmin puede ver recibos de todos los empleados
      query += ' WHERE u.rol = \'empleado\'';
    } else {
      // Referente solo ve recibos de sus empleados
      query += ' WHERE u.referente_id = ?';
      params.push(referenteId);
    }

    if (empleadoId) {
      query += ' AND u.id = ?';
      params.push(empleadoId);
    }

    if (periodo) {
      query += ' AND r.PeriodoLiquidacion = ?';
      params.push(periodo);
    }

    query += ' ORDER BY r.PeriodoLiquidacion DESC, u.apellido, u.nombre, r.ConcNro';

    db.query(query, params, (err, results) => {
      if (err) {
        console.error('Error al obtener recibos de empleados:', err);
        return res.status(500).json({
          success: false,
          message: 'Error al obtener recibos de empleados',
          error: err.message
        });
      }

      res.json({
        success: true,
        data: results
      });
    });

  } catch (error) {
    console.error('Error al obtener recibos de empleados:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener recibos de empleados',
      error: error.message
    });
  }
};

// Obtener estadísticas del equipo
const getEstadisticasEquipo = (req, res) => {
  try {
    const { id: referenteId, rol } = req.user;

    let query, queryParams;

    if (rol === 'superadmin') {
      // Superadmin ve estadísticas de todos los empleados
      query = `
        SELECT 
          COUNT(DISTINCT u.id) as total_empleados,
          COUNT(DISTINCT CASE WHEN r.id IS NOT NULL THEN u.id END) as empleados_con_recibos,
          COUNT(DISTINCT CASE WHEN r.fecha_firma IS NOT NULL THEN u.id END) as empleados_con_firmas,
          COUNT(DISTINCT r.PeriodoLiquidacion) as periodos_activos,
          SUM(CASE WHEN r.ConcImpHabCRet > 0 THEN r.ConcImpHabCRet ELSE 0 END) as total_haberes,
          SUM(CASE WHEN r.ConcImpHabCRet < 0 THEN ABS(r.ConcImpHabCRet) ELSE 0 END) as total_descuentos
        FROM usuarios u
        LEFT JOIN recibos_excel_raw r ON u.legajo = r.Legajo
        WHERE u.rol = 'empleado'
      `;
      queryParams = [];
    } else {
      // Referente solo ve estadísticas de sus empleados
      query = `
        SELECT 
          COUNT(DISTINCT u.id) as total_empleados,
          COUNT(DISTINCT CASE WHEN r.id IS NOT NULL THEN u.id END) as empleados_con_recibos,
          COUNT(DISTINCT CASE WHEN r.fecha_firma IS NOT NULL THEN u.id END) as empleados_con_firmas,
          COUNT(DISTINCT r.PeriodoLiquidacion) as periodos_activos,
          SUM(CASE WHEN r.ConcImpHabCRet > 0 THEN r.ConcImpHabCRet ELSE 0 END) as total_haberes,
          SUM(CASE WHEN r.ConcImpHabCRet < 0 THEN ABS(r.ConcImpHabCRet) ELSE 0 END) as total_descuentos
        FROM usuarios u
        LEFT JOIN recibos_excel_raw r ON u.legajo = r.Legajo
        WHERE u.referente_id = ? AND u.rol = 'empleado'
      `;
      queryParams = [referenteId];
    }

    db.query(query, queryParams, (err, results) => {
      if (err) {
        console.error('Error al obtener estadísticas del equipo:', err);
        return res.status(500).json({
          success: false,
          message: 'Error al obtener estadísticas del equipo',
          error: err.message
        });
      }

      const stats = results[0] || {};
      
      // Calcular porcentajes
      stats.porcentaje_con_recibos = stats.total_empleados > 0 
        ? ((stats.empleados_con_recibos / stats.total_empleados) * 100).toFixed(1)
        : 0;
        
      stats.porcentaje_con_firmas = stats.empleados_con_recibos > 0
        ? ((stats.empleados_con_firmas / stats.empleados_con_recibos) * 100).toFixed(1)
        : 0;

      res.json({
        success: true,
        data: stats
      });
    });

  } catch (error) {
    console.error('Error al obtener estadísticas del equipo:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener estadísticas del equipo',
      error: error.message
    });
  }
};

module.exports = {
  getEmpleadosACargo,
  getRecibosEmpleados,
  getEstadisticasEquipo
};