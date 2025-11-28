# Guía de Despliegue Multi-Aplicación (RRHH + HCSI)

## 📋 Resumen de Configuración

Esta configuración permite ejecutar dos aplicaciones diferentes en el mismo servidor:
- **RRHH**: `rrhh.dbconsulting.com.ar`
- **HCSI**: `hcsi.dbconsulting.com.ar`

Ambas aplicaciones comparten:
- Un único contenedor Caddy (reverse proxy con SSL automático)
- La misma red Docker (`shared-network`)
- El mismo servidor de base de datos MySQL (diferentes bases de datos)

## 🏗️ Arquitectura

```
Internet
   ↓
Caddy (puerto 80/443)
   ├→ rrhh.dbconsulting.com.ar → rrhh-frontend:80 → rrhh-backend:3001
   └→ hcsi.dbconsulting.com.ar → hcsi-frontend:80 → hcsi-backend:3002
                                        ↓                    ↓
                                   MySQL (34.176.128.94)
                                   ├─ Base: RRHH
                                   └─ Base: meal_delivery_system
```

## 📁 Estructura de Archivos

```
sistema-rrhh/
├── docker-compose.caddy.yml   # Configuración de contenedores
├── Caddyfile                  # Configuración de proxy y SSL
├── .env.production            # Variables de entorno (NO SUBIR A GIT)
├── rrhh/
│   └── uploads/              # Archivos subidos RRHH
└── hcsi/
    └── uploads/              # Archivos subidos HCSI
```

## 🚀 Pasos de Despliegue

### 1. Preparar el Servidor

```bash
# Conectar al servidor
ssh usuario@tu-servidor

# Crear directorio de trabajo
mkdir -p /opt/aplicaciones
cd /opt/aplicaciones

# Crear estructura de directorios
mkdir -p rrhh/uploads
mkdir -p hcsi/uploads
chmod -R 755 rrhh hcsi
```

### 2. Subir Archivos de Configuración

Copiar al servidor los siguientes archivos:
- `docker-compose.caddy.yml`
- `Caddyfile`
- `.env.production` (renombrar a `.env`)

```bash
# Desde tu máquina local
scp docker-compose.caddy.yml usuario@servidor:/opt/aplicaciones/
scp Caddyfile usuario@servidor:/opt/aplicaciones/
scp .env.production usuario@servidor:/opt/aplicaciones/.env
```

### 3. Generar JWT Secrets (IMPORTANTE)

```bash
# En el servidor, generar secret para HCSI
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Copiar el resultado y editar el archivo .env
nano .env

# Pegar el secret generado en HCSI_JWT_SECRET
# También puedes generar uno nuevo para RRHH_JWT_SECRET si deseas
```

### 4. Configurar DNS

Asegúrate de que los dominios apunten a la IP de tu servidor:

```
Tipo A: rrhh.dbconsulting.com.ar → IP_DEL_SERVIDOR
Tipo A: hcsi.dbconsulting.com.ar → IP_DEL_SERVIDOR
```

### 5. Verificar Imágenes Docker

```bash
# Verificar que las imágenes existen en Docker Hub
docker pull elcheloide/rrhh-backend:v1.2.2
docker pull elcheloide/rrhh-frontend:v1.2.2
docker pull elcheloide/hcsi-backend:latest
docker pull elcheloide/hcsi-frontend:latest
```

### 6. Iniciar Servicios

```bash
cd /opt/aplicaciones

# Descargar imágenes y crear contenedores
docker-compose -f docker-compose.caddy.yml pull

# Iniciar servicios en segundo plano
docker-compose -f docker-compose.caddy.yml up -d

# Ver logs en tiempo real
docker-compose -f docker-compose.caddy.yml logs -f
```

### 7. Verificar Despliegue

```bash
# Ver estado de contenedores
docker-compose -f docker-compose.caddy.yml ps

# Todos deben mostrar "Up" y "healthy"
# - multi-caddy
# - rrhh-backend (healthy)
# - rrhh-frontend (healthy)
# - hcsi-backend (healthy)
# - hcsi-frontend (healthy)

# Verificar logs de Caddy
docker logs multi-caddy

# Verificar que obtuvo certificados SSL
docker exec multi-caddy ls -la /data/caddy/certificates/
```

### 8. Probar las Aplicaciones

```bash
# Probar RRHH
curl -I https://rrhh.dbconsulting.com.ar

# Probar HCSI
curl -I https://hcsi.dbconsulting.com.ar

# Ambos deben retornar 200 OK con certificado SSL válido
```

## 🔧 Comandos Útiles

### Ver Logs

```bash
# Logs de todos los servicios
docker-compose -f docker-compose.caddy.yml logs -f

# Logs de un servicio específico
docker-compose -f docker-compose.caddy.yml logs -f rrhh-backend
docker-compose -f docker-compose.caddy.yml logs -f hcsi-backend
docker-compose -f docker-compose.caddy.yml logs -f multi-caddy
```

### Reiniciar Servicios

```bash
# Reiniciar todo
docker-compose -f docker-compose.caddy.yml restart

# Reiniciar un servicio específico
docker-compose -f docker-compose.caddy.yml restart rrhh-backend
docker-compose -f docker-compose.caddy.yml restart hcsi-frontend
```

### Actualizar Imágenes

```bash
# Descargar nuevas versiones
docker-compose -f docker-compose.caddy.yml pull

# Recrear contenedores con nuevas imágenes
docker-compose -f docker-compose.caddy.yml up -d

# O hacerlo en un solo comando
docker-compose -f docker-compose.caddy.yml pull && \
docker-compose -f docker-compose.caddy.yml up -d
```

### Detener Servicios

```bash
# Detener todos los servicios
docker-compose -f docker-compose.caddy.yml down

# Detener y eliminar volúmenes (⚠️ CUIDADO: elimina logs)
docker-compose -f docker-compose.caddy.yml down -v
```

## 🔒 Seguridad

### Permisos de Archivos

```bash
# .env debe tener permisos restrictivos
chmod 600 .env

# Directorios de uploads
chmod -R 755 rrhh/uploads hcsi/uploads
```

### Firewall

```bash
# Asegúrate de que solo los puertos necesarios estén abiertos
sudo ufw allow 80/tcp    # HTTP (redirige a HTTPS)
sudo ufw allow 443/tcp   # HTTPS
sudo ufw allow 22/tcp    # SSH
sudo ufw enable
```

### Backups

```bash
# Backup de uploads RRHH
tar -czf rrhh-uploads-$(date +%Y%m%d).tar.gz rrhh/uploads/

# Backup de uploads HCSI
tar -czf hcsi-uploads-$(date +%Y%m%d).tar.gz hcsi/uploads/

# Backup de configuración
tar -czf config-backup-$(date +%Y%m%d).tar.gz \
  docker-compose.caddy.yml Caddyfile .env
```

## 🐛 Troubleshooting

### Los certificados SSL no se obtienen

```bash
# Verificar logs de Caddy
docker logs multi-caddy

# Verificar que los dominios resuelven correctamente
nslookup rrhh.dbconsulting.com.ar
nslookup hcsi.dbconsulting.com.ar

# Reiniciar Caddy
docker-compose -f docker-compose.caddy.yml restart caddy
```

### Backend no responde

```bash
# Ver logs del backend
docker logs rrhh-backend
docker logs hcsi-backend

# Verificar conexión a base de datos
docker exec rrhh-backend wget -q -O- http://localhost:3001/api/health
docker exec hcsi-backend wget -q -O- http://localhost:3002/api/health
```

### Error de conexión a base de datos

```bash
# Verificar conectividad desde el contenedor
docker exec rrhh-backend ping -c 3 34.176.128.94

# Verificar credenciales en .env
cat .env | grep DB_
```

### Frontend no carga

```bash
# Verificar logs
docker logs rrhh-frontend
docker logs hcsi-frontend

# Verificar que el backend está healthy
docker-compose -f docker-compose.caddy.yml ps
```

## 📊 Monitoreo

### Verificar Estado de Salud

```bash
# Estado general
docker-compose -f docker-compose.caddy.yml ps

# Healthcheck manual
curl http://localhost:3001/api/health  # RRHH backend
curl http://localhost:3002/api/health  # HCSI backend
```

### Uso de Recursos

```bash
# Ver uso de CPU y memoria
docker stats

# Espacio en disco
df -h
du -sh rrhh/ hcsi/
```

## 📝 Notas Importantes

1. **JWT Secrets**: Cada aplicación DEBE tener su propio JWT secret único
2. **Bases de Datos**: Ambas aplicaciones usan el mismo servidor MySQL pero diferentes bases de datos
3. **Puertos**: RRHH usa 3001, HCSI usa 3002 internamente
4. **SSL**: Caddy obtiene y renueva certificados automáticamente
5. **Logs**: Se guardan en volúmenes Docker persistentes
6. **Uploads**: Cada aplicación tiene su propio directorio de uploads

## 🔄 Actualizaciones

Para actualizar cualquiera de las aplicaciones:

1. Construir y pushear nueva imagen a Docker Hub
2. Actualizar tag en `docker-compose.caddy.yml` si es necesario
3. Ejecutar:
   ```bash
   docker-compose -f docker-compose.caddy.yml pull [servicio]
   docker-compose -f docker-compose.caddy.yml up -d [servicio]
   ```

## 📞 Soporte

Si encuentras problemas:
1. Revisa los logs: `docker-compose -f docker-compose.caddy.yml logs`
2. Verifica el estado: `docker-compose -f docker-compose.caddy.yml ps`
3. Consulta esta guía de troubleshooting
