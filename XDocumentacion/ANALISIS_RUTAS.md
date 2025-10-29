# Análisis y Estandarización de Rutas - Sistema RRHH

## 📋 Estado Actual

### Backend - Rutas API (Puerto 3001)

Todas las rutas del backend están bajo el prefijo `/api`:

```
/api/auth              - Autenticación (login, logout, reset-password)
/api/usuarios          - Gestión de usuarios
/api/preguntas         - Preguntas de seguridad
/api/legajos           - Gestión de legajos
/api/errores           - Log de errores del sistema
/api/recibos           - Gestión de recibos de sueldo
/api/empresas          - Gestión de empresas
/api/dashboard         - Datos del dashboard
/api/vacaciones        - Gestión de vacaciones
/api/permisos          - Gestión de permisos
/api/referente         - Funcionalidades para referentes
/api/health            - Health check del sistema
/uploads/*             - Archivos subidos (fuera de /api)
```

**✅ BIEN**: El backend tiene rutas consistentes bajo `/api` excepto `/uploads` que está separado correctamente.

### Frontend - Rutas React Router

```
/                      - Redirige según rol (empleado → /bienvenida, otros → /dashboard)
/login                 - Página de login
/dashboard             - Dashboard principal (admin/superadmin/referente)
/bienvenida            - Dashboard de empleado
/usuarios              - Gestión de usuarios
/vacaciones            - Gestión de vacaciones
/recibos               - Gestión de recibos
/recibos/empresas      - Gestión de empresas (solo admin)
/legajo                - Legajo (empleado: LegajoEmpleado, otros: Legajo)
/legajos-admin         - Gestión de legajos (admin_rrhh/superadmin)
/reset-password        - Reseteo de contraseña
/preguntas-iniciales   - Configuración de preguntas de seguridad
/errores-log           - Log de errores (superadmin)
/permisos              - Gestión de permisos (superadmin)
/permisos/nuevos       - Nuevos permisos (superadmin)
/monitoring            - Dashboard de monitoreo (superadmin)
/mi-equipo             - Gestión de equipo (referente/superadmin)
/*                     - Redirige según rol (igual que /)
```

**⚠️ INCONSISTENCIAS ENCONTRADAS**:
1. `/recibos/empresas` debería estar en `/empresas` (es gestión de empresas, no de recibos)
2. `/legajo` y `/legajos-admin` deberían unificarse bajo `/legajos` con subrutas
3. `/permisos` y `/permisos/nuevos` están bien, pero podría mejorarse la nomenclatura
4. Faltan subrutas para mejor organización por módulos

### Configuración de URLs

**Desarrollo**:
- Frontend: `http://localhost:3000` → Backend: `http://localhost:3001`
- La configuración en `src/config.js` detecta automáticamente el entorno
- `API_BASE_URL = 'http://localhost:3001'` en desarrollo

**Producción actual**:
- Frontend: Puerto 80 (Caddy)
- Backend: Puerto 3001 (directo)
- `API_BASE_URL = '/api'` (ruta relativa, Caddy hace proxy)
- CORS: `https://rrhh.dbconsulting.com.ar,http://192.168.203.24:3000`

## 🎯 Estandarización Propuesta

### 1. Backend - Sin cambios (ya está bien)

Mantener todas las rutas API bajo `/api` y `/uploads` separado.

### 2. Frontend - Rutas Reorganizadas

```
Públicas:
/                      - Redirige según autenticación y rol
/login                 - Página de login
/reset-password        - Reseteo de contraseña
/preguntas-iniciales   - Configuración de preguntas de seguridad

Empleados:
/bienvenida            - Dashboard de empleado
/legajo                - Mi legajo (vista empleado)
/recibos               - Mis recibos
/vacaciones            - Mis vacaciones

Admin/Referente/Superadmin:
/dashboard             - Dashboard principal

Módulos administrativos:
/usuarios              - Gestión de usuarios
/empresas              - Gestión de empresas (mover desde /recibos/empresas)
/legajos               - Gestión de legajos (unificar legajo/legajos-admin)
/legajos/:id           - Detalle de legajo específico
/recibos/admin         - Gestión de recibos (admin)
/vacaciones/admin      - Gestión de vacaciones (admin)

Superadmin:
/permisos              - Gestión de permisos
/permisos/nuevos       - Nuevos permisos pendientes
/errores               - Log de errores (renombrar desde /errores-log)
/monitoring            - Dashboard de monitoreo

Referente:
/mi-equipo             - Gestión de equipo
```

### 3. Configuración de Producción

**Domain**: `https://rrhh.dbconsulting.com.ar`

**Backend CORS permitidos**:
```javascript
allowedOrigins = [
  'https://rrhh.dbconsulting.com.ar',
  'http://rrhh.dbconsulting.com.ar',
  'http://localhost:3000',  // Desarrollo
  'http://127.0.0.1:3000'   // Desarrollo
];
```

**Frontend `config.js` para producción**:
```javascript
const getApiBaseUrl = () => {
  if (process.env.NODE_ENV === 'production') {
    return '/api';  // Ruta relativa, Caddy hace proxy
  }
  return 'http://localhost:3001';  // Desarrollo
};
```

**Caddy** (ya configurado correctamente):
- Puerto 80: HTTP (puede redirigir a HTTPS)
- Puerto 443: HTTPS con SSL
- Proxy `/api/*` → `backend:3001`
- Proxy `/uploads/*` → `backend:3001`
- Servir archivos estáticos del frontend

## 📝 Cambios a Realizar

### Fase 1: Reorganizar rutas frontend (sin romper funcionalidad)

1. ✅ Mover `/recibos/empresas` → `/empresas`
2. ✅ Unificar `/legajo` y `/legajos-admin` → `/legajos` con lógica por rol
3. ✅ Renombrar `/errores-log` → `/errores`
4. ✅ Verificar que todas las rutas requieran autenticación excepto públicas

### Fase 2: Configurar producción

1. ✅ Actualizar `backend/index.js` - CORS para producción
2. ✅ Verificar `frontend/src/config.js` - detección de entorno
3. ✅ Verificar `docker-compose.production.yml` - variables de entorno
4. ✅ Verificar `Caddyfile` - proxy y SSL

### Fase 3: Testing

1. ✅ Probar en desarrollo (localhost)
2. ✅ Probar en producción (rrhh.dbconsulting.com.ar)
3. ✅ Verificar CORS en ambos entornos
4. ✅ Verificar autenticación y autorización por rol

## 🚀 Deploy a Producción

```bash
# 1. Construir imágenes
docker-compose -f docker-compose.production.yml build

# 2. Subir al servidor
docker push elcheloide/sistema-rrhh-backend:latest
docker push elcheloide/sistema-rrhh-frontend:latest

# 3. En servidor, bajar y arrancar
docker-compose -f docker-compose.production.yml pull
docker-compose -f docker-compose.production.yml up -d

# 4. Verificar
docker-compose -f docker-compose.production.yml ps
docker-compose -f docker-compose.production.yml logs -f
```

## ✅ Checklist Pre-Deploy

- [ ] Backend CORS configurado con dominio de producción
- [ ] Frontend config.js detecta correctamente entorno
- [ ] Todas las rutas frontend protegidas según rol
- [ ] Variables de entorno de producción configuradas
- [ ] SSL configurado en Caddy
- [ ] Health checks configurados
- [ ] Backup de base de datos creado
- [ ] Testing en desarrollo completado
