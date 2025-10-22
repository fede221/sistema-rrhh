const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const db = require('../config/db');

exports.login = (req, res) => {
  const { dni, password } = req.body;

  db.query('SELECT * FROM usuarios WHERE dni = ?', [dni], (err, results) => {
    if (err) return res.status(500).json({ error: 'Error en la DB' });
    if (results.length === 0) return res.status(401).json({ error: 'Credenciales inválidas' });

    const usuario = results[0];

    if (usuario.activo === 0) {
      return res.status(403).json({ error: 'Usuario suspendido. Contactá al administrador.' });
    }

    bcrypt.compare(password, usuario.password, (err, isMatch) => {
      if (err) return res.status(500).json({ error: 'Error al verificar contraseña' });
      if (!isMatch) return res.status(401).json({ error: 'Credenciales inválidas' });

      const token = jwt.sign(
        {
          id: usuario.id,
          rol: usuario.rol,
          cuil: usuario.cuil,
          dni: usuario.dni,
          nombre: usuario.nombre,
          apellido: usuario.apellido,
          apodo: usuario.apodo || null
        },
        process.env.JWT_SECRET,
        { expiresIn: '50m' }
      );

      // 🔐 Configurar cookie HttpOnly segura
      const isProduction = process.env.NODE_ENV === 'production';
      res.cookie('authToken', token, {
        httpOnly: true,     // NO accesible desde JavaScript (protección XSS)
        secure: isProduction, // Solo HTTPS en producción
        sameSite: 'lax',    // Protección CSRF moderada (permite navegación normal)
        maxAge: 50 * 60 * 1000, // 50 minutos (igual que el token JWT)
        path: '/'           // Cookie disponible en toda la app
      });

      // También enviar token en JSON para compatibilidad durante migración
      // TODO: Remover "token" del response una vez que el frontend use solo cookies
      res.json({
        token, // ⚠️ DEPRECADO - Solo para compatibilidad, remover en futuro
        rol: usuario.rol,
        nombre: usuario.nombre,
        apellido: usuario.apellido,
        apodo: usuario.apodo || null,
        legajo: usuario.legajo,
        id: usuario.id,
        cuil: usuario.cuil,
        dni: usuario.dni
      });
    });
  });
};

exports.logout = (req, res) => {
  // Limpiar cookie de autenticación
  res.clearCookie('authToken', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/'
  });

  res.json({
    success: true,
    message: 'Logout exitoso'
  });
};

exports.resetPassword = (req, res) => {
  const { userId } = req.params;
  const { nuevaPassword } = req.body;

  if (!nuevaPassword) {
    return res.status(400).json({ error: 'La contraseña es obligatoria' });
  }

  const saltRounds = 10;
  bcrypt.hash(nuevaPassword, saltRounds, (err, hashedPassword) => {
    if (err) {
      console.error('Error al hashear la nueva contraseña:', err);
      return res.status(500).json({ error: 'Error al cambiar la contraseña' });
    }

    const sql = 'UPDATE usuarios SET password = ? WHERE id = ?';
    db.query(sql, [hashedPassword, userId], (err, result) => {
      if (err) {
        console.error('Error al actualizar la contraseña:', err);
        return res.status(500).json({ error: 'Error al cambiar la contraseña' });
      }

      res.json({ mensaje: '✅ Contraseña actualizada con éxito' });
    });
  });
};

// Obtener preguntas de recuperación por DNI
exports.getRecoveryQuestions = (req, res) => {
  const { dni } = req.params;

  // Buscar usuario por DNI
  const sqlUsuario = 'SELECT id FROM usuarios WHERE dni = ?';
  db.query(sqlUsuario, [dni], (err, userResult) => {
    if (err) {
      console.error('Error buscando usuario:', err);
      return res.status(500).json({ error: 'Error en la consulta' });
    }

    if (userResult.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    const userId = userResult[0].id;

    // Obtener 3 preguntas aleatorias del usuario
    const sqlPreguntas = `
      SELECT p.id, p.pregunta
      FROM respuestas_usuarios ru
      JOIN preguntas p ON ru.pregunta_id = p.id
      WHERE ru.usuario_id = ?
      ORDER BY RAND() LIMIT 3
    `;

    db.query(sqlPreguntas, [userId], (err, questions) => {
      if (err) {
        console.error('Error obteniendo preguntas:', err);
        return res.status(500).json({ error: 'Error obteniendo preguntas' });
      }

      if (questions.length === 0) {
        return res.status(404).json({ error: 'Usuario no tiene preguntas configuradas' });
      }

      res.json({
        userId,
        preguntas: questions
      });
    });
  });
};

// Validar respuestas de recuperación
exports.validateRecoveryAnswers = async (req, res) => {
  const { userId, respuestas } = req.body;

  if (!userId || !Array.isArray(respuestas) || respuestas.length !== 3) {
    return res.status(400).json({ error: 'Datos inválidos' });
  }

  try {
    // Obtener respuestas hasheadas del usuario
    const sql = 'SELECT pregunta_id, respuesta_hash FROM respuestas_usuarios WHERE usuario_id = ?';
    
    db.query(sql, [userId], async (err, storedAnswers) => {
      if (err) {
        console.error('Error obteniendo respuestas:', err);
        return res.status(500).json({ error: 'Error en la consulta' });
      }

      let correctAnswers = 0;

      // Verificar cada respuesta
      for (const respuesta of respuestas) {
        const stored = storedAnswers.find(a => a.pregunta_id === respuesta.pregunta_id);
        if (stored) {
          const isMatch = await bcrypt.compare(respuesta.respuesta.trim(), stored.respuesta_hash);
          if (isMatch) correctAnswers++;
        }
      }

      // Requiere todas las respuestas correctas para mayor seguridad
      if (correctAnswers === 3) {
        res.json({ 
          success: true, 
          message: 'Respuestas validadas correctamente',
          userId 
        });
      } else {
        res.status(401).json({ 
          success: false, 
          error: 'Respuestas incorrectas' 
        });
      }
    });
  } catch (error) {
    console.error('Error validando respuestas:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};