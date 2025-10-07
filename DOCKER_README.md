# RRHH Sistema - Docker

## 🚀 Configuración Docker

Este proyecto está completamente dockerizado para facilitar el despliegue y desarrollo.

### Prerequisitos
- Docker
- Docker Compose

### Estructura Docker
```
├── docker-compose.yml          # Producción
├── docker-compose.dev.yml      # Desarrollo
├── start-production.bat        # Script Windows para producción
├── start-production.sh         # Script Linux/Mac para producción
├── backend/
│   ├── Dockerfile             # Imagen backend producción
│   └── .dockerignore
└── frontend/
    ├── Dockerfile             # Imagen frontend producción (Nginx)
    ├── Dockerfile.dev         # Imagen frontend desarrollo
    ├── nginx.conf             # Configuración Nginx
    └── .dockerignore
```

## 🏗️ Comandos Docker

### Producción
```bash
# Construir y ejecutar (automatizado)
./start-production.sh          # Linux/Mac
start-production.bat           # Windows

# O manualmente:
docker-compose build
docker-compose up -d

# Ver logs
docker-compose logs -f

# Parar servicios
docker-compose down
```

### Desarrollo
```bash
# Ejecutar en modo desarrollo
docker-compose -f docker-compose.dev.yml up

# Con rebuild
docker-compose -f docker-compose.dev.yml up --build
```

## 🌐 Acceso a la aplicación

### Producción
- **Frontend**: http://localhost (puerto 80)
- **Backend API**: http://localhost:3001
- **Health Check**: http://localhost:3001/api/health

### Desarrollo
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001

## 📊 Monitoreo

### Health Checks
Los containers incluyen health checks automáticos:
- Frontend: Verifica disponibilidad en puerto 80
- Backend: Verifica endpoint `/api/health`

### Logs
```bash
# Ver todos los logs
docker-compose logs -f

# Ver logs específicos
docker-compose logs -f backend
docker-compose logs -f frontend
```

## 💾 Persistencia de datos

- **Uploads**: Los archivos subidos se persisten en el volumen `uploads_data`
- **Base de datos**: Externa (no containerizada)

## 🔧 Variables de entorno

Las variables de entorno se configuran en:
- `docker-compose.yml` (producción)
- `docker-compose.dev.yml` (desarrollo)
- `.env.docker` (plantilla)

### Variables principales:
```env
DB_HOST=34.176.164.98
DB_USER=root
DB_PASSWORD=pos38ric0S
DB_NAME=RRHH
DB_PORT=3306
JWT_SECRET=claveultrasecreta123
```

## 🚨 Troubleshooting

### Problemas comunes:

1. **Puerto en uso**:
   ```bash
   docker-compose down
   # Cambiar puertos en docker-compose.yml si necesario
   ```

2. **Rebuild completo**:
   ```bash
   docker-compose down
   docker-compose build --no-cache
   docker-compose up -d
   ```

3. **Limpiar todo**:
   ```bash
   docker-compose down -v
   docker system prune -f
   ```

4. **Ver estado de containers**:
   ```bash
   docker-compose ps
   docker-compose top
   ```

## 🔄 Actualizaciones

Para actualizar la aplicación:
```bash
git pull
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```