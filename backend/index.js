require('dotenv').config({ path: __dirname + '/.env' });
const express = require('express');
const cors = require('cors');
const { apiLimiter } = require('./middlewares/rateLimiter');
const helmetConfig = require('./config/helmet');
const app = express();

// Headers de seguridad con Helmet
// Protección contra XSS, clickjacking, sniffing, etc.
app.use(helmetConfig());

// Configuración CORS para producción
// Permite definir CORS_ORIGIN como una lista separada por comas en el entorno
// Ejemplo: CORS_ORIGIN="https://rrhh.tudominio.com,http://localhost:3002"
let allowedOrigins = [
  'http://localhost:3002',
  'http://localhost',
  'http://127.0.0.1:3002'
];

// Agregar orígenes desde variable de entorno
if (process.env.CORS_ORIGIN) {
  const envOrigins = process.env.CORS_ORIGIN.split(',').map(o => o.trim());
  allowedOrigins = [...allowedOrigins, ...envOrigins];
  console.log('📝 CORS origins desde .env:', envOrigins);
}

const corsOptions = {
  origin: function(origin, callback) {
    // Normalizar orígenes: quitar barra final, espacios, minúsculas
    const normalize = o => (o ? o.trim().replace(/\/$/, '').toLowerCase() : o);
    const normalizedOrigin = normalize(origin);
    console.log('CORS request from origin:', origin, '| Normalized:', normalizedOrigin);
    console.log('Allowed origins (exact list check still active for reference):', allowedOrigins);

    // Cuando el cliente no envía origin (ej. llamadas desde curl/postman), permitir
    if (!origin) return callback(null, true);

    // Permitir por hostname, independientemente del puerto
    const allowedHostnames = new Set([
      'localhost',
      '127.0.0.1',
      'rrhh.dbconsulting.com.ar',
      '34.176.124.72'
    ]);
    try {
      const url = new URL(normalizedOrigin);
      const isHttp = url.protocol === 'http:' || url.protocol === 'https:';
      const isAllowedHost = allowedHostnames.has(url.hostname);
      // Permitir cualquier IP en el rango 192.168.*.* para desarrollo en red local
      const isLocalNetwork = /^192\.168\.\d{1,3}\.\d{1,3}$/.test(url.hostname);
      if (isHttp && (isAllowedHost || isLocalNetwork)) {
        console.log(`CORS: Origin permitido por hostname ${url.hostname}`);
        return callback(null, true);
      }
    } catch (e) {
      console.warn('CORS: No se pudo parsear el origin como URL, se intentará comparación exacta. Error:', e.message);
    }

    // Fallback: lista exacta
    const normalizedAllowed = allowedOrigins.map(normalize);
    if (normalizedAllowed.includes(normalizedOrigin)) {
      console.log('CORS: Origin permitido por lista exacta');
      return callback(null, true);
    }

    console.error('CORS: Origin NO permitido:', origin);
    return callback(new Error('CORS policy: origin not allowed'), false);
  },
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));

// Rate limiting general para toda la API
// Protección contra DoS y uso abusivo
app.use('/api/', apiLimiter);

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

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
app.listen(PORT, HOST, () => console.log(`🚀 Backend escuchando en http://${HOST}:${PORT}`));