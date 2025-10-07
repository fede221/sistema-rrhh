const express = require('express');
const router = express.Router();
const db = require('../config/db');
const bcrypt = require('bcrypt');
const { verifyToken, verifyAdminRRHH, verifySuperadmin } = require('../middlewares/verifyToken');
const preguntasController = require('../controllers/preguntasController');
/*
// ✅ Obtener preguntas secretas precargadas
router.get('/preguntas-secretas', (req, res) => {
  db.query('SELECT * FROM preguntas', (err, result) => {
    if (err) return res.status(500).json({ error: 'Error en la DB' });
    res.json(result);
  });
});

// ✅ Guardar las respuestas al primer login
router.post('/guardar-respuestas', verifyToken, async (req, res) => {
  const { respuestas } = req.body;
  const userId = req.user.id;

  try {
    for (const r of respuestas) {
      const hashed = await bcrypt.hash(r.respuesta, 10);
      await db.promise().query(
        'INSERT INTO respuestas_usuarios (usuario_id, pregunta_id, respuesta_hash) VALUES (?, ?, ?)',
        [userId, r.pregunta_id, hashed]
      );
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Error al guardar respuestas' });
  }
});

// ✅ Validar respuestas para recuperación de contraseña
router.post('/validar-preguntas', async (req, res) => {
  const { dni, respuestas } = req.body;

  try {
    const [usuario] = await db.promise().query('SELECT id FROM usuarios WHERE dni = ?', [dni]);
    if (!usuario.length) return res.status(404).json({ error: 'Usuario no encontrado' });

    const userId = usuario[0].id;

    const [registros] = await db.promise().query(
      'SELECT pregunta_id, respuesta_hash FROM respuestas_usuarios WHERE usuario_id = ?',
      [userId]
    );

    let respuestasValidas = 0;
    for (const r of respuestas) {
      const dbRespuesta = registros.find(x => x.pregunta_id === r.pregunta_id);
      if (dbRespuesta && await bcrypt.compare(r.respuesta, dbRespuesta.respuesta_hash)) {
        respuestasValidas++;
      }
    }

    if (respuestasValidas >= 3) {
      return res.json({ success: true, userId });
    }

    res.status(403).json({ error: 'Respuestas incorrectas' });
  } catch (err) {
    res.status(500).json({ error: 'Error en la validación' });
  }
});

*/
router.get('/verificar-preguntas/:id', preguntasController.verificarPreguntas);
router.get('/listado', preguntasController.listadoPreguntas);
router.post('/cargar-preguntas/:id', preguntasController.cargarPreguntasUsuario);
router.get('/recuperar/:usuario_id', preguntasController.obtenerPreguntasPorUsuarioId);
router.post('/verificar-respuestas/:usuario_id', preguntasController.verificarRespuestas);
router.get('/preguntas-random/:dni', preguntasController.obtenerPreguntasPorDNI);
router.post('/validar-preguntas', preguntasController.validarPreguntas);







module.exports = router;
