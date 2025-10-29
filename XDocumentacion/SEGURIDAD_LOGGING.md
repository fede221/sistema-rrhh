# 🛡️ Política de Logging Seguro

## 📋 Qué es CWE-532: Sensitive Information in Log Files

**CWE-532** es una vulnerabilidad que ocurre cuando información sensible se registra en logs, permitiendo que atacantes con acceso a los logs puedan comprometer la seguridad del sistema.

**Riesgo**: Si un atacante obtiene acceso a logs (por error de configuración, backup expuesto, ataque a servidor, etc.), puede encontrar:
- 🔑 Tokens JWT y credenciales
- 🔐 Contraseñas en texto plano
- 🆔 Información personal (DNI, datos privados)
- 🔒 Respuestas a preguntas de seguridad
- 💳 Datos financieros o de tarjetas

---

## ✅ Estado Actual del Proyecto

### Análisis de Seguridad Realizado

Hemos revisado todos los logs del proyecto y **eliminado toda información sensible**.

**Resumen:**
- ✅ Creado sistema de logging seguro con sanitización automática
- ✅ Eliminados logs de tokens JWT
- ✅ Eliminados logs de contraseñas y respuestas de seguridad
- ✅ Eliminados logs de `req.body` sin filtrar
- ✅ Reemplazados `console.log` por `logger` con contexto seguro

---

## 🔒 Sistema de Logging Seguro

### Utilidad: secureLogger

**Archivo:** `backend/utils/secureLogger.js`

El sistema de logging seguro implementa:

#### 1. Sanitización Automática

```javascript
const SENSITIVE_FIELDS = [
  'password', 'secret', 'token', 'authorization', 'auth',
  'cookie', 'session', 'apikey', 'jwt', 'bearer'
];
```

Cualquier campo con estos nombres se redacta automáticamente como `[REDACTED]`.

#### 2. Detección de Tokens

```javascript
// Detecta JWT en formato Bearer
if (data.match(/^Bearer\s+[\w-]+\.[\w-]+\.[\w-]+$/i)) {
  return 'Bearer [REDACTED]';
}

// Detecta strings largos Base64 (probable token)
if (data.length > 20 && data.match(/^[A-Za-z0-9+/=]+$/)) {
  return `[TOKEN:${data.length} chars]`;
}
```

#### 3. Tipos de Logs Disponibles

```javascript
const { logger } = require('../utils/secureLogger');

// Log general con sanitización automática
logger.info('Mensaje', { userId: 123, data: obj });

// Log de eventos de autenticación
logger.auth('Login exitoso', { userId: 123, ip: req.ip });

// Log de eventos de seguridad críticos
logger.security('Intento de acceso no autorizado', {
  userId: 123,
  resource: '/admin',
  ip: req.ip
});

// Log de debugging (solo en desarrollo)
logger.debug('Estado interno', { state: data });

// Log de errores
logger.error('Error en operación', error);
```

---

## 📚 Qué NUNCA Loguear

### ❌ 1. Tokens y Credenciales

```javascript
// ❌ NUNCA HACER ESTO
console.log('Token recibido:', req.headers['authorization']);
console.log('JWT:', token);
console.log('API Key:', apiKey);

// ✅ CORRECTO
logger.auth('Token verificado', {
  userId: decoded.id,
  rol: decoded.rol
  // NO incluir el token
});
```

### ❌ 2. Contraseñas

```javascript
// ❌ NUNCA HACER ESTO
console.log('Usuario registrado:', req.body); // Contiene password
console.log('Cambiando password:', { oldPass, newPass });

// ✅ CORRECTO
logger.info('Usuario registrado', {
  userId: newUserId,
  legajo: req.body.legajo,
  dni: req.body.dni
  // NO incluir password
});
```

### ❌ 3. Respuestas a Preguntas de Seguridad

```javascript
// ❌ NUNCA HACER ESTO
console.log('Respuestas recibidas:', respuestas);
console.log('Validando respuesta:', { pregunta, respuesta });

// ✅ CORRECTO
logger.security('Guardando respuestas de seguridad', {
  userId,
  cantidadRespuestas: respuestas.length
  // NO incluir las respuestas
});
```

### ❌ 4. req.body sin Filtrar

```javascript
// ❌ NUNCA HACER ESTO
console.log('Body recibido:', req.body);
console.log('Datos:', req.body);

// ✅ CORRECTO - Solo loguear metadatos
logger.info('Petición recibida', {
  userId: req.user?.id,
  endpoint: req.originalUrl,
  cantidadCampos: Object.keys(req.body || {}).length,
  ip: req.ip
  // NO incluir req.body completo
});
```

### ❌ 5. req.headers Completo

```javascript
// ❌ NUNCA HACER ESTO
console.log('Headers:', req.headers); // Contiene Authorization

// ✅ CORRECTO
logger.debug('Request metadata', {
  userAgent: req.headers['user-agent'],
  contentType: req.headers['content-type']
  // NO incluir authorization, cookie, etc.
});
```

### ❌ 6. Información Personal Sensible

```javascript
// ⚠️ CUIDADO - Depende del contexto
console.log('Datos personales:', { dni, nombre, salario, cuenta_bancaria });

// ✅ MEJOR - Solo identificadores
logger.info('Usuario actualizado', {
  userId: id,
  camposModificados: ['nombre', 'email']
  // NO incluir valores, solo keys
});
```

---

## ✅ Qué SÍ Puedes Loguear

### ✅ 1. Identificadores No Sensibles

```javascript
logger.info('Operación exitosa', {
  userId: 123,
  legajoId: 456,
  empresaId: 789
});
```

### ✅ 2. Metadatos de Operación

```javascript
logger.info('Importación masiva', {
  cantidadRegistros: 100,
  tipoOperacion: 'create',
  duracion: '2.5s'
});
```

### ✅ 3. Resultados de Validaciones

```javascript
logger.info('Validación de formulario', {
  camposInvalidos: ['email', 'telefono'],
  cantidadErrores: 2
});
```

### ✅ 4. Eventos de Seguridad

```javascript
logger.security('Intento de acceso denegado', {
  userId: req.user?.id,
  recurso: '/admin/usuarios',
  ip: req.ip,
  userAgent: req.headers['user-agent']
});
```

### ✅ 5. Información de Debugging (Desarrollo)

```javascript
logger.debug('Estado de transacción', {
  paso: 'validacion',
  cantidadItems: items.length,
  tiempoTranscurrido: Date.now() - startTime
});
```

---

## 🔧 Guía de Uso

### Importar el Logger

```javascript
const { logger } = require('../utils/secureLogger');
```

### Reemplazar console.log

#### Antes (❌ Inseguro)

```javascript
exports.login = (req, res) => {
  console.log('Login attempt:', req.body);
  const { dni, password } = req.body;

  // Verificar credenciales...
  console.log('User authenticated:', user);
  console.log('Token:', token);
};
```

#### Después (✅ Seguro)

```javascript
const { logger } = require('../utils/secureLogger');

exports.login = (req, res) => {
  logger.auth('Intento de login', {
    dni: req.body.dni,
    ip: req.ip
    // NO incluir password ni token
  });

  const { dni, password } = req.body;

  // Verificar credenciales...
  logger.auth('Usuario autenticado', {
    userId: user.id,
    rol: user.rol,
    dni: user.dni
    // NO incluir token completo
  });
};
```

---

## 📊 Archivos Corregidos

### 1. backend/middlewares/verifyToken.js

**Antes:**
```javascript
console.log("🔐 Authorization header:", authHeader); // Expone JWT
console.log("📦 Token recibido:", token); // Expone JWT
console.log("✅ Token decodificado:", decoded); // Expone datos del token
```

**Después:**
```javascript
logger.auth('❌ No authorization header', {
  ip: req.ip,
  url: req.originalUrl
});

logger.debug('✅ Token verificado', {
  userId: decoded.id,
  rol: decoded.rol,
  dni: decoded.dni
  // NO incluir el token completo
});
```

---

### 2. backend/routes/preguntasRoutes.js

**Antes:**
```javascript
console.log('Respuestas recibidas:', respuestas); // ⚠️ CRÍTICO - Expone respuestas
```

**Después:**
```javascript
logger.security('🔐 Guardando respuestas de seguridad', {
  userId,
  cantidadRespuestas: respuestas?.length,
  ip: req.ip
  // NO incluir las respuestas
});
```

---

### 3. backend/controllers/usuariosController.js

**Antes:**
```javascript
console.log('📦 Body recibido:', req.body); // Expone passwords
console.log('👤 Usuario:', req.user); // Expone datos completos
```

**Después:**
```javascript
logger.info('🔥 Recibida petición de importación masiva', {
  userId: req.user?.id,
  userRole: req.user?.rol,
  ip: req.ip
  // NO incluir req.body con passwords
});

logger.info(`📊 Procesando ${usuarios.length} usuarios`, {
  cantidad: usuarios.length,
  userId: req.user?.id
});
```

---

### 4. backend/controllers/empresasController.js

**Antes:**
```javascript
console.log('📝 Datos recibidos:', req.body);
console.log('📎 Archivos recibidos:', req.files);
```

**Después:**
```javascript
logger.info('🔄 Actualizando empresa', {
  empresaId: id,
  userId: user?.id,
  userRole: user?.rol,
  tieneArchivos: !!req.files,
  cantidadCampos: Object.keys(req.body || {}).length,
  ip: req.ip
});
```

---

### 5. backend/controllers/vacacionesController.js

**Antes:**
```javascript
console.log('📋 Datos recibidos:', req.body);
console.log('👤 Usuario:', req.user);
```

**Después:**
```javascript
logger.info('🔍 Iniciando asignarVacacionesProximoPeriodo', {
  userId: req.user?.id,
  userRole: req.user?.rol,
  anioDestino: anio_destino,
  ip: req.ip
});
```

---

## 🧪 Testing

### Verificar que los Logs NO Contengan Datos Sensibles

```bash
# Buscar console.log que loguean req.body
grep -r "console.log.*req\.body" backend/ --include="*.js"

# Buscar console.log que loguean tokens
grep -r "console.log.*token\|console.log.*authorization" backend/ --include="*.js"

# Buscar console.log que loguean passwords
grep -r "console.log.*password\|console.log.*contraseña" backend/ --include="*.js"

# Resultado esperado: Solo console.log seguros o comentados
```

### Verificar que secureLogger Sanitiza Correctamente

```bash
# En el backend, crear un test rápido:
node -e "
const { logger } = require('./backend/utils/secureLogger');

// Test 1: Sanitizar password
logger.info('Test', { password: 'secret123' });
// Debe mostrar: { password: '[REDACTED]' }

// Test 2: Sanitizar token JWT
logger.info('Test', { token: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' });
// Debe mostrar: { token: 'Bearer [REDACTED]' }

// Test 3: Datos seguros
logger.info('Test', { userId: 123, nombre: 'Juan' });
// Debe mostrar: { userId: 123, nombre: 'Juan' }
"
```

---

## ⚠️ Advertencias

### 1. Logs en Producción

En producción, los logs pueden ser:
- Almacenados en servicios externos (CloudWatch, Datadog, etc.)
- Accedidos por múltiples personas
- Retenidos por meses o años
- Backupeados en múltiples ubicaciones
- Sujetos a auditorías de seguridad

**Por lo tanto, NUNCA loguear datos sensibles.**

### 2. Error Stack Traces

Los stack traces pueden contener valores de variables:

```javascript
// ⚠️ CUIDADO
try {
  const password = req.body.password;
  authenticateUser(password); // Si falla, el stack trace puede mostrar password
} catch (err) {
  console.error(err); // Stack trace puede contener password
}

// ✅ MEJOR
try {
  authenticateUser(req.body.password);
} catch (err) {
  logger.error('Error en autenticación', {
    userId: req.user?.id,
    errorMessage: err.message
    // NO incluir err.stack completo en producción
  });
}
```

### 3. Logs de Debugging

```javascript
// ⚠️ NUNCA dejar esto en producción
console.log('DEBUG - Estado completo:', JSON.stringify(req));

// ✅ Usar logger.debug que se puede deshabilitar
if (process.env.NODE_ENV !== 'production') {
  logger.debug('Estado de request', {
    method: req.method,
    url: req.originalUrl,
    hasAuth: !!req.headers['authorization']
  });
}
```

---

## 🛠️ Configuración de Logging por Ambiente

### Desarrollo

```javascript
// .env
NODE_ENV=development
LOG_LEVEL=debug
```

En desarrollo, `logger.debug()` está activo para facilitar debugging.

### Producción

```javascript
// .env
NODE_ENV=production
LOG_LEVEL=info
```

En producción, `logger.debug()` está deshabilitado por performance y seguridad.

---

## 📈 Mejores Prácticas

### 1. ✅ Usar Niveles de Log Apropiados

```javascript
logger.debug('Detalles técnicos'); // Solo desarrollo
logger.info('Operación normal');   // Info general
logger.auth('Evento de autenticación'); // Auth/Security
logger.security('Evento de seguridad crítico');
logger.error('Error en sistema');   // Errores
```

### 2. ✅ Incluir Contexto Suficiente

```javascript
// ❌ Poco contexto
logger.info('Usuario actualizado');

// ✅ Contexto útil
logger.info('Usuario actualizado', {
  userId: 123,
  camposModificados: ['email', 'telefono'],
  modificadoPor: req.user?.id,
  ip: req.ip,
  timestamp: new Date().toISOString()
});
```

### 3. ✅ Estructurar Logs como JSON

```javascript
// ✅ CORRECTO - Fácil de parsear y buscar
logger.info('Operación completada', {
  operation: 'import',
  recordsProcessed: 100,
  duration: 2500,
  userId: 123
});

// ❌ DIFÍCIL de parsear
console.log('Operación completada: 100 registros en 2500ms por usuario 123');
```

### 4. ✅ Loguear Eventos de Seguridad

```javascript
logger.security('Intento de acceso denegado', {
  userId: req.user?.id,
  resource: req.originalUrl,
  method: req.method,
  ip: req.ip,
  userAgent: req.headers['user-agent']
});

logger.security('Múltiples intentos de login fallidos', {
  dni: req.body.dni,
  intentos: 5,
  ip: req.ip,
  bloqueado: true
});
```

### 5. ✅ Rotar y Retener Logs Apropiadamente

En producción, configurar rotación de logs:

```javascript
// Usar winston con rotación diaria
const winston = require('winston');
require('winston-daily-rotate-file');

const transport = new winston.transports.DailyRotateFile({
  filename: 'application-%DATE%.log',
  datePattern: 'YYYY-MM-DD',
  maxSize: '20m',
  maxFiles: '30d' // Retener 30 días
});
```

---

## 🔍 Auditoría de Logs

### Checklist de Revisión

Al revisar código, verificar:

- [ ] ¿Se usa `logger` en lugar de `console.log`?
- [ ] ¿No se loguean passwords, tokens, o secretos?
- [ ] ¿No se loguea `req.body` sin sanitizar?
- [ ] ¿No se loguean respuestas de preguntas de seguridad?
- [ ] ¿Se incluye contexto suficiente (userId, ip, etc.)?
- [ ] ¿Se usan niveles de log apropiados?
- [ ] ¿Stack traces no exponen valores sensibles?

### Patrones a Buscar

```bash
# Buscar console.log restantes
grep -rn "console.log" backend/ --include="*.js" | grep -v node_modules

# Buscar logs de req.body
grep -rn "req\.body" backend/ --include="*.js" | grep "console\|logger"

# Buscar logs de headers
grep -rn "req\.headers" backend/ --include="*.js" | grep "console\|logger"
```

---

## 📚 Referencias

- [OWASP Logging Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Logging_Cheat_Sheet.html)
- [CWE-532: Information Exposure Through Log Files](https://cwe.mitre.org/data/definitions/532.html)
- [GDPR and Logging](https://gdpr.eu/data-privacy/)
- [Node.js Logging Best Practices](https://betterstack.com/community/guides/logging/nodejs-logging-best-practices/)

---

## ✅ Resumen

**Estado del Proyecto:** ✅ SEGURO

- ✅ Sistema de logging seguro implementado con sanitización automática
- ✅ Eliminados todos los logs de tokens JWT
- ✅ Eliminados todos los logs de contraseñas y respuestas de seguridad
- ✅ Eliminados logs de `req.body` sin filtrar
- ✅ Todos los logs ahora usan `secureLogger` con contexto apropiado

**Recomendaciones:**
1. Seguir usando `logger` en lugar de `console.log`
2. NUNCA loguear datos sensibles mencionados en este documento
3. Revisar logs regularmente en busca de información sensible
4. Configurar rotación de logs en producción
5. Implementar alertas para eventos de seguridad críticos

---

**Última actualización:** 2025-10-22
**Próxima auditoría recomendada:** 2025-11-22
