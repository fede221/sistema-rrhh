const jwt = require('jsonwebtoken');
const db = require('../config/db');

// Middleware para verificar si el usuario puede aprobar vacaciones
const verifyVacacionesApprover = (req, res, next) => {
  try {
    let token = null;
    
    // PRIORIDAD 1: Cookie (más seguro)
    if (req.cookies && req.cookies.authToken) {
      token = req.cookies.authToken;
    }
    
    // PRIORIDAD 2: Header Authorization
    if (!token) {
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.split(' ')[1];
      }
    }
    
    if (!token) {
      return res.status(401).json({ error: 'Token no proporcionado' });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
      if (err) {
        return res.status(401).json({ error: 'Token inválido' });
      }

      // Verificar rol en base de datos
      const query = 'SELECT id, rol, nombre, apellido FROM usuarios WHERE id = ? AND activo = 1';
      
      db.query(query, [decoded.id], (dbErr, results) => {
        if (dbErr) {
          return res.status(500).json({ error: 'Error de base de datos' });
        }

        if (results.length === 0) {
          return res.status(401).json({ error: 'Usuario no encontrado o inactivo' });
        }

        const usuario = results[0];
        
        // Verificar si el usuario puede aprobar vacaciones
        const rolesAprobadores = ['admin_rrhh', 'superadmin', 'referente_vacaciones'];
        
        if (!rolesAprobadores.includes(usuario.rol)) {
          return res.status(403).json({ 
            error: 'No tienes permisos para aprobar solicitudes de vacaciones',
            requiredRole: 'referente_vacaciones, admin_rrhh o superadmin'
          });
        }

        req.user = {
          id: usuario.id,
          rol: usuario.rol,
          nombre: usuario.nombre,
          apellido: usuario.apellido
        };
        
        next();
      });
    });
  } catch (error) {
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// Middleware para verificar administración general (superadmin y admin_rrhh)
const verifyAdmin = (req, res, next) => {
  try {
    let token = null;
    
    // PRIORIDAD 1: Cookie (más seguro)
    if (req.cookies && req.cookies.authToken) {
      token = req.cookies.authToken;
    }
    
    // PRIORIDAD 2: Header Authorization
    if (!token) {
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.split(' ')[1];
      }
    }
    
    if (!token) {
      console.log('❌ verifyAdmin - Token no proporcionado');
      return res.status(401).json({ error: 'Token no proporcionado' });
    }

    console.log('🔑 verifyAdmin - Token encontrado');

    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
      if (err) {
        console.log('❌ verifyAdmin - Token inválido:', err.message);
        return res.status(401).json({ error: 'Token inválido' });
      }

      console.log('✅ verifyAdmin - Token válido');

      const query = 'SELECT id, rol, nombre, apellido FROM usuarios WHERE id = ? AND activo = 1';
      
      db.query(query, [decoded.id], (dbErr, results) => {
        if (dbErr) {
          console.log('❌ verifyAdmin - Error de base de datos:', dbErr.message);
          return res.status(500).json({ error: 'Error de base de datos' });
        }

        if (results.length === 0) {
          console.log('❌ verifyAdmin - Usuario no encontrado o inactivo');
          return res.status(401).json({ error: 'Usuario no encontrado o inactivo' });
        }

        const usuario = results[0];
        const rolesAdmin = ['admin_rrhh', 'superadmin'];
        
        if (!rolesAdmin.includes(usuario.rol)) {
          console.log('❌ verifyAdmin - Rol no válido:', usuario.rol);
          return res.status(403).json({ 
            error: 'Se requieren permisos de administración',
            requiredRole: 'admin_rrhh o superadmin'
          });
        }

        console.log('✅ verifyAdmin - Rol válido, continuando...');

        req.user = {
          id: usuario.id,
          rol: usuario.rol,
          nombre: usuario.nombre,
          apellido: usuario.apellido
        };
        
        next();
      });
    });
  } catch (error) {
    console.log('💥 verifyAdmin - Error catch:', error.message);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

module.exports = {
  verifyVacacionesApprover,
  verifyAdmin
};
