const jwt = require('jsonwebtoken');
const { logger } = require('../utils/secureLogger');

// Middleware base: verifica el token y agrega el usuario al request
function verifyToken(req, res, next) {
  let token = null;
  let tokenSource = null;

  // 🔐 PRIORIDAD 1: Leer token de cookie HttpOnly (más seguro contra XSS)
  if (req.cookies && req.cookies.authToken) {
    token = req.cookies.authToken;
    tokenSource = 'cookie';
  }

  // PRIORIDAD 2: Leer token de Authorization header (compatibilidad con localStorage)
  // ⚠️ Este método es menos seguro (vulnerable a XSS) y será removido en el futuro
  if (!token) {
    const authHeader = req.headers['authorization'];

    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
      tokenSource = 'header';
    }
  }

  // Si no hay token en ningún lado
  if (!token) {
    logger.auth('❌ No token (ni en cookie ni en header)', {
      ip: req.ip,
      url: req.originalUrl,
      hasCookie: !!req.cookies?.authToken,
      hasAuthHeader: !!req.headers['authorization']
    });
    return res.sendStatus(403);
  }

  // Verificar si el token parece ser un objeto JSON en lugar de un JWT
  if (token.startsWith('{')) {
    logger.auth('❌ Token formato inválido (JSON)', {
      ip: req.ip,
      source: tokenSource
    });
    return res.sendStatus(403);
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      logger.auth('❌ Error al verificar token', {
        error: err.message,
        ip: req.ip,
        source: tokenSource
      });
      return res.sendStatus(403);
    }

    // ✅ Solo loguear información no sensible del token decodificado
    logger.debug('✅ Token verificado', {
      userId: decoded.id,
      rol: decoded.rol,
      dni: decoded.dni,
      source: tokenSource // 'cookie' (seguro) o 'header' (legacy, inseguro)
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
