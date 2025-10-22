# 📚 Guía de Control de Versiones - Sistema RRHH

## 🎯 Sistema de Versionado

Este proyecto usa **Versionado Semántico (SemVer)**: `MAJOR.MINOR.PATCH`

```
Ejemplo: 1.2.3
         │ │ │
         │ │ └─ PATCH: Correcciones de bugs
         │ └─── MINOR: Nuevas funcionalidades (compatible)
         └───── MAJOR: Cambios incompatibles
```

---

## 📂 Archivos de Versión

### 1. `VERSION` 
Archivo simple con solo el número de versión:
```
1.0.0
```

### 2. `version.json`
Información detallada en formato JSON:
```json
{
  "version": "1.0.0",
  "buildDate": "2025-10-19",
  "buildNumber": "1",
  "releaseNotes": "Descripción del release",
  "environment": "production"
}
```

### 3. `CHANGELOG.md`
Registro detallado de todos los cambios por versión.

### 4. `package.json`
Frontend y backend tienen su versión sincronizada.

---

## 🚀 Cómo Actualizar la Versión

### Método Automático (Recomendado)

#### Opción 1: Especificar versión exacta
```powershell
.\update-version.ps1 -NewVersion "1.2.3"
```

#### Opción 2: Auto-incrementar (Bump)
```powershell
# Incrementar PATCH (1.0.0 → 1.0.1)
.\update-version.ps1 -BumpType patch

# Incrementar MINOR (1.0.1 → 1.1.0)
.\update-version.ps1 -BumpType minor

# Incrementar MAJOR (1.1.0 → 2.0.0)
.\update-version.ps1 -BumpType major
```

El script actualiza automáticamente:
- ✅ `VERSION`
- ✅ `version.json`
- ✅ `frontend/package.json`
- ✅ `backend/package.json`
- ✅ `frontend/.env.production`
- ✅ `frontend/.env.development`

---

### Método Manual

Si prefieres hacerlo manualmente:

1. **Editar `VERSION`**
   ```
   1.1.0
   ```

2. **Editar `version.json`**
   ```json
   {
     "version": "1.1.0",
     "buildDate": "2025-10-20",
     "buildNumber": "2",
     "releaseNotes": "Nueva funcionalidad X",
     "environment": "production"
   }
   ```

3. **Editar `frontend/package.json`**
   ```json
   {
     "version": "1.1.0"
   }
   ```

4. **Editar `backend/package.json`**
   ```json
   {
     "version": "1.1.0"
   }
   ```

5. **Editar `frontend/.env.production`**
   ```
   REACT_APP_VERSION=1.1.0
   REACT_APP_BUILD_DATE=2025-10-20
   ```

---

## 📝 Actualizar CHANGELOG

Después de actualizar la versión, documenta los cambios:

1. Abrir `CHANGELOG.md`

2. Mover cambios de `[Unreleased]` a la nueva versión:

```markdown
## [1.1.0] - 2025-10-20

### Agregado
- Nueva funcionalidad de reportes avanzados
- Exportación a Excel mejorada

### Corregido
- Bug en descarga de recibos en Safari
- Error al aprobar vacaciones

### Cambiado
- Mejorado diseño del dashboard
- Optimizado rendimiento de búsqueda
```

---

## 🏷️ Git Tags y Releases

### Crear Tag de Versión

```powershell
# Commit los cambios de versión
git add .
git commit -m "chore: bump version to 1.1.0"

# Crear tag anotado
git tag -a v1.1.0 -m "Release v1.1.0 - Reportes Avanzados"

# Push con tags
git push origin main
git push origin v1.1.0
```

### Listar Tags
```powershell
git tag -l
```

### Ver Información de un Tag
```powershell
git show v1.1.0
```

---

## 🔄 Workflow Completo de Release

### Paso a Paso:

#### 1. **Hacer cambios en el código**
```powershell
# Desarrollar nueva funcionalidad
git checkout -b feature/nueva-funcionalidad
# ... hacer cambios ...
git commit -m "feat: agregar nueva funcionalidad"
git push origin feature/nueva-funcionalidad
```

#### 2. **Merge a main**
```powershell
git checkout main
git merge feature/nueva-funcionalidad
```

#### 3. **Actualizar versión**
```powershell
# Si es una nueva funcionalidad (MINOR)
.\update-version.ps1 -BumpType minor

# Si es un bugfix (PATCH)
.\update-version.ps1 -BumpType patch

# Si rompe compatibilidad (MAJOR)
.\update-version.ps1 -BumpType major
```

#### 4. **Actualizar CHANGELOG.md**
Documenta todos los cambios de la versión.

#### 5. **Commit de versión**
```powershell
git add .
git commit -m "chore: bump version to 1.1.0"
```

#### 6. **Crear tag**
```powershell
git tag -a v1.1.0 -m "Release v1.1.0"
```

#### 7. **Push**
```powershell
git push origin main
git push origin v1.1.0
```

#### 8. **Build y Deploy**
```powershell
# Build y push de imágenes Docker
.\build-and-push.ps1

# En el servidor
cd /home/RRHH
docker compose pull
docker compose up -d
```

---

## 📊 Visualización de la Versión

### En el Login

La versión se muestra en la **esquina inferior derecha** del login:

```
┌─────────────────────────────────┐
│                                 │
│         Sistema RRHH            │
│                                 │
│   [DNI Input]                   │
│   [Password Input]              │
│   [Ingresar Button]             │
│                                 │
│                       ⓘ v1.0.0 │
└─────────────────────────────────┘
```

**Características**:
- 🔵 Azul: Desarrollo
- 🟢 Verde: Producción
- 🟠 Naranja: Staging
- Tooltip con información completa al hacer hover

---

## 🎨 Personalizar Componente de Versión

El componente está en: `frontend/src/components/Version.js`

### Cambiar posición:
```javascript
// Cambiar de bottom-right a top-left
sx={{
  position: 'fixed',
  top: 16,        // Cambiar bottom por top
  left: 16,       // Cambiar right por left
}}
```

### Ocultar en producción:
```javascript
if (environment === 'production') return null;
```

### Cambiar colores:
```javascript
const getEnvColor = () => {
  switch (environment) {
    case 'production': return '#4caf50'; // Verde
    case 'staging': return '#ff9800';    // Naranja
    case 'development': return '#2196f3'; // Azul
  }
};
```

---

## 📋 Tipos de Versiones

### MAJOR (X.0.0)
**Cuándo usarlo:**
- Cambios que rompen compatibilidad
- Nueva arquitectura
- Cambios masivos en la API
- Migración de tecnologías

**Ejemplos:**
- `1.0.0` → `2.0.0`: Migración a React 19
- `2.0.0` → `3.0.0`: Nueva API REST incompatible

### MINOR (0.X.0)
**Cuándo usarlo:**
- Nuevas funcionalidades
- Mejoras significativas
- Compatible con versión anterior

**Ejemplos:**
- `1.0.0` → `1.1.0`: Agregar módulo de reportes
- `1.1.0` → `1.2.0`: Nuevo dashboard para referentes

### PATCH (0.0.X)
**Cuándo usarlo:**
- Corrección de bugs
- Pequeñas mejoras
- Optimizaciones
- Actualizaciones de seguridad

**Ejemplos:**
- `1.0.0` → `1.0.1`: Fix error en descarga de recibos
- `1.0.1` → `1.0.2`: Corregir validación de fechas

---

## 🛠️ Comandos Útiles

### Ver versión actual:
```powershell
Get-Content VERSION
```

### Ver información completa:
```powershell
Get-Content version.json | ConvertFrom-Json | Format-List
```

### Comparar versiones entre archivos:
```powershell
Write-Host "VERSION:" (Get-Content VERSION)
Write-Host "Frontend:" ((Get-Content frontend/package.json | ConvertFrom-Json).version)
Write-Host "Backend:" ((Get-Content backend/package.json | ConvertFrom-Json).version)
```

### Ver último tag:
```powershell
git describe --tags --abbrev=0
```

### Listar cambios desde último tag:
```powershell
git log $(git describe --tags --abbrev=0)..HEAD --oneline
```

---

## 📚 Buenas Prácticas

### ✅ DO (Hacer)

- ✅ Actualizar CHANGELOG.md en cada release
- ✅ Usar tags de git para cada versión
- ✅ Mantener VERSION sincronizado con package.json
- ✅ Documentar breaking changes en CHANGELOG
- ✅ Usar commits semánticos (feat:, fix:, chore:)
- ✅ Hacer release notes descriptivas
- ✅ Probar antes de incrementar MAJOR

### ❌ DON'T (No hacer)

- ❌ No saltarse versiones (ej: 1.0.0 → 1.2.0 sin 1.1.0)
- ❌ No cambiar versión sin documentar en CHANGELOG
- ❌ No hacer deploy sin crear tag
- ❌ No usar versiones inconsistentes entre archivos
- ❌ No modificar tags existentes
- ❌ No olvidar actualizar .env con la versión

---

## 🔗 Referencias

- [Semantic Versioning](https://semver.org/)
- [Keep a Changelog](https://keepachangelog.com/)
- [Conventional Commits](https://www.conventionalcommits.org/)
- [Git Tagging](https://git-scm.com/book/en/v2/Git-Basics-Tagging)

---

## 📞 Soporte

Si tienes dudas sobre versionado:
- 📧 Email: dev@dbconsulting.com.ar
- 📚 Ver `CHANGELOG.md` para ejemplos

---

**© 2025 DB Consulting - Sistema RRHH**
