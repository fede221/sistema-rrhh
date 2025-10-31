// Devuelve todos los datos del legajo del usuario autenticado
exports.miLegajo = (req, res) => {
  const usuarioId = req.user.id;
  const sql = `
    SELECT * FROM legajos WHERE usuario_id = ? LIMIT 1
  `;
  db.query(sql, [usuarioId], (err, results) => {
    if (err) {
      logError({ req, mensaje: 'Error al obtener legajo del usuario', detalles: err.stack || String(err) });
      return res.status(500).json({ error: 'Error al obtener legajo' });
    }
    if (!results || results.length === 0) {
      return res.status(404).json({ error: 'No se encontró legajo para el usuario' });
    }
    res.json(results[0]);
  });
};
const db = require('../config/db');
const bcrypt = require('bcrypt');
const { logError } = require('../utils/errorLogger');
const { logger } = require('../utils/secureLogger');
const { validatePassword } = require('../utils/passwordValidator');
const { isPasswordMarker, processPassword } = require('../utils/passwordGenerator');



exports.listarUsuarios = (req, res) => {
  const sql = 'SELECT id, legajo, dni, nombre, apellido, correo, rol, activo, referente_id, convenio FROM usuarios';

  db.query(sql, (err, results) => {
    if (err) {
      logError({ req, mensaje: 'Error al obtener usuarios', detalles: err.stack || String(err) });
      console.error('❌ Error al obtener usuarios:', err);
      return res.status(500).json({ error: 'Error al obtener usuarios' });
    }
    res.json(results);
  });
};




exports.crearUsuario = async (req, res) => {
  const {
    legajo,
    dni,
    nombre,
    apellido,
    correo,
    password,
    rol,
    cuil,
    fecha_nacimiento,
    referente_id,
    convenio
  } = req.body;
 
  // Validación detallada de campos
  const errores = [];

  if (!legajo || String(legajo).trim().length === 0) {
    errores.push('Legajo es obligatorio');
  } else if (String(legajo).trim().length < 2) {
    errores.push('Legajo debe tener al menos 2 caracteres');
  } else if (String(legajo).trim().length > 20) {
    errores.push('Legajo no puede tener más de 20 caracteres');
  }

  if (!dni || String(dni).trim().length === 0) {
    errores.push('DNI es obligatorio');
  } else if (!/^\d{7,8}$/.test(String(dni).trim())) {
    errores.push('DNI debe contener entre 7 y 8 dígitos numéricos');
  }

  if (!nombre || String(nombre).trim().length === 0) {
    errores.push('Nombre es obligatorio');
  } else if (String(nombre).trim().length > 100) {
    errores.push('Nombre no puede tener más de 100 caracteres');
  }

  if (!apellido || String(apellido).trim().length === 0) {
    errores.push('Apellido es obligatorio');
  } else if (String(apellido).trim().length > 100) {
    errores.push('Apellido no puede tener más de 100 caracteres');
  }

  if (!correo || String(correo).trim().length === 0) {
    errores.push('Correo electrónico es obligatorio');
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(correo).trim())) {
    errores.push('Formato de correo electrónico inválido');
  } else if (String(correo).trim().length > 100) {
    errores.push('Correo electrónico no puede tener más de 100 caracteres');
  }

  if (!password || String(password).trim().length === 0) {
    errores.push('Contraseña es obligatoria');
  } else if (String(password).trim().length > 255) {
    errores.push('Contraseña no puede tener más de 255 caracteres');
  } else {
    // 🛡️ Validación robusta de contraseña (8 chars, mayúscula, minúscula, número)
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      errores.push(...passwordValidation.errors);
    }
  }

  if (!rol || String(rol).trim().length === 0) {
    errores.push('Rol es obligatorio');
  } else {
    const rolesValidos = ['superadmin', 'admin_rrhh', 'empleado', 'referente_vacaciones', 'referente'];
    if (!rolesValidos.includes(String(rol).trim())) {
      errores.push(`Rol inválido. Debe ser uno de: ${rolesValidos.join(', ')}`);
    }
  }

  // Validar CUIL si está presente
  if (cuil && !/^\d{11}$/.test(String(cuil).trim())) {
    errores.push('CUIL debe contener exactamente 11 dígitos numéricos');
  }

  // Si hay errores de validación, retornarlos
  if (errores.length > 0) {
    logError({ req, mensaje: 'Errores de validación al crear usuario', detalles: errores.join('; ') });
    return res.status(400).json({ error: errores.join('; ') });
  }

  try {
    // Validar que no exista un usuario con ese DNI
    const existeDNI = await new Promise((resolve, reject) => {
      db.query('SELECT nombre, apellido FROM usuarios WHERE dni = ?', [dni], (err, results) => {
        if (err) {
          logError({ req, mensaje: 'Error al buscar usuario por DNI', detalles: err.stack || String(err) });
          // Error específico de conexión a BD
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

    if (existeDNI.length > 0) {
      const usuario = existeDNI[0];
      const mensajeError = `Ya existe un usuario con ese DNI (pertenece a ${usuario.nombre} ${usuario.apellido})`;
      logError({ req, mensaje: 'Intento de crear usuario con DNI ya existente', detalles: `DNI: ${dni} - ${mensajeError}` });
      return res.status(400).json({ 
        error: mensajeError,
        field: 'dni',
        type: 'DUPLICATE_FIELD'
      });
    }

    // Validar que no exista un usuario con ese legajo
    const existeLegajo = await new Promise((resolve, reject) => {
      db.query('SELECT nombre, apellido FROM usuarios WHERE legajo = ?', [legajo], (err, results) => {
        if (err) {
          logError({ req, mensaje: 'Error al buscar usuario por legajo', detalles: err.stack || String(err) });
          // Error específico de conexión a BD
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

    if (existeLegajo.length > 0) {
      const usuario = existeLegajo[0];
      const mensajeError = `Ya existe un usuario con ese legajo (pertenece a ${usuario.nombre} ${usuario.apellido})`;
      logError({ req, mensaje: 'Intento de crear usuario con legajo ya existente', detalles: `Legajo: ${legajo} - ${mensajeError}` });
      return res.status(400).json({ 
        error: mensajeError,
        field: 'legajo',
        type: 'DUPLICATE_FIELD'
      });
    }

    // Validar que no exista un usuario con ese correo
    const existeCorreo = await new Promise((resolve, reject) => {
      db.query('SELECT nombre, apellido FROM usuarios WHERE correo = ?', [correo], (err, results) => {
        if (err) {
          logError({ req, mensaje: 'Error al buscar usuario por correo', detalles: err.stack || String(err) });
          // Error específico de conexión a BD
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

    if (existeCorreo.length > 0) {
      const usuario = existeCorreo[0];
      const mensajeError = `Ya existe un usuario con ese correo electrónico (pertenece a ${usuario.nombre} ${usuario.apellido})`;
      logError({ req, mensaje: 'Intento de crear usuario con correo ya existente', detalles: `Correo: ${correo} - ${mensajeError}` });
      return res.status(400).json({ 
        error: mensajeError,
        field: 'correo',
        type: 'DUPLICATE_FIELD'
      });
    }

    const hash = await bcrypt.hash(password, 10);

    const sqlUsuario = `
      INSERT INTO usuarios (legajo, dni, nombre, apellido, correo, password, rol, activo, referente_id, convenio)
      VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?, ?)
    `;

    db.query(sqlUsuario, [legajo, dni, nombre, apellido, correo, hash, rol, referente_id || null, convenio || 'dentro'], (err, result) => {
      if (err) {
        // Error más específico basado en el código de MySQL
        let errorMsg = 'Error interno al crear usuario';
        let fieldName = null;
        let errorType = 'INTERNAL_ERROR';
        
        if (err.code === 'ER_DUP_ENTRY') {
          errorType = 'DUPLICATE_FIELD';
          if (err.message.includes('dni')) {
            errorMsg = 'Ya existe un usuario con ese DNI';
            fieldName = 'dni';
          } else if (err.message.includes('legajo')) {
            errorMsg = 'Ya existe un usuario con ese legajo';
            fieldName = 'legajo';
          } else if (err.message.includes('correo')) {
            errorMsg = 'Ya existe un usuario con ese correo electrónico';
            fieldName = 'correo';
          } else {
            errorMsg = 'Ya existe un usuario con esos datos';
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

        logError({ req, mensaje: 'Error al insertar usuario', detalles: `${errorMsg} - ${err.stack || String(err)}` });
        console.error('❌ Error al insertar usuario:', err);
        
        return res.status(err.code === 'ER_DUP_ENTRY' ? 400 : 500).json({ 
          error: errorMsg,
          field: fieldName,
          type: errorType
        });
      }
      
      const userId = result.insertId;
      console.log('✅ Usuario creado exitosamente:', { id: userId, legajo, dni, nombre, apellido });
      
      // 🆕 CREAR LEGAJO AUTOMÁTICAMENTE
      console.log('📄 Creando legajo automáticamente...');
      const sqlLegajo = `
        INSERT INTO legajos (
          usuario_id, numero_legajo, nombre, apellido, email_personal, nro_documento,
          tipo_documento, nacionalidad, fecha_ingreso, cuil
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURDATE(), ?)
      `;
      
      db.query(sqlLegajo, [
        userId,                           // usuario_id
        legajo,                          // numero_legajo (mismo que el usuario)
        nombre.trim(),                   // nombre
        apellido.trim(),                 // apellido
        correo.trim(),                   // email_personal
        dni.toString().trim(),           // nro_documento
        'DNI',                          // tipo_documento
        'Argentina',                    // nacionalidad (valor por defecto)
        cuil || null                    // cuil (si está disponible)
      ], (errLegajo) => {
        if (errLegajo) {
          console.error('⚠️ Error al crear legajo automático:', errLegajo);
          logError({ req, mensaje: 'Usuario creado pero error al crear legajo automático', detalles: errLegajo.stack || String(errLegajo) });
          
          // El usuario se creó correctamente, pero el legajo falló
          return res.json({ 
            id: userId, 
            mensaje: 'Usuario creado exitosamente pero falló la creación automática del legajo',
            advertencia: 'Deberá crear el legajo manualmente desde la sección de legajos',
            legajo,
            dni,
            nombre: `${nombre} ${apellido}`
          });
        }
        
        console.log('✅ Legajo automático creado exitosamente');
        res.json({ 
          id: userId, 
          mensaje: 'Usuario y legajo creados exitosamente',
          legajo,
          dni,
          nombre: `${nombre} ${apellido}`
        });
      });
    });
  } catch (err) {
    logError({ req, mensaje: 'Error inesperado al crear usuario', detalles: err.stack || String(err) });
    console.error('❌ Error inesperado al crear usuario:', err);
    
    let errorMsg = 'Error inesperado al crear usuario';
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
    } else if (err.code === 'ECONNREFUSED') {
      errorMsg = 'Error de conexión con la base de datos. Verifique la conectividad.';
      errorType = 'CONNECTION_ERROR';
      return res.status(503).json({ 
        error: errorMsg, 
        type: errorType 
      });
    } else if (err.code === 'ER_ACCESS_DENIED_ERROR') {
      errorMsg = 'Error de permisos en la base de datos';
      errorType = 'PERMISSION_ERROR';
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



exports.editarUsuario = (req, res) => {
  const { id } = req.params;
  const {
    legajo,
    dni,
    nombre,
    apellido,
    correo,
    rol,
    activo,
    password,
    referente_id,
    convenio
  } = req.body;
  
  const usuarioActual = req.user;

  // Verificar si se está intentando editar un usuario superadmin
  const verificarRolQuery = 'SELECT rol FROM usuarios WHERE id = ?';
  
  db.query(verificarRolQuery, [id], (err, results) => {
    if (err) {
      logError({ req, mensaje: 'Error al verificar permisos en editarUsuario', detalles: err.stack || String(err) });
      return res.status(500).json({ error: 'Error al verificar permisos' });
    }
    
    if (results.length === 0) {
      logError({ req, mensaje: 'Usuario no encontrado en editarUsuario', detalles: `ID: ${id}` });
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    
    const rolDelUsuario = results[0].rol;
    
    // Si el usuario actual es admin_rrhh y está intentando editar un superadmin
    if (usuarioActual.rol === 'admin_rrhh' && rolDelUsuario === 'superadmin') {
      logError({ req, mensaje: 'Intento de editar usuario superadmin', detalles: `ID: ${id}` });
      return res.status(403).json({ error: 'No tienes permisos para editar usuarios superadmin' });
    }
    
    // Proceder con la actualización
    const actualizarContrasena = password && password.trim() !== '';

    const updateFields = [
      'legajo = ?',
      'dni = ?',
      'nombre = ?',
      'apellido = ?',
      'correo = ?',
      'rol = ?',
      'activo = ?',
      'referente_id = ?',
      'convenio = ?'
    ];
    const values = [legajo, dni, nombre, apellido, correo, rol, activo, referente_id, convenio || 'dentro'];

    const terminarYActualizar = (passwordHash) => {
      if (passwordHash) {
        updateFields.push('password = ?');
        values.push(passwordHash);
      }

      const sql = `UPDATE usuarios SET ${updateFields.join(', ')} WHERE id = ?`;
      values.push(id);

      db.query(sql, values, (err) => {
        if (err) {
          logError({ req, mensaje: 'Error al editar usuario', detalles: err.stack || String(err) });
          return res.status(500).json({ error: 'Error al editar usuario' });
        }

        // 🔁 También actualizar el legajo
        const sqlLegajo = `
          UPDATE legajos
          SET nombre = ?, apellido = ?, email_personal = ?, nro_documento = ?
          WHERE usuario_id = ?
        `;

        const legajoValues = [nombre, apellido, correo, dni, id];

        db.query(sqlLegajo, legajoValues, (err2) => {
          if (err2) {
            logError({ req, mensaje: 'Usuario editado pero error al actualizar legajo', detalles: err2.stack || String(err2) });
            return res.status(500).json({ error: 'Usuario actualizado pero falló actualización de legajo' });
          }

          res.json({ message: '✅ Usuario y legajo actualizados correctamente' });
        });
      });
    };

    if (actualizarContrasena) {
      bcrypt.hash(password, 10, (err, hash) => {
        if (err) {
          logError({ req, mensaje: 'Error al hashear contraseña en editarUsuario', detalles: err.stack || String(err) });
          return res.status(500).json({ error: 'Error al encriptar la contraseña' });
        }
        terminarYActualizar(hash);
      });
    } else {
      terminarYActualizar(null);
    }
  });
};


exports.eliminarUsuario = (req, res) => {
  const { id } = req.params;
  const userRol = req.user.rol;
  const userId = req.user.id;

  const sql = 'SELECT id, rol FROM usuarios WHERE id = ?';
  db.query(sql, [id], (err, results) => {
    if (err) return res.status(500).json({ error: 'Error al buscar el usuario' });
    if (results.length === 0) return res.status(404).json({ error: 'Usuario no encontrado' });

    const usuario = results[0];

    if (usuario.rol === 'superadmin' && userRol !== 'superadmin') {
      return res.status(403).json({ error: 'No tenés permisos para eliminar un superadmin' });
    }

    if (usuario.id === userId) {
      return res.status(403).json({ error: 'No podés eliminarte a vos mismo' });
    }

    db.query('DELETE FROM usuarios WHERE id = ?', [id], (err2) => {
      if (err2) return res.status(500).json({ error: 'Error al eliminar el usuario' });
      res.json({ message: '✅ Usuario eliminado correctamente' });
    });
  });
};

exports.toggleActivo = (req, res) => {
  const id = req.params.id;
  const usuarioActual = req.user;

  if (parseInt(id) === usuarioActual.id) {
    return res.status(400).json({ error: 'No podés suspenderte a vos mismo.' });
  }

  const sqlGet = 'SELECT rol, activo FROM usuarios WHERE id = ?';
  db.query(sqlGet, [id], (err, result) => {
    if (err) return res.status(500).json({ error: 'Error al buscar usuario' });
    if (result.length === 0) return res.status(404).json({ error: 'Usuario no encontrado' });

    const { rol, activo } = result[0];

    if (rol === 'superadmin' && usuarioActual.rol !== 'superadmin') {
      return res.status(403).json({ error: 'No podés suspender un superadmin' });
    }

    const nuevoEstado = activo ? 0 : 1;
    const sqlUpdate = 'UPDATE usuarios SET activo = ? WHERE id = ?';
    db.query(sqlUpdate, [nuevoEstado, id], (err) => {
      if (err) return res.status(500).json({ error: 'Error al actualizar estado' });
      res.json({ mensaje: `Usuario ${nuevoEstado ? 'activado' : 'suspendido'} correctamente` });
    });
  });
};

exports.buscarPorDni = (req, res) => {
  const { dni } = req.params;

  const sql = 'SELECT id, nombre, apellido FROM usuarios WHERE dni = ? AND activo = 1';

  db.query(sql, [dni], (err, result) => {
    if (err) {
      console.error('❌ Error en la consulta:', err);
      return res.status(500).json({ error: 'Error interno' });
    }

    if (result.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    res.json(result[0]);
  });
};

exports.cambiarPassword = (req, res) => {
  const { userId, nuevaPassword } = req.body;

  if (!userId || !nuevaPassword) {
    return res.status(400).json({ error: 'Faltan datos' });
  }

  const hash = bcrypt.hashSync(nuevaPassword, 10);
  const sql = 'UPDATE usuarios SET password = ? WHERE id = ?';

  db.query(sql, [hash, userId], (err, resultado) => {
    if (err) {
      console.error('💥 Error al cambiar contraseña:', err);
      return res.status(500).json({ error: 'Error interno' });
    }

    res.json({ success: true, mensaje: 'Contraseña actualizada' });
  });
};

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

exports.importarUsuariosMasivo = async (req, res) => {
  // ⚠️ NO loguear req.body - contiene contraseñas de usuarios nuevos
  logger.info('🔥 Recibida petición de importación masiva', {
    userId: req.user?.id,
    userRole: req.user?.rol,
    ip: req.ip
  });

  const { usuarios } = req.body;

  if (!usuarios || !Array.isArray(usuarios) || usuarios.length === 0) {
    logger.info('❌ Error: Array de usuarios vacío o inválido', {
      userId: req.user?.id
    });
    return res.status(400).json({ error: 'Debe proporcionar un array de usuarios' });
  }

  logger.info(`📊 Procesando ${usuarios.length} usuarios`, {
    cantidad: usuarios.length,
    userId: req.user?.id
  });

  const resultados = {
    exitosos: 0,
    errores: [],
    advertencias: []
  };

  // Función de validación detallada
  const validarUsuario = (usuario, fila) => {
    const errores = [];
    
    // Validar legajo
    const legajo = String(usuario.legajo || '').trim();
    if (!legajo) {
      errores.push('Legajo es obligatorio');
    } else if (legajo.length < 2) {
      errores.push('Legajo debe tener al menos 2 caracteres');
    } else if (legajo.length > 20) {
      errores.push('Legajo no puede tener más de 20 caracteres');
    }

    // Validar DNI
    const dni = String(usuario.dni || '').trim();
    if (!dni) {
      errores.push('DNI es obligatorio');
    } else if (!/^\d{7,8}$/.test(dni)) {
      errores.push('DNI debe contener entre 7 y 8 dígitos numéricos');
    }

    // Validar nombre y apellido
    const nombre = String(usuario.nombre || '').trim();
    const apellido = String(usuario.apellido || '').trim();
    
    if (!nombre && !apellido) {
      const nombreCompleto = String(usuario.nombreCompleto || usuario.nombre_completo || '').trim();
      if (!nombreCompleto) {
        errores.push('Nombre y apellido son obligatorios');
      }
    } else {
      if (!nombre) errores.push('Nombre es obligatorio');
      if (!apellido) errores.push('Apellido es obligatorio');
      if (nombre && nombre.length > 100) errores.push('Nombre no puede tener más de 100 caracteres');
      if (apellido && apellido.length > 100) errores.push('Apellido no puede tener más de 100 caracteres');
    }

    // Validar correo
    const correo = String(usuario.correo || '').trim();
    if (!correo) {
      errores.push('Correo electrónico es obligatorio');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) {
      errores.push('Formato de correo electrónico inválido');
    } else if (correo.length > 100) {
      errores.push('Correo electrónico no puede tener más de 100 caracteres');
    }

    // Validar contraseña
    const password = String(usuario.password || '').trim();
    if (!password) {
      errores.push('Contraseña es obligatoria');
    } else if (password === 'undefined' || password === 'null') {
      errores.push('Contraseña tiene un valor inválido');
    } else if (password.length > 255) {
      errores.push('Contraseña no puede tener más de 255 caracteres');
    } else if (!isPasswordMarker(password)) {
      // Solo validar si NO es un marcador especial (como [PRESENTE])
      // Si es un marcador, será generada automáticamente
      const passwordValidation = validatePassword(password);
      if (!passwordValidation.valid) {
        errores.push(...passwordValidation.errors);
      }
    }

    // Validar rol
    const rol = String(usuario.rol || 'empleado').trim();
    const rolesValidos = ['superadmin', 'admin_rrhh', 'empleado', 'referente_vacaciones'];
    if (!rolesValidos.includes(rol)) {
      errores.push(`Rol inválido. Debe ser uno de: ${rolesValidos.join(', ')}`);
    }

    // Validar CUIL si está presente
    const cuil = String(usuario.cuil || '').trim();
    if (cuil && !/^\d{11}$/.test(cuil)) {
      errores.push('CUIL debe contener exactamente 11 dígitos numéricos');
    }

    // Validar fecha de nacimiento si está presente
    if (usuario.fecha_nacimiento) {
      let fechaNacimiento = usuario.fecha_nacimiento;
      
      if (typeof fechaNacimiento === 'number' && !isNaN(fechaNacimiento)) {
        // Es una fecha de Excel, verificar que sea un número válido
        if (fechaNacimiento < 1 || fechaNacimiento > 50000) {
          errores.push('Fecha de nacimiento de Excel fuera del rango válido');
        }
      } else if (typeof fechaNacimiento === 'string') {
        const fecha = new Date(fechaNacimiento);
        if (isNaN(fecha.getTime())) {
          errores.push('Formato de fecha de nacimiento inválido');
        } else {
          // Verificar que sea una fecha razonable
          const ahora = new Date();
          const hace120Anos = new Date(ahora.getFullYear() - 120, ahora.getMonth(), ahora.getDate());
          const hace16Anos = new Date(ahora.getFullYear() - 16, ahora.getMonth(), ahora.getDate());
          
          if (fecha < hace120Anos || fecha > hace16Anos) {
            errores.push('Fecha de nacimiento debe estar entre hace 120 años y hace 16 años');
          }
        }
      }
    }

    // Validar estado civil si está presente
    const estadoCivil = String(usuario.estado_civil || '').trim();
    if (estadoCivil && estadoCivil.length > 100) {
      errores.push('Estado civil no puede tener más de 100 caracteres');
    }

    return errores;
  };

  // Validar que cada usuario tenga los campos obligatorios
  for (let i = 0; i < usuarios.length; i++) {
    const usuario = usuarios[i];
    const fila = i + 1; // Número de fila para referencia

    console.log(`🔍 Validando usuario ${fila}:`, {
      legajo: usuario.legajo,
      dni: usuario.dni,
      nombre: usuario.nombre,
      apellido: usuario.apellido,
      password: usuario.password ? '[PRESENTE]' : '[FALTANTE]'
    });

    // Ejecutar validaciones detalladas
    const erroresValidacion = validarUsuario(usuario, fila);
    
    if (erroresValidacion.length > 0) {
      console.log(`❌ Errores de validación en fila ${fila}:`, erroresValidacion);
      resultados.errores.push({
        fila,
        error: erroresValidacion.join('; '),
        usuario: `${usuario.nombre || 'N/A'} ${usuario.apellido || 'N/A'}`
      });
      continue;
    }

    // Validar y limpiar los datos después de la validación
    const legajo = String(usuario.legajo || '').trim();
    const dni = String(usuario.dni || '').trim();
    
    // Procesamiento de nombre y apellido
    let nombre = String(usuario.nombre || '').trim();
    let apellido = String(usuario.apellido || '').trim();
    
    // Solo si faltan datos, intentar separar desde nombre completo
    if (!nombre && !apellido) {
      const nombreCompleto = String(usuario.nombreCompleto || usuario.nombre_completo || '').trim();
      if (nombreCompleto.includes(' ')) {
        const partes = nombreCompleto.split(' ');
        nombre = partes[0];
        apellido = partes.slice(1).join(' ');
      } else if (nombreCompleto) {
        nombre = nombreCompleto;
        apellido = 'Sin Apellido';
      }
    }
    
    const correo = String(usuario.correo || '').trim();
    const password = String(usuario.password || '').trim();
    const rol = String(usuario.rol || 'empleado').trim();

    console.log(`✅ Datos procesados para fila ${fila}:`, {legajo, dni, nombre, apellido, rol});

    try {
      // Verificar si ya existe un usuario con ese DNI
      const existeDNI = await new Promise((resolve, reject) => {
        db.query('SELECT dni, nombre, apellido FROM usuarios WHERE dni = ?', [dni], (err, results) => {
          if (err) return reject(err);
          resolve(results[0] || null);
        });
      });

      if (existeDNI) {
        console.log(`⚠️ DNI ${dni} ya existe`);
        resultados.errores.push({
          fila,
          error: `DNI ya existe en el sistema (pertenece a ${existeDNI.nombre} ${existeDNI.apellido})`,
          usuario: `${nombre} ${apellido} (DNI: ${dni})`
        });
        continue;
      }

      // Verificar si ya existe un usuario con ese legajo
      const existeLegajo = await new Promise((resolve, reject) => {
        db.query('SELECT legajo, nombre, apellido FROM usuarios WHERE legajo = ?', [legajo], (err, results) => {
          if (err) return reject(err);
          resolve(results[0] || null);
        });
      });

      if (existeLegajo) {
        console.log(`⚠️ Legajo ${legajo} ya existe`);
        resultados.errores.push({
          fila,
          error: `Legajo ya existe en el sistema (pertenece a ${existeLegajo.nombre} ${existeLegajo.apellido})`,
          usuario: `${nombre} ${apellido} (Legajo: ${legajo})`
        });
        continue;
      }

      // Verificar si ya existe un usuario con ese correo
      const existeCorreo = await new Promise((resolve, reject) => {
        db.query('SELECT correo, nombre, apellido FROM usuarios WHERE correo = ?', [correo], (err, results) => {
          if (err) return reject(err);
          resolve(results[0] || null);
        });
      });

      if (existeCorreo) {
        console.log(`⚠️ Correo ${correo} ya existe`);
        resultados.errores.push({
          fila,
          error: `Correo electrónico ya existe en el sistema (pertenece a ${existeCorreo.nombre} ${existeCorreo.apellido})`,
          usuario: `${nombre} ${apellido} (Correo: ${correo})`
        });
        continue;
      }

      // Procesar contraseña: generar si es marcador
      let passwordFinal = password;
      let passwordWasGenerated = false;
      
      if (isPasswordMarker(password)) {
        const result = processPassword(password, dni, apellido);
        passwordFinal = result.password;
        passwordWasGenerated = result.wasGenerated;
        console.log(`🔑 Contraseña generada automáticamente para ${nombre} ${apellido} (método: ${result.method})`);
      }

      // Hash de la contraseña
      console.log(`🔐 Hasheando password para ${nombre} ${apellido}`);
      const hash = await bcrypt.hash(passwordFinal, 10);

      // Insertar usuario
      const usuarioCreado = await new Promise((resolve, reject) => {
        const sqlUsuario = `
          INSERT INTO usuarios (legajo, dni, nombre, apellido, correo, password, rol, activo)
          VALUES (?, ?, ?, ?, ?, ?, ?, 1)
        `;

        console.log(`💾 Insertando usuario: ${nombre} ${apellido}`);
        db.query(sqlUsuario, [
          legajo,
          dni,
          nombre,
          apellido,
          correo,
          hash,
          rol
        ], (err, result) => {
          if (err) {
            console.log(`❌ Error al insertar usuario:`, err);
            // Error más específico basado en el código de MySQL
            let errorMsg = 'Error interno al crear usuario';
            if (err.code === 'ER_DUP_ENTRY') {
              if (err.message.includes('dni')) errorMsg = 'DNI duplicado';
              else if (err.message.includes('legajo')) errorMsg = 'Legajo duplicado';
              else if (err.message.includes('correo')) errorMsg = 'Correo duplicado';
              else errorMsg = 'Datos duplicados';
            } else if (err.code === 'ER_DATA_TOO_LONG') {
              errorMsg = 'Algún campo excede la longitud máxima permitida';
            } else if (err.code === 'ER_BAD_NULL_ERROR') {
              errorMsg = 'Falta un campo obligatorio';
            }
            return reject(new Error(errorMsg));
          }
          console.log(`✅ Usuario insertado con ID: ${result.insertId}`);
          resolve(result.insertId);
        });
      });

      // Buscar empresa por nombre si se proporciona
      let empresaId = 1; // Default: Catering S.A.
      
      if (usuario.empresa && String(usuario.empresa).trim() !== '') {
        const empresaNombre = String(usuario.empresa).trim();
        console.log(`🏢 Buscando empresa: ${empresaNombre}`);
        
        try {
          const empresaEncontrada = await new Promise((resolve, reject) => {
            db.query(
              'SELECT id FROM empresas WHERE nombre LIKE ? OR razon_social LIKE ? LIMIT 1', 
              [`%${empresaNombre}%`, `%${empresaNombre}%`], 
              (err, results) => {
                if (err) return reject(err);
                resolve(results[0] || null);
              }
            );
          });
          
          if (empresaEncontrada) {
            empresaId = empresaEncontrada.id;
            console.log(`✅ Empresa encontrada: ID ${empresaId}`);
          } else {
            console.log(`⚠️ Empresa "${empresaNombre}" no encontrada, usando default (ID: 1)`);
          }
        } catch (error) {
          console.log(`❌ Error buscando empresa:`, error);
          console.log(`⚠️ Usando empresa default (ID: 1)`);
        }
      }

      // Crear o actualizar legajo asociado
      await new Promise((resolve, reject) => {
        // Usar INSERT ... ON DUPLICATE KEY UPDATE para crear o actualizar
        const sqlLegajo = `
          INSERT INTO legajos (
            usuario_id, numero_legajo, empresa_id, nombre, apellido, email_personal, nro_documento, cuil, 
            fecha_nacimiento, fecha_ingreso, domicilio, localidad, codigo_postal,
            telefono_contacto, contacto_emergencia, estado_civil, cuenta_bancaria,
            banco_destino, centro_costos, tarea_desempenada, sexo, tipo_documento,
            nacionalidad, provincia
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURDATE(), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE
            usuario_id = VALUES(usuario_id),
            nombre = VALUES(nombre),
            apellido = VALUES(apellido),
            email_personal = VALUES(email_personal),
            nro_documento = VALUES(nro_documento),
            cuil = VALUES(cuil),
            fecha_nacimiento = VALUES(fecha_nacimiento),
            domicilio = VALUES(domicilio),
            localidad = VALUES(localidad),
            codigo_postal = VALUES(codigo_postal),
            telefono_contacto = VALUES(telefono_contacto),
            contacto_emergencia = VALUES(contacto_emergencia),
            estado_civil = VALUES(estado_civil),
            cuenta_bancaria = VALUES(cuenta_bancaria),
            banco_destino = VALUES(banco_destino),
            centro_costos = VALUES(centro_costos),
            tarea_desempenada = VALUES(tarea_desempenada),
            sexo = VALUES(sexo),
            tipo_documento = VALUES(tipo_documento),
            nacionalidad = VALUES(nacionalidad),
            provincia = VALUES(provincia)
        `;

        console.log(`📄 Creando o actualizando legajo para usuario ID: ${usuarioCreado} con empresa ID: ${empresaId}`);
        
        // Validar y convertir fecha de nacimiento
        let fechaNacimiento = usuario.fecha_nacimiento || null;
        
        if (fechaNacimiento) {
          try {
            // Si es un número (fecha de Excel), convertirla
            if (typeof fechaNacimiento === 'number' && !isNaN(fechaNacimiento)) {
              console.log(`🔄 Convirtiendo fecha de Excel: ${fechaNacimiento}`);
              fechaNacimiento = convertirFechaExcel(fechaNacimiento);
              console.log(`✅ Fecha convertida: ${fechaNacimiento}`);
            } else if (typeof fechaNacimiento === 'string') {
              // Si es string, verificar si es una fecha válida
              const fecha = new Date(fechaNacimiento);
              if (isNaN(fecha.getTime()) || fechaNacimiento.length < 8) {
                console.log(`⚠️ Fecha de nacimiento inválida: ${fechaNacimiento}, se establecerá como null`);
                fechaNacimiento = null;
              }
            }
          } catch (error) {
            console.log(`⚠️ Error al procesar fecha de nacimiento: ${error.message}, se establecerá como null`);
            fechaNacimiento = null;
          }
        }

        // Función para limpiar y validar campos de texto
        const limpiarCampo = (valor, maxLength = 255) => {
          if (!valor) return null;
          const valorLimpio = String(valor).trim();
          if (valorLimpio === '' || valorLimpio === 'null' || valorLimpio === 'undefined') return null;
          return valorLimpio.length > maxLength ? valorLimpio.substring(0, maxLength) : valorLimpio;
        };

        // Función especial para teléfonos
        const limpiarTelefono = (valor) => {
          if (!valor) return null;
          const valorLimpio = String(valor).replace(/[^\d\-\+\(\)\s]/g, '').trim();
          if (valorLimpio === '' || valorLimpio === 'null') return null;
          return valorLimpio.length > 20 ? valorLimpio.substring(0, 20) : valorLimpio;
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
        
        db.query(sqlLegajo, [
          usuarioCreado,       // usuario_id
          legajo,              // numero_legajo
          empresaId,           // empresa_id
          limpiarCampo(nombre, 100),     // nombre
          limpiarCampo(apellido, 100),   // apellido
          limpiarCampo(correo, 100),     // email_personal
          limpiarCampo(dni, 20),         // nro_documento
          limpiarCampo(usuario.cuil, 20), // cuil
          fechaNacimiento,               // fecha_nacimiento
          // fecha_ingreso se pone como CURDATE() en el SQL
          construirDomicilioCompleto(usuario), // domicilio
          limpiarCampo(usuario.localidad, 100), // localidad
          limpiarCampo(usuario.codigo_postal, 10), // codigo_postal
          limpiarTelefono(usuario.telefono || usuario.telefono_contacto), // telefono_contacto
          limpiarTelefono(usuario.contacto_emergencia), // contacto_emergencia
          limpiarCampo(usuario.DescEstado || usuario.estado_civil, 100), // estado_civil
          limpiarCampo(usuario.cuenta_bancaria || usuario.cbu, 50), // cuenta_bancaria
          limpiarCampo(usuario.banco || usuario.banco_destino, 100), // banco_destino
          limpiarCampo(usuario.centro_costos || usuario.centro_costo, 100), // centro_costos
          limpiarCampo(usuario.tarea || usuario.puesto || usuario.cargo, 200), // tarea_desempenada
          limpiarCampo(usuario.sexo || usuario.genero, 10), // sexo
          limpiarCampo(usuario.tipo_documento, 20) || 'DNI', // tipo_documento
          limpiarCampo(usuario.nacionalidad, 50) || 'Argentina', // nacionalidad
          limpiarCampo(usuario.provincia, 50) // provincia
        ], (err) => {
          if (err) {
            console.log(`❌ Error al crear/actualizar legajo:`, err);
            // Error más específico para legajo
            let errorMsg = 'Error interno al crear/actualizar legajo';
            if (err.code === 'ER_DATA_TOO_LONG') {
              errorMsg = 'Algún campo del legajo excede la longitud máxima permitida';
            } else if (err.code === 'ER_BAD_NULL_ERROR') {
              errorMsg = 'Falta un campo obligatorio en el legajo';
            } else if (err.code === 'ER_TRUNCATED_WRONG_VALUE_FOR_FIELD') {
              errorMsg = 'Formato inválido en algún campo del legajo (ej: fecha)';
            }
            return reject(new Error(errorMsg));
          }
          console.log(`✅ Legajo creado o actualizado`);
          resolve();
        });
      });

      resultados.exitosos++;
      console.log(`🎉 Usuario ${nombre} ${apellido} creado exitosamente`);

      // Agregar advertencia si faltan datos opcionales importantes
      const camposFaltantes = [];
      if (!usuario.cuil) camposFaltantes.push('CUIL');
      if (!usuario.fecha_nacimiento) camposFaltantes.push('fecha de nacimiento');
      if (!usuario.telefono && !usuario.telefono_contacto) camposFaltantes.push('teléfono');
      if (!usuario.domicilio && !usuario.domicilio_calle) camposFaltantes.push('domicilio');
      
      if (camposFaltantes.length > 0) {
        resultados.advertencias.push({
          fila,
          mensaje: `Usuario creado pero faltan datos recomendados: ${camposFaltantes.join(', ')}`,
          usuario: `${nombre} ${apellido}`
        });
      }

    } catch (err) {
      console.error(`❌ Error al crear usuario en fila ${fila}:`, err);
      resultados.errores.push({
        fila,
        error: err.message || `Error interno: ${err.message}`,
        usuario: `${nombre || usuario.nombre} ${apellido || usuario.apellido}`
      });
    }
  }

  console.log('✅ Importación completada:', resultados);
  
  res.json({
    mensaje: `Importación completada. ${resultados.exitosos} usuarios creados exitosamente.`,
    exitosos: resultados.exitosos,
    totalProcesados: usuarios.length,
    errores: resultados.errores,
    advertencias: resultados.advertencias
  });
};

// Función para actualizar legajos con datos faltantes
exports.actualizarLegajosFaltantes = async (req, res) => {
  console.log('🔄 Iniciando actualización de legajos faltantes');
  
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
      const dni = String(usuario.dni || '').trim();
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

        // Verificar si existe el legajo para este usuario
        const legajoExistente = await new Promise((resolve, reject) => {
          db.query('SELECT id, numero_legajo FROM legajos WHERE usuario_id = ?', [usuarioExistente.id], (err, results) => {
            if (err) return reject(err);
            resolve(results[0] || null);
          });
        });

        console.log(`🔍 Usuario ID ${usuarioExistente.id}, legajo existente:`, legajoExistente ? `ID ${legajoExistente.id}` : 'NO');

        // Preparar datos para actualizar/crear
        let fechaNacimiento = usuario.fecha_nacimiento || null;
        
        if (fechaNacimiento) {
          if (typeof fechaNacimiento === 'number' && !isNaN(fechaNacimiento)) {
            console.log(`🔄 Convirtiendo fecha de Excel: ${fechaNacimiento}`);
            fechaNacimiento = convertirFechaExcel(fechaNacimiento);
            console.log(`✅ Fecha convertida: ${fechaNacimiento}`);
          }
        }

        const datosLegajo = {
          nombre: nombre,
          apellido: apellido,
          email_personal: usuario.correo || `${nombre.toLowerCase()}.${apellido.toLowerCase()}@temp.com`,
          nro_documento: dni,
          cuil: usuario.cuil || null,
          fecha_nacimiento: fechaNacimiento,
          fecha_ingreso: new Date().toISOString().split('T')[0] // Fecha actual
        };

        if (legajoExistente) {
          // Actualizar legajo existente
          await new Promise((resolve, reject) => {
            const sqlUpdate = `
              UPDATE legajos SET 
                nombre = ?, apellido = ?, email_personal = ?, 
                nro_documento = ?, cuil = ?, fecha_nacimiento = ?, 
                fecha_ingreso = COALESCE(fecha_ingreso, ?)
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
              usuarioExistente.id
            ], (err) => {
              if (err) {
                console.log(`❌ Error al actualizar legajo:`, err);
                return reject(err);
              }
              console.log(`✅ Legajo actualizado para usuario ID: ${usuarioExistente.id}`);
              resolve();
            });
          });
        } else {
          console.log(`⚠️ Usuario ${nombre} ${apellido} ya tiene un legajo, omitiendo creación`);
          resultados.advertencias.push({
            fila,
            mensaje: `Usuario ya tiene legajo (ID: ${legajoExistente.id}), se omitió la creación`,
            usuario: `${nombre} ${apellido}`
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

    console.log('✅ Actualización de legajos completada:', resultados);
    res.json({
      mensaje: `Actualización completada. ${resultados.exitosos} legajos actualizados.`,
      exitosos: resultados.exitosos,
      totalProcesados: usuarios.length,
      errores: resultados.errores,
      advertencias: resultados.advertencias
    });

  } catch (error) {
    console.error('❌ Error en actualización de legajos:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

// Función para generar y descargar plantilla Excel para carga masiva
exports.descargarPlantillaExcel = async (req, res) => {
  console.log('📋 Generando plantilla Excel para carga masiva');
  
  try {
    const XLSX = require('xlsx');
    
    // Crear los datos de ejemplo con todas las columnas necesarias
    const datosEjemplo = [
      {
        legajo: 'EJ001',
        dni: '12345678',
        nombre: 'Juan Carlos',
        apellido: 'Pérez',
        correo: 'juan.perez@empresa.com',
        password: 'Temporal123!',
        rol: 'empleado',
        empresa: 'COOKERY S.A.',
        cuil: '20123456789',
        fecha_nacimiento: '1990-05-15',
        telefono: '1123456789',
        telefono_contacto: '1123456789',
        contacto_emergencia: '1198765432',
        domicilio: 'Av. Ejemplo 123',
        domicilio_calle: 'Av. Ejemplo',
        calle: 'Av. Ejemplo',
        domicilio_nro: '123',
        numero: '123',
        domicilio_piso: '2',
        piso: '2',
        domicilio_dpto: 'A',
        departamento: 'A',
        localidad: 'Ciudad Ejemplo',
        provincia: 'Buenos Aires',
        codigo_postal: '1234',
        nacionalidad: 'Argentina',
        sexo: 'M',
        genero: 'M',
        estado_civil: 'Soltero',
        DescEstado: 'Soltero',
        tipo_documento: 'DNI',
        cuenta_bancaria: '1234567890123456789012',
        cbu: '1234567890123456789012',
        banco: 'Banco Ejemplo',
        banco_destino: 'Banco Ejemplo',
        centro_costos: 'Administración',
        centro_costo: 'Administración',
        tarea: 'Empleado',
        puesto: 'Asistente Administrativo',
        cargo: 'Junior'
      },
      {
        legajo: 'EJ002',
        dni: '87654321',
        nombre: 'María Elena',
        apellido: 'González',
        correo: 'maria.gonzalez@empresa.com',
        password: 'Temporal123!',
        rol: 'empleado',
        empresa: 'Total Food S.A.',
        cuil: '27876543210',
        fecha_nacimiento: '1985-10-20',
        telefono: '1156789012',
        telefono_contacto: '1156789012',
        contacto_emergencia: '1134567890',
        domicilio: 'Calle Principal 456 - Piso 3 Dpto B',
        domicilio_calle: 'Calle Principal',
        calle: 'Calle Principal',
        domicilio_nro: '456',
        numero: '456',
        domicilio_piso: '3',
        piso: '3',
        domicilio_dpto: 'B',
        departamento: 'B',
        localidad: 'Villa Ejemplo',
        provincia: 'Córdoba',
        codigo_postal: '5678',
        nacionalidad: 'Argentina',
        sexo: 'F',
        genero: 'F',
        estado_civil: 'Casada',
        DescEstado: 'Casada',
        tipo_documento: 'DNI',
        cuenta_bancaria: '9876543210987654321098',
        cbu: '9876543210987654321098',
        banco: 'Banco Nacional',
        banco_destino: 'Banco Nacional',
        centro_costos: 'Ventas',
        centro_costo: 'Ventas',
        tarea: 'Vendedor',
        puesto: 'Vendedor Senior',
        cargo: 'Senior'
      }
    ];
    
    // Crear libro de Excel
    const workbook = XLSX.utils.book_new();
    
    // Crear hoja con los datos de ejemplo
    const worksheet = XLSX.utils.json_to_sheet(datosEjemplo);
    
    // Definir anchos de columnas para mejor legibilidad
    const wscols = [
      { wch: 12 }, // legajo
      { wch: 12 }, // dni
      { wch: 15 }, // nombre
      { wch: 15 }, // apellido
      { wch: 25 }, // correo
      { wch: 12 }, // password
      { wch: 10 }, // rol
      { wch: 20 }, // empresa
      { wch: 15 }, // cuil
      { wch: 12 }, // fecha_nacimiento
      { wch: 15 }, // telefono
      { wch: 15 }, // telefono_contacto
      { wch: 15 }, // contacto_emergencia
      { wch: 30 }, // domicilio
      { wch: 20 }, // domicilio_calle
      { wch: 15 }, // calle
      { wch: 8 },  // domicilio_nro
      { wch: 8 },  // numero
      { wch: 8 },  // domicilio_piso
      { wch: 8 },  // piso
      { wch: 8 },  // domicilio_dpto
      { wch: 12 }, // departamento
      { wch: 15 }, // localidad
      { wch: 15 }, // provincia
      { wch: 10 }, // codigo_postal
      { wch: 12 }, // nacionalidad
      { wch: 6 },  // sexo
      { wch: 8 },  // genero
      { wch: 12 }, // estado_civil
      { wch: 12 }, // DescEstado
      { wch: 8 },  // tipo_documento
      { wch: 25 }, // cuenta_bancaria
      { wch: 25 }, // cbu
      { wch: 15 }, // banco
      { wch: 15 }, // banco_destino
      { wch: 15 }, // centro_costos
      { wch: 15 }, // centro_costo
      { wch: 20 }, // tarea
      { wch: 20 }, // puesto
      { wch: 10 }  // cargo
    ];
    
    worksheet['!cols'] = wscols;
    
    // Agregar la hoja al libro
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Plantilla Usuarios');
    
    // Crear hoja con instrucciones
    const instrucciones = [
      { Campo: 'INSTRUCCIONES PARA CARGA MASIVA', Descripcion: '', Obligatorio: '', Ejemplo: '' },
      { Campo: '', Descripcion: '', Obligatorio: '', Ejemplo: '' },
      { Campo: 'legajo', Descripcion: 'Número de legajo único del empleado', Obligatorio: 'SÍ', Ejemplo: 'EJ001, 00123, etc.' },
      { Campo: 'dni', Descripcion: 'Documento Nacional de Identidad (solo números)', Obligatorio: 'SÍ', Ejemplo: '12345678' },
      { Campo: 'nombre', Descripcion: 'Nombre del empleado', Obligatorio: 'SÍ', Ejemplo: 'Juan Carlos' },
      { Campo: 'apellido', Descripcion: 'Apellido del empleado', Obligatorio: 'SÍ', Ejemplo: 'Pérez' },
      { Campo: 'correo', Descripcion: 'Email corporativo del empleado', Obligatorio: 'SÍ', Ejemplo: 'juan.perez@empresa.com' },
      { Campo: 'password', Descripcion: 'Contraseña temporal para el primer acceso', Obligatorio: 'SÍ', Ejemplo: 'Temporal123!' },
      { Campo: 'rol', Descripcion: 'Rol del usuario en el sistema', Obligatorio: 'NO', Ejemplo: 'empleado, admin, superadmin' },
      { Campo: 'empresa', Descripcion: 'Nombre de la empresa (debe existir en el sistema)', Obligatorio: 'NO', Ejemplo: 'COOKERY S.A., Total Food S.A., etc.' },
      { Campo: 'cuil', Descripcion: 'Código Único de Identificación Laboral', Obligatorio: 'NO', Ejemplo: '20123456789' },
      { Campo: 'fecha_nacimiento', Descripcion: 'Fecha de nacimiento (YYYY-MM-DD)', Obligatorio: 'NO', Ejemplo: '1990-05-15' },
      { Campo: 'telefono', Descripcion: 'Número de teléfono principal', Obligatorio: 'NO', Ejemplo: '1123456789' },
      { Campo: 'telefono_contacto', Descripcion: 'Teléfono de contacto alternativo', Obligatorio: 'NO', Ejemplo: '1123456789' },
      { Campo: 'contacto_emergencia', Descripcion: 'Teléfono de contacto de emergencia', Obligatorio: 'NO', Ejemplo: '1198765432' },
      { Campo: 'domicilio', Descripcion: 'Dirección completa (alternativamente usar campos separados)', Obligatorio: 'NO', Ejemplo: 'Av. Ejemplo 123 - Piso 2 Dpto A' },
      { Campo: 'domicilio_calle', Descripcion: 'Calle del domicilio (se combina con otros campos)', Obligatorio: 'NO', Ejemplo: 'Av. Ejemplo' },
      { Campo: 'calle', Descripcion: 'Calle del domicilio (alternativa a domicilio_calle)', Obligatorio: 'NO', Ejemplo: 'Av. Ejemplo' },
      { Campo: 'domicilio_nro', Descripcion: 'Número del domicilio', Obligatorio: 'NO', Ejemplo: '123' },
      { Campo: 'numero', Descripcion: 'Número del domicilio (alternativa a domicilio_nro)', Obligatorio: 'NO', Ejemplo: '123' },
      { Campo: 'domicilio_piso', Descripcion: 'Piso del domicilio', Obligatorio: 'NO', Ejemplo: '2' },
      { Campo: 'piso', Descripcion: 'Piso del domicilio (alternativa a domicilio_piso)', Obligatorio: 'NO', Ejemplo: '2' },
      { Campo: 'domicilio_dpto', Descripcion: 'Departamento del domicilio', Obligatorio: 'NO', Ejemplo: 'A' },
      { Campo: 'departamento', Descripcion: 'Departamento del domicilio (alternativa a domicilio_dpto)', Obligatorio: 'NO', Ejemplo: 'A' },
      { Campo: 'localidad', Descripcion: 'Localidad de residencia', Obligatorio: 'NO', Ejemplo: 'Ciudad Ejemplo' },
      { Campo: 'provincia', Descripcion: 'Provincia de residencia', Obligatorio: 'NO', Ejemplo: 'Buenos Aires' },
      { Campo: 'codigo_postal', Descripcion: 'Código postal', Obligatorio: 'NO', Ejemplo: '1234' },
      { Campo: 'nacionalidad', Descripcion: 'Nacionalidad del empleado', Obligatorio: 'NO', Ejemplo: 'Argentina' },
      { Campo: 'sexo', Descripcion: 'Sexo del empleado (M/F)', Obligatorio: 'NO', Ejemplo: 'M' },
      { Campo: 'genero', Descripcion: 'Género del empleado (alternativa a sexo)', Obligatorio: 'NO', Ejemplo: 'M' },
      { Campo: 'estado_civil', Descripcion: 'Estado civil', Obligatorio: 'NO', Ejemplo: 'Soltero, Casado, etc.' },
      { Campo: 'DescEstado', Descripcion: 'Estado civil (alternativa a estado_civil)', Obligatorio: 'NO', Ejemplo: 'Soltero, Casado, etc.' },
      { Campo: 'tipo_documento', Descripcion: 'Tipo de documento de identidad', Obligatorio: 'NO', Ejemplo: 'DNI' },
      { Campo: 'cuenta_bancaria', Descripcion: 'Número de cuenta bancaria o CBU', Obligatorio: 'NO', Ejemplo: '1234567890123456789012' },
      { Campo: 'cbu', Descripcion: 'CBU (alternativa a cuenta_bancaria)', Obligatorio: 'NO', Ejemplo: '1234567890123456789012' },
      { Campo: 'banco', Descripcion: 'Nombre del banco', Obligatorio: 'NO', Ejemplo: 'Banco Ejemplo' },
      { Campo: 'banco_destino', Descripcion: 'Banco destino (alternativa a banco)', Obligatorio: 'NO', Ejemplo: 'Banco Ejemplo' },
      { Campo: 'centro_costos', Descripcion: 'Centro de costos o área', Obligatorio: 'NO', Ejemplo: 'Administración' },
      { Campo: 'centro_costo', Descripcion: 'Centro de costo (alternativa a centro_costos)', Obligatorio: 'NO', Ejemplo: 'Administración' },
      { Campo: 'tarea', Descripcion: 'Tarea o función principal', Obligatorio: 'NO', Ejemplo: 'Empleado Administrativo' },
      { Campo: 'puesto', Descripcion: 'Puesto de trabajo', Obligatorio: 'NO', Ejemplo: 'Asistente Administrativo' },
      { Campo: 'cargo', Descripcion: 'Nivel del cargo', Obligatorio: 'NO', Ejemplo: 'Junior, Senior, etc.' },
      { Campo: '', Descripcion: '', Obligatorio: '', Ejemplo: '' },
      { Campo: 'EMPRESAS DISPONIBLES:', Descripcion: '', Obligatorio: '', Ejemplo: '' },
      { Campo: 'Catering S.A.', Descripcion: '(Empresa por defecto)', Obligatorio: '', Ejemplo: '' },
      { Campo: 'Compañía Integral de Alimentos SA', Descripcion: '', Obligatorio: '', Ejemplo: '' },
      { Campo: 'Total Food S.A.', Descripcion: '', Obligatorio: '', Ejemplo: '' },
      { Campo: 'COOKERY S.A.', Descripcion: '', Obligatorio: '', Ejemplo: '' },
      { Campo: 'Carnes Norte S.A.', Descripcion: '', Obligatorio: '', Ejemplo: '' },
      { Campo: 'COMPAÑÍA RIONEGRINA DE ALIMENTOS S.A.S', Descripcion: '', Obligatorio: '', Ejemplo: '' },
      { Campo: '', Descripcion: '', Obligatorio: '', Ejemplo: '' },
      { Campo: 'NOTA SOBRE COLUMNAS ALTERNATIVAS:', Descripcion: '', Obligatorio: '', Ejemplo: '' },
      { Campo: 'Algunas columnas tienen nombres alternativos', Descripcion: 'Para compatibilidad con diferentes formatos de Excel', Obligatorio: '', Ejemplo: '' },
      { Campo: 'Ejemplo: use "calle" O "domicilio_calle"', Descripcion: 'No es necesario llenar ambas columnas', Obligatorio: '', Ejemplo: '' },
      { Campo: 'El sistema reconoce automáticamente', Descripcion: 'qué columnas están completas', Obligatorio: '', Ejemplo: '' }
    ];
    
    const wsInstrucciones = XLSX.utils.json_to_sheet(instrucciones);
    
    // Ajustar ancho de columnas para instrucciones
    const wscolsInstr = [
      { wch: 25 }, // Campo
      { wch: 50 }, // Descripcion
      { wch: 12 }, // Obligatorio
      { wch: 30 }  // Ejemplo
    ];
    
    wsInstrucciones['!cols'] = wscolsInstr;
    
    // Agregar hoja de instrucciones
    XLSX.utils.book_append_sheet(workbook, wsInstrucciones, 'Instrucciones');
    
    // Generar buffer del archivo
    const buffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' });
    
    // Configurar headers para descarga
    const fechaActual = new Date().toISOString().split('T')[0];
    const nombreArchivo = `plantilla_carga_usuarios_${fechaActual}.xlsx`;
    
    res.setHeader('Content-Disposition', `attachment; filename="${nombreArchivo}"`);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Length', buffer.length);
    
    console.log(`✅ Plantilla Excel generada: ${nombreArchivo}`);
    
    // Enviar el archivo
    res.send(buffer);
    
  } catch (error) {
    console.error('❌ Error al generar plantilla Excel:', error);
    res.status(500).json({
      success: false,
      message: 'Error al generar plantilla Excel',
      error: error.message
    });
  }
};
