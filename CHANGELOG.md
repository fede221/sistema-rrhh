# Changelog - Sistema RRHH

Todos los cambios notables de este proyecto serán documentados en este archivo.

El formato está basado en [Keep a Changelog](https://keepachangelog.com/es/1.0.0/),
y este proyecto adhiere a [Versionado Semántico](https://semver.org/lang/es/).

## [Unreleased]

### Planeado
- Notificaciones push para móviles
- Integración con sistemas de fichaje
- Reportes avanzados en Excel
- Dashboard personalizable

---

## [1.0.0] - 2025-10-19

### 🎉 Lanzamiento Inicial

#### Agregado
- ✅ Sistema de autenticación con JWT
- ✅ Gestión de empresas múltiples
- ✅ Gestión completa de legajos de empleados
- ✅ Módulo de vacaciones (solicitud y aprobación)
- ✅ Módulo de permisos (solicitud y aprobación)
- ✅ Generación de recibos de sueldo en PDF
- ✅ Dashboard con estadísticas para administradores
- ✅ Dashboard específico para referentes de empresa
- ✅ Sistema de roles (Administrador, Referente, Empleado)
- ✅ Gestión de referentes por empresa
- ✅ Módulo de preguntas frecuentes
- ✅ Carga y descarga de documentos
- ✅ Historial de importaciones
- ✅ Asignación de períodos de vacaciones
- ✅ Diseño responsive (mobile-friendly)
- ✅ Modo PWA (Progressive Web App)
- ✅ Instalación como aplicación móvil

#### Seguridad
- ✅ Certificado SSL/TLS de Let's Encrypt
- ✅ HTTPS obligatorio con redirección automática
- ✅ Headers de seguridad (HSTS, X-Frame-Options, etc.)
- ✅ Tokens de autenticación seguros
- ✅ Encriptación de contraseñas
- ✅ Protección contra inyección SQL
- ✅ Validación de datos en frontend y backend

#### Infraestructura
- ✅ Arquitectura dockerizada completa
- ✅ Reverse proxy con Caddy
- ✅ Base de datos MySQL externa
- ✅ Almacenamiento persistente de uploads
- ✅ Logs estructurados
- ✅ Health checks para contenedores
- ✅ Despliegue en producción (Google Cloud)

#### Documentación
- ✅ Manual de usuario completo
- ✅ Guía de despliegue en producción
- ✅ Documentación de arquitectura
- ✅ Checklist de deploy
- ✅ Análisis de rutas
- ✅ Registro de cambios

---

## Tipos de Cambios

- **Agregado** (`Added`): Nuevas funcionalidades
- **Cambiado** (`Changed`): Cambios en funcionalidades existentes
- **Obsoleto** (`Deprecated`): Funcionalidades que serán removidas
- **Removido** (`Removed`): Funcionalidades eliminadas
- **Corregido** (`Fixed`): Corrección de bugs
- **Seguridad** (`Security`): Cambios de seguridad

---

## Formato de Versiones

El proyecto usa **Versionado Semántico** (SemVer): `MAJOR.MINOR.PATCH`

- **MAJOR**: Cambios incompatibles con versiones anteriores
- **MINOR**: Nuevas funcionalidades compatibles con versiones anteriores
- **PATCH**: Correcciones de bugs compatibles

**Ejemplo de próximas versiones:**

### [1.1.0] - Próxima versión menor
- Nuevas funcionalidades sin romper compatibilidad

### [1.0.1] - Próximo patch
- Corrección de bugs menores

### [2.0.0] - Próxima versión mayor
- Cambios que rompen compatibilidad con v1.x

---

## Cómo Contribuir al Changelog

Cuando hagas cambios al sistema:

1. **Agrega una entrada** en la sección `[Unreleased]`
2. **Categoriza** el cambio (Agregado, Cambiado, Corregido, etc.)
3. **Describe** el cambio claramente
4. **Incluye el issue/ticket** si aplica

**Ejemplo:**
```markdown
## [Unreleased]

### Agregado
- Nueva funcionalidad de reportes personalizados (#123)

### Corregido
- Error al descargar recibos en Safari (#124)
```

---

## Links de Versiones

- [Unreleased]: Cambios no publicados aún
- [1.0.0]: https://github.com/fede221/sistema-rrhh/releases/tag/v1.0.0

---

**Sistema RRHH** - DB Consulting  
**URL**: https://rrhh.dbconsulting.com.ar
