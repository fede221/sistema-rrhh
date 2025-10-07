const db = require('../config/db');
const { promisify } = require('util');

const query = promisify(db.query).bind(db);

// Obtener todos los permisos agrupados por rol y módulo
const getPermisos = async (req, res) => {
  try {
    const permisos = await query(`
      SELECT 
        rol,
        modulo,
        permiso,
        activo,
        id
      FROM permisos_roles
      ORDER BY rol, modulo, permiso
    `);

    // Agrupar por rol y módulo
    const permisosAgrupados = permisos.reduce((acc, perm) => {
      if (!acc[perm.rol]) {
        acc[perm.rol] = {};
      }
      if (!acc[perm.rol][perm.modulo]) {
        acc[perm.rol][perm.modulo] = [];
      }
      acc[perm.rol][perm.modulo].push({
        id: perm.id,
        permiso: perm.permiso,
        activo: Boolean(perm.activo)
      });
      return acc;
    }, {});

    res.json({
      success: true,
      data: permisosAgrupados
    });

  } catch (error) {
    console.error('Error al obtener permisos:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener permisos',
      error: error.message
    });
  }
};

// Actualizar estado de un permiso
const updatePermiso = async (req, res) => {
  try {
    const { id } = req.params;
    const { activo } = req.body;

    if (typeof activo !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'El campo activo debe ser un booleano'
      });
    }

    const result = await query(
      'UPDATE permisos_roles SET activo = ? WHERE id = ?',
      [activo ? 1 : 0, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Permiso no encontrado'
      });
    }

    // Obtener el permiso actualizado
    const [permisoActualizado] = await query(
      'SELECT * FROM permisos_roles WHERE id = ?',
      [id]
    );

    res.json({
      success: true,
      message: 'Permiso actualizado exitosamente',
      data: permisoActualizado
    });

  } catch (error) {
    console.error('Error al actualizar permiso:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar permiso',
      error: error.message
    });
  }
};

// Actualizar múltiples permisos de un módulo
const updateModuloPermisos = async (req, res) => {
  try {
    const { rol, modulo, permisos } = req.body;

    if (!rol || !modulo || !Array.isArray(permisos)) {
      return res.status(400).json({
        success: false,
        message: 'Datos inválidos. Se requiere rol, modulo y array de permisos'
      });
    }

    // Actualizar todos los permisos del módulo
    for (const permiso of permisos) {
      await query(
        'UPDATE permisos_roles SET activo = ? WHERE rol = ? AND modulo = ? AND permiso = ?',
        [permiso.activo ? 1 : 0, rol, modulo, permiso.permiso]
      );
    }

    res.json({
      success: true,
      message: `Permisos del módulo ${modulo} actualizados para rol ${rol}`
    });

  } catch (error) {
    console.error('Error al actualizar permisos del módulo:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar permisos del módulo',
      error: error.message
    });
  }
};

// Obtener permisos de un usuario específico (para middleware)
const getPermisosUsuario = async (rol) => {
  try {
    const permisos = await query(`
      SELECT modulo, permiso
      FROM permisos_roles
      WHERE rol = ? AND activo = 1
    `, [rol]);

    return permisos.reduce((acc, perm) => {
      if (!acc[perm.modulo]) {
        acc[perm.modulo] = [];
      }
      acc[perm.modulo].push(perm.permiso);
      return acc;
    }, {});

  } catch (error) {
    console.error('Error al obtener permisos del usuario:', error);
    return {};
  }
};

// Restablecer permisos por defecto
const resetPermisosDefecto = async (req, res) => {
  try {
    const { rol } = req.params;

    if (!['admin_rrhh', 'empleado'].includes(rol)) {
      return res.status(400).json({
        success: false,
        message: 'Rol inválido'
      });
    }

    // Activar todos los permisos del rol
    await query(
      'UPDATE permisos_roles SET activo = 1 WHERE rol = ?',
      [rol]
    );

    res.json({
      success: true,
      message: `Permisos por defecto restablecidos para ${rol}`
    });

  } catch (error) {
    console.error('Error al restablecer permisos:', error);
    res.status(500).json({
      success: false,
      message: 'Error al restablecer permisos',
      error: error.message
    });
  }
};

// Gestionar permiso específico de editar legajo propio para admin_rrhh
const toggleEditarLegajoPropio = async (req, res) => {
  try {
    const { activo } = req.body;
    
    if (typeof activo !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'El parámetro activo debe ser un booleano'
      });
    }

    const resultado = await query(`
      UPDATE permisos_roles 
      SET activo = ? 
      WHERE rol = 'admin_rrhh' AND modulo = 'legajos' AND permiso = 'editar_propio'
    `, [activo ? 1 : 0]);

    if (resultado.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Permiso no encontrado'
      });
    }

    // Obtener el estado actualizado
    const permisoActualizado = await query(`
      SELECT rol, modulo, permiso, activo 
      FROM permisos_roles 
      WHERE rol = 'admin_rrhh' AND modulo = 'legajos' AND permiso = 'editar_propio'
    `);

    res.json({
      success: true,
      message: `Permiso ${activo ? 'habilitado' : 'deshabilitado'} correctamente`,
      data: permisoActualizado[0]
    });

  } catch (error) {
    console.error('Error al actualizar permiso editar_propio:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar el permiso',
      error: error.message
    });
  }
};

module.exports = {
  getPermisos,
  updatePermiso,
  updateModuloPermisos,
  getPermisosUsuario,
  resetPermisosDefecto,
  toggleEditarLegajoPropio
};