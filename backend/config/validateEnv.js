/**
 * 🔐 Validación de Variables de Entorno
 * Verifica que todas las variables críticas estén configuradas al inicio
 * Previene errores de configuración en producción
 */

const { log } = require('../utils/logger');

/**
 * Variables de entorno requeridas para el funcionamiento de la aplicación
 */
const REQUIRED_ENV_VARS = [
  { name: 'DB_HOST', description: 'Host de la base de datos MySQL' },
  { name: 'DB_USER', description: 'Usuario de la base de datos' },
  { name: 'DB_PASSWORD', description: 'Contraseña de la base de datos' },
  { name: 'DB_NAME', description: 'Nombre de la base de datos' },
  { name: 'JWT_SECRET', description: 'Secret para firma de tokens JWT', validator: validateJWTSecret }
];

/**
 * Variables de entorno opcionales con valores por defecto
 */
const OPTIONAL_ENV_VARS = [
  { name: 'DB_PORT', default: '3306', description: 'Puerto de MySQL' },
  { name: 'PORT', default: '3001', description: 'Puerto del servidor Express' },
  { name: 'HOST', default: '0.0.0.0', description: 'Host del servidor' },
  { name: 'NODE_ENV', default: 'development', description: 'Entorno de ejecución' },
  { name: 'LOG_LEVEL', default: 'info', description: 'Nivel de logging' }
];

/**
 * Validar que JWT_SECRET tenga al menos 64 caracteres
 */
function validateJWTSecret(value) {
  if (!value || value.length < 64) {
    return {
      valid: false,
      error: 'JWT_SECRET debe tener al menos 64 caracteres para seguridad óptima. Genera uno con: node -e "console.log(require(\'crypto\').randomBytes(64).toString(\'hex\'))"'
    };
  }

  // Verificar que no sea un valor de ejemplo
  const exampleValues = ['your-secret-key', 'GENERA_UN_SECRET', 'change-this'];
  if (exampleValues.some(example => value.includes(example))) {
    return {
      valid: false,
      error: 'JWT_SECRET contiene un valor de ejemplo. Genera un secret aleatorio seguro.'
    };
  }

  return { valid: true };
}

/**
 * Validar usuario de base de datos
 */
function validateDBUser(value) {
  // Advertir si se usa root (no es crítico, pero no recomendado)
  if (value === 'root') {
    log.warn('⚠️  Usando usuario "root" para la base de datos. Se recomienda crear un usuario específico con permisos limitados.');
  }
  return { valid: true };
}

/**
 * Validar que todas las variables de entorno requeridas estén configuradas
 */
function validateEnvironment() {
  const errors = [];
  const warnings = [];
  const missing = [];

  log.info('🔍 Validando variables de entorno...');

  // Validar variables requeridas
  REQUIRED_ENV_VARS.forEach(({ name, description, validator }) => {
    const value = process.env[name];

    if (!value || value.trim() === '') {
      missing.push({ name, description });
      errors.push(`❌ ${name}: ${description} - NO CONFIGURADA`);
      return;
    }

    // Ejecutar validador personalizado si existe
    if (validator) {
      const result = validator(value);
      if (!result.valid) {
        errors.push(`❌ ${name}: ${result.error}`);
      }
    }
  });

  // Configurar valores por defecto para variables opcionales
  OPTIONAL_ENV_VARS.forEach(({ name, default: defaultValue, description }) => {
    if (!process.env[name]) {
      process.env[name] = defaultValue;
      log.info(`ℹ️  ${name} no configurada, usando valor por defecto: ${defaultValue}`);
    }
  });

  // Validar DB_USER
  if (process.env.DB_USER) {
    validateDBUser(process.env.DB_USER);
  }

  // Advertencias de seguridad en producción
  if (process.env.NODE_ENV === 'production') {
    // Verificar que CORS_ORIGIN esté configurado
    if (!process.env.CORS_ORIGIN) {
      warnings.push('⚠️  CORS_ORIGIN no configurado en producción. Se usarán los valores por defecto.');
    }

    // Verificar que JWT_SECRET sea diferente entre ambientes
    if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 128) {
      warnings.push('⚠️  Se recomienda JWT_SECRET de al menos 128 caracteres en producción (actualmente: ' + process.env.JWT_SECRET.length + ')');
    }
  }

  // Mostrar warnings
  if (warnings.length > 0) {
    warnings.forEach(warning => log.warn(warning));
  }

  // Si hay errores, mostrarlos y salir
  if (errors.length > 0) {
    log.error('❌ Errores de configuración encontrados:\n' + errors.join('\n'));

    if (missing.length > 0) {
      log.error('\n📝 Variables faltantes:');
      missing.forEach(({ name, description }) => {
        log.error(`   ${name}: ${description}`);
      });
      log.error('\n💡 Copia .env.example a .env y configura los valores apropiados.');
    }

    // En producción, forzar salida
    if (process.env.NODE_ENV === 'production') {
      log.error('🛑 No se puede iniciar en producción sin configuración válida.');
      process.exit(1);
    } else {
      log.warn('⚠️  Continuando en modo desarrollo, pero pueden ocurrir errores.');
    }

    return false;
  }

  log.info('✅ Todas las variables de entorno están configuradas correctamente');

  // Mostrar resumen de configuración (sin valores sensibles)
  const configSummary = {
    environment: process.env.NODE_ENV,
    database: {
      host: process.env.DB_HOST,
      name: process.env.DB_NAME,
      user: process.env.DB_USER,
      port: process.env.DB_PORT
    },
    server: {
      host: process.env.HOST,
      port: process.env.PORT
    },
    security: {
      jwtSecretLength: process.env.JWT_SECRET?.length || 0,
      corsConfigured: !!process.env.CORS_ORIGIN
    }
  };

  log.info('📋 Configuración cargada', configSummary);

  return true;
}

module.exports = {
  validateEnvironment,
  REQUIRED_ENV_VARS,
  OPTIONAL_ENV_VARS
};
