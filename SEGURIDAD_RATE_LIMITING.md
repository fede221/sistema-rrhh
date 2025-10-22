# 🛡️ Rate Limiting - Protección contra Ataques

## 📋 Qué es Rate Limiting

Rate limiting es una técnica de seguridad que limita el número de solicitudes que un usuario puede hacer a la API en un período de tiempo específico. Protege contra:

- **Ataques de fuerza bruta**: Intentos masivos de adivinar contraseñas
- **DoS/DDoS**: Ataques de denegación de servicio
- **Enumeración de usuarios**: Descubrimiento de usuarios válidos
- **Scraping abusivo**: Extracción masiva de datos
- **Abuso de recursos**: Consumo excesivo del servidor

---

## 🔧 Configuración Implementada

### 1. Rate Limiting General de API

**Aplicado a**: Todas las rutas `/api/*`

```
Ventana: 15 minutos
Límite: 100 requests
```

**Protege contra**: Uso abusivo general de la API

**Respuesta cuando se excede**:
```json
{
  "error": "Demasiadas solicitudes",
  "message": "Has excedido el límite de solicitudes permitidas",
  "retryAfter": "15 minutos"
}
```

---

### 2. Rate Limiting de Autenticación (Login)

**Aplicado a**: `POST /api/auth/login`

```
Ventana: 15 minutos
Límite: 5 intentos
```

**Protege contra**:
- Ataques de fuerza bruta en login
- Descubrimiento de credenciales válidas

**Respuesta cuando se excede**:
```json
{
  "error": "Demasiados intentos de inicio de sesión",
  "message": "Has excedido el límite de intentos",
  "retryAfter": "15 minutos"
}
```

**Código HTTP**: `429 Too Many Requests`

---

### 3. Rate Limiting de Recuperación de Contraseña

**Aplicado a**:
- `GET /api/auth/recovery-questions/:dni`
- `POST /api/auth/validate-recovery`
- `POST /api/auth/reset-password/:userId`

```
Ventana: 1 hora
Límite: 3 intentos
```

**Protege contra**:
- Enumeración de usuarios (descubrir DNIs válidos)
- Abuso del sistema de recuperación
- Ataques de fuerza bruta en preguntas de seguridad

**Respuesta cuando se excede**:
```json
{
  "error": "Demasiados intentos de recuperación de contraseña",
  "message": "Has excedido el límite de intentos. Por seguridad, intenta en 1 hora",
  "retryAfter": "1 hora"
}
```

---

### 4. Rate Limiting para Operaciones de Escritura

**Aplicado a**: `POST`, `PUT`, `DELETE` (disponible para uso futuro)

```
Ventana: 15 minutos
Límite: 50 operaciones
```

**Protege contra**: Modificación masiva de datos

---

### 5. Rate Limiting para Uploads

**Aplicado a**: Rutas de upload de archivos (disponible para uso futuro)

```
Ventana: 1 hora
Límite: 10 uploads
```

**Protege contra**:
- Abuso de almacenamiento
- Ataques de llenado de disco
- Upload de archivos maliciosos en masa

---

## ⚙️ Configuración Personalizada

### Variables de Entorno

Puedes ajustar los límites en tu archivo `.env`:

```bash
# Login rate limiting
AUTH_RATE_WINDOW_MS=900000        # 15 minutos
AUTH_RATE_MAX_REQUESTS=5          # 5 intentos

# Password recovery rate limiting
PASSWORD_RECOVERY_WINDOW_MS=3600000   # 1 hora
PASSWORD_RECOVERY_MAX_REQUESTS=3      # 3 intentos

# API general rate limiting
API_RATE_WINDOW_MS=900000         # 15 minutos
API_RATE_MAX_REQUESTS=100         # 100 requests

# Write operations rate limiting
WRITE_RATE_WINDOW_MS=900000       # 15 minutos
WRITE_RATE_MAX_REQUESTS=50        # 50 operaciones

# Upload rate limiting
UPLOAD_RATE_WINDOW_MS=3600000     # 1 hora
UPLOAD_RATE_MAX_REQUESTS=10       # 10 uploads
```

### Valores Recomendados por Ambiente

#### Desarrollo
```bash
AUTH_RATE_MAX_REQUESTS=20         # Más permisivo para testing
API_RATE_MAX_REQUESTS=500         # Más permisivo
```

#### Producción
```bash
AUTH_RATE_MAX_REQUESTS=5          # Restrictivo
API_RATE_MAX_REQUESTS=100         # Moderado
```

#### Testing/QA
```bash
AUTH_RATE_MAX_REQUESTS=50         # Muy permisivo
API_RATE_MAX_REQUESTS=1000        # Muy permisivo
```

---

## 📊 Headers de Rate Limiting

Cada respuesta incluye headers estándar de rate limiting:

```http
RateLimit-Limit: 100              # Límite total
RateLimit-Remaining: 95           # Requests restantes
RateLimit-Reset: 1634567890       # Timestamp de reset
```

Estos headers permiten a los clientes:
- Saber cuántos requests les quedan
- Evitar ser bloqueados
- Implementar retry logic inteligente

---

## 🔍 Identificación de Clientes

El rate limiting identifica clientes por **dirección IP**:

```javascript
// Prioridad:
1. req.ip
2. req.headers['x-forwarded-for']  // Para proxies/load balancers
3. req.connection.remoteAddress
```

### ⚠️ Consideraciones con Proxies

Si usas un proxy reverso (nginx, caddy) o load balancer:

1. Asegúrate de configurar `trust proxy` en Express:
```javascript
app.set('trust proxy', 1);
```

2. O especificar IPs confiables:
```javascript
app.set('trust proxy', ['127.0.0.1', '::1']);
```

Esto asegura que `req.ip` contenga la IP real del cliente, no la del proxy.

---

## 🧪 Testing

### Probar Rate Limiting de Login

```bash
# Hacer 6 intentos de login (el 6to debería fallar)
for i in {1..6}; do
  echo "Intento $i"
  curl -X POST http://localhost:3001/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"dni":"12345678","password":"wrong"}' \
    -v 2>&1 | grep -E "HTTP|RateLimit"
  sleep 1
done
```

**Resultado esperado**:
- Intentos 1-5: HTTP 401 (credenciales incorrectas)
- Intento 6: HTTP 429 (rate limit excedido)

### Probar Rate Limiting General

```bash
# Hacer 101 requests rápidas (la 101 debería fallar)
for i in {1..101}; do
  curl -s http://localhost:3001/api/health > /dev/null
  echo "Request $i"
done
```

### Verificar Headers

```bash
curl -I http://localhost:3001/api/health

# Salida esperada:
# RateLimit-Limit: 100
# RateLimit-Remaining: 99
# RateLimit-Reset: 1634567890
```

---

## 📈 Monitoreo

### Logs de Rate Limiting

Cuando un límite es excedido, se loguea:

```
🚨 Rate limit excedido para IP: 192.168.1.100 en ruta: /api/auth/login
```

### Monitoreo en Producción

```bash
# Ver intentos bloqueados
docker compose logs backend | grep "Rate limit excedido"

# Contar IPs bloqueadas
docker compose logs backend | grep "Rate limit excedido" | awk '{print $NF}' | sort | uniq -c | sort -rn

# Ver patrones de ataque
docker compose logs backend | grep "Rate limit excedido" | grep "login"
```

---

## 🎯 Mejores Prácticas

### 1. Ajustar Límites Según Uso Real

Monitorea el uso real de tu API y ajusta:

```bash
# Ver estadísticas de requests
docker compose logs backend | grep "POST /api/auth/login" | wc -l
```

### 2. Whitelist de IPs Confiables

Para IPs internas o servicios confiables, puedes crear un rate limiter personalizado:

```javascript
const { createCustomLimiter } = require('./middlewares/rateLimiter');

const trustedIpLimiter = createCustomLimiter({
  windowMs: 15 * 60 * 1000,
  max: 1000,  // Mucho más permisivo
  skip: (req) => {
    const trustedIPs = ['192.168.1.50', '10.0.0.1'];
    return trustedIPs.includes(req.ip);
  }
});
```

### 3. Rate Limiting por Usuario Autenticado

Para usuarios logueados, puedes implementar límites por usuario en vez de por IP:

```javascript
const userLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  keyGenerator: (req) => {
    // Si está autenticado, usar su ID
    return req.user ? req.user.id : req.ip;
  }
});
```

### 4. Notificar a Administradores

Para múltiples bloqueos desde la misma IP (posible ataque):

```javascript
let blockedAttempts = {};

const handler = (req, res) => {
  const ip = req.ip;
  blockedAttempts[ip] = (blockedAttempts[ip] || 0) + 1;

  if (blockedAttempts[ip] > 10) {
    // Notificar admin, bloquear IP en firewall, etc.
    console.error(`⚠️  POSIBLE ATAQUE desde IP: ${ip} - ${blockedAttempts[ip]} bloqueos`);
  }
};
```

---

## 🚨 Qué Hacer Si Eres Bloqueado

### Como Usuario Legítimo

Si eres bloqueado accidentalmente:

1. **Espera el tiempo indicado** (15 min o 1 hora)
2. **Verifica tu conexión**: Si compartes IP (NAT, empresa), otros usuarios pueden afectar tu límite
3. **Contacta al administrador** si el problema persiste

### Como Administrador

Para desbloquear manualmente:

```bash
# Reiniciar backend (limpia todos los contadores en memoria)
docker compose restart backend

# O implementar endpoint de limpieza (solo para admins)
```

---

## 🔐 Seguridad Adicional

El rate limiting es **una capa** de seguridad. También implementa:

1. ✅ Contraseñas fuertes (mínimo 8 caracteres, complejidad)
2. ✅ Bloqueo de cuenta después de X intentos fallidos
3. ✅ Autenticación de 2 factores (2FA)
4. ✅ CAPTCHA después de X intentos
5. ✅ Monitoreo de IPs sospechosas
6. ✅ Firewall de aplicación web (WAF)

---

## 📚 Referencias

- [OWASP Rate Limiting](https://cheatsheetseries.owasp.org/cheatsheets/Denial_of_Service_Cheat_Sheet.html)
- [express-rate-limit Documentation](https://github.com/express-rate-limit/express-rate-limit)
- [RFC 6585 - 429 Too Many Requests](https://tools.ietf.org/html/rfc6585#section-4)

---

**Última actualización**: 2025-10-22
