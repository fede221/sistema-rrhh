# Deployment Commands - Sistema RRHH v1.2.2

## 🚀 Imágenes Docker Disponibles

Las siguientes imágenes están disponibles en Docker Hub:

- **Backend:** `elcheloide/rrhh-backend:v1.2.2`
- **Frontend:** `elcheloide/rrhh-frontend:v1.2.2`

## 📦 Comandos de Deployment

### Pull de Imágenes
```bash
# Pull imagen backend
docker pull elcheloide/rrhh-backend:v1.2.2

# Pull imagen frontend  
docker pull elcheloide/rrhh-frontend:v1.2.2

# Verificar imágenes descargadas
docker images | grep v1.2.2
```

### Deployment Individual

#### Backend
```bash
# Ejecutar backend
docker run -d \
  --name rrhh-backend-v1.2.2 \
  -p 3001:3001 \
  -e DB_HOST=34.176.128.94 \
  -e DB_USER=root \
  -e DB_PASSWORD=pos38ric0S \
  -e DB_NAME=RRHH \
  -e DB_PORT=3306 \
  -e JWT_SECRET=your_jwt_secret_here \
  elcheloide/rrhh-backend:v1.2.2
```

#### Frontend
```bash
# Ejecutar frontend
docker run -d \
  --name rrhh-frontend-v1.2.2 \
  -p 3002:80 \
  elcheloide/rrhh-frontend:v1.2.2
```

### Deployment con Docker Compose

Crear archivo `docker-compose.v1.2.2.yml`:

```yaml
version: '3.8'

services:
  backend:
    image: elcheloide/rrhh-backend:v1.2.2
    container_name: rrhh-backend-v1.2.2
    ports:
      - "3001:3001"
    environment:
      - DB_HOST=34.176.128.94
      - DB_USER=root
      - DB_PASSWORD=pos38ric0S
      - DB_NAME=RRHH
      - DB_PORT=3306
      - JWT_SECRET=${JWT_SECRET}
      - NODE_ENV=production
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "wget", "--quiet", "--tries=1", "--spider", "http://localhost:3001/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  frontend:
    image: elcheloide/rrhh-frontend:v1.2.2
    container_name: rrhh-frontend-v1.2.2
    ports:
      - "3002:80"
    depends_on:
      - backend
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "wget", "--quiet", "--tries=1", "--spider", "http://localhost:80"]
      interval: 30s
      timeout: 10s
      retries: 3
```

Ejecutar:
```bash
# Deployment completo
docker-compose -f docker-compose.v1.2.2.yml up -d

# Ver logs
docker-compose -f docker-compose.v1.2.2.yml logs -f

# Detener servicios
docker-compose -f docker-compose.v1.2.2.yml down
```

## 🔧 Comandos de Mantenimiento

### Logs y Monitoreo
```bash
# Ver logs del backend
docker logs rrhh-backend-v1.2.2 -f

# Ver logs del frontend
docker logs rrhh-frontend-v1.2.2 -f

# Ver estado de contenedores
docker ps | grep rrhh

# Ver uso de recursos
docker stats rrhh-backend-v1.2.2 rrhh-frontend-v1.2.2
```

### Backup y Restauración
```bash
# Backup de contenedor
docker commit rrhh-backend-v1.2.2 backup-backend-$(date +%Y%m%d)
docker commit rrhh-frontend-v1.2.2 backup-frontend-$(date +%Y%m%d)

# Exportar imágenes
docker save elcheloide/rrhh-backend:v1.2.2 -o rrhh-backend-v1.2.2.tar
docker save elcheloide/rrhh-frontend:v1.2.2 -o rrhh-frontend-v1.2.2.tar
```

### Limpieza
```bash
# Detener y eliminar contenedores
docker stop rrhh-backend-v1.2.2 rrhh-frontend-v1.2.2
docker rm rrhh-backend-v1.2.2 rrhh-frontend-v1.2.2

# Eliminar imágenes locales (opcional)
docker rmi elcheloide/rrhh-backend:v1.2.2
docker rmi elcheloide/rrhh-frontend:v1.2.2

# Limpieza general de Docker
docker system prune -f
```

## 🔍 Verificación Post-Deployment

### Health Checks
```bash
# Verificar backend
curl http://localhost:3001/api/health

# Verificar frontend
curl http://localhost:3002

# Verificar conectividad completa
curl -H "Content-Type: application/json" http://localhost:3001/api/auth/verify
```

### Tests de Funcionalidad
```bash
# Test de login (reemplazar con credenciales reales)
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"dni":"99999999","password":"admin123"}'

# Test de endpoint vacaciones (con token JWT)
curl -X GET http://localhost:3001/api/vacaciones/historial \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## ⚙️ Variables de Entorno Requeridas

### Backend (.env)
```bash
DB_HOST=34.176.128.94
DB_USER=root
DB_PASSWORD=pos38ric0S
DB_NAME=RRHH
DB_PORT=3306
JWT_SECRET=your_super_secret_jwt_key_here
NODE_ENV=production
PORT=3001
CORS_ORIGIN=http://localhost:3002,https://your-domain.com
```

### Nginx (Frontend)
El frontend incluye configuración de nginx optimizada para producción.

## 🚨 Troubleshooting

### Problemas Comunes

1. **Backend no conecta a base de datos:**
   ```bash
   # Verificar conectividad
   docker exec rrhh-backend-v1.2.2 npm run health
   ```

2. **Frontend no carga:**
   ```bash
   # Verificar nginx
   docker exec rrhh-frontend-v1.2.2 nginx -t
   ```

3. **CORS errors:**
   - Verificar CORS_ORIGIN en variables de entorno
   - Asegurar que frontend accede desde dominio permitido

4. **JWT errors:**
   - Verificar JWT_SECRET configurado
   - Verificar expiración de tokens

### Logs Detallados
```bash
# Backend con debug
docker run -e LOG_LEVEL=debug elcheloide/rrhh-backend:v1.2.2

# Ver logs de nginx
docker exec rrhh-frontend-v1.2.2 tail -f /var/log/nginx/access.log
```

## 📞 Soporte

Para issues de deployment:
1. Verificar logs de contenedores
2. Comprobar variables de entorno
3. Validar conectividad de red
4. Revisar health checks

---

**Versión:** v1.2.2  
**Fecha:** 2025-11-07  
**Status:** ✅ PRODUCCIÓN READY