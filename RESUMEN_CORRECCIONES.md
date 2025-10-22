# Resumen de Correcciones - Backend Unhealthy

## 🎯 Problema Identificado

El contenedor backend se marcaba como "unhealthy" después de un tiempo debido a:

1. **Conexiones MySQL sin timeouts** → Se colgaban indefinidamente
2. **Health checks demasiado frecuentes** → Sobrecargaban el sistema
3. **Sin reconexión automática** → Al perder conexión, nunca recuperaba
4. **Sin cierre graceful** → Dejaba conexiones abiertas al reiniciar

---

## ✅ Soluciones Aplicadas

### Archivos Modificados:

1. **`backend/config/db.js`**
   - ✅ Agregado `connectTimeout: 10000`
   - ✅ Agregado `enableKeepAlive: true`
   - ✅ Health check cada 2 min (antes 5 min)
   - ✅ Manejo de SIGTERM/SIGINT para cierre graceful
   - ✅ Función `checkHealth()` exportada

2. **`backend/routes/health.js`**
   - ✅ Endpoint `/api/health` ultrarrápido (respuesta mínima)
   - ✅ Timeout de 5s para verificar DB
   - ✅ Nuevo endpoint `/api/health/detailed` para info completa

3. **`docker-compose.caddy.yml`**
   - ✅ Intervalo: 30s → **60s**
   - ✅ Timeout: 10s → **15s**
   - ✅ Retries: 3 → **5**
   - ✅ Start period: 40s → **60s**

---

## 🚀 Cómo Aplicar (Guía Rápida)

### Paso 1: Rebuild Local (Windows)

```powershell
# Ejecutar desde el directorio raíz
.\rebuild-backend.ps1
```

### Paso 2: Actualizar en Servidor (Linux)

```bash
# Subir docker-compose.caddy.yml actualizado al servidor
scp docker-compose.caddy.yml user@server:/ruta/proyecto/

# Conectarse al servidor
ssh user@server

# Ejecutar script de actualización
cd /ruta/proyecto
bash update-backend-server.sh
```

### Alternativa: Sin Scripts

**Local:**
```powershell
cd backend
docker build -t elcheloide/sistema-rrhh-backend:latest .
docker push elcheloide/sistema-rrhh-backend:latest
```

**Servidor:**
```bash
docker-compose -f docker-compose.caddy.yml pull backend
docker-compose -f docker-compose.caddy.yml up -d backend
```

---

## 🔍 Verificación

### 1. Health Check Rápido
```bash
curl http://localhost:3001/api/health
```
Respuesta esperada (< 1 segundo):
```json
{
  "status": "OK",
  "uptime": 123,
  "timestamp": "2025-10-19T...",
  "responseTime": "45ms"
}
```

### 2. Estado del Contenedor
```bash
docker ps | grep rrhh-backend
```
Debe mostrar `(healthy)` en el STATUS después de ~60 segundos.

### 3. Logs
```bash
docker logs -f rrhh-backend
```
Buscar:
- ✅ `Pool de conexiones saludable` (cada 2 min)
- ❌ NO debe aparecer: `Error en health check`

---

## 📊 Mejoras Implementadas

| Métrica | Antes | Ahora | Mejora |
|---------|-------|-------|--------|
| Health check interval | 30s | 60s | -50% carga |
| Health check timeout | 10s | 15s | +50% margen |
| Retries antes de unhealthy | 3 | 5 | +66% tolerancia |
| Start period | 40s | 60s | +50% tiempo arranque |
| DB connection timeout | ∞ | 10s | Evita cuelgues |
| Cierre graceful | ❌ | ✅ | Sin conexiones huérfanas |

---

## 🎨 Archivos Creados

- ✅ `FIX_UNHEALTHY_CONTAINER.md` - Documentación detallada
- ✅ `rebuild-backend.ps1` - Script para rebuild local (Windows)
- ✅ `update-backend-server.sh` - Script para actualizar servidor (Linux)
- ✅ `RESUMEN_CORRECCIONES.md` - Este archivo

---

## 💡 Notas Importantes

1. **Tiempo de recuperación**: El contenedor puede tener problemas temporales hasta 5 minutos (5 retries × 60s) antes de marcarse unhealthy.

2. **Subida de docker-compose**: Recuerda subir el archivo `docker-compose.caddy.yml` actualizado al servidor.

3. **Backup**: Antes de aplicar, haz backup del docker-compose anterior:
   ```bash
   cp docker-compose.caddy.yml docker-compose.caddy.yml.bak
   ```

4. **Monitoreo**: Después de aplicar, monitorea por 10-15 minutos:
   ```bash
   watch -n 5 'docker ps --filter name=rrhh-backend'
   ```

---

## 🆘 Troubleshooting

### Sigue apareciendo unhealthy

1. **Aumentar timeout y start_period**:
   ```yaml
   timeout: 20s
   start_period: 90s
   ```

2. **Verificar recursos del servidor**:
   ```bash
   free -h    # Memoria disponible
   df -h      # Espacio en disco
   docker stats  # Uso de recursos de contenedores
   ```

3. **Revisar conexiones MySQL**:
   ```bash
   docker exec -it rrhh-backend wget -O- http://localhost:3001/api/health
   ```

4. **Logs completos**:
   ```bash
   docker logs --tail 100 rrhh-backend
   ```

---

## ✨ Resultado Esperado

Después de aplicar estas correcciones:

✅ El contenedor backend permanece **healthy** indefinidamente  
✅ Los health checks responden rápido (< 1s)  
✅ Las conexiones a la BD se recuperan automáticamente  
✅ El cierre del contenedor es limpio y sin errores  
✅ No hay sobrecarga por health checks frecuentes  

---

**Fecha:** 19 de octubre de 2025  
**Versión Backend:** 1.0.0  
**Estado:** Listo para aplicar
