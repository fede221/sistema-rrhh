require('dotenv').config({ path: __dirname + '/.env' });

// Validar variables de entorno ANTES de iniciar la aplicación
const { validateEnvironment } = require('./config/validateEnv');
validateEnvironment();

const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const { apiLimiter } = require('./middlewares/rateLimiter');
const helmetConfig = require('./config/helmet');
const { log } = require('./utils/logger');
const app = express();

// Headers de seguridad con Helmet
// Protección contra XSS, clickjacking, sniffing, etc.
app.use(helmetConfig());

// Configuración CORS para producción
// Permite definir CORS_ORIGIN como una lista separada por comas en el entorno
// Ejemplo: CORS_ORIGIN="https://rrhh.tudominio.com,http://localhost:3002"
let allowedOrigins = [
  'http://localhost:3000',  // Frontend React default port
  'http://localhost:3002',  // Additional frontend port
  'http://localhost',
  'https://rrhh.dbconsulting.com.ar',
  'http://rrhh.dbconsulting.com.ar',
  'http://127.0.0.1:3000',  // Frontend React default port (127.0.0.1)
  'http://127.0.0.1:3002'   // Additional frontend port (127.0.0.1)
];

// Agregar orígenes desde variable de entorno
if (process.env.CORS_ORIGIN) {
  const envOrigins = process.env.CORS_ORIGIN.split(',').map(o => o.trim());
  allowedOrigins = [...allowedOrigins, ...envOrigins];
  log.startup('📝 CORS origins desde .env', { origins: envOrigins });
}

const corsOptions = {
  origin: allowedOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));

// Cookie parser para leer cookies HttpOnly en autenticación
app.use(cookieParser());

// Rate limiting general para toda la API
// Protección contra DoS y uso abusivo
app.use('/api/', apiLimiter);

// 🛡️ Límite de payload general: 5MB (balanceado para formularios complejos)
// Antes: 50MB (peligroso - permite saturar servidor)
// Ahora: 5MB (seguro para formularios complejos como legajos)
// Nota: uploads de archivos (multer) tienen límites configurados aparte (10MB)
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ limit: '5mb', extended: true }));

// Servir archivos estáticos desde el directorio uploads con Content-Type correcto
app.use('/uploads', (req, res, next) => {
  // Configurar Content-Type basado en la extensión del archivo
  const ext = req.path.toLowerCase();
  if (ext.endsWith('.png')) {
    res.setHeader('Content-Type', 'image/png');
  } else if (ext.endsWith('.jpg') || ext.endsWith('.jpeg')) {
    res.setHeader('Content-Type', 'image/jpeg');
  } else if (ext.endsWith('.gif')) {
    res.setHeader('Content-Type', 'image/gif');
  } else if (ext.endsWith('.svg')) {
    res.setHeader('Content-Type', 'image/svg+xml');
  } else {
    // Para archivos sin extensión, intentar detectar el tipo por contenido
    res.setHeader('Content-Type', 'image/png'); // Asumir PNG por defecto
  }
  next();
}, express.static('uploads'));

// Rutas
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/usuarios', require('./routes/usuariosRoutes'));
app.use('/api/preguntas', require('./routes/preguntasRoutes'));
app.use('/api/legajos', require('./routes/legajosRoutes'));
app.use('/api/errores', require('./routes/erroresRoutes'));
app.use('/api/recibos', require('./routes/recibosRoutes'));
app.use('/api/empresas', require('./routes/empresasRoutes'));
app.use('/api/dashboard', require('./routes/dashboardRoutes'));
app.use('/api/vacaciones', require('./routes/vacacionesRoutes'));
app.use('/api/permisos', require('./routes/permisosRoutes'));
app.use('/api/referente', require('./routes/referenteRoutes'));
app.use('/api', require('./routes/health')); // Agregar health check

const PORT = process.env.PORT || 3001;
const HOST = process.env.HOST || '0.0.0.0';
app.listen(PORT, HOST, () => {
  log.startup(`🚀 Backend escuchando en http://${HOST}:${PORT}`, {
    port: PORT,
    host: HOST,
    env: process.env.NODE_ENV || 'development'
  });
});