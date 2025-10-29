# ✅ Checklist Pre-Deploy - Sistema RRHH

## 🎯 Objetivo
Deploy del sistema a producción en `https://rrhh.dbconsulting.com.ar` con rutas estandarizadas.

---

## 📋 FASE 1: Verificación de Código

### Backend
- [x] CORS configurado para desarrollo y producción
- [x] Logs de CORS activados para depuración
- [x] Variables de entorno configuradas en `docker-compose.production.yml`
- [ ] JWT_SECRET cambiado (no usar el del ejemplo en producción)
- [ ] Credenciales de base de datos verificadas

### Frontend
- [x] Rutas estandarizadas:
  - [x] `/empresas` (antes `/recibos/empresas`)
  - [x] `/legajos` (unificado, antes `/legajo` y `/legajos-admin`)
  - [x] `/errores` (antes `/errores-log`)
- [x] Navbar actualizado con rutas nuevas
- [x] Componentes actualizados (Dashboard, etc.)
- [x] Import no usado eliminado (`RequireAuth`)
- [ ] Config.js detecta correctamente el entorno

---

## 🧪 FASE 2: Testing en Desarrollo

### Arrancar Servicios
```powershell
# Terminal 1: Backend
cd backend
npm run dev

# Terminal 2: Frontend
cd frontend
npm start
```

### Tests Funcionales
- [ ] ✅ Login funciona sin errores de CORS
- [ ] ✅ Dashboard carga correctamente
- [ ] ✅ Navegación funciona:
  - [ ] `/dashboard` → Dashboard admin/superadmin
  - [ ] `/bienvenida` → Dashboard empleado
  - [ ] `/usuarios` → Gestión de usuarios
  - [ ] `/vacaciones` → Gestión de vacaciones
  - [ ] `/recibos` → Gestión de recibos
  - [ ] `/empresas` → Gestión de empresas (NUEVO)
  - [ ] `/legajos` → Legajos (empleado muestra su legajo, admin muestra gestión)
  - [ ] `/permisos` → Gestión de permisos (superadmin)
  - [ ] `/errores` → Log de errores (RENOMBRADO)
  - [ ] `/mi-equipo` → Gestión de equipo (referente)
  - [ ] `/monitoring` → Monitoreo (superadmin)

### Verificación de CORS
- [ ] ✅ No hay errores en consola del navegador
- [ ] ✅ Backend logs muestran "CORS: Origin permitido"
- [ ] ✅ Peticiones API funcionan correctamente

### Verificación de Roles
- [ ] ✅ Empleado: Ve `/bienvenida`, `/legajos` (su legajo), `/recibos`, `/vacaciones`
- [ ] ✅ Admin: Ve `/dashboard`, todas las secciones administrativas
- [ ] ✅ Superadmin: Ve todas las secciones incluyendo `/permisos`, `/errores`, `/monitoring`
- [ ] ✅ Referente: Ve `/mi-equipo` además de sus secciones

---

## 🐳 FASE 3: Build de Imágenes Docker

### Construir Backend
```powershell
cd C:\Users\Usuario\Desktop\sistema-rrhh-20251008T120753Z-1-001\sistema-rrhh
docker build -t elcheloide/sistema-rrhh-backend:latest ./backend
```
- [ ] ✅ Build exitoso sin errores
- [ ] ✅ Imagen creada: `docker images | Select-String "sistema-rrhh-backend"`

### Construir Frontend
```powershell
docker build -t elcheloide/sistema-rrhh-frontend:latest ./frontend
```
- [ ] ✅ Build exitoso sin errores
- [ ] ✅ Imagen creada: `docker images | Select-String "sistema-rrhh-frontend"`

---

## ☁️ FASE 4: Push a Docker Hub

### Login a Docker Hub
```powershell
docker login
```
- [ ] ✅ Login exitoso

### Push Backend
```powershell
docker push elcheloide/sistema-rrhh-backend:latest
```
- [ ] ✅ Push exitoso
- [ ] ✅ Verificar en Docker Hub: https://hub.docker.com/r/elcheloide/sistema-rrhh-backend

### Push Frontend
```powershell
docker push elcheloide/sistema-rrhh-frontend:latest
```
- [ ] ✅ Push exitoso
- [ ] ✅ Verificar en Docker Hub: https://hub.docker.com/r/elcheloide/sistema-rrhh-frontend

---

## 🚀 FASE 5: Deploy en Servidor

### Verificaciones Pre-Deploy
- [ ] Dominio `rrhh.dbconsulting.com.ar` apunta al servidor
- [ ] Puertos 80 y 443 abiertos en firewall
- [ ] Base de datos MySQL accesible desde el servidor
- [ ] Docker y Docker Compose instalados en el servidor
- [ ] Acceso SSH al servidor

### Conectar al Servidor
```bash
ssh usuario@servidor
```
- [ ] ✅ Conexión exitosa

### Preparar Directorio
```bash
mkdir -p ~/sistema-rrhh
cd ~/sistema-rrhh
```
- [ ] ✅ Directorio creado

### Subir docker-compose.production.yml
```bash
# Desde tu máquina local (PowerShell)
scp docker-compose.production.yml usuario@servidor:~/sistema-rrhh/
```
- [ ] ✅ Archivo subido

### Pull de Imágenes
```bash
docker-compose -f docker-compose.production.yml pull
```
- [ ] ✅ Backend descargado
- [ ] ✅ Frontend descargado

### Arrancar Servicios
```bash
docker-compose -f docker-compose.production.yml up -d
```
- [ ] ✅ Backend arrancado
- [ ] ✅ Frontend arrancado

---

## 🔍 FASE 6: Verificación Post-Deploy

### Verificar Estado de Contenedores
```bash
docker-compose -f docker-compose.production.yml ps
```
- [ ] ✅ Backend: `Up (healthy)`
- [ ] ✅ Frontend: `Up (healthy)`

### Verificar Logs
```bash
# Backend
docker-compose -f docker-compose.production.yml logs backend | tail -50

# Frontend
docker-compose -f docker-compose.production.yml logs frontend | tail -50
```
- [ ] ✅ Backend: Sin errores críticos
- [ ] ✅ Frontend: Caddy arrancado correctamente

### Test de Endpoints Internos
```bash
# Health check backend
curl http://localhost:3001/api/health

# Frontend
curl http://localhost:80
```
- [ ] ✅ Backend responde OK
- [ ] ✅ Frontend responde OK

### Test Desde Navegador
- [ ] ✅ Acceder a `http://rrhh.dbconsulting.com.ar`
- [ ] ✅ Frontend carga correctamente
- [ ] ✅ No hay errores en consola del navegador
- [ ] ✅ Login funciona
- [ ] ✅ No hay errores de CORS
- [ ] ✅ Navegación funciona correctamente

### Test de Rutas Nuevas
- [ ] ✅ `/empresas` funciona (antes `/recibos/empresas`)
- [ ] ✅ `/legajos` funciona según rol
- [ ] ✅ `/errores` funciona (antes `/errores-log`)

### Test de Roles
- [ ] ✅ Login como empleado → Redirige a `/bienvenida`
- [ ] ✅ Login como admin → Redirige a `/dashboard`
- [ ] ✅ Login como superadmin → Acceso a todas las secciones

---

## 🔐 FASE 7: Seguridad

### Variables de Entorno
- [ ] ⚠️ `JWT_SECRET` cambiado (no usar el del ejemplo)
- [ ] ✅ Credenciales de base de datos correctas
- [ ] ✅ CORS solo permite dominio de producción

### SSL/HTTPS
- [ ] ✅ Caddy genera certificado SSL automáticamente
- [ ] ✅ `https://rrhh.dbconsulting.com.ar` funciona
- [ ] ✅ HTTP redirige a HTTPS

### Firewall
- [ ] ✅ Solo puertos 80 y 443 accesibles desde internet
- [ ] ✅ Puerto 3001 solo accesible internamente (Docker network)
- [ ] ✅ Puerto 3306 (MySQL) solo accesible desde backend

---

## 💾 FASE 8: Backup

### Backup de Base de Datos
```bash
mysqldump -h 34.176.164.98 -u root -p RRHH > rrhh-backup-$(date +%Y%m%d).sql
```
- [ ] ✅ Backup creado

### Backup de Uploads
```bash
docker run --rm -v sistema-rrhh_uploads_data:/data -v $(pwd):/backup alpine tar czf /backup/uploads-backup-$(date +%Y%m%d).tar.gz -C /data .
```
- [ ] ✅ Backup creado

---

## 📊 FASE 9: Monitoreo

### Health Checks
```bash
# Verificar cada 5 minutos durante 1 hora
watch -n 300 'docker-compose -f docker-compose.production.yml ps'
```
- [ ] ✅ Contenedores mantienen estado `healthy`

### Logs en Tiempo Real
```bash
docker-compose -f docker-compose.production.yml logs -f
```
- [ ] ✅ Sin errores en logs

### Uso de Recursos
```bash
docker stats
```
- [ ] ✅ CPU < 80%
- [ ] ✅ RAM < 80%

---

## 🎉 DEPLOY COMPLETADO

Si todos los checkboxes están marcados, el deploy fue exitoso.

### URLs de Acceso
- 🌐 Frontend: `https://rrhh.dbconsulting.com.ar`
- 🔧 Backend API: `https://rrhh.dbconsulting.com.ar/api`
- 📁 Uploads: `https://rrhh.dbconsulting.com.ar/uploads`

### Credenciales de Acceso
- Usar las credenciales existentes de la base de datos
- Si es necesario crear admin: `docker-compose -f docker-compose.production.yml exec backend node create-admin.js`

---

## 🆘 Troubleshooting

### Si algo falla, consultar:
1. **Logs del backend**: `docker-compose -f docker-compose.production.yml logs backend`
2. **Logs del frontend**: `docker-compose -f docker-compose.production.yml logs frontend`
3. **Guía completa**: `GUIA_DEPLOY_PRODUCCION.md` sección Troubleshooting
4. **CORS issues**: Verificar en logs del backend con `grep CORS`

### Rollback (si es necesario)
```bash
docker-compose -f docker-compose.production.yml down
# Volver a versión anterior
docker pull elcheloide/sistema-rrhh-backend:previous
docker pull elcheloide/sistema-rrhh-frontend:previous
docker-compose -f docker-compose.production.yml up -d
```

---

**Última actualización**: 18 de Octubre de 2025
**Estado**: ✅ Listo para deploy
