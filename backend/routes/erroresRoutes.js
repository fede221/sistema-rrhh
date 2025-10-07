const express = require('express');
const router = express.Router();
const { listarErrores } = require('../controllers/erroresController');
const { verifyToken } = require('../middlewares/verifyToken');

// Solo superadmin puede ver los errores
router.get('/', verifyToken, listarErrores);

module.exports = router;
