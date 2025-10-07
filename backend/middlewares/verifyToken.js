const jwt = require('jsonwebtoken');

// Middleware base: verifica el token y agrega el usuario al request
function verifyToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  console.log("🔐 Authorization header:", authHeader);

  if (!authHeader) {
    console.log("❌ No authorization header");
    return res.sendStatus(403);
  }

  // Verificar formato del header
  if (!authHeader.startsWith('Bearer ')) {
    console.log("❌ Authorization header no comienza con 'Bearer '");
    return res.sendStatus(403);
  }

  const token = authHeader.split(' ')[1];
  console.log("📦 Token recibido:", token);

  if (!token) {
    console.log("❌ Token vacío");
    return res.sendStatus(403);
  }

  // Verificar si el token parece ser un objeto JSON en lugar de un JWT
  if (token.startsWith('{')) {
    console.log("❌ Token parece ser un objeto JSON, no un JWT válido");
    return res.sendStatus(403);
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      console.log("❌ Error al verificar token:", err.message);
      return res.sendStatus(403);
    }

    console.log("✅ Token decodificado:", decoded);
    req.user = decoded;
    next();
  });
}


// Solo Admin RRHH o Superadmin
function verifyAdminRRHH(req, res, next) {
 // console.log("🧠 Datos del token:", req.user); // Agregá esto

  if (req.user?.rol === 'admin_rrhh' || req.user?.rol === 'superadmin') {
    next();
  } else {
    return res.status(403).json({ message: 'Acceso solo para RRHH o Superadmin' });
  }
}

// Solo Superadmin
function verifySuperadmin(req, res, next) {
  if (req.user?.rol === 'superadmin') {
    next();
  } else {
    return res.status(403).json({ message: 'Acceso solo para Superadmin' });
  }
}

// Exportá todo
module.exports = {
  verifyToken,
  verifyAdminRRHH,
  verifySuperadmin
};
