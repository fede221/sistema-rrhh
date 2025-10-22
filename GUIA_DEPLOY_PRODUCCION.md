# 🚀 Guía de Deploy a Producción - Sistema RRHH

## 📋 Pre-requisitos

- [ ] Docker y Docker Compose instalados en el servidor
- [ ] Dominio `rrhh.dbconsulting.com.ar` apuntando al servidor
- [ ] Puerto 80 y 443 abiertos en el firewall
- [ ] Base de datos MySQL accesible desde el servidor
- [ ] Credenciales de base de datos válidas

## 🔧 Cambios Realizados para Producción

### Frontend
- ✅ Rutas reorganizadas y estandarizadas
  - `/recibos/empresas` → `/empresas`
  - `/legajo` y `/legajos-admin` → `/legajos` (con lógica por rol)
  - `/errores-log` → `/errores`
- ✅ Configuración de API (`src/config.js`) que detecta automáticamente el entorno
  - Desarrollo: `http://localhost:3001`
  - Producción: `/api` (ruta relativa, Caddy hace proxy)

### Backend
- ✅ CORS configurado para desarrollo y producción
  - Permite: `localhost`, `127.0.0.1`, `rrhh.dbconsulting.com.ar`, `34.176.124.72`
  - Funciona con HTTP y HTTPS
  - Independiente del puerto (para desarrollo)

### Docker Compose
- ✅ Configurado para producción (`docker-compose.production.yml`)
  - Backend: Puerto 3001
  - Frontend: Puertos 80 (HTTP) y 443 (HTTPS)
  - Health checks configurados
  - Volumes persistentes para uploads y datos de Caddy

## 📝 Pasos de Deploy

### 1. Preparar el entorno local

```powershell
# Navegar al directorio del proyecto
cd C:\Users\Usuario\Desktop\sistema-rrhh-20251008T120753Z-1-001\sistema-rrhh

# Verificar que todos los cambios estén guardados
git status
git add .
git commit -m "Preparar para deploy a producción - rutas estandarizadas y CORS configurado"
git push origin main
```

### 2. Construir las imágenes Docker

```powershell
# Construir backend
docker build -t elcheloide/sistema-rrhh-backend:latest ./backend

# Construir frontend
docker build -t elcheloide/sistema-rrhh-frontend:latest ./frontend

# Verificar que las imágenes se construyeron correctamente
docker images | Select-String "sistema-rrhh"
```

### 3. Subir las imágenes a Docker Hub

```powershell
# Login a Docker Hub (si no lo has hecho)
docker login

# Subir backend
docker push elcheloide/sistema-rrhh-backend:latest

# Subir frontend
docker push elcheloide/sistema-rrhh-frontend:latest
```

### 4. Deploy en el servidor

#### Opción A: Usando docker-compose directamente (si tienes acceso SSH)

```bash
# Conectarse al servidor
ssh usuario@servidor

# Clonar o actualizar el repositorio
git clone https://github.com/fede221/sistema-rrhh.git
cd sistema-rrhh
git pull origin main

# Bajar las últimas imágenes
docker-compose -f docker-compose.production.yml pull

# Detener los contenedores anteriores (si existen)
docker-compose -f docker-compose.production.yml down

# Arrancar los servicios
docker-compose -f docker-compose.production.yml up -d

# Verificar que estén corriendo
docker-compose -f docker-compose.production.yml ps
```

#### Opción B: Deploy manual (sin repositorio en servidor)

```bash
# En el servidor, crear el directorio
mkdir -p ~/sistema-rrhh
cd ~/sistema-rrhh

# Copiar docker-compose.production.yml al servidor
# (desde tu máquina local usando SCP o similar)

# Bajar las imágenes
docker pull elcheloide/sistema-rrhh-backend:latest
docker pull elcheloide/sistema-rrhh-frontend:latest

# Arrancar con docker-compose
docker-compose -f docker-compose.production.yml up -d
```

### 5. Verificar el deploy

```bash
# Ver logs del backend
docker-compose -f docker-compose.production.yml logs -f backend

# Ver logs del frontend
docker-compose -f docker-compose.production.yml logs -f frontend

# Verificar health checks
docker-compose -f docker-compose.production.yml ps

# Verificar conectividad
curl http://localhost:3001/api/health
curl http://localhost:80
```

### 6. Verificar desde el navegador

1. Acceder a `http://rrhh.dbconsulting.com.ar`
2. Verificar que cargue el frontend
3. Intentar login con credenciales válidas
4. Verificar que no haya errores de CORS en la consola del navegador
5. Navegar por las diferentes secciones (dashboard, usuarios, recibos, etc.)

## 🔍 Checklist Post-Deploy

- [ ] Frontend accesible en `http://rrhh.dbconsulting.com.ar`
- [ ] Login funciona correctamente
- [ ] No hay errores de CORS en la consola
- [ ] Backend responde correctamente a las peticiones API
- [ ] Health checks pasando (verificar con `docker ps`)
- [ ] Logs sin errores críticos
- [ ] Subida de archivos funciona (si aplica)
- [ ] Todas las rutas del frontend funcionan:
  - [ ] `/dashboard` (admin/superadmin)
  - [ ] `/bienvenida` (empleado)
  - [ ] `/usuarios`
  - [ ] `/vacaciones`
  - [ ] `/recibos`
  - [ ] `/empresas`
  - [ ] `/legajos`
  - [ ] `/permisos` (superadmin)
  - [ ] `/mi-equipo` (referente/superadmin)
  - [ ] `/monitoring` (superadmin)
  - [ ] `/errores` (superadmin)

## 🐛 Troubleshooting

### Error de CORS
```bash
# Verificar logs del backend para ver qué origin está siendo rechazado
docker-compose -f docker-compose.production.yml logs backend | grep CORS

# Si es necesario, agregar el origin a allowedOrigins en backend/index.js
# y rebuild + redeploy
```

### Backend no conecta a la base de datos
```bash
# Verificar variables de entorno
docker-compose -f docker-compose.production.yml exec backend env | grep DB_

# Probar conectividad desde el contenedor
docker-compose -f docker-compose.production.yml exec backend ping 34.176.164.98

# Verificar credenciales de MySQL
```

### Frontend no carga
```bash
# Verificar logs de Caddy
docker-compose -f docker-compose.production.yml logs frontend

# Verificar que Caddy está escuchando en el puerto correcto
docker-compose -f docker-compose.production.yml exec frontend netstat -tulpn | grep :80
```

### Contenedor no arranca
```bash
# Ver logs detallados
docker-compose -f docker-compose.production.yml logs <servicio>

# Verificar que la imagen se descargó correctamente
docker images | grep sistema-rrhh

# Rebuild si es necesario
docker-compose -f docker-compose.production.yml build --no-cache <servicio>
```

## 📊 Monitoreo

### Ver logs en tiempo real
```bash
# Todos los servicios
docker-compose -f docker-compose.production.yml logs -f

# Solo backend
docker-compose -f docker-compose.production.yml logs -f backend

# Solo frontend
docker-compose -f docker-compose.production.yml logs -f frontend
```

### Ver uso de recursos
```bash
# CPU y memoria
docker stats

# Espacio en disco
docker system df
```

### Health checks
```bash
# Estado de los contenedores
docker-compose -f docker-compose.production.yml ps

# Health check manual del backend
curl http://localhost:3001/api/health

# Health check manual del frontend
curl http://localhost:80
```

## 🔄 Actualizar después del deploy

```bash
# Rebuild y redeploy
docker-compose -f docker-compose.production.yml build
docker-compose -f docker-compose.production.yml up -d

# O pull desde Docker Hub
docker-compose -f docker-compose.production.yml pull
docker-compose -f docker-compose.production.yml up -d
```

## 🛑 Detener los servicios

```bash
# Detener sin borrar datos
docker-compose -f docker-compose.production.yml stop

# Detener y borrar contenedores (mantiene volumes)
docker-compose -f docker-compose.production.yml down

# Detener, borrar contenedores Y volumes (¡CUIDADO! Borra uploads)
docker-compose -f docker-compose.production.yml down -v
```

## 🔐 Seguridad

- [ ] Cambiar `JWT_SECRET` en producción (no usar el del ejemplo)
- [ ] Usar HTTPS con SSL/TLS (Caddy lo maneja automáticamente con Let's Encrypt)
- [ ] Configurar firewall para permitir solo puertos 80 y 443
- [ ] Cambiar credenciales de base de datos si son las default
- [ ] Hacer backup regular de la base de datos
- [ ] Hacer backup del volumen `uploads_data`

## 📦 Backup y Restore

### Backup de uploads
```bash
# Backup
docker run --rm -v sistema-rrhh_uploads_data:/data -v $(pwd):/backup alpine tar czf /backup/uploads-backup-$(date +%Y%m%d).tar.gz -C /data .

# Restore
docker run --rm -v sistema-rrhh_uploads_data:/data -v $(pwd):/backup alpine tar xzf /backup/uploads-backup-YYYYMMDD.tar.gz -C /data
```

### Backup de base de datos
```bash
# Desde el servidor de base de datos o mediante mysqldump remoto
mysqldump -h 34.176.164.98 -u root -p RRHH > rrhh-backup-$(date +%Y%m%d).sql
```

## 🎉 Deploy completado

Si todos los checks pasaron, el sistema está listo para producción en `https://rrhh.dbconsulting.com.ar`
