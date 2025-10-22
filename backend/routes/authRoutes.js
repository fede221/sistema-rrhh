const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authLimiter, passwordRecoveryLimiter } = require('../middlewares/rateLimiter');
const {
  validateLogin,
  validateResetPassword,
  validateRecoveryDNI,
  validateRecoveryAnswers
} = require('../middlewares/validators');

// Login con validación + rate limiting
// Protección contra ataques de fuerza bruta e inyecciones
router.post('/login', validateLogin, authLimiter, authController.login);

// Logout - limpiar cookie HttpOnly
router.post('/logout', authController.logout);

// Rutas de recuperación de contraseña con validación + rate limiting
// Máximo 3 intentos por hora para prevenir enumeración de usuarios
router.get('/recovery-questions/:dni', validateRecoveryDNI, passwordRecoveryLimiter, authController.getRecoveryQuestions);
router.post('/validate-recovery', validateRecoveryAnswers, passwordRecoveryLimiter, authController.validateRecoveryAnswers);
router.post('/reset-password/:userId', validateResetPassword, passwordRecoveryLimiter, authController.resetPassword);

module.exports = router;


