// backend/controllers/preguntasController.js


const db = require('../config/db');
const bcrypt = require('bcrypt');
const crypto = require('crypto');

exports.verificarPreguntas = (req, res) => {
  const userId = req.params.id;
  
  const sql = 'SELECT COUNT(*) AS cantidad FROM respuestas_usuarios WHERE usuario_id = ?';

  db.query(sql, [userId], (err, result) => {
    if (err) {
      console.error('Error en la consulta:', err);
      return res.status(500).json({ error: 'Error en la consulta' });
    }

    const cantidad = result[0].cantidad;
    res.json({ tienePreguntas: cantidad >= 7 }); // asumimos que son 7 preguntas cargadas
  });
};

// 🔹 Listar preguntas precargadas
exports.listadoPreguntas = (req, res) => {
  const sql = 'SELECT * FROM preguntas';

  db.query(sql, (err, result) => {
    if (err) {
      console.error('Error al traer las preguntas:', err);
      return res.status(500).json({ error: 'Error al listar preguntas' });
    }
    res.json(result);
  });
};

// 🔹 Cargar respuestas del usuario (7)
exports.cargarPreguntasUsuario = async (req, res) => {
  const { id } = req.params; // ID del usuario
  const respuestas = req.body; // [{ pregunta_id, respuesta }, ...]

  if (!Array.isArray(respuestas) || respuestas.length !== 7) {
    return res.status(400).json({ error: 'Se requieren exactamente 7 respuestas' });
  }

  try {
    const hashedRespuestas = await Promise.all(respuestas.map(async ({ pregunta_id, respuesta }) => {
      const hash = await bcrypt.hash(respuesta, 10);
      return [id, pregunta_id, hash];
    }));

    const sql = 'INSERT INTO respuestas_usuarios (usuario_id, pregunta_id, respuesta_hash) VALUES ?';

    db.query(sql, [hashedRespuestas], (err, result) => {
      if (err) {
        console.error('Error al guardar respuestas:', err);
        return res.status(500).json({ error: 'Error al guardar respuestas' });
      }

      res.json({ mensaje: 'Respuestas guardadas correctamente' });
    });
  } catch (error) {
    console.error('Error en el proceso:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

exports.obtenerPreguntasParaRecuperacion = (req, res) => {
  const dni = req.params.dni;

  // Buscar el usuario por DNI
  const sqlUsuario = 'SELECT id FROM usuarios WHERE dni = ?';
  db.query(sqlUsuario, [dni], (err, resultadoUsuario) => {
    if (err) {
      console.error('Error buscando usuario por DNI:', err);
      return res.status(500).json({ error: 'Error buscando usuario' });
    }

    if (resultadoUsuario.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    const usuarioId = resultadoUsuario[0].id;

    // Obtener 3 preguntas al azar del usuario
    const sqlPreguntas = `
      SELECT p.id, p.pregunta
      FROM respuestas_usuarios ru
      JOIN preguntas p ON ru.pregunta_id = p.id
      WHERE ru.usuario_id = ?
      ORDER BY RAND() LIMIT 3
    `;

    db.query(sqlPreguntas, [usuarioId], (err, resultadoPreguntas) => {
      if (err) {
        console.error('Error buscando preguntas:', err);
        return res.status(500).json({ error: 'Error buscando preguntas' });
      }

      res.json({
        success: true,
        userId: usuarioId,
        preguntas: resultadoPreguntas
      });
    });
  });
};


exports.verificarRespuestas = async (req, res) => {
  const { usuario_id } = req.params;
  let respuestas = req.body;

  // Normalización por si viene en formato { respuestas: [...] }
  if (respuestas.respuestas) {
    respuestas = respuestas.respuestas;
  }

  if (!Array.isArray(respuestas)) {
    return res.status(400).json({ mensaje: "Formato incorrecto. Se esperaba un array." });
  }

  try {
    const checks = await Promise.all(respuestas.map(({ pregunta_id, respuesta }) => {
      return new Promise((resolve, reject) => {
        const hash = crypto.createHash('sha256').update(respuesta.trim().toLowerCase()).digest('hex');

        const sql = `SELECT respuesta_hash FROM respuestas_usuarios WHERE usuario_id = ? AND pregunta_id = ?`;
        db.query(sql, [usuario_id, pregunta_id], (err, rows) => {
          if (err) return reject(err);

          const correcto = rows.length > 0 && rows[0].respuesta_hash === hash;
          resolve(correcto);
        });
      });
    }));

    const errores = checks.filter(c => !c).length;

    if (errores === 0) {
      return res.json({ success: true, mensaje: 'Respuestas correctas' });
    } else {
      return res.status(401).json({ success: false, mensaje: 'Respuestas incorrectas' });
    }

  } catch (err) {
    console.error('Error al verificar respuestas:', err);
    return res.status(500).json({ success: false, mensaje: 'Error interno del servidor' });
  }
};




// ✅ Obtener preguntas para recuperación por usuario_id
exports.obtenerPreguntasPorUsuarioId = (req, res) => {
  const { usuario_id } = req.params;
  const sql = `
    SELECT p.id AS pregunta_id, p.pregunta AS pregunta
    FROM preguntas p
    INNER JOIN respuestas_usuarios r ON r.pregunta_id = p.id
    WHERE r.usuario_id = ?
  `;

  db.query(sql, [usuario_id], (err, result) => {
    if (err) {
      console.error('Error en la consulta:', err);
      return res.status(500).json({ error: 'Error en la consulta' });
    }
    res.json({ preguntas: result });
  });
};

// ✅ Obtener preguntas random por DNI (solo si existen respuestas)
exports.obtenerPreguntasPorDNI = (req, res) => {
  const { dni } = req.params;

  const buscarUsuarioSQL = 'SELECT id FROM usuarios WHERE dni = ?';
  db.query(buscarUsuarioSQL, [dni], (err, result) => {
    if (err || !result.length) {
      console.error('Error buscando usuario:', err);
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    const userId = result[0].id;

 const preguntasSQL = `
  SELECT p.id AS pregunta_id, p.pregunta AS pregunta
  FROM preguntas p
  INNER JOIN respuestas_usuarios r ON r.pregunta_id = p.id
  WHERE r.usuario_id = ?
  ORDER BY RAND()
  LIMIT 3
`;

    db.query(preguntasSQL, [userId], (err2, preguntas) => {
      if (err2) {
        console.error('Error obteniendo preguntas:', err2);
        return res.status(500).json({ error: 'Error en la consulta' });
      }

      res.json({ preguntas, usuario_id: userId });
    });
  });
};


exports.validarPreguntas = (req, res) => {
  const { dni, respuestas } = req.body;
  //console.log('📥 Body recibido:', req.body);

  const sqlUsuario = 'SELECT id FROM usuarios WHERE dni = ?';
  db.query(sqlUsuario, [dni], (err, usuarioResult) => {
    if (err) {
      console.error('💥 Error buscando usuario:', err);
      return res.status(500).json({ error: 'Error buscando usuario' });
    }

    if (!usuarioResult.length) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    const userId = usuarioResult[0].id;

    const sqlRespuestas = 'SELECT pregunta_id, respuesta_hash FROM respuestas_usuarios WHERE usuario_id = ?';
db.query(sqlRespuestas, [userId], async (err, registros) => {
  if (err) {
    console.error('💥 Error buscando respuestas:', err);
    return res.status(500).json({ error: 'Error buscando respuestas' });
  }

  try {
    let respuestasValidas = 0;

    for (const r of respuestas) {
      const matchDB = registros.find(x => x.pregunta_id === parseInt(r.pregunta_id));
      if (matchDB) {
        const esIgual = await bcrypt.compare(r.respuesta.trim(), matchDB.respuesta_hash);
        if (esIgual) respuestasValidas++;
      }
    }

    if (respuestasValidas >= 3) {
      return res.json({ success: true, userId });
    }

    return res.status(403).json({ error: 'Respuestas incorrectas' });
  } catch (err2) {
    console.error('💥 Error interno durante comparación bcrypt:', err2);
    return res.status(500).json({ error: 'Error interno durante la comparación' });
  }
});
  });
};
