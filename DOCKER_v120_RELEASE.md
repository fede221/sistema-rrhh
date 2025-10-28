# 📦 Docker Build v120 - Resumen de Despliegue

**Fecha**: 28 de Octubre 2025  
**Versión**: v120  
**Status**: ✅ COMPLETADO

## Imágenes Publicadas en Docker Hub

### Backend
```
docker pull elcheloide/sistema-rrhh-backend:v120
```
- **Digest**: sha256:1948ff5224d128c848a6aef6088a13bb9a4fead2672c002f6fc76bf2615b8a57
- **Tamaño**: 856 bytes (manifest)
- **Base**: Node.js 18-Alpine
- **Status**: ✅ Subida correctamente

### Frontend  
```
docker pull elcheloide/sistema-rrhh-frontend:v120
```
- **Digest**: sha256:47c4772d0d12514a72c6d230aeb7ffb7a92646154b25000b8469ecdc6aa4450f
- **Tamaño**: 856 bytes (manifest)
- **Base**: Nginx Alpine (Multi-stage build)
- **Status**: ✅ Subida correctamente

## Características Incluidas en v120

### ✨ Correciones de Base de Datos
- ✅ Migración de charset `latin1` → `utf8mb4` en todas las tablas
- ✅ Corrección de encoding en nombres de empresas
- ✅ Soporte completo para caracteres especiales (ñ, á, é, etc.)

### 📦 Mejoras Previas (v1.2.1)
- ✅ Límite de recibos aumentado a 50MB
- ✅ Validación de contraseñas con checklist en vivo
- ✅ Avatar con iniciales del usuario
- ✅ Configuración de seguridad (Helmet, CORS)

## Cómo Usar

### Opción 1: Docker Compose
```bash
# En producción con docker-compose.prod.yml
docker-compose -f docker-compose.prod.yml up -d

# Las imágenes se descargarán automáticamente
```

### Opción 2: Docker Run Individual
```bash
# Backend
docker run -d \
  --name sistema-rrhh-backend \
  -p 3001:3001 \
  -e DB_HOST=<IP_BD> \
  -e DB_USER=root \
  -e DB_PASSWORD=<PASSWORD> \
  -e DB_NAME=RRHH \
  elcheloide/sistema-rrhh-backend:v120

# Frontend
docker run -d \
  --name sistema-rrhh-frontend \
  -p 80:80 \
  elcheloide/sistema-rrhh-frontend:v120
```

### Opción 3: Verificar Imágenes Localmente
```bash
docker images | grep "v120"
```

## Verificación

### Backend Health Check
```bash
curl http://localhost:3001/api/health
# Debería responder: {"status":"ok"}
```

### Frontend
```
http://localhost:80
# Debería mostrar login del sistema RRHH
```

## Notas Importantes

⚠️ **Encoding en Base de Datos**
- Reinicia el backend después de aplicar esta imagen
- Los nombres de empresas se mostrarán correctamente
- Algunos nombres anteriores pueden estar corruptos (ver ENCODING_FIX_REPORT.md)

🔐 **Seguridad**
- Las imágenes incluyen Helmet + CORS configurado
- Variables de entorno deben ser seteadas en el servidor
- Asegúrate de usar HTTPS en producción

📊 **Logs**
- Backend genera logs en `backend/logs/` (Winston logger)
- Frontend logs están disponibles en browser console

## Próximos Pasos

1. ✅ Verificar imágenes están en Docker Hub
2. ⏳ Descargar y testear en servidor de staging
3. ⏳ Aplicar migraciones de base de datos si es necesario
4. ⏳ Hacer deploy en producción

## Archivos de Referencia

- `build-and-push-v120.ps1` - Script de build/push usado
- `CHANGELOG.md` - Historial de cambios
- `backend/scripts/ENCODING_FIX_REPORT.md` - Detalles de corrección de encoding
- `MANUAL_USUARIO.md` - Manual de usuario con nuevas funcionalidades

---

**Build completado satisfactoriamente** ✅
