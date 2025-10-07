const db = require('../config/db');

// Obtener todos los permisos
const getPermisos = (req, res) => {
  try {
    const query = `
      SELECT 
        rol,
        modulo,
        permiso,
        activo,
        id
      FROM permisos_roles
      ORDER BY rol, modulo, permiso
    `;

    db.query(query, (err, results) => {
      if (err) {
        console.error('Error al obtener permisos:', err);
        return res.status(500).json({
          success: false,
          message: 'Error al obtener permisos',
          error: err.message
        });
      }

      // Agrupar por rol y módulo
      const permisosAgrupados = results.reduce((acc, perm) => {
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
const updatePermiso = (req, res) => {
  try {
    const { id } = req.params;
    const { activo } = req.body;

    if (typeof activo !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'El campo activo debe ser un booleano'
      });
    }

    const query = 'UPDATE permisos_roles SET activo = ? WHERE id = ?';
    
    db.query(query, [activo ? 1 : 0, id], (err, result) => {
      if (err) {
        console.error('Error al actualizar permiso:', err);
        return res.status(500).json({
          success: false,
          message: 'Error al actualizar permiso',
          error: err.message
        });
      }

      if (result.affectedRows === 0) {
        return res.status(404).json({
          success: false,
          message: 'Permiso no encontrado'
        });
      }

      res.json({
        success: true,
        message: 'Permiso actualizado exitosamente'
      });
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

// Restablecer permisos por defecto
const resetPermisosDefecto = (req, res) => {
  try {
    const { rol } = req.params;

    if (!['admin_rrhh', 'empleado'].includes(rol)) {
      return res.status(400).json({
        success: false,
        message: 'Rol inválido'
      });
    }

    const query = 'UPDATE permisos_roles SET activo = 1 WHERE rol = ?';
    
    db.query(query, [rol], (err, result) => {
      if (err) {
        console.error('Error al restablecer permisos:', err);
        return res.status(500).json({
          success: false,
          message: 'Error al restablecer permisos',
          error: err.message
        });
      }

      res.json({
        success: true,
        message: `Permisos por defecto restablecidos para ${rol}`
      });
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

// Obtener permisos del usuario actual
const getPermisosUsuario = (req, res) => {
  try {
    const { rol } = req.user;
    
    // Si es superadmin, tiene todos los permisos
    if (rol === 'superadmin') {
      return res.json({
        success: true,
        data: {
          rol: rol,
          permisos: {} // El frontend ya maneja que superadmin tiene todo
        }
      });
    }
    
    const query = `
      SELECT 
        modulo,
        permiso,
        activo
      FROM permisos_roles
      WHERE rol = ? AND activo = 1
      ORDER BY modulo, permiso
    `;

    db.query(query, [rol], (err, results) => {
      if (err) {
        console.error('Error al obtener permisos del usuario:', err);
        return res.status(500).json({
          success: false,
          message: 'Error al obtener permisos del usuario',
          error: err.message
        });
      }

      // Agrupar por módulo
      const permisosPorModulo = results.reduce((acc, perm) => {
        if (!acc[perm.modulo]) {
          acc[perm.modulo] = [];
        }
        acc[perm.modulo].push(perm.permiso);
        return acc;
      }, {});

      res.json({
        success: true,
        data: {
          rol: rol,
          permisos: permisosPorModulo
        }
      });
    });

  } catch (error) {
    console.error('Error al obtener permisos del usuario:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener permisos del usuario',
      error: error.message
    });
  }
};

// Agregar un nuevo permiso
const agregarPermiso = (req, res) => {
  try {
    const { rol, modulo, permiso, activo = 1 } = req.body;

    if (!rol || !modulo || !permiso) {
      return res.status(400).json({
        success: false,
        message: 'Rol, módulo y permiso son obligatorios'
      });
    }

    const query = `
      INSERT INTO permisos_roles (rol, modulo, permiso, activo)
      VALUES (?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE activo = VALUES(activo)
    `;

    db.query(query, [rol, modulo, permiso, activo], (err, result) => {
      if (err) {
        console.error('Error al agregar permiso:', err);
        return res.status(500).json({
          success: false,
          message: 'Error al agregar permiso',
          error: err.message
        });
      }

      if (result.affectedRows === 0) {
        return res.status(409).json({
          success: false,
          message: 'El permiso ya existe con los mismos valores'
        });
      }

      const mensaje = result.insertId ? 'Permiso creado exitosamente' : 'Permiso actualizado exitosamente';
      
      res.json({
        success: true,
        message: mensaje,
        data: { id: result.insertId || 'existing', rol, modulo, permiso, activo }
      });
    });

  } catch (error) {
    console.error('Error al agregar permiso:', error);
    res.status(500).json({
      success: false,
      message: 'Error al agregar permiso',
      error: error.message
    });
  }
};

// Gestionar permiso específico de editar legajo propio para admin_rrhh
const toggleEditarLegajoPropio = (req, res) => {
  try {
    const { activo } = req.body;
    
    if (typeof activo !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'El parámetro activo debe ser un booleano'
      });
    }

    const query = `
      UPDATE permisos_roles 
      SET activo = ? 
      WHERE rol = 'admin_rrhh' AND modulo = 'legajos' AND permiso = 'editar_propio'
    `;

    db.query(query, [activo ? 1 : 0], (err, result) => {
      if (err) {
        console.error('Error al actualizar permiso editar_propio:', err);
        return res.status(500).json({
          success: false,
          message: 'Error al actualizar el permiso',
          error: err.message
        });
      }

      if (result.affectedRows === 0) {
        return res.status(404).json({
          success: false,
          message: 'Permiso no encontrado'
        });
      }

      // Obtener el estado actualizado
      const verificarQuery = `
        SELECT rol, modulo, permiso, activo 
        FROM permisos_roles 
        WHERE rol = 'admin_rrhh' AND modulo = 'legajos' AND permiso = 'editar_propio'
      `;

      db.query(verificarQuery, (err2, results) => {
        if (err2) {
          console.error('Error al verificar permiso:', err2);
          return res.status(500).json({
            success: false,
            message: 'Error al verificar el permiso actualizado'
          });
        }

        res.json({
          success: true,
          message: `Permiso ${activo ? 'habilitado' : 'deshabilitado'} correctamente`,
          data: results[0]
        });
      });
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
  resetPermisosDefecto,
  getPermisosUsuario,
  agregarPermiso,
  toggleEditarLegajoPropio
};