const db = require('../config/db');

// Solo superadmin puede ver los errores
exports.listarErrores = (req, res) => {
  if (!req.user || req.user.rol !== 'superadmin') {
    return res.status(403).json({ error: 'No autorizado' });
  }

  // Permite paginación y filtro básico
  const { limit = 100, offset = 0 } = req.query;
  db.query(
    `SELECT * FROM errores ORDER BY fecha DESC LIMIT ? OFFSET ?`,
    [parseInt(limit), parseInt(offset)],
    (err, results) => {
      if (err) return res.status(500).json({ error: 'Error al obtener errores' });
      res.json(results);
    }
  );
};
