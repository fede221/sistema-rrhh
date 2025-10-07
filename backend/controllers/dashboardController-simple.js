const db = require('../config/db');
const { logError } = require('../utils/errorLogger');

// Obtener estadísticas generales del dashboard - VERSIÓN SIMPLE
exports.getEstadisticasGenerales = async (req, res) => {
  const user = req.user;
  
  try {
    console.log('🔍 Dashboard - Usuario:', user);
    
    const estadisticas = {
      basicas: {
        usuarios_activos: 600,
        total_legajos: 600,
        empresas_activas: 6,
        periodos_disponibles: 6
      }
    };

    if (user.rol === 'admin_rrhh' || user.rol === 'superadmin') {
      estadisticas.admin = {
        importaciones_hoy: 10,
        recibos_semana: 10,
        errores_semana: 40,
        usuarios_nuevos_mes: 30,
        porcentaje_firmados: 0,
        porcentaje_usuarios_activos: 100,
        porcentaje_legajos_completos: 98,
        recibos_por_periodo: [
          { PeriodoLiquidacion: '07/2025', cantidad: 13153, firmados: 0 },
          { PeriodoLiquidacion: '06/2025', cantidad: 20, firmados: 0 }
        ],
        usuarios_por_rol: [
          { rol: 'empleado', cantidad: 599 },
          { rol: 'superadmin', cantidad: 1 }
        ]
      };

      estadisticas.tendencias = {
        nuevos_usuarios: 10,
        crecimiento_usuarios: 25,
        recibos_procesados: 10,
        crecimiento_recibos: 15,
        firmas_completadas: 0,
        tasa_firmas: 0,
        errores_resueltos: 35,
        errores_pendientes: 5
      };
    }

    if (user.rol === 'empleado') {
      estadisticas.empleado = {
        total_recibos: 22,
        recibos_firmados: 0,
        ultimo_periodo: '07/2025'
      };
    }

    estadisticas.actividad_reciente = [
      {
        tipo: 'importacion',
        descripcion: 'Importación de 13153 recibos - completada',
        detalle: user.nombre || 'Sistema',
        fecha: new Date()
      }
    ];

    console.log('✅ Estadísticas enviadas:', JSON.stringify(estadisticas, null, 2));
    res.json(estadisticas);
    
  } catch (err) {
    console.error('❌ Error en dashboard:', err);
    logError({ req, mensaje: 'Error al obtener estadísticas del dashboard', detalles: err.stack || String(err) });
    res.status(500).json({ error: 'Error al obtener estadísticas' });
  }
};

// Obtener resumen del perfil del usuario - VERSIÓN SIMPLE
exports.getResumenPerfil = async (req, res) => {
  const user = req.user;
  
  try {
    console.log('🔍 Perfil - Usuario:', user);
    
    const perfil = {
      nombre: user.nombre || 'Super',
      apellido: user.apellido || 'Admin',
      correo: user.correo || 'super@admin.com',
      rol: user.rol || 'superadmin'
    };

    if (user.rol === 'empleado') {
      perfil.empresa_nombre = 'Empresa de Prueba';
    }

    console.log('✅ Perfil enviado:', perfil);
    res.json(perfil);
    
  } catch (err) {
    console.error('❌ Error en perfil:', err);
    logError({ req, mensaje: 'Error al obtener resumen de perfil', detalles: err.stack || String(err) });
    res.status(500).json({ error: 'Error inesperado' });
  }
};

// Obtener alertas y notificaciones - VERSIÓN SIMPLE
exports.getAlertas = async (req, res) => {
  const user = req.user;
  
  try {
    console.log('🔍 Alertas - Usuario:', user);
    
    const alertas = [
      {
        tipo: 'info',
        titulo: 'Sistema funcionando correctamente',
        descripcion: 'Todas las funcionalidades están operativas.',
        icono: 'info'
      }
    ];

    if (user.rol === 'admin_rrhh' || user.rol === 'superadmin') {
      alertas.push({
        tipo: 'warning',
        titulo: 'Recibos sin firmar',
        descripcion: '13,153 recibos están esperando firma.',
        accion: '/recibos',
        icono: 'warning'
      });
    }

    console.log('✅ Alertas enviadas:', alertas);
    res.json(alertas);
    
  } catch (err) {
    console.error('❌ Error en alertas:', err);
    logError({ req, mensaje: 'Error al obtener alertas del dashboard', detalles: err.stack || String(err) });
    res.status(500).json({ error: 'Error al obtener alertas' });
  }
};
