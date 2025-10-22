# 🛡️ Headers de Seguridad HTTP - Helmet

## 📋 Qué son los Headers de Seguridad

Los headers de seguridad HTTP son directivas que el servidor envía al navegador para configurar comportamientos de seguridad. Protegen contra vulnerabilidades comunes como:

- **XSS (Cross-Site Scripting)**: Inyección de código malicioso
- **Clickjacking**: Engañar al usuario para hacer clicks no deseados
- **MIME Sniffing**: Interpretación incorrecta de tipos de archivo
- **Information Leakage**: Revelación de tecnologías usadas
- **Man-in-the-Middle**: Ataques de interceptación

---

## ✅ Headers Implementados

### 1. Content-Security-Policy (CSP)

**Qué hace**: Define qué recursos pueden cargarse y desde dónde

**Nuestra configuración**:
```javascript
defaultSrc: ["'self'"]              // Solo recursos del mismo origen por defecto
scriptSrc: ["'self'"]               // Scripts solo del mismo origen
styleSrc: ["'self'", "'unsafe-inline'", "fonts.googleapis.com"]  // Estilos + Google Fonts
fontSrc: ["'self'", "fonts.gstatic.com", "data:"]  // Fuentes + data URIs
imgSrc: ["'self'", "data:", "https:", "blob:"]     // Imágenes flexibles
connectSrc: ["'self'"]              // APIs solo mismo origen
frameSrc: ["'none'"]                // No permitir iframes
objectSrc: ["'none'"]               // No Flash, Java, etc.
```

**Protege contra**:
- ✅ Inyección de scripts maliciosos (XSS)
- ✅ Carga de recursos desde dominios no autorizados
- ✅ Ataques de exfiltración de datos

**Respuesta del navegador**:
```
Content-Security-Policy: default-src 'self'; script-src 'self'; ...
```

**Ejemplo de violación bloqueada**:
```javascript
// Esto sería bloqueado:
<script src="http://malicious-site.com/hack.js"></script>

// Esto está permitido:
<script src="/js/app.js"></script>
```

---

### 2. Strict-Transport-Security (HSTS)

**Qué hace**: Fuerza al navegador a usar HTTPS siempre

**Nuestra configuración** (solo en producción):
```javascript
maxAge: 31536000,          // 1 año
includeSubDomains: true,   // Aplicar a subdominios
preload: true              // Incluir en lista de precarga
```

**Protege contra**:
- ✅ Ataques man-in-the-middle
- ✅ Downgrade attacks (forzar HTTP)
- ✅ Cookie hijacking

**Respuesta del navegador**:
```
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
```

**⚠️ Importante**: Solo habilitado en producción con HTTPS. En desarrollo (HTTP) está deshabilitado.

---

### 3. X-Frame-Options

**Qué hace**: Previene que el sitio sea embebido en iframes

**Nuestra configuración**:
```javascript
action: 'deny'  // No permitir ser embebido en ningún iframe
```

**Protege contra**:
- ✅ Clickjacking
- ✅ UI Redressing attacks
- ✅ Frame injection

**Respuesta del navegador**:
```
X-Frame-Options: DENY
```

**Ejemplo bloqueado**:
```html
<!-- Otro sitio intenta:  -->
<iframe src="https://tu-app-rrhh.com"></iframe>
<!-- El navegador lo bloqueará -->
```

---

### 4. X-Content-Type-Options

**Qué hace**: Previene MIME type sniffing

**Nuestra configuración**:
```javascript
noSniff: true
```

**Protege contra**:
- ✅ Ejecución de scripts disfrazados como imágenes
- ✅ MIME confusion attacks

**Respuesta del navegador**:
```
X-Content-Type-Options: nosniff
```

**Ejemplo de ataque prevenido**:
```html
<!-- Atacante sube "imagen.jpg" que en realidad es JavaScript -->
<!-- Sin noSniff: navegador podría ejecutarlo -->
<!-- Con noSniff: navegador lo trata solo como imagen -->
```

---

### 5. Referrer-Policy

**Qué hace**: Controla qué información se envía en el header Referer

**Nuestra configuración**:
```javascript
policy: "strict-origin-when-cross-origin"
```

**Significa**:
- Mismo origen: envía URL completa
- HTTPS → HTTPS: envía solo origen
- HTTPS → HTTP: no envía nada

**Protege contra**:
- ✅ Fuga de URLs sensibles con tokens
- ✅ Información sobre navegación del usuario

**Respuesta del navegador**:
```
Referrer-Policy: strict-origin-when-cross-origin
```

---

### 6. X-DNS-Prefetch-Control

**Qué hace**: Controla DNS prefetching del navegador

**Nuestra configuración**:
```javascript
allow: false
```

**Protege contra**:
- ✅ Fuga de información sobre sitios visitados
- ✅ Tracking por DNS queries

**Respuesta del navegador**:
```
X-DNS-Prefetch-Control: off
```

---

### 7. X-Download-Options (IE)

**Qué hace**: Previene que IE8+ abra descargas en contexto del sitio

**Nuestra configuración**:
```javascript
ieNoOpen: true
```

**Protege contra**:
- ✅ Ejecución de archivos descargados en contexto privilegiado

**Respuesta del navegador**:
```
X-Download-Options: noopen
```

---

### 8. Cross-Origin-Opener-Policy

**Qué hace**: Aísla ventanas del navegador

**Nuestra configuración**:
```javascript
policy: "same-origin"
```

**Protege contra**:
- ✅ Ataques Spectre/Meltdown en navegador
- ✅ Cross-window leaks

**Respuesta del navegador**:
```
Cross-Origin-Opener-Policy: same-origin
```

---

### 9. Cross-Origin-Resource-Policy

**Qué hace**: Controla qué sitios pueden cargar recursos

**Nuestra configuración**:
```javascript
policy: "same-origin"
```

**Protege contra**:
- ✅ Carga no autorizada de recursos
- ✅ Embedding attacks

**Respuesta del navegador**:
```
Cross-Origin-Resource-Policy: same-origin
```

---

### 10. Ocultar X-Powered-By

**Qué hace**: Remueve header que revela tecnología

**Nuestra configuración**:
```javascript
hidePoweredBy: true
```

**Antes**:
```
X-Powered-By: Express
```

**Después**:
```
(header no presente)
```

**Protege contra**:
- ✅ Información sobre tecnología usada
- ✅ Targeting de vulnerabilidades específicas de Express

---

## 🧪 Testing

### Verificar Headers Localmente

```bash
# Ver todos los headers de seguridad
curl -I http://localhost:3001/api/health

# Buscar headers específicos
curl -I http://localhost:3001/api/health | grep -i "content-security\|x-frame\|strict-transport"
```

**Salida esperada**:
```
HTTP/1.1 200 OK
Content-Security-Policy: default-src 'self'; script-src 'self'; ...
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
X-DNS-Prefetch-Control: off
X-Download-Options: noopen
Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Resource-Policy: same-origin
```

En producción con HTTPS, también verás:
```
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
```

---

### Testing con Herramientas Online

#### 1. SecurityHeaders.com
```
https://securityheaders.com/?q=https://tu-dominio.com
```
Score esperado: **A** o **A+**

#### 2. Mozilla Observatory
```
https://observatory.mozilla.org/analyze/tu-dominio.com
```
Score esperado: **90+**

#### 3. OWASP ZAP
Herramienta de pentesting que verifica headers

---

## 🔧 Configuración por Ambiente

### Desarrollo (HTTP)

```javascript
NODE_ENV=development
```

**Características**:
- ❌ HSTS deshabilitado (no hay HTTPS)
- ✅ CSP permite `unsafe-inline` y `unsafe-eval` para React dev
- ✅ Otros headers activos

### Producción (HTTPS)

```javascript
NODE_ENV=production
```

**Características**:
- ✅ HSTS habilitado con max-age 1 año
- ✅ CSP estricto sin `unsafe-inline`
- ✅ `upgradeInsecureRequests` activo
- ✅ Todos los headers activos

---

## 🎯 Ajustes Personalizados

### Permitir Embedding en Dominios Específicos

Si necesitas permitir iframes en dominios confiables:

```javascript
// backend/config/helmet.js
frameguard: {
  action: 'allow-from',
  domain: 'https://trusted-domain.com'
}
```

### Agregar Dominios a CSP

Si usas CDNs adicionales:

```javascript
// backend/config/helmet.js
scriptSrc: ["'self'", "https://cdn.trusted.com"],
styleSrc: ["'self'", "https://cdn.trusted.com"],
```

### Reportar Violaciones de CSP

Para monitorear intentos de ataque:

```javascript
contentSecurityPolicy: {
  directives: {
    // ... tu configuración ...
    reportUri: '/api/csp-report'
  }
}
```

Luego crear endpoint para recibir reportes:

```javascript
app.post('/api/csp-report', (req, res) => {
  console.warn('CSP Violation:', req.body);
  // Guardar en BD, alertar admins, etc.
  res.status(204).send();
});
```

---

## 📊 Comparación Antes/Después

### Antes (Sin Helmet)

```bash
curl -I http://localhost:3001/api/health

HTTP/1.1 200 OK
X-Powered-By: Express  # ⚠️ Revela tecnología
Content-Type: application/json
# Solo 2 headers de seguridad básicos
```

**Score SecurityHeaders.com**: F (Fail)

---

### Después (Con Helmet)

```bash
curl -I http://localhost:3001/api/health

HTTP/1.1 200 OK
Content-Security-Policy: default-src 'self'; script-src 'self'; ...
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
X-DNS-Prefetch-Control: off
X-Download-Options: noopen
Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Resource-Policy: same-origin
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
# X-Powered-By removido ✅
# 9+ headers de seguridad ✅
```

**Score SecurityHeaders.com**: A o A+

---

## ⚠️ Troubleshooting

### CSP Bloqueando Recursos Legítimos

**Síntoma**: Recursos (scripts, estilos, imágenes) no cargan

**Solución**: Ver violaciones en consola del navegador
```javascript
// En DevTools Console verás:
Refused to load script 'https://example.com/script.js'
because it violates the following CSP directive: "script-src 'self'"
```

Agrega el dominio a la directiva correspondiente en `backend/config/helmet.js`

---

### HSTS Causando Problemas

**Síntoma**: No puedes acceder al sitio después de cambiar a HTTP

**Causa**: HSTS guarda el requerimiento de HTTPS por 1 año

**Solución**:
```
1. Chrome: chrome://net-internals/#hsts
2. Buscar tu dominio
3. Click "Delete domain security policies"
```

---

### Frames Bloqueados Cuando Son Necesarios

**Síntoma**: Tu app necesita ser embebida en iframe

**Solución**: Cambiar de `deny` a `sameorigin`:
```javascript
frameguard: { action: 'sameorigin' }
```

---

## 🔒 Mejores Prácticas

### 1. ✅ Monitorear Violaciones de CSP

Implementa reporting para detectar ataques:
```javascript
reportUri: '/api/csp-report'
```

### 2. ✅ Probar Antes de Desplegar

```bash
# Testing local
NODE_ENV=production npm start
# Verificar que todo funciona
```

### 3. ✅ Actualizar Helmet Regularmente

```bash
npm update helmet
```

### 4. ✅ Auditar con Herramientas Automáticas

- SecurityHeaders.com
- Mozilla Observatory
- OWASP ZAP

### 5. ✅ Combinar con Otras Medidas

Headers de seguridad son **una capa**. También implementa:
- Rate limiting ✅ (ya implementado)
- Validación de entrada
- Sanitización de salida
- Autenticación fuerte
- WAF (Web Application Firewall)

---

## 📚 Referencias

- [OWASP Secure Headers Project](https://owasp.org/www-project-secure-headers/)
- [Helmet.js Documentation](https://helmetjs.github.io/)
- [MDN Web Security](https://developer.mozilla.org/en-US/docs/Web/Security)
- [Content Security Policy Reference](https://content-security-policy.com/)
- [SecurityHeaders.com Scanner](https://securityheaders.com/)

---

## 📈 Mejoras Futuras

### Implementar Subresource Integrity (SRI)

Para CDNs:
```html
<script
  src="https://cdn.example.com/lib.js"
  integrity="sha384-hash..."
  crossorigin="anonymous">
</script>
```

### Implementar Certificate Transparency

```javascript
expectCt: {
  enforce: true,
  maxAge: 86400,
  reportUri: '/api/ct-report'
}
```

### Implementar Permissions Policy

```javascript
// Controlar qué features del navegador están permitidas
permissionsPolicy: {
  features: {
    geolocation: ["'none'"],
    camera: ["'none'"],
    microphone: ["'none'"]
  }
}
```

---

**Última actualización**: 2025-10-22
**Próxima revisión**: 2025-11-22
