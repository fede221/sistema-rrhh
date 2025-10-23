const db = require('../config/db');
const legajoModel = require('../models/legajoModel');
const { log } = require('../utils/logger');

// Función para convertir fecha de Excel a formato YYYY-MM-DD
const convertirFechaExcel = (numeroSerie) => {
  if (!numeroSerie || isNaN(numeroSerie)) {
    return null;
  }
  
  // Excel cuenta los días desde el 1 de enero de 1900
  // Pero tiene un bug donde considera 1900 como año bisiesto (no lo es)
  // Por eso restamos 2 días: uno por el día 0 y otro por el día bisiesto falso
  const fechaBase = new Date(1900, 0, 1);
  const diasAjustados = numeroSerie - 2;
  
  const fecha = new Date(fechaBase.getTime() + (diasAjustados * 24 * 60 * 60 * 1000));
  
  // Formatear como YYYY-MM-DD
  const año = fecha.getFullYear();
  const mes = String(fecha.getMonth() + 1).padStart(2, '0');
  const dia = String(fecha.getDate()).padStart(2, '0');
  
  return `${año}-${mes}-${dia}`;
};

// Obtener el legajo del usuario autenticado
exports.obtenerMiLegajo = (req, res) => {
  const usuario_id = req.user.id;

  const query = `
    SELECT l.*, e.nombre as empresa_nombre 
    FROM legajos l 
    LEFT JOIN empresas e ON l.empresa_id = e.id 
    WHERE l.usuario_id = ?
  `;

  db.query(query, [usuario_id], (err, results) => {
    if (err) return res.status(500).json({ error: 'Error al buscar legajo' });
    if (results.length === 0) return res.status(404).json({ error: 'Legajo no encontrado' });

    const legajo = results[0];
    if (legajo.fecha_nacimiento) {
      legajo.fecha_nacimiento = legajo.fecha_nacimiento.toISOString().split('T')[0];
    }
    if (legajo.fecha_ingreso) {
      legajo.fecha_ingreso = legajo.fecha_ingreso.toISOString().split('T')[0];
    }
    res.json(legajo);
  });
};

// Obtener todos los legajos (solo admin_rrhh o superadmin)
exports.obtenerTodos = (req, res) => {
  const rol = req.user.rol;
  if (rol !== 'admin_rrhh' && rol !== 'superadmin') {
    return res.status(403).json({ error: 'No autorizado' });
  }

  // Incluir información del usuario y empresa
  const query = `
    SELECT 
      l.*,
      u.rol as usuario_rol,
      u.nombre as usuario_nombre,
      u.apellido as usuario_apellido,
      e.nombre as empresa_nombre
    FROM legajos l
    JOIN usuarios u ON l.usuario_id = u.id
    LEFT JOIN empresas e ON l.empresa_id = e.id
  `;

  db.query(query, (err, results) => {
    if (err) return res.status(500).json({ error: 'Error al obtener legajos' });

    const legajos = results.map(l => ({
      ...l,
      fecha_nacimiento: l.fecha_nacimiento
        ? new Date(l.fecha_nacimiento).toISOString().split('T')[0]
        : '',
      fecha_ingreso: l.fecha_ingreso
        ? new Date(l.fecha_ingreso).toISOString().split('T')[0]
        : ''
    }));

    res.json(legajos);
  });
};

// Crear nuevo legajo
exports.crearLegajo = async (req, res) => {
  const {
    usuario_id, nombre, apellido, email_personal, nro_documento, cuil,
    domicilio, localidad, codigo_postal, telefono_contacto, contacto_emergencia,
    fecha_nacimiento, estado_civil, fecha_ingreso,
    cuenta_bancaria, banco_destino, centro_costos, tarea_desempenada,
    apellido_casada, domicilio_calle, domicilio_nro, domicilio_piso,
    domicilio_dpto, sexo, tipo_documento, nacionalidad, provincia, empresa_id,
    numero_legajo
  } = req.body;

  // Validaciones específicas
  if (!nombre || !apellido || !nro_documento) {
    return res.status(400).json({ 
      error: 'Faltan datos obligatorios: nombre, apellido y número de documento son requeridos',
      type: 'VALIDATION_ERROR'
    });
  }

  // Validar formato de DNI
  if (nro_documento && !/^\d{7,8}$/.test(String(nro_documento).trim())) {
    return res.status(400).json({ 
      error: 'El DNI debe contener entre 7 y 8 dígitos numéricos',
      field: 'nro_documento',
      type: 'VALIDATION_ERROR'
    });
  }

  // Validar formato de CUIL si está presente
  if (cuil && !/^\d{2}-\d{7,8}-\d{1}$/.test(String(cuil).trim())) {
    return res.status(400).json({ 
      error: 'El CUIL debe tener el formato XX-XXXXXXXX-X',
      field: 'cuil',
      type: 'VALIDATION_ERROR'
    });
  }

  // Validar email si está presente
  if (email_personal && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email_personal).trim())) {
    return res.status(400).json({ 
      error: 'El formato del email no es válido',
      field: 'email_personal',
      type: 'VALIDATION_ERROR'
    });
  }

  try {
    // Verificar si ya existe un legajo con el mismo DNI
    const legajoExistente = await new Promise((resolve, reject) => {
      db.query('SELECT id, nombre, apellido FROM legajos WHERE nro_documento = ?', [nro_documento], (err, results) => {
        if (err) {
          if (err.code === 'ECONNREFUSED' || err.code === 'ENOTFOUND' || err.code === 'ETIMEDOUT') {
            return reject({ 
              type: 'CONNECTION_ERROR', 
              message: 'Error de conexión con la base de datos. Verifique la conectividad.',
              originalError: err 
            });
          }
          return reject({ 
            type: 'DATABASE_ERROR', 
            message: 'Error interno de la base de datos',
            originalError: err 
          });
        }
        resolve(results);
      });
    });

    if (legajoExistente.length > 0) {
      const legajo = legajoExistente[0];
      return res.status(400).json({ 
        error: `Ya existe un legajo con ese DNI (pertenece a ${legajo.nombre} ${legajo.apellido})`,
        field: 'nro_documento',
        type: 'DUPLICATE_FIELD'
      });
    }

    // Verificar si ya existe un legajo con el mismo número de legajo (si se proporciona)
    if (numero_legajo) {
      const numeroLegajoExistente = await new Promise((resolve, reject) => {
        db.query('SELECT id, nombre, apellido FROM legajos WHERE numero_legajo = ?', [numero_legajo], (err, results) => {
          if (err) {
            if (err.code === 'ECONNREFUSED' || err.code === 'ENOTFOUND' || err.code === 'ETIMEDOUT') {
              return reject({ 
                type: 'CONNECTION_ERROR', 
                message: 'Error de conexión con la base de datos. Verifique la conectividad.',
                originalError: err 
              });
            }
            return reject({ 
              type: 'DATABASE_ERROR', 
              message: 'Error interno de la base de datos',
              originalError: err 
            });
          }
          resolve(results);
        });
      });

      if (numeroLegajoExistente.length > 0) {
        const legajo = numeroLegajoExistente[0];
        return res.status(400).json({ 
          error: `Ya existe un legajo con ese número (pertenece a ${legajo.nombre} ${legajo.apellido})`,
          field: 'numero_legajo',
          type: 'DUPLICATE_FIELD'
        });
      }
    }

    const sql = `INSERT INTO legajos (
      usuario_id, nombre, apellido, email_personal, nro_documento, cuil,
      domicilio, localidad, codigo_postal, telefono_contacto, contacto_emergencia,
      fecha_nacimiento, estado_civil, fecha_ingreso,
      cuenta_bancaria, banco_destino, centro_costos, tarea_desempenada,
      apellido_casada, domicilio_calle, domicilio_nro, domicilio_piso,
      domicilio_dpto, sexo, tipo_documento, nacionalidad, provincia, empresa_id,
      numero_legajo
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

    const fechaNacimientoSQL = fecha_nacimiento ? fecha_nacimiento.split('T')[0] : null;
    const fechaIngresoSQL = fecha_ingreso ? fecha_ingreso.split('T')[0] : null;

    const values = [
      usuario_id, nombre, apellido, email_personal, nro_documento, cuil,
      domicilio, localidad, codigo_postal, telefono_contacto, contacto_emergencia,
      fechaNacimientoSQL, estado_civil, fechaIngresoSQL,
      cuenta_bancaria, banco_destino, centro_costos, tarea_desempenada,
      apellido_casada, domicilio_calle, domicilio_nro, domicilio_piso,
      domicilio_dpto, sexo, tipo_documento, nacionalidad, provincia, empresa_id,
      numero_legajo
    ];

    db.query(sql, values, (err, result) => {
      if (err) {
        console.error('❌ Error al crear legajo:', err);
        
        // Manejo específico de errores de base de datos
        let errorMsg = 'Error al crear legajo';
        let fieldName = null;
        let errorType = 'INTERNAL_ERROR';
        
        if (err.code === 'ER_DUP_ENTRY') {
          errorType = 'DUPLICATE_FIELD';
          if (err.message.includes('nro_documento')) {
            errorMsg = 'Ya existe un legajo con ese DNI';
            fieldName = 'nro_documento';
          } else if (err.message.includes('numero_legajo')) {
            errorMsg = 'Ya existe un legajo con ese número';
            fieldName = 'numero_legajo';
          } else if (err.message.includes('email_personal')) {
            errorMsg = 'Ya existe un legajo con ese email';
            fieldName = 'email_personal';
          } else {
            errorMsg = 'Ya existe un legajo con esos datos';
          }
        } else if (err.code === 'ER_DATA_TOO_LONG') {
          errorMsg = 'Algún campo excede la longitud máxima permitida';
          errorType = 'VALIDATION_ERROR';
        } else if (err.code === 'ER_BAD_NULL_ERROR') {
          errorMsg = 'Falta un campo obligatorio';
          errorType = 'VALIDATION_ERROR';
        } else if (err.code === 'ECONNREFUSED' || err.code === 'ENOTFOUND' || err.code === 'ETIMEDOUT') {
          errorMsg = 'Error de conexión con la base de datos. Verifique la conectividad.';
          errorType = 'CONNECTION_ERROR';
        }

        return res.status(err.code === 'ER_DUP_ENTRY' ? 400 : 500).json({ 
          error: errorMsg,
          field: fieldName,
          type: errorType
        });
      }

      const legajo_id = result.insertId;
      const usuario_audit = req.user ? req.user.id : null;
      const datos = JSON.stringify(req.body);

      const auditoriaSql = `
        INSERT INTO auditoria_legajos (legajo_id, usuario_id, accion, datos)
        VALUES (?, ?, 'crear', ?)
      `;

      db.query(auditoriaSql, [legajo_id, usuario_audit, datos], (err2) => {
        if (err2) console.error('⚠️ Error al registrar auditoría de legajo (crear):', err2);
        res.json({ success: true, id: legajo_id });
      });
    });

  } catch (err) {
    console.error('❌ Error inesperado al crear legajo:', err);
    
    let errorMsg = 'Error inesperado al crear legajo';
    let errorType = 'INTERNAL_ERROR';
    
    // Manejo específico de errores de conexión
    if (err.type === 'CONNECTION_ERROR') {
      errorMsg = err.message;
      errorType = 'CONNECTION_ERROR';
      return res.status(503).json({ 
        error: errorMsg, 
        type: errorType 
      });
    } else if (err.type === 'DATABASE_ERROR') {
      errorMsg = err.message;
      errorType = 'DATABASE_ERROR';
      return res.status(500).json({ 
        error: errorMsg, 
        type: errorType 
      });
    }
    
    res.status(500).json({ 
      error: errorMsg, 
      type: errorType 
    });
  }
}; 

// Editar legajo
exports.editarLegajo = async (req, res) => {
  try {
    const id = req.params.id;
    const datos = req.body;
    const usuarioActual = req.user;
    
    if (datos.fecha_nacimiento) {
      datos.fecha_nacimiento = datos.fecha_nacimiento.split('T')[0];
    }
    if (datos.fecha_ingreso) {
      datos.fecha_ingreso = datos.fecha_ingreso.split('T')[0];
    }

    if (datos.fecha_nacimiento === '') datos.fecha_nacimiento = null;
    if (datos.fecha_ingreso === '') datos.fecha_ingreso = null;

    if (!id) return res.status(400).json({ error: 'Falta ID' });

    // Verificar si el legajo pertenece a un superadmin
    const verificarRolQuery = `
      SELECT u.rol 
      FROM legajos l 
      JOIN usuarios u ON l.usuario_id = u.id 
      WHERE l.id = ?
    `;
    
    const rolResults = await new Promise((resolve, reject) => {
      db.query(verificarRolQuery, [id], (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    });
    
    if (rolResults.length === 0) {
      return res.status(404).json({ error: 'Legajo no encontrado' });
    }
    
    const rolDelLegajo = rolResults[0].rol;
    
    // Si el usuario actual es admin_rrhh y está intentando editar un legajo de superadmin
    if (usuarioActual.rol === 'admin_rrhh' && rolDelLegajo === 'superadmin') {
      return res.status(403).json({ error: 'No tienes permisos para editar legajos de superadmin' });
    }

    // Si el usuario es admin_rrhh, verificar si tiene permiso para editar su propio legajo
    if (usuarioActual.rol === 'admin_rrhh') {
      // Verificar si tiene el permiso editar_propio
      const verificarPermisoQuery = `
        SELECT activo 
        FROM permisos_roles 
        WHERE rol = 'admin_rrhh' AND modulo = 'legajos' AND permiso = 'editar_propio'
      `;
      
      const permisoResult = await new Promise((resolve, reject) => {
        db.query(verificarPermisoQuery, (err, results) => {
          if (err) reject(err);
          else resolve(results);
        });
      });

      if (permisoResult.length === 0 || !permisoResult[0].activo) {
        return res.status(403).json({ 
          error: 'No tienes permisos para editar legajos. Contacta al administrador del sistema.',
          codigo: 'SIN_PERMISO_EDITAR_LEGAJO'
        });
      }

      // Restringir campos sensibles para admin_rrhh
      const camposRestringidos = ['empresa_id', 'numero_legajo', 'cuil', 'fecha_ingreso', 'centro_costos'];
      const camposEnviados = Object.keys(datos);
      
      for (const campo of camposRestringidos) {
        if (camposEnviados.includes(campo) && datos[campo] !== undefined && datos[campo] !== null) {
          return res.status(403).json({ 
            error: `No tienes permisos para modificar el campo: ${campo}`,
            campo_restringido: campo
          });
        }
      }
    }
    
    // Proceder con la actualización
    console.log('Datos a actualizar:', datos);
    console.log('ID del legajo:', id);
    
    // Filtrar solo los campos válidos de la tabla legajos
    const camposValidosLegajo = {
      nombre: datos.nombre,
      apellido: datos.apellido,
      email_personal: datos.email_personal,
      nro_documento: datos.nro_documento,
      cuil: datos.cuil,
      domicilio: datos.domicilio,
      localidad: datos.localidad,
      codigo_postal: datos.codigo_postal,
      telefono_contacto: datos.telefono_contacto,
      contacto_emergencia: datos.contacto_emergencia,
      fecha_nacimiento: datos.fecha_nacimiento,
      estado_civil: datos.estado_civil,
      fecha_ingreso: datos.fecha_ingreso,
      cuenta_bancaria: datos.cuenta_bancaria,
      banco_destino: datos.banco_destino,
      centro_costos: datos.centro_costos,
      tarea_desempenada: datos.tarea_desempenada,
      apellido_casada: datos.apellido_casada,
      domicilio_calle: datos.domicilio_calle,
      domicilio_nro: datos.domicilio_nro,
      domicilio_piso: datos.domicilio_piso,
      domicilio_dpto: datos.domicilio_dpto,
      sexo: datos.sexo,
      tipo_documento: datos.tipo_documento,
      nacionalidad: datos.nacionalidad,
      provincia: datos.provincia,
      empresa_id: datos.empresa_id
    };
    
    // Remover campos undefined/null del objeto
    Object.keys(camposValidosLegajo).forEach(key => {
      if (camposValidosLegajo[key] === undefined) {
        delete camposValidosLegajo[key];
      }
    });
    
    console.log('Campos válidos a actualizar:', camposValidosLegajo);
    
    // Actualizar el legajo
    await new Promise((resolve, reject) => {
      db.query('UPDATE legajos SET ? WHERE id = ?', [camposValidosLegajo, id], (err, result) => {
        if (err) {
          console.error('Error al editar legajo:', err);
          reject(err);
        } else {
          resolve(result);
        }
      });
    });

    // Registrar auditoría
    const usuario_id = req.user.id;
    const datosStr = JSON.stringify(camposValidosLegajo);

    const auditoriaSql = `
      INSERT INTO auditoria_legajos (legajo_id, usuario_id, accion, datos)
      VALUES (?, ?, 'editar', ?)
    `;

    await new Promise((resolve, reject) => {
      db.query(auditoriaSql, [id, usuario_id, datosStr], (err2) => {
        if (err2) {
          console.error('⚠️ Error al registrar auditoría de legajo (editar):', err2);
          // No rechazamos la promesa porque la auditoría es opcional
        }
        resolve();
      });
    });

    res.json({ success: true });

  } catch (error) {
    console.error('Error en editarLegajo:', error);
    res.status(500).json({ 
      error: 'Error al editar legajo', 
      details: error.message 
    });
  }
}; 

// Eliminar legajo (solo superadmin)
exports.eliminarLegajo = (req, res) => {
  const id = req.params.id;

  db.query('DELETE FROM legajos WHERE id = ?', [id], (err, result) => {
    if (err) return res.status(500).json({ error: 'Error al eliminar legajo' });
    res.json({ success: true });
  });
};

exports.verAuditoriaDeLegajo = (req, res) => {
  const legajo_id = req.params.id;
  db.query(
    'SELECT * FROM auditoria_legajos WHERE legajo_id = ? ORDER BY fecha DESC',
    [legajo_id],
    (err, result) => {
      if (err) return res.status(500).json({ error: 'Error al obtener auditoría' });
      res.json(result);
    }
  );
};

// Función para actualizar legajos masivamente desde Excel
exports.actualizarLegajosMasivo = async (req, res) => {
  console.log('🔄 Iniciando actualización masiva de legajos');
  
  try {
    const { usuarios } = req.body;
    
    if (!usuarios || !Array.isArray(usuarios) || usuarios.length === 0) {
      console.log('❌ Error: Array de usuarios vacío o inválido');
      return res.status(400).json({ 
        success: false, 
        message: 'Array de usuarios vacío o inválido' 
      });
    }

    console.log(`📊 Actualizando ${usuarios.length} legajos`);

    const resultados = {
      exitosos: 0,
      errores: [],
      advertencias: []
    };

    for (let i = 0; i < usuarios.length; i++) {
      const usuario = usuarios[i];
      const fila = i + 1;

      const legajo = String(usuario.legajo || '').trim();
      const dni = String(usuario.dni || usuario.nro_documento || '').trim();
      const nombre = String(usuario.nombre || '').trim();
      const apellido = String(usuario.apellido || '').trim();

      console.log(`🔍 Actualizando legajo ${fila}: ${legajo} - ${nombre} ${apellido}`);

      if (!legajo || !dni) {
        console.log(`❌ Faltan datos obligatorios en fila ${fila}`);
        resultados.errores.push({
          fila,
          error: 'Faltan datos obligatorios (legajo, dni)',
          usuario: `${nombre || 'N/A'} ${apellido || 'N/A'}`
        });
        continue;
      }

      try {
        // Buscar el usuario por legajo
        const usuarioExistente = await new Promise((resolve, reject) => {
          db.query('SELECT id FROM usuarios WHERE legajo = ?', [legajo], (err, results) => {
            if (err) return reject(err);
            resolve(results[0] || null);
          });
        });

        if (!usuarioExistente) {
          console.log(`⚠️ Usuario con legajo ${legajo} no encontrado`);
          resultados.advertencias.push({
            fila,
            mensaje: `Usuario con legajo ${legajo} no encontrado`,
            usuario: `${nombre} ${apellido}`
          });
          continue;
        }

        // Verificar si existe el legajo
        const legajoExistente = await new Promise((resolve, reject) => {
          db.query('SELECT id FROM legajos WHERE usuario_id = ?', [usuarioExistente.id], (err, results) => {
            if (err) return reject(err);
            resolve(results[0] || null);
          });
        });

        // Preparar datos para actualizar/crear
        let fechaNacimiento = usuario.fecha_nacimiento || null;
        
        if (fechaNacimiento) {
          if (typeof fechaNacimiento === 'number' && !isNaN(fechaNacimiento)) {
            console.log(`🔄 Convirtiendo fecha de Excel: ${fechaNacimiento}`);
            fechaNacimiento = convertirFechaExcel(fechaNacimiento);
            console.log(`✅ Fecha convertida: ${fechaNacimiento}`);
          }
        }

        // Función para limpiar y validar campos de texto
        const limpiarCampo = (valor, maxLength = 255) => {
          if (!valor) return null;
          const valorLimpio = String(valor).trim();
          if (valorLimpio === '' || valorLimpio === 'null' || valorLimpio === 'undefined') return null;
          
          if (valorLimpio.length > maxLength) {
            console.log(`⚠️ Campo truncado de ${valorLimpio.length} a ${maxLength} caracteres: ${valorLimpio.substring(0, 50)}...`);
            return valorLimpio.substring(0, maxLength);
          }
          return valorLimpio;
        };

        // Función especial para teléfonos
        const limpiarTelefono = (valor) => {
          if (!valor) return null;
          const valorLimpio = String(valor).replace(/[^\d\-\+\(\)\s]/g, '').trim();
          if (valorLimpio === '' || valorLimpio === 'null') return null;
          
          if (valorLimpio.length > 20) {
            console.log(`⚠️ Teléfono truncado de ${valorLimpio.length} a 20 caracteres: ${valorLimpio}`);
            return valorLimpio.substring(0, 20);
          }
          return valorLimpio;
        };

        // Función para construir domicilio completo concatenado
        const construirDomicilioCompleto = (usuario) => {
          const calle = limpiarCampo(usuario.domicilio_calle || usuario.calle, 200);
          const numero = limpiarCampo(usuario.domicilio_nro || usuario.numero, 10);
          const piso = limpiarCampo(usuario.domicilio_piso || usuario.piso, 10);
          const dpto = limpiarCampo(usuario.domicilio_dpto || usuario.departamento, 10);
          
          let domicilioCompleto = '';
          
          // Construir: Calle Número - Piso Dpto
          if (calle) {
            domicilioCompleto = calle;
            if (numero) {
              domicilioCompleto += ` ${numero}`;
            }
            if (piso || dpto) {
              domicilioCompleto += ' -';
              if (piso) {
                domicilioCompleto += ` Piso ${piso}`;
              }
              if (dpto) {
                domicilioCompleto += ` Dpto ${dpto}`;
              }
            }
          } else {
            // Si no hay calle, usar el domicilio tal como viene
            domicilioCompleto = limpiarCampo(usuario.domicilio, 200);
          }
          
          return domicilioCompleto || null;
        };

        // Función para buscar empresa por ID o nombre
        const buscarEmpresaId = async (empresaData) => {
          if (!empresaData) return null;
          
          // Si viene como número (ID directo), validar que existe
          if (!isNaN(empresaData) && Number(empresaData) > 0) {
            const empresaId = Number(empresaData);
            
            return new Promise((resolve, reject) => {
              const sql = 'SELECT id FROM empresas WHERE id = ? AND activa = 1';
              
              db.query(sql, [empresaId], (err, results) => {
                if (err) {
                  console.log(`⚠️ Error al validar empresa ID ${empresaId}:`, err.message);
                  resolve(null);
                } else if (results.length > 0) {
                  console.log(`✅ Empresa ID ${empresaId} válida y activa`);
                  resolve(empresaId);
                } else {
                  console.log(`⚠️ Empresa ID ${empresaId} no encontrada o inactiva`);
                  resolve(null);
                }
              });
            });
          }
          
          // Si viene como string, buscar por nombre (fallback)
          const nombreEmpresa = String(empresaData).trim();
          if (nombreEmpresa === '') return null;
          
          return new Promise((resolve, reject) => {
            const sql = `
              SELECT id FROM empresas 
              WHERE (nombre LIKE ? OR razon_social LIKE ?) AND activa = 1
              LIMIT 1
            `;
            
            db.query(sql, [`%${nombreEmpresa}%`, `%${nombreEmpresa}%`], (err, results) => {
              if (err) {
                console.log(`⚠️ Error al buscar empresa "${nombreEmpresa}":`, err.message);
                resolve(null);
              } else if (results.length > 0) {
                console.log(`✅ Empresa encontrada: "${nombreEmpresa}" -> ID ${results[0].id}`);
                resolve(results[0].id);
              } else {
                console.log(`⚠️ Empresa no encontrada: "${nombreEmpresa}"`);
                resolve(null);
              }
            });
          });
        };

        // Buscar empresa_id si viene especificada
        const empresaId = await buscarEmpresaId(
          usuario.empresa_id || 
          usuario.empresa || 
          usuario.empresa_nombre || 
          usuario.razon_social ||
          null
        );

        const datosLegajo = {
          nombre: limpiarCampo(nombre, 100),
          apellido: limpiarCampo(apellido, 100),
          email_personal: limpiarCampo(usuario.email_personal || usuario.correo || `${nombre.toLowerCase()}.${apellido.toLowerCase()}@temp.com`, 100),
          nro_documento: limpiarCampo(dni, 20),
          cuil: limpiarCampo(usuario.cuil, 20),
          fecha_nacimiento: fechaNacimiento,
          fecha_ingreso: usuario.fecha_ingreso || usuario.FecIngreso || usuario.fecha_ing || usuario.FechaIng || new Date().toISOString().split('T')[0],
          // Campos adicionales del Excel con validación
          domicilio: construirDomicilioCompleto(usuario),
          localidad: limpiarCampo(usuario.localidad, 100),
          codigo_postal: limpiarCampo(usuario.codigo_postal || usuario.DomicilioCodPos, 10),
          telefono_contacto: limpiarTelefono(usuario.telefono || usuario.telefono_contacto),
          contacto_emergencia: limpiarTelefono(usuario.contacto_emergencia),
          estado_civil: limpiarCampo(usuario.estado_civil || usuario.DescEstado, 100),
          cuenta_bancaria: limpiarCampo(usuario.cuenta_bancaria || usuario.cbu || usuario.nroctabancaria, 50),
          banco_destino: limpiarCampo(usuario.banco || usuario.banco_destino || usuario.descbanco, 100),
          centro_costos: limpiarCampo(usuario.centro_costos || usuario.centro_costo || usuario.cenrtoA, 100),
          tarea_desempenada: limpiarCampo(usuario.tarea || usuario.puesto || usuario.cargo || usuario.atributoEsp1, 200),
          apellido_casada: limpiarCampo(usuario.apellido_casada, 100),
          domicilio_calle: limpiarCampo(usuario.domicilio_calle || usuario.calle, 100),
          domicilio_nro: limpiarCampo(usuario.domicilio_nro || usuario.numero, 10),
          domicilio_piso: limpiarCampo(usuario.domicilio_piso || usuario.piso, 10),
          domicilio_dpto: limpiarCampo(usuario.domicilio_dpto || usuario.departamento, 10),
          sexo: limpiarCampo(usuario.sexo || usuario.genero, 10),
          tipo_documento: limpiarCampo(usuario.tipo_documento, 20) || 'DNI',
          nacionalidad: limpiarCampo(usuario.nacionalidad, 50) || 'Argentina',
          provincia: limpiarCampo(usuario.provincia, 50),
          empresa_id: empresaId
        };

        if (legajoExistente) {
          // Actualizar legajo existente
          await new Promise((resolve, reject) => {
            const sqlUpdate = `
              UPDATE legajos SET 
                nombre = ?, apellido = ?, email_personal = ?, 
                nro_documento = ?, cuil = ?, fecha_nacimiento = ?, 
                fecha_ingreso = COALESCE(fecha_ingreso, ?),
                domicilio = COALESCE(?, domicilio),
                localidad = COALESCE(?, localidad),
                codigo_postal = COALESCE(?, codigo_postal),
                telefono_contacto = COALESCE(?, telefono_contacto),
                contacto_emergencia = COALESCE(?, contacto_emergencia),
                estado_civil = COALESCE(?, estado_civil),
                cuenta_bancaria = COALESCE(?, cuenta_bancaria),
                banco_destino = COALESCE(?, banco_destino),
                centro_costos = COALESCE(?, centro_costos),
                tarea_desempenada = COALESCE(?, tarea_desempenada),
                apellido_casada = COALESCE(?, apellido_casada),
                domicilio_calle = COALESCE(?, domicilio_calle),
                domicilio_nro = COALESCE(?, domicilio_nro),
                domicilio_piso = COALESCE(?, domicilio_piso),
                domicilio_dpto = COALESCE(?, domicilio_dpto),
                sexo = COALESCE(?, sexo),
                tipo_documento = COALESCE(?, tipo_documento),
                nacionalidad = COALESCE(?, nacionalidad),
                provincia = COALESCE(?, provincia),
                empresa_id = COALESCE(?, empresa_id)
              WHERE usuario_id = ?
            `;

            db.query(sqlUpdate, [
              datosLegajo.nombre,
              datosLegajo.apellido,
              datosLegajo.email_personal,
              datosLegajo.nro_documento,
              datosLegajo.cuil,
              datosLegajo.fecha_nacimiento,
              datosLegajo.fecha_ingreso,
              datosLegajo.domicilio,
              datosLegajo.localidad,
              datosLegajo.codigo_postal,
              datosLegajo.telefono_contacto,
              datosLegajo.contacto_emergencia,
              datosLegajo.estado_civil,
              datosLegajo.cuenta_bancaria,
              datosLegajo.banco_destino,
              datosLegajo.centro_costos,
              datosLegajo.tarea_desempenada,
              datosLegajo.apellido_casada,
              datosLegajo.domicilio_calle,
              datosLegajo.domicilio_nro,
              datosLegajo.domicilio_piso,
              datosLegajo.domicilio_dpto,
              datosLegajo.sexo,
              datosLegajo.tipo_documento,
              datosLegajo.nacionalidad,
              datosLegajo.provincia,
              datosLegajo.empresa_id,
              usuarioExistente.id
            ], (err) => {
              if (err) {
                console.log(`❌ Error al actualizar legajo:`, err);
                return reject(err);
              }
              console.log(`✅ Legajo actualizado para usuario ID: ${usuarioExistente.id}`);
              
              // Registrar auditoría
              const usuario_audit = req.user.id;
              const datos_audit = JSON.stringify(datosLegajo);
              const auditoriaSql = `
                INSERT INTO auditoria_legajos (legajo_id, usuario_id, accion, datos)
                VALUES (?, ?, 'editar', ?)
              `;
              
              db.query(auditoriaSql, [legajoExistente.id, usuario_audit, datos_audit], (err2) => {
                if (err2) console.error('⚠️ Error al registrar auditoría:', err2);
                resolve();
              });
            });
          });
        } else {
          // Crear nuevo legajo
          await new Promise((resolve, reject) => {
            const sqlInsert = `
              INSERT INTO legajos (
                usuario_id, nombre, apellido, email_personal, nro_documento, cuil, 
                fecha_nacimiento, fecha_ingreso, domicilio, localidad, codigo_postal,
                telefono_contacto, contacto_emergencia, estado_civil, cuenta_bancaria,
                banco_destino, centro_costos, tarea_desempenada, apellido_casada,
                domicilio_calle, domicilio_nro, domicilio_piso, domicilio_dpto,
                sexo, tipo_documento, nacionalidad, provincia, empresa_id
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `;

            db.query(sqlInsert, [
              usuarioExistente.id,
              datosLegajo.nombre,
              datosLegajo.apellido,
              datosLegajo.email_personal,
              datosLegajo.nro_documento,
              datosLegajo.cuil,
              datosLegajo.fecha_nacimiento,
              datosLegajo.fecha_ingreso,
              datosLegajo.domicilio,
              datosLegajo.localidad,
              datosLegajo.codigo_postal,
              datosLegajo.telefono_contacto,
              datosLegajo.contacto_emergencia,
              datosLegajo.estado_civil,
              datosLegajo.cuenta_bancaria,
              datosLegajo.banco_destino,
              datosLegajo.centro_costos,
              datosLegajo.tarea_desempenada,
              datosLegajo.apellido_casada,
              datosLegajo.domicilio_calle,
              datosLegajo.domicilio_nro,
              datosLegajo.domicilio_piso,
              datosLegajo.domicilio_dpto,
              datosLegajo.sexo,
              datosLegajo.tipo_documento,
              datosLegajo.nacionalidad,
              datosLegajo.provincia,
              datosLegajo.empresa_id || null
            ], (err, result) => {
              if (err) {
                console.log(`❌ Error al crear legajo:`, err);
                return reject(err);
              }
              console.log(`✅ Legajo creado para usuario ID: ${usuarioExistente.id}`);
              
              // Registrar auditoría
              const legajo_id = result.insertId;
              const usuario_audit = req.user.id;
              const datos_audit = JSON.stringify(datosLegajo);
              const auditoriaSql = `
                INSERT INTO auditoria_legajos (legajo_id, usuario_id, accion, datos)
                VALUES (?, ?, 'crear', ?)
              `;
              
              db.query(auditoriaSql, [legajo_id, usuario_audit, datos_audit], (err2) => {
                if (err2) console.error('⚠️ Error al registrar auditoría:', err2);
                resolve();
              });
            });
          });
        }

        resultados.exitosos++;
        console.log(`🎉 Legajo de ${nombre} ${apellido} actualizado exitosamente`);

      } catch (err) {
        console.error(`❌ Error al actualizar legajo en fila ${fila}:`, err);
        resultados.errores.push({
          fila,
          error: `Error interno: ${err.message}`,
          usuario: `${nombre} ${apellido}`
        });
      }
    }

    console.log('✅ Actualización masiva de legajos completada:', resultados);
    res.json({
      mensaje: `Actualización completada. ${resultados.exitosos} legajos actualizados.`,
      exitosos: resultados.exitosos,
      totalProcesados: usuarios.length,
      errores: resultados.errores,
      advertencias: resultados.advertencias
    });

  } catch (error) {
    console.error('❌ Error en actualización masiva de legajos:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

// Función para actualizar datos adicionales de legajos existentes
exports.actualizarDatosAdicionales = async (req, res) => {
  try {
    const { datos } = req.body;
    
    if (!datos || !Array.isArray(datos)) {
      return res.status(400).json({ error: 'Se requiere un array de datos' });
    }
    
    console.log('Actualizando datos adicionales para', datos.length, 'registros');
    
    let exitosos = 0;
    let errores = [];
    let advertencias = [];
    
    for (let i = 0; i < datos.length; i++) {
      const registro = datos[i];
      const fila = i + 1;
      
      try {
        // Buscar el legajo por CUIL (prioritario), DNI o número de legajo
        let legajoExistente = null;
        
        // Prioridad 1: Buscar por CUIL si está disponible
        if (registro.cuil_busqueda) {
          const sqlBusquedaCuil = `
            SELECT l.*, u.dni 
            FROM legajos l 
            JOIN usuarios u ON l.usuario_id = u.id 
            WHERE l.cuil = ?
          `;
          
          const resultadoCuil = await new Promise((resolve, reject) => {
            db.query(sqlBusquedaCuil, [registro.cuil_busqueda], (err, results) => {
              if (err) reject(err);
              else resolve(results);
            });
          });
          
          if (resultadoCuil.length > 0) {
            legajoExistente = resultadoCuil[0];
            console.log(`✅ Legajo encontrado por CUIL: ${registro.cuil_busqueda}`);
          }
        }
        
        // Prioridad 2: Buscar por DNI si no se encontró por CUIL
        if (!legajoExistente && registro.dni_busqueda) {
          const sqlBusquedaDni = `
            SELECT l.*, u.dni 
            FROM legajos l 
            JOIN usuarios u ON l.usuario_id = u.id 
            WHERE u.dni = ?
          `;
          
          const resultadoDni = await new Promise((resolve, reject) => {
            db.query(sqlBusquedaDni, [registro.dni_busqueda], (err, results) => {
              if (err) reject(err);
              else resolve(results);
            });
          });
          
          if (resultadoDni.length > 0) {
            legajoExistente = resultadoDni[0];
            console.log(`✅ Legajo encontrado por DNI: ${registro.dni_busqueda}`);
          }
        }
        
        if (!legajoExistente && registro.legajo_busqueda) {
          const sqlBusquedaLegajo = `
            SELECT l.*, u.dni 
            FROM legajos l 
            JOIN usuarios u ON l.usuario_id = u.id 
            WHERE u.legajo = ?
          `;
          
          const resultadoLegajo = await new Promise((resolve, reject) => {
            db.query(sqlBusquedaLegajo, [registro.legajo_busqueda], (err, results) => {
              if (err) reject(err);
              else resolve(results);
            });
          });
          
          if (resultadoLegajo.length > 0) {
            legajoExistente = resultadoLegajo[0];
            console.log(`✅ Legajo encontrado por número de legajo: ${registro.legajo_busqueda}`);
          }
        }
        
        if (!legajoExistente) {
          errores.push({
            fila: fila,
            error: `No se encontró legajo para CUIL: ${registro.cuil_busqueda || 'N/A'}, DNI: ${registro.dni_busqueda || 'N/A'} o Legajo: ${registro.legajo_busqueda || 'N/A'}`
          });
          continue;
        }
        
        // Preparar campos para actualizar (solo los que tienen valor)
        const camposActualizar = [];
        const valoresActualizar = [];
        
        // Función para buscar empresa por ID o nombre (misma lógica que actualizarLegajosMasivo)
        const buscarEmpresaId = async (empresaData) => {
          if (!empresaData) return null;
          
          // Si viene como número (ID directo), validar que existe
          if (!isNaN(empresaData) && Number(empresaData) > 0) {
            const empresaId = Number(empresaData);
            
            return new Promise((resolve, reject) => {
              const sql = 'SELECT id FROM empresas WHERE id = ? AND activa = 1';
              
              db.query(sql, [empresaId], (err, results) => {
                if (err) {
                  console.log(`⚠️ Error al validar empresa ID ${empresaId}:`, err.message);
                  resolve(null);
                } else if (results.length > 0) {
                  console.log(`✅ Empresa ID ${empresaId} válida y activa`);
                  resolve(empresaId);
                } else {
                  console.log(`⚠️ Empresa ID ${empresaId} no encontrada o inactiva`);
                  resolve(null);
                }
              });
            });
          }
          
          // Si viene como string, buscar por nombre (fallback)
          const nombreEmpresa = String(empresaData).trim();
          if (nombreEmpresa === '') return null;
          
          return new Promise((resolve, reject) => {
            const sql = `
              SELECT id FROM empresas 
              WHERE (nombre LIKE ? OR razon_social LIKE ?) AND activa = 1
              LIMIT 1
            `;
            
            db.query(sql, [`%${nombreEmpresa}%`, `%${nombreEmpresa}%`], (err, results) => {
              if (err) {
                console.log(`⚠️ Error al buscar empresa "${nombreEmpresa}":`, err.message);
                resolve(null);
              } else if (results.length > 0) {
                console.log(`✅ Empresa encontrada: "${nombreEmpresa}" -> ID ${results[0].id}`);
                resolve(results[0].id);
              } else {
                console.log(`⚠️ Empresa no encontrada: "${nombreEmpresa}"`);
                resolve(null);
              }
            });
          });
        };
        
        // Procesar campos especiales antes del loop general
        for (const campo in registro) {
          if (['dni_busqueda', 'legajo_busqueda', 'cuil_busqueda'].includes(campo)) {
            continue; // Saltar campos de búsqueda
          }
          
          if (['empresa_id', 'empresa', 'empresa_nombre', 'razon_social'].includes(campo) && registro[campo]) {
            // Manejar empresa especialmente
            const empresaId = await buscarEmpresaId(registro[campo]);
            if (empresaId) {
              camposActualizar.push('empresa_id = ?');
              valoresActualizar.push(empresaId);
              console.log(`✅ Empresa asignada: ID ${empresaId} para legajo ${legajoExistente.id}`);
            }
            continue;
          }
          
          if (registro[campo]) {
            camposActualizar.push(`${campo} = ?`);
            valoresActualizar.push(registro[campo]);
          }
        }
        
        if (camposActualizar.length === 0) {
          advertencias.push({
            fila: fila,
            mensaje: 'No hay datos para actualizar en este registro'
          });
          continue;
        }
        
        // Actualizar el legajo
        const sqlActualizar = `
          UPDATE legajos 
          SET ${camposActualizar.join(', ')}
          WHERE id = ?
        `;
        
        valoresActualizar.push(legajoExistente.id);
        
        await new Promise((resolve, reject) => {
          db.query(sqlActualizar, valoresActualizar, (err, result) => {
            if (err) {
              console.error(`Error al actualizar legajo ID ${legajoExistente.id}:`, err);
              reject(err);
            } else {
              console.log(`✅ Legajo ID ${legajoExistente.id} actualizado exitosamente`);
              resolve(result);
            }
          });
        });
        
        // Registrar en auditoría
        const datosAuditoria = JSON.stringify(registro);
        const sqlAuditoria = `
          INSERT INTO auditoria_legajos (legajo_id, usuario_id, accion, datos)
          VALUES (?, ?, 'editar', ?)
        `;
        
        db.query(sqlAuditoria, [legajoExistente.id, req.user.id, datosAuditoria], (err2) => {
          if (err2) console.error('⚠️ Error al registrar auditoría:', err2);
        });
        
        exitosos++;
        
      } catch (error) {
        console.error(`❌ Error al procesar fila ${fila}:`, error);
        errores.push({
          fila: fila,
          error: error.message
        });
      }
    }
    
    console.log(`✅ Actualización de datos adicionales completada: ${exitosos} exitosos, ${errores.length} errores, ${advertencias.length} advertencias`);
    
    res.json({
      success: true,
      exitosos: exitosos,
      errores: errores,
      advertencias: advertencias,
      mensaje: `Datos adicionales actualizados: ${exitosos} exitosos, ${errores.length} errores`
    });
    
  } catch (error) {
    console.error('❌ Error general en actualización de datos adicionales:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

// Obtener empresas activas para dropdown
exports.obtenerEmpresas = (req, res) => {
  const sql = `
    SELECT id, nombre, razon_social 
    FROM empresas 
    WHERE activa = 1 
    ORDER BY nombre ASC
  `;
  
  db.query(sql, (err, results) => {
    if (err) {
      console.error('Error al obtener empresas:', err);
      return res.status(500).json({ error: 'Error al obtener empresas' });
    }
    res.json(results);
  });
};

// ============= NUEVOS MÉTODOS PARA GESTIÓN DE MÚLTIPLES LEGAJOS =============

// Obtener todos los legajos del usuario autenticado
exports.getMisLegajos = (req, res) => {
  try {
    const user = req.user;
    legajoModel.obtenerPorUsuarioId(user.id, (err, results) => {
      if (err) {
        console.error('Error obteniendo legajos:', err);
        return res.status(500).json({ error: 'Error al obtener legajos' });
      }
      res.json(results);
    });
  } catch (error) {
    console.error('Error obteniendo legajos:', error);
    res.status(500).json({ error: 'Error al obtener legajos' });
  }
};

// Obtener legajos por DNI (para admin)
exports.getLegajosByDNI = (req, res) => {
  try {
    const { dni } = req.params;
    legajoModel.obtenerPorDocumento(dni, (err, results) => {
      if (err) {
        console.error('Error obteniendo legajos por DNI:', err);
        return res.status(500).json({ error: 'Error al obtener legajos' });
      }
      res.json(results);
    });
  } catch (error) {
    console.error('Error obteniendo legajos por DNI:', error);
    res.status(500).json({ error: 'Error al obtener legajos' });
  }
};

// Crear nuevo legajo
exports.crearLegajo = async (req, res) => {
  try {
    const user = req.user;
    const { empresa_id, numero_legajo, ...otrosDatos } = req.body;
    
    if (!empresa_id || !numero_legajo) {
      return res.status(400).json({ error: 'Empresa y número de legajo son requeridos' });
    }

    // Verificar que la empresa existe
    const empresaExiste = await new Promise((resolve, reject) => {
      db.query('SELECT id FROM empresas WHERE id = ?', [empresa_id], (err, results) => {
        if (err) reject(err);
        else resolve(results.length > 0);
      });
    });

    if (!empresaExiste) {
      return res.status(400).json({ error: 'La empresa especificada no existe' });
    }

    // Verificar que no existe otro legajo con el mismo número en la misma empresa
    const legajoExiste = await new Promise((resolve, reject) => {
      db.query(
        'SELECT id FROM legajos WHERE empresa_id = ? AND numero_legajo = ?',
        [empresa_id, numero_legajo],
        (err, results) => {
          if (err) reject(err);
          else resolve(results.length > 0);
        }
      );
    });

    if (legajoExiste) {
      return res.status(400).json({ error: 'Ya existe un legajo con ese número en la empresa' });
    }

    const datosLegajo = {
      empresa_id,
      numero_legajo,
      usuario_id: user.id,
      nro_documento: user.dni,
      nombre: user.nombre || '',
      apellido: user.apellido || '',
      ...otrosDatos
    };

    const nuevoLegajo = await legajoModel.crear(datosLegajo);
    res.status(201).json({ id: nuevoLegajo, message: 'Legajo creado exitosamente' });
  } catch (error) {
    console.error('Error creando legajo:', error);
    res.status(500).json({ error: 'Error al crear legajo' });
  }
};

// Actualizar legajo existente
exports.actualizarLegajo = async (req, res) => {
  try {
    const user = req.user;
    const { id } = req.params;
    const datosActualizacion = req.body;

    // Verificar que el legajo pertenece al usuario (o es admin)
    let condicionWhere = 'id = ?';
    let parametros = [id];
    
    if (user.rol !== 'admin' && user.rol !== 'superadmin') {
      condicionWhere += ' AND usuario_id = ?';
      parametros.push(user.id);
    }

    const legajo = await new Promise((resolve, reject) => {
      db.query(`SELECT * FROM legajos WHERE ${condicionWhere}`, parametros, (err, results) => {
        if (err) reject(err);
        else resolve(results[0] || null);
      });
    });

    if (!legajo) {
      return res.status(404).json({ error: 'Legajo no encontrado o no autorizado' });
    }

    // Si se cambia empresa_id o numero_legajo, verificar unicidad
    if (datosActualizacion.empresa_id || datosActualizacion.numero_legajo) {
      const empresa_id = datosActualizacion.empresa_id || legajo.empresa_id;
      const numero_legajo = datosActualizacion.numero_legajo || legajo.numero_legajo;

      const legajoExiste = await new Promise((resolve, reject) => {
        db.query(
          'SELECT id FROM legajos WHERE empresa_id = ? AND numero_legajo = ? AND id != ?',
          [empresa_id, numero_legajo, id],
          (err, results) => {
            if (err) reject(err);
            else resolve(results.length > 0);
          }
        );
      });

      if (legajoExiste) {
        return res.status(400).json({ error: 'Ya existe otro legajo con ese número en la empresa' });
      }
    }

    await legajoModel.actualizar(id, datosActualizacion);

    // Log de auditoría
    log.info('Legajo actualizado', {
      usuario_id: user.id,
      usuario_email: user.email,
      legajo_id: id,
      campos_actualizados: Object.keys(datosActualizacion),
      es_admin: user.rol === 'admin' || user.rol === 'superadmin'
    });

    res.json({ message: 'Legajo actualizado exitosamente' });
  } catch (error) {
    log.error('Error actualizando legajo', error, {
      usuario_id: req.user?.id,
      usuario_email: req.user?.email,
      legajo_id: req.params.id
    });
    res.status(500).json({ error: 'Error al actualizar legajo' });
  }
};

// Eliminar legajo
exports.eliminarLegajo = async (req, res) => {
  try {
    const user = req.user;
    const { id } = req.params;

    // Verificar que el legajo pertenece al usuario (o es admin)
    let condicionWhere = 'id = ?';
    let parametros = [id];
    
    if (user.rol !== 'admin' && user.rol !== 'superadmin') {
      condicionWhere += ' AND usuario_id = ?';
      parametros.push(user.id);
    }

    const legajo = await new Promise((resolve, reject) => {
      db.query(`SELECT * FROM legajos WHERE ${condicionWhere}`, parametros, (err, results) => {
        if (err) reject(err);
        else resolve(results[0] || null);
      });
    });

    if (!legajo) {
      return res.status(404).json({ error: 'Legajo no encontrado o no autorizado' });
    }

    // Verificar si hay recibos asociados
    const tieneRecibos = await new Promise((resolve, reject) => {
      db.query(
        'SELECT COUNT(*) as count FROM recibos_excel_raw WHERE DocNumero = ? AND Legajo = ?',
        [legajo.nro_documento, legajo.numero_legajo],
        (err, results) => {
          if (err) reject(err);
          else resolve(results[0].count > 0);
        }
      );
    });

    if (tieneRecibos) {
      return res.status(400).json({ 
        error: 'No se puede eliminar el legajo porque tiene recibos asociados' 
      });
    }

    await legajoModel.eliminar(id);
    res.json({ message: 'Legajo eliminado exitosamente' });
  } catch (error) {
    console.error('Error eliminando legajo:', error);
    res.status(500).json({ error: 'Error al eliminar legajo' });
  }
};
