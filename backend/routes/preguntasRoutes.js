const express = require('express');
const router = express.Router();
const db = require('../config/db');
const bcrypt = require('bcrypt');
const { verifyToken, verifyAdminRRHH, verifySuperadmin } = require('../middlewares/verifyToken');
const preguntasController = require('../controllers/preguntasController');
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

  console.log('🟡 Intentando guardar respuestas de seguridad');
  console.log('Usuario ID:', userId);
  console.log('Respuestas recibidas:', respuestas);

  try {
    for (const r of respuestas) {
      if (!r.pregunta_id || !r.respuesta) {
        console.error('❌ Respuesta inválida:', r);
        return res.status(400).json({ error: 'Faltan datos en alguna respuesta' });
      }
      const hashed = await bcrypt.hash(r.respuesta, 10);
      try {
        await db.query(
          'INSERT INTO respuestas_usuarios (usuario_id, pregunta_id, respuesta_hash) VALUES (?, ?, ?)',
          [userId, r.pregunta_id, hashed]
        );
      } catch (dbErr) {
        console.error('💥 Error SQL al insertar respuesta:', dbErr);
        return res.status(500).json({ error: 'Error SQL al guardar respuesta', detalle: dbErr.message });
      }
    }
    res.json({ success: true });
  } catch (err) {
    console.error('💥 Error inesperado al guardar respuestas:', err);
    res.status(500).json({ error: 'Error inesperado al guardar respuestas', detalle: err.message });
  }
});

router.get('/verificar-preguntas/:id', preguntasController.verificarPreguntas);
router.get('/listado', preguntasController.listadoPreguntas);
router.post('/cargar-preguntas/:id', preguntasController.cargarPreguntasUsuario);
router.get('/recuperar/:usuario_id', preguntasController.obtenerPreguntasPorUsuarioId);
router.post('/verificar-respuestas/:usuario_id', preguntasController.verificarRespuestas);
router.get('/preguntas-random/:dni', preguntasController.obtenerPreguntasPorDNI);
router.post('/validar-preguntas', preguntasController.validarPreguntas);







module.exports = router;
