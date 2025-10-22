# 🔐 Implementación de HTTPS con Caddy

## ✅ Prerrequisitos

Antes de implementar HTTPS, asegúrate de que:

1. **El DNS está configurado correctamente**
   ```bash
   nslookup rrhh.dbconsulting.com.ar
   # Debe apuntar a la IP pública de tu servidor
   ```

2. **Los puertos 80 y 443 están abiertos**
   ```bash
   sudo ufw status
   # Debe permitir 80/tcp y 443/tcp
   ```

3. **La aplicación funciona en HTTP**
   - Puedes acceder a http://rrhh.dbconsulting.com.ar
   - Las APIs funcionan correctamente

## 🚀 Pasos para Implementar HTTPS

### 1. Copiar archivos al servidor

Desde tu PC:
```powershell
# Copiar Caddyfile
scp Caddyfile root@IP_SERVIDOR:/home/RRHH/

# Copiar docker-compose con Caddy
scp docker-compose.caddy.yml root@IP_SERVIDOR:/home/RRHH/
```

### 2. En el servidor - Hacer backup

```bash
cd /home/RRHH

# Backup del docker-compose actual
cp docker-compose.yml docker-compose.http.yml.backup

# Reemplazar con la versión de Caddy
cp docker-compose.caddy.yml docker-compose.yml
```

### 3. Verificar que el Caddyfile está ahí

```bash
ls -la /home/RRHH/Caddyfile
cat /home/RRHH/Caddyfile
```

### 4. Detener servicios actuales

```bash
docker compose down
```

### 5. Levantar con Caddy

```bash
docker compose up -d
```

### 6. Ver los logs de Caddy

```bash
# Ver logs en tiempo real
docker compose logs -f caddy

# Deberías ver algo como:
# "obtaining certificate" para rrhh.dbconsulting.com.ar
# "certificate obtained successfully"
```

### 7. Verificar que todo funciona

```bash
# Verificar que Caddy está corriendo
docker compose ps

# Probar HTTPS
curl -I https://rrhh.dbconsulting.com.ar

# Verificar que HTTP redirige a HTTPS
curl -I http://rrhh.dbconsulting.com.ar
```

## 🔍 Verificaciones

### Certificado SSL
```bash
# Ver detalles del certificado
echo | openssl s_client -connect rrhh.dbconsulting.com.ar:443 -servername rrhh.dbconsulting.com.ar 2>/dev/null | openssl x509 -noout -dates
```

### Estado de los contenedores
```bash
docker compose ps
# Todos deben estar "Up" y "healthy"
```

### Logs de Caddy
```bash
# Ver si hay errores
docker compose logs caddy | grep -i error

# Ver certificados obtenidos
docker exec rrhh-caddy caddy list-certificates
```

## 🎯 URLs de Acceso

Después de la implementación:

- **HTTPS (principal)**: https://rrhh.dbconsulting.com.ar
- **HTTP (auto-redirige)**: http://rrhh.dbconsulting.com.ar → https://

## 🔧 Troubleshooting

### Caddy no puede obtener certificados

**Problema**: "failed to obtain certificate"

**Solución**:
1. Verificar que el DNS apunta correctamente
   ```bash
   nslookup rrhh.dbconsulting.com.ar
   ```

2. Verificar que los puertos 80 y 443 están abiertos
   ```bash
   sudo netstat -tulpn | grep -E ':80|:443'
   ```

3. Ver logs detallados
   ```bash
   docker compose logs caddy
   ```

### Error "too many requests" de Let's Encrypt

**Problema**: Let's Encrypt tiene rate limits

**Solución**:
- Esperar 1 hora antes de reintentar
- Verificar que el dominio está bien configurado antes de reintentar

### El sitio no carga con HTTPS

**Problema**: "Connection refused" o "Timeout"

**Solución**:
1. Verificar firewall
   ```bash
   sudo ufw allow 443/tcp
   sudo ufw reload
   ```

2. Verificar que Caddy está escuchando
   ```bash
   docker exec rrhh-caddy netstat -tulpn | grep :443
   ```

## 🔄 Rollback a HTTP (si es necesario)

Si algo sale mal y necesitas volver a HTTP:

```bash
cd /home/RRHH

# Detener todo
docker compose down

# Restaurar configuración HTTP
cp docker-compose.http.yml.backup docker-compose.yml

# Levantar sin Caddy
docker compose up -d
```

## 📊 Monitoreo Post-Implementación

```bash
# Ver estado general
docker compose ps

# Ver logs en tiempo real
docker compose logs -f

# Ver solo logs de Caddy
docker compose logs -f caddy

# Ver certificados
docker exec rrhh-caddy caddy list-certificates

# Ver uso de recursos
docker stats
```

## ✅ Checklist Final

- [ ] DNS configurado y propagado
- [ ] Puertos 80 y 443 abiertos en firewall
- [ ] Archivos copiados al servidor (Caddyfile, docker-compose.caddy.yml)
- [ ] Backup del docker-compose.yml actual
- [ ] `docker compose down` ejecutado
- [ ] `docker compose up -d` ejecutado
- [ ] Caddy obtuvo certificados SSL correctamente
- [ ] https://rrhh.dbconsulting.com.ar carga correctamente
- [ ] http:// redirige automáticamente a https://
- [ ] Las APIs funcionan con HTTPS
- [ ] Los uploads cargan correctamente
- [ ] Todas las funcionalidades de la app funcionan

## 🎉 ¡Listo!

Tu aplicación ahora está disponible en:
**https://rrhh.dbconsulting.com.ar** con certificados SSL automáticos y renovación automática cada 90 días.
