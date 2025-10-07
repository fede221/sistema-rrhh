require('dotenv').config({ path: __dirname + '/.env' });
const express = require('express');
const cors = require('cors');
const app = express();

// Configuración CORS para producción
// Permite definir CORS_ORIGIN como una lista separada por comas en el entorno,
// por ejemplo: CORS_ORIGIN="https://rrhh.dbconsulting.com.ar,http://192.168.203.24:8080"
let allowedOrigins = ['http://localhost:3000', 'http://localhost', 'https://rrhh.dbconsulting.com.ar'];
if (process.env.CORS_ORIGIN) {
  allowedOrigins = process.env.CORS_ORIGIN.split(',').map(s => s.trim()).filter(Boolean);
}

const corsOptions = {
  origin: function(origin, callback) {
    console.log('CORS request from origin:', origin);
    console.log('Allowed origins:', allowedOrigins);
    // Cuando el cliente no envía origin (ej. llamadas desde curl/postman), permitir
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('CORS policy: origin not allowed'), false);
    }
  },
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
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