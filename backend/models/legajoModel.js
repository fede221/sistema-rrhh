const db = require('../config/db');

const Legajo = {
  crear: (data, callback) => {
    const query = `INSERT INTO legajos SET ?`;
    db.query(query, data, callback);
  },

  // Obtener todos los legajos de un usuario (puede tener múltiples)
  obtenerPorUsuarioId: (usuario_id, callback) => {
    const query = `
      SELECT l.*, e.nombre as empresa_nombre, e.razon_social as empresa_razon_social,
             e.direccion as empresa_direccion, e.cuit as empresa_cuit
      FROM legajos l
      LEFT JOIN empresas e ON l.empresa_id = e.id
      WHERE l.usuario_id = ?
      ORDER BY l.empresa_id, l.numero_legajo
    `;
    db.query(query, [usuario_id], callback);
  },

  // Obtener un legajo específico por usuario y empresa
  obtenerPorUsuarioYEmpresa: (usuario_id, empresa_id, callback) => {
    const query = `
      SELECT l.*, e.nombre as empresa_nombre, e.razon_social as empresa_razon_social,
             e.direccion as empresa_direccion, e.cuit as empresa_cuit
      FROM legajos l
      LEFT JOIN empresas e ON l.empresa_id = e.id
      WHERE l.usuario_id = ? AND l.empresa_id = ?
    `;
    db.query(query, [usuario_id, empresa_id], callback);
  },

  // Obtener un legajo específico por ID
  obtenerPorId: (id, callback) => {
    const query = `
      SELECT l.*, e.nombre as empresa_nombre, e.razon_social as empresa_razon_social,
             e.direccion as empresa_direccion, e.cuit as empresa_cuit
      FROM legajos l
      LEFT JOIN empresas e ON l.empresa_id = e.id
      WHERE l.id = ?
    `;
    db.query(query, [id], callback);
  },

  // Obtener legajo por número de documento (para compatibilidad con recibos)
  obtenerPorDocumento: (nro_documento, callback) => {
    const query = `
      SELECT l.*, e.nombre as empresa_nombre, e.razon_social as empresa_razon_social,
             e.direccion as empresa_direccion, e.cuit as empresa_cuit
      FROM legajos l
      LEFT JOIN empresas e ON l.empresa_id = e.id
      WHERE l.nro_documento = ?
    `;
    db.query(query, [nro_documento], callback);
  },

  // Verificar si existe un legajo específico por empresa y número
  existeLegajo: (empresa_id, numero_legajo, callback) => {
    db.query('SELECT id FROM legajos WHERE empresa_id = ? AND numero_legajo = ?', [empresa_id, numero_legajo], callback);
  },

  // Actualizar un legajo específico por ID
  actualizarPorId: (id, data, callback) => {
    db.query('UPDATE legajos SET ? WHERE id = ?', [data, id], callback);
  },

  // Actualizar por usuario_id (para compatibilidad hacia atrás)
  actualizarPorUsuarioId: (usuario_id, data, callback) => {
    db.query('UPDATE legajos SET ? WHERE usuario_id = ?', [data, usuario_id], callback);
  },

  // Eliminar un legajo específico por ID
  eliminarPorId: (id, callback) => {
    db.query('DELETE FROM legajos WHERE id = ?', [id], callback);
  },

  // Eliminar por usuario_id (para compatibilidad hacia atrás)
  eliminarPorUsuarioId: (usuario_id, callback) => {
    db.query('DELETE FROM legajos WHERE usuario_id = ?', [usuario_id], callback);
  }
};

module.exports = Legajo;
