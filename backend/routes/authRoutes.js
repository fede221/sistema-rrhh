const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authLimiter, passwordRecoveryLimiter } = require('../middlewares/rateLimiter');

// Login con rate limiting estricto - máximo 5 intentos cada 15 minutos
// Protección contra ataques de fuerza bruta
router.post('/login', authLimiter, authController.login);

// Rutas de recuperación de contraseña con rate limiting
// Máximo 3 intentos por hora para prevenir enumeración de usuarios
router.get('/recovery-questions/:dni', passwordRecoveryLimiter, authController.getRecoveryQuestions);
router.post('/validate-recovery', passwordRecoveryLimiter, authController.validateRecoveryAnswers);
router.post('/reset-password/:userId', passwordRecoveryLimiter, authController.resetPassword);

module.exports = router;


