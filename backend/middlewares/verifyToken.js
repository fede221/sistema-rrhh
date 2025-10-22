const jwt = require('jsonwebtoken');
const { logger } = require('../utils/secureLogger');

// Middleware base: verifica el token y agrega el usuario al request
function verifyToken(req, res, next) {
  const authHeader = req.headers['authorization'];

  // ⚠️ NO loguear el authHeader completo - contiene el token
  // console.log("🔐 Authorization header:", authHeader); // REMOVIDO por seguridad

  if (!authHeader) {
    logger.auth('❌ No authorization header', {
      ip: req.ip,
      url: req.originalUrl
    });
    return res.sendStatus(403);
  }

  // Verificar formato del header
  if (!authHeader.startsWith('Bearer ')) {
    logger.auth('❌ Authorization header formato inválido', {
      ip: req.ip,
      url: req.originalUrl
    });
    return res.sendStatus(403);
  }

  const token = authHeader.split(' ')[1];

  // ⚠️ NO loguear el token - es información sensible
  // console.log("📦 Token recibido:", token); // REMOVIDO por seguridad

  if (!token) {
    logger.auth('❌ Token vacío', { ip: req.ip });
    return res.sendStatus(403);
  }

  // Verificar si el token parece ser un objeto JSON en lugar de un JWT
  if (token.startsWith('{')) {
    logger.auth('❌ Token formato inválido (JSON)', { ip: req.ip });
    return res.sendStatus(403);
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      logger.auth('❌ Error al verificar token', {
        error: err.message,
        ip: req.ip
      });
      return res.sendStatus(403);
    }

    // ✅ Solo loguear información no sensible del token decodificado
    logger.debug('✅ Token verificado', {
      userId: decoded.id,
      rol: decoded.rol,
      dni: decoded.dni
      // NO incluir el token completo ni decoded completo
    });

    req.user = decoded;
    next();
  });
}


// Solo Admin RRHH o Superadmin
function verifyAdminRRHH(req, res, next) {
  // ⚠️ NO loguear datos del token - puede contener información sensible
  // console.log("🧠 Datos del token:", req.user); // Ya estaba comentado

  if (req.user?.rol === 'admin_rrhh' || req.user?.rol === 'superadmin') {
    next();
  } else {
    logger.auth('❌ Acceso denegado - rol insuficiente', {
      userId: req.user?.id,
      rol: req.user?.rol,
      required: 'admin_rrhh o superadmin'
    });
    return res.status(403).json({ message: 'Acceso solo para RRHH o Superadmin' });
  }
}

// Solo Superadmin
function verifySuperadmin(req, res, next) {
  if (req.user?.rol === 'superadmin') {
    next();
  } else {
    logger.auth('❌ Acceso denegado - rol insuficiente', {
      userId: req.user?.id,
      rol: req.user?.rol,
      required: 'superadmin'
    });
    return res.status(403).json({ message: 'Acceso solo para Superadmin' });
  }
}

// Exportá todo
module.exports = {
  verifyToken,
  verifyAdminRRHH,
  verifySuperadmin
};
