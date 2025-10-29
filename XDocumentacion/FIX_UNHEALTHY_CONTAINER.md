# Corrección de Contenedor Unhealthy

## Problema
El contenedor backend quedaba como "unhealthy" después de un tiempo debido a:

1. **Pool de conexiones MySQL sin reconexión automática**
2. **Health checks demasiado frecuentes sobrecargando el sistema**
3. **Falta de timeouts en conexiones a la base de datos**
4. **Cierre incorrecto de conexiones al reiniciar**

## Cambios Realizados

### 1. Backend - Configuración de Base de Datos (`backend/config/db.js`)

✅ **Agregado:**
- `connectTimeout: 10000` - Timeout de 10 segundos para establecer conexión
- `waitForConnections: true` - Esperar si no hay conexiones disponibles
- `enableKeepAlive: true` - Mantener conexiones vivas
- `keepAliveInitialDelay: 0` - Enviar keep-alive inmediatamente

✅ **Mejorado:**
- Health check del pool cada 2 minutos (antes cada 5 minutos)
- Manejo de señales SIGTERM y SIGINT para cierre graceful de conexiones
- Convertido a async/await para mejor manejo de errores
- Exportada función `checkHealth()` para uso en health endpoint

### 2. Backend - Health Check Endpoint (`backend/routes/health.js`)

✅ **Optimizado:**
- Endpoint `/api/health` ahora es ultrarrápido (respuesta mínima)
- Timeout de 5 segundos para verificación de DB
- Código 200 OK si todo está bien, 503 si hay problemas
- Nuevo endpoint `/api/health/detailed` para información completa

### 3. Docker Compose (`docker-compose.caddy.yml`)

✅ **Ajustado:**
- Intervalo aumentado de 30s a **60s** (menos frecuencia)
- Timeout aumentado de 10s a **15s** (más margen)
- Retries aumentados de 3 a **5** (más tolerancia)
- Start period aumentado de 40s a **60s** (más tiempo de arranque)
- Agregado `--timeout=5` al comando wget

## Cómo Aplicar los Cambios

### Opción 1: Rebuild Local y Push a Docker Hub

```bash
# En el directorio del backend
cd backend
docker build -t elcheloide/sistema-rrhh-backend:latest .
docker push elcheloide/sistema-rrhh-backend:latest

# En el servidor, pull y restart
docker-compose -f docker-compose.caddy.yml pull backend
docker-compose -f docker-compose.caddy.yml up -d backend
```

### Opción 2: Hot Update (Sin Rebuild - Temporal)

```bash
# Copiar archivos actualizados al contenedor en ejecución
docker cp backend/config/db.js rrhh-backend:/app/config/db.js
docker cp backend/routes/health.js rrhh-backend:/app/routes/health.js

# Reiniciar el contenedor
docker restart rrhh-backend
```

### Opción 3: Docker Compose desde Cero

```bash
# Detener todo
docker-compose -f docker-compose.caddy.yml down

# Rebuild backend localmente
cd backend
docker build -t elcheloide/sistema-rrhh-backend:latest .
docker push elcheloide/sistema-rrhh-backend:latest
cd ..

# Actualizar docker-compose.caddy.yml en el servidor
# Luego levantar todo de nuevo
docker-compose -f docker-compose.caddy.yml pull
docker-compose -f docker-compose.caddy.yml up -d
```

## Verificar que Funciona

### 1. Probar Health Check Manualmente

```bash
# Desde el servidor
curl http://localhost:3001/api/health

# Debe responder rápido con:
{
  "status": "OK",
  "uptime": 123,
  "timestamp": "2025-10-19T...",
  "responseTime": "45ms"
}
```

### 2. Verificar Estado del Contenedor

```bash
docker ps
# El STATUS debe mostrar "healthy" después de ~60 segundos
```

### 3. Ver Logs del Backend

```bash
docker logs -f rrhh-backend
# Debe mostrar:
# ✅ Pool de conexiones saludable (cada 2 minutos)
# No debe mostrar:
# ❌ Error en health check
```

### 4. Monitorear Health Check en Docker

```bash
docker inspect rrhh-backend | grep -A 10 Health
```

## Prevención Futura

### Buenas Prácticas Implementadas:

1. ✅ **Timeouts en todas las conexiones**
2. ✅ **Health checks optimizados y rápidos**
3. ✅ **Cierre graceful de conexiones**
4. ✅ **Keep-alive en conexiones MySQL**
5. ✅ **Retry logic en Docker healthcheck**

### Monitoreo Recomendado:

```bash
# Script de monitoreo (guardar como monitor.sh)
#!/bin/bash
while true; do
  echo "=== $(date) ==="
  docker ps --filter name=rrhh-backend --format "table {{.Names}}\t{{.Status}}"
  curl -s http://localhost:3001/api/health | jq '.status, .responseTime'
  echo ""
  sleep 30
done
```

## Notas Adicionales

- **Intervalo de Health Check**: Ahora es cada 60 segundos en vez de 30
- **Timeout**: Ahora tolera hasta 15 segundos de respuesta
- **Start Period**: El contenedor tiene 60 segundos para estar listo
- **Retries**: Permitimos 5 fallos consecutivos antes de marcar como unhealthy

Esto significa que el contenedor puede tener problemas temporales (hasta 5 minutos) sin ser marcado como unhealthy.

## Troubleshooting

### Si sigue apareciendo unhealthy:

1. **Verificar logs de la base de datos**:
   ```bash
   # ¿La BD está rechazando conexiones?
   docker logs rrhh-backend | grep "Error obteniendo conexión"
   ```

2. **Aumentar aún más el timeout**:
   ```yaml
   timeout: 20s
   start_period: 90s
   ```

3. **Verificar recursos del servidor**:
   ```bash
   free -h  # Memoria
   df -h    # Disco
   top      # CPU
   ```

4. **Revisar límites de conexiones MySQL**:
   ```sql
   SHOW VARIABLES LIKE 'max_connections';
   SHOW STATUS LIKE 'Threads_connected';
   ```
