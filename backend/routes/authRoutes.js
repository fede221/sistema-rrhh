const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

router.post('/login', authController.login);

// Ruta para cambio de contraseña después de validar preguntas
router.post('/reset-password/:userId', authController.resetPassword);

// Nueva ruta para obtener preguntas de recuperación por DNI
router.get('/recovery-questions/:dni', authController.getRecoveryQuestions);

// Nueva ruta para validar respuestas y permitir cambio de contraseña
router.post('/validate-recovery', authController.validateRecoveryAnswers);

module.exports = router;


