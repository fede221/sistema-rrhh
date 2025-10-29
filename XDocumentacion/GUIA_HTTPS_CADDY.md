# Configuración HTTPS con Caddy (Para implementar más adelante)

## 📋 ¿Por qué Caddy?

- ✅ Certificados SSL automáticos (Let's Encrypt)
- ✅ Configuración más simple que Nginx
- ✅ HTTPS automático
- ✅ Renovación automática de certificados

## 🔧 Configuración Futura con Caddy

### Caddyfile (cuando implementes HTTPS)

```caddy
rrhh.dbconsulting.com.ar {
    # Reverse proxy al frontend (que también hace proxy al backend)
    reverse_proxy frontend:80
    
    # Logs
    log {
        output file /var/log/caddy/access.log
        format json
    }
    
    # Headers de seguridad
    header {
        # Seguridad
        Strict-Transport-Security "max-age=31536000; includeSubDomains; preload"
        X-Content-Type-Options "nosniff"
        X-Frame-Options "SAMEORIGIN"
        X-XSS-Protection "1; mode=block"
        Referrer-Policy "strict-origin-when-cross-origin"
        
        # Remover headers innecesarios
        -Server
    }
    
    # Comprimir respuestas
    encode gzip
}
```

### docker-compose con Caddy

```yaml
version: '3.8'

services:
  caddy:
    image: caddy:2-alpine
    container_name: rrhh-caddy
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
      - "443:443/udp"  # HTTP/3
    volumes:
      - ./Caddyfile:/etc/caddy/Caddyfile
      - caddy-data:/data
      - caddy-config:/config
      - caddy-logs:/var/log/caddy
    networks:
      - rrhh-network
    depends_on:
      frontend:
        condition: service_healthy

  backend:
    image: elcheloide/sistema-rrhh-backend:latest
    container_name: rrhh-backend
    restart: unless-stopped
    environment:
      - DB_HOST=${DB_HOST}
      - DB_USER=${DB_USER}
      - DB_PASSWORD=${DB_PASSWORD}
      - DB_NAME=${DB_NAME}
      - DB_PORT=${DB_PORT}
      - JWT_SECRET=${JWT_SECRET}
      - NODE_ENV=production
      - PORT=3001
    volumes:
      - ./backend/uploads:/app/uploads
      - backend-logs:/app/logs
    networks:
      - rrhh-network
    healthcheck:
      test: ["CMD", "wget", "--quiet", "--tries=1", "--spider", "http://localhost:3001/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

  frontend:
    image: elcheloide/sistema-rrhh-frontend:latest
    container_name: rrhh-frontend
    restart: unless-stopped
    depends_on:
      backend:
        condition: service_healthy
    networks:
      - rrhh-network
    healthcheck:
      test: ["CMD", "wget", "--quiet", "--tries=1", "--spider", "http://localhost:80"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 10s

networks:
  rrhh-network:
    driver: bridge

volumes:
  backend-logs:
  caddy-data:
  caddy-config:
  caddy-logs:
```

## 🚀 Pasos para Migrar a HTTPS (Cuando estés listo)

### 1. Preparar el Caddyfile

```bash
cd ~/sistema-rrhh
nano Caddyfile
# Pegar el contenido del Caddyfile de arriba
```

### 2. Actualizar docker-compose.yml

```bash
# Hacer backup
cp docker-compose.yml docker-compose.http.yml.backup

# Editar con la configuración de Caddy
nano docker-compose.yml
```

### 3. Verificar que el DNS esté configurado correctamente

```bash
nslookup rrhh.dbconsulting.com.ar
# Debe apuntar a la IP pública de tu servidor
```

### 4. Detener servicios actuales

```bash
docker compose down
```

### 5. Levantar con Caddy

```bash
docker compose up -d
```

### 6. Verificar los logs de Caddy

```bash
docker compose logs -f caddy
```

Verás algo como:
```
Caddy obtaining certificate for rrhh.dbconsulting.com.ar
Certificate obtained successfully
```

### 7. Verificar HTTPS

```bash
curl https://rrhh.dbconsulting.com.ar
```

## 🔒 Ventajas de HTTPS con Caddy

### Automático
- ✅ Obtiene certificados SSL automáticamente
- ✅ Renueva certificados antes de que expiren
- ✅ Redirecciona HTTP → HTTPS automáticamente

### Seguridad
- ✅ TLS 1.2 y 1.3 habilitados
- ✅ Headers de seguridad configurados
- ✅ HTTP/2 y HTTP/3 habilitados

### Simple
- ✅ Una sola línea para habilitar HTTPS
- ✅ No necesitas generar certificados manualmente
- ✅ No necesitas configurar renovaciones

## 📝 Configuración Alternativa (Más Simple)

Si solo quieres HTTPS rápido, el Caddyfile puede ser aún más simple:

```caddy
rrhh.dbconsulting.com.ar

reverse_proxy frontend:80
```

¡Eso es todo! Caddy se encarga del resto automáticamente.

## 🔍 Verificaciones Después de Implementar HTTPS

```bash
# Verificar certificado
curl -vI https://rrhh.dbconsulting.com.ar 2>&1 | grep -i "SSL certificate"

# Verificar redirección HTTP → HTTPS
curl -I http://rrhh.dbconsulting.com.ar
# Debe devolver 301 o 308 redirect a HTTPS

# Ver logs de Caddy
docker compose logs caddy

# Verificar que todo funciona
curl https://rrhh.dbconsulting.com.ar/api/health
```

## 🆘 Troubleshooting con Caddy

### Caddy no puede obtener certificados

**Problema**: "Unable to obtain certificate"

**Solución**:
1. Verificar que el puerto 80 y 443 estén abiertos
2. Verificar que el DNS apunte correctamente
3. Esperar unos minutos (Let's Encrypt a veces tarda)

```bash
# Verificar puertos
sudo netstat -tulpn | grep -E ':80|:443'

# Verificar DNS
nslookup rrhh.dbconsulting.com.ar
```

### Certificado autofirmado en lugar de Let's Encrypt

**Problema**: El navegador muestra "Certificado no confiable"

**Solución**:
- Caddy usa certificado autofirmado en desarrollo/localhost
- Verifica que el dominio en Caddyfile coincida exactamente con el DNS
- Debe ser un dominio público real, no localhost

### Ver detalles del certificado

```bash
docker exec rrhh-caddy caddy list-certificates
```

## 📊 Comparación HTTP vs HTTPS

| Aspecto | HTTP (Actual) | HTTPS (Con Caddy) |
|---------|--------------|-------------------|
| Seguridad | ⚠️ Datos sin cifrar | ✅ Cifrado TLS |
| SEO | ❌ Penalizado por Google | ✅ Mejor ranking |
| Confianza | ⚠️ "No seguro" en navegador | ✅ Candado verde |
| Complejidad | ✅ Simple | ✅ Simple con Caddy |
| Costo | ✅ Gratis | ✅ Gratis (Let's Encrypt) |
| PWA | ❌ No funciona bien | ✅ Requerido |

## ⏭️ Siguiente Paso

Cuando estés listo para implementar HTTPS:

1. **Crear Caddyfile** en el servidor
2. **Actualizar docker-compose.yml** con el servicio Caddy
3. **Reiniciar servicios**: `docker compose down && docker compose up -d`
4. **Verificar** que todo funciona con HTTPS
5. **Disfrutar** de HTTPS automático y gratuito 🎉

---

**Nota**: Por ahora, el sistema funciona perfectamente con HTTP. Implementa HTTPS cuando estés listo y tengas el DNS configurado correctamente.
