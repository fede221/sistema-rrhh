const db = require('../config/db');

/**
 * Registra un error en la base de datos
 * @param {Object} options
 * @param {Object} [options.req] - Request de Express (opcional)
 * @param {string} options.mensaje - Mensaje de error
 * @param {string} [options.detalles] - Stacktrace u otros detalles
 */
function logError({ req, mensaje, detalles }) {
  let usuario_id = null;
  let usuario_rol = null;
  let ip = null;
  let endpoint = null;

  if (req) {
    endpoint = req.originalUrl || req.url;
    ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress || null;
    if (req.user) {
      usuario_id = req.user.id;
      usuario_rol = req.user.rol;
    }
  }

  const sql = `INSERT INTO errores (usuario_id, usuario_rol, ip, endpoint, mensaje, detalles) VALUES (?, ?, ?, ?, ?, ?)`;
  db.query(sql, [usuario_id, usuario_rol, ip, endpoint, mensaje, detalles], (err) => {
    if (err) {
      // Si falla el log, solo mostrar en consola
      console.error('No se pudo registrar el error en la tabla errores:', err);
    }
  });
}

module.exports = { logError };
