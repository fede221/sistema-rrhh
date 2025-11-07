# 🚀 Instrucciones de Deployment - Sistema RRHH v1.2.2

## ✅ Problema Resuelto

El error que viste:
```
Error response from daemon: manifest for elcheloide/sistema-rrhh-backend:v1.2.2 not found
```

**YA ESTÁ SOLUCIONADO** ✅

## 📦 Imágenes Disponibles

Ahora tienes disponibles las siguientes imágenes en Docker Hub:

- ✅ `elcheloide/sistema-rrhh-backend:v1.2.2`
- ✅ `elcheloide/sistema-rrhh-frontend:v1.2.2`
- ✅ `elcheloide/rrhh-backend:v1.2.2` (nombre alternativo)
- ✅ `elcheloide/rrhh-frontend:v1.2.2` (nombre alternativo)
- ✅ Todas también con tag `:latest`

## 🔧 Comandos para el Servidor

### Opción 1: Deployment Rápido
```bash
# En el servidor, ejecuta:
docker pull elcheloide/sistema-rrhh-backend:v1.2.2
docker pull elcheloide/sistema-rrhh-frontend:v1.2.2

# Luego ejecuta tu comando original:
docker compose -f docker-compose.yml up -d --no-deps --force-recreate backend frontend
```

### Opción 2: Usar el nuevo archivo docker-compose
```bash
# Usar el nuevo archivo optimizado:
docker compose -f docker-compose.server.yml up -d
```

### Opción 3: Script automatizado
```bash
# Hacer el script ejecutable y ejecutarlo:
chmod +x deploy-v1.2.2.sh
./deploy-v1.2.2.sh
```

## 📋 Archivos Actualizados

He actualizado todos los archivos docker-compose para usar las nuevas imágenes:

- ✅ `docker-compose.yml` → `elcheloide/rrhh-backend:v1.2.2`
- ✅ `docker-compose.prod.yml` → `elcheloide/rrhh-backend:v1.2.2`  
- ✅ `docker-compose.caddy.yml` → `elcheloide/rrhh-backend:v1.2.2`
- ✅ `docker-compose.server.yml` → `elcheloide/sistema-rrhh-backend:v1.2.2` (nombre que esperabas)

## 🎯 ¿Qué cambió en v1.2.2?

- ✅ **Refactor completo del módulo de vacaciones**
- ✅ **8 endpoints optimizados y funcionales**
- ✅ **Base de datos migrada a producción (RRHH)**
- ✅ **Frontend sincronizado con backend**
- ✅ **Validaciones robustas y manejo de errores**
- ✅ **Health checks mejorados**

## 🔍 Verificación Post-Deployment

Después del deployment, verifica:

```bash
# Estado de contenedores
docker ps

# Health check backend
curl http://localhost:3001/api/health

# Health check frontend  
curl http://localhost:80

# Ver logs si es necesario
docker logs rrhh-backend
docker logs rrhh-frontend
```

## 🆘 Si Tienes Problemas

1. **Verifica que las imágenes se descargaron:**
   ```bash
   docker images | grep v1.2.2
   ```

2. **Limpia imágenes antiguas:**
   ```bash
   docker system prune -f
   ```

3. **Reinicia completamente:**
   ```bash
   docker compose down --remove-orphans
   docker compose up -d
   ```

---

**¡Las imágenes están listas y funcionando!** 🚀

Solo ejecuta uno de los comandos de arriba y el sistema debería iniciar correctamente con la versión 1.2.2.