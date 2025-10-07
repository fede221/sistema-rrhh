const db = require('../config/db');
const { buildAbsoluteUrl } = require('../utils/urlHelper');

// Obtener todas las empresas
exports.getEmpresas = (req, res) => {
  // Verificar que el usuario sea admin
  const user = req.user;
  if (!user || !['admin', 'superadmin', 'admin_rrhh'].includes(user.rol)) {
    return res.status(403).json({ error: 'Acceso denegado. Solo administradores pueden gestionar empresas.' });
  }

  const query = `
    SELECT e.*, u.nombre as usuario_creador_nombre 
    FROM empresas e 
    LEFT JOIN usuarios u ON e.usuario_creador = u.id 
    ORDER BY e.nombre
  `;
  
  db.query(query, (err, results) => {
    if (err) {
      console.error('Error al obtener empresas:', err);
      return res.status(500).json({ error: 'Error interno del servidor' });
    }
    
    // Construir URLs completas para imágenes
    const empresasConUrls = results.map(empresa => ({
      ...empresa,
      logo_url: buildAbsoluteUrl(empresa.logo_url),
      firma_url: buildAbsoluteUrl(empresa.firma_url)
    }));
    
    res.json(empresasConUrls);
  });
};

// Obtener empresas activas
exports.getEmpresasActivas = (req, res) => {
  const query = `
    SELECT e.*, u.nombre as usuario_creador_nombre 
    FROM empresas e 
    LEFT JOIN usuarios u ON e.usuario_creador = u.id 
    WHERE e.activa = TRUE 
    ORDER BY e.nombre
  `;
  
  db.query(query, (err, results) => {
    if (err) {
      console.error('Error al obtener empresas activas:', err);
      return res.status(500).json({ error: 'Error interno del servidor' });
    }
    
    // Construir URLs completas para imágenes
    const empresasConUrls = results.map(empresa => ({
      ...empresa,
      logo_url: buildAbsoluteUrl(empresa.logo_url),
      firma_url: buildAbsoluteUrl(empresa.firma_url)
    }));
    
    res.json(empresasConUrls);
  });
};

// Crear nueva empresa
exports.crearEmpresa = (req, res) => {
  const user = req.user;
  
  // Verificar que el usuario sea admin
  if (!user || !['admin', 'superadmin', 'admin_rrhh'].includes(user.rol)) {
    return res.status(403).json({ error: 'Acceso denegado. Solo administradores pueden crear empresas.' });
  }

  const { 
    nombre, 
    razon_social, 
    cuit, 
    direccion, 
    telefono, 
    email, 
    contacto_nombre, 
    contacto_telefono, 
    contacto_email,
    descripcion
  } = req.body;

  // Validaciones básicas
  if (!nombre || !razon_social) {
    return res.status(400).json({ error: 'Nombre y razón social son obligatorios' });
  }

  const query = `
    INSERT INTO empresas 
    (nombre, razon_social, cuit, direccion, telefono, email, contacto_nombre, contacto_telefono, contacto_email, descripcion, usuario_creador) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  const values = [
    nombre.trim(),
    razon_social.trim(),
    cuit ? cuit.trim() : null,
    direccion ? direccion.trim() : null,
    telefono ? telefono.trim() : null,
    email ? email.trim() : null,
    contacto_nombre ? contacto_nombre.trim() : null,
    contacto_telefono ? contacto_telefono.trim() : null,
    contacto_email ? contacto_email.trim() : null,
    descripcion ? descripcion.trim() : null,
    user.id
  ];

  db.query(query, values, (err, result) => {
    if (err) {
      console.error('Error al crear empresa:', err);
      if (err.code === 'ER_DUP_ENTRY') {
        if (err.message.includes('nombre')) {
          return res.status(400).json({ error: 'Ya existe una empresa con ese nombre' });
        }
        if (err.message.includes('cuit')) {
          return res.status(400).json({ error: 'Ya existe una empresa con ese CUIT' });
        }
        return res.status(400).json({ error: 'Datos duplicados' });
      }
      return res.status(500).json({ error: 'Error interno del servidor' });
    }

    res.status(201).json({ 
      message: 'Empresa creada exitosamente', 
      id: result.insertId 
    });
  });
};

// Actualizar empresa
exports.actualizarEmpresa = (req, res) => {
  const user = req.user;
  const { id } = req.params; // Obtener ID de los parámetros
  
  console.log('🔄 Actualizando empresa ID:', id);
  console.log('📝 Datos recibidos:', req.body);
  console.log('📎 Archivos recibidos:', req.files);
  
  // Verificar que el usuario sea admin
  if (!user || !['admin', 'superadmin', 'admin_rrhh'].includes(user.rol)) {
    return res.status(403).json({ error: 'Acceso denegado. Solo administradores pueden actualizar empresas.' });
  }

  const db = require('../config/db');
  const path = require('path');
  const fs = require('fs');
  const { 
    nombre, 
    razon_social, 
    cuit, 
    direccion, 
    telefono, 
    email, 
    contacto_nombre, 
    contacto_telefono, 
    contacto_email,
    descripcion,
    activa
  } = req.body;

  // Validaciones básicas
  if (!nombre || !razon_social) {
    return res.status(400).json({ error: 'Nombre y razón social son obligatorios' });
  }


  // Manejo de archivos (logo y firma)
  let logoUrl = null;
  let firmaUrl = null;
  if (req.files) {
    if (req.files.logo && req.files.logo[0]) {
      logoUrl = '/uploads/' + req.files.logo[0].filename;
    }
    if (req.files.firma && req.files.firma[0]) {
      firmaUrl = '/uploads/' + req.files.firma[0].filename;
    }
  }

  let setFields = [
    'nombre = ?',
    'razon_social = ?',
    'cuit = ?',
    'direccion = ?',
    'telefono = ?',
    'email = ?',
    'contacto_nombre = ?',
    'contacto_telefono = ?',
    'contacto_email = ?',
    'descripcion = ?',
    'activa = ?',
    'fecha_actualizacion = CURRENT_TIMESTAMP'
  ];
  let values = [
    nombre.trim(),
    razon_social.trim(),
    cuit ? cuit.trim() : null,
    direccion ? direccion.trim() : null,
    telefono ? telefono.trim() : null,
    email ? email.trim() : null,
    contacto_nombre ? contacto_nombre.trim() : null,
    contacto_telefono ? contacto_telefono.trim() : null,
    contacto_email ? contacto_email.trim() : null,
    descripcion ? descripcion.trim() : null,
    activa !== undefined ? activa : true
  ];
  if (logoUrl) {
    setFields.push('logo_url = ?');
    values.push(logoUrl);
  }
  if (firmaUrl) {
    setFields.push('firma_url = ?');
    values.push(firmaUrl);
  }
  values.push(id);
  const query = `UPDATE empresas SET ${setFields.join(', ')} WHERE id = ?`;
  
  console.log('🗄️ Query SQL:', query);
  console.log('📊 Valores:', values);
  
  db.query(query, values, (err, result) => {
    if (err) {
      console.error('Error al actualizar empresa:', err);
      if (err.code === 'ER_DUP_ENTRY') {
        if (err.message.includes('nombre')) {
          return res.status(400).json({ error: 'Ya existe una empresa con ese nombre' });
        }
        if (err.message.includes('cuit')) {
          return res.status(400).json({ error: 'Ya existe una empresa con ese CUIT' });
        }
        return res.status(400).json({ error: 'Datos duplicados' });
      }
      return res.status(500).json({ error: 'Error interno del servidor' });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Empresa no encontrada' });
    }
    res.json({ message: 'Empresa actualizada exitosamente' });
  });
};

// Cambiar estado de empresa (activar/desactivar)
exports.cambiarEstadoEmpresa = (req, res) => {
  const user = req.user;
  
  // Verificar que el usuario sea admin
  if (!user || !['admin', 'superadmin', 'admin_rrhh'].includes(user.rol)) {
    return res.status(403).json({ error: 'Acceso denegado. Solo administradores pueden cambiar el estado de empresas.' });
  }

  const { id } = req.params;
  const { activa } = req.body;

  const query = `
    UPDATE empresas 
    SET activa = ?, fecha_actualizacion = CURRENT_TIMESTAMP 
    WHERE id = ?
  `;

  db.query(query, [activa, id], (err, result) => {
    if (err) {
      console.error('Error al cambiar estado de empresa:', err);
      return res.status(500).json({ error: 'Error interno del servidor' });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Empresa no encontrada' });
    }

    res.json({ 
      message: `Empresa ${activa ? 'activada' : 'desactivada'} exitosamente` 
    });
  });
};

// Obtener empresa por ID
exports.getEmpresaPorId = (req, res) => {
  const { id } = req.params;

  const query = `
    SELECT e.*, u.nombre as usuario_creador_nombre 
    FROM empresas e 
    LEFT JOIN usuarios u ON e.usuario_creador = u.id 
    WHERE e.id = ?
  `;

  db.query(query, [id], (err, results) => {
    if (err) {
      console.error('Error al obtener empresa:', err);
      return res.status(500).json({ error: 'Error interno del servidor' });
    }

    if (results.length === 0) {
      return res.status(404).json({ error: 'Empresa no encontrada' });
    }

    // Construir URLs completas para imágenes
    const empresaConUrls = {
      ...results[0],
      logo_url: buildAbsoluteUrl(results[0].logo_url),
      firma_url: buildAbsoluteUrl(results[0].firma_url)
    };

    res.json(empresaConUrls);
  });
};

// Eliminar empresa
exports.eliminarEmpresa = (req, res) => {
  const user = req.user;
  
  // Verificar que el usuario sea admin
  if (!user || !['admin', 'superadmin', 'admin_rrhh'].includes(user.rol)) {
    return res.status(403).json({ error: 'Acceso denegado. Solo administradores pueden eliminar empresas.' });
  }

  const { id } = req.params;

  // Eliminar empresa directamente
  const deleteQuery = 'DELETE FROM empresas WHERE id = ?';
  
  db.query(deleteQuery, [id], (err, result) => {
    if (err) {
      console.error('Error al eliminar empresa:', err);
      return res.status(500).json({ error: 'Error interno del servidor' });
    }
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Empresa no encontrada' });
      if (logoUrl) {
        setFields.push('logo_url = ?');
        values.push(logoUrl);
      }
      if (firmaUrl) {
        setFields.push('firma_url = ?');
        values.push(firmaUrl);
      }
    }
    
    res.json({ message: 'Empresa eliminada exitosamente' });
  });
};
