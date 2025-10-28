# 📝 Cambios Realizados: Campo "Convenio" en Usuarios

## ✅ Completado

### Frontend (`frontend/src/pages/Usuarios/Usuarios.js`)

#### 1. **Columna en DataGrid**
   - ✅ Agregada nueva columna "Convenio"
   - ✅ Indicador visual con círculo de color:
     - 🟢 Verde: "Dentro de Convenio"
     - 🔴 Rojo: "Fuera de Convenio"
   - ✅ Posición: Entre "Rol" y "Acciones"

#### 2. **Formulario de Creación de Usuario**
   - ✅ Agregado campo select "Convenio"
   - ✅ Posición: Entre `fecha_nacimiento` y `password`
   - ✅ Opciones:
     - ✅ Dentro de Convenio
     - ❌ Fuera de Convenio
   - ✅ Valor por defecto: "dentro"
   - ✅ Estado: `nuevoUsuario.convenio`

#### 3. **Formulario de Edición de Usuario**
   - ✅ Agregado campo select "Convenio"
   - ✅ Posición: Entre `rol` y selector de Referente
   - ✅ Opciones:
     - ✅ Dentro de Convenio
     - ❌ Fuera de Convenio
   - ✅ Valor por defecto: "dentro" (con fallback)
   - ✅ Estado: `usuarioEditado.convenio`

### Backend (`backend/controllers/usuariosController.js`)

#### 1. **Función `listarUsuarios`**
   - ✅ SELECT actualizado: Incluye `convenio`
   - Query: `SELECT ..., convenio FROM usuarios`

#### 2. **Función `crearUsuario`**
   - ✅ Destructuración: Agregado parámetro `convenio`
   - ✅ INSERT: Columna `convenio` agregada
   - ✅ Valores: Usa `convenio || 'dentro'` (fallback)
   - ✅ Query: `INSERT INTO usuarios (..., convenio) VALUES (..., ?)`

#### 3. **Función `editarUsuario`**
   - ✅ Destructuración: Agregado parámetro `convenio`
   - ✅ UPDATE: Campo `convenio` agregado
   - ✅ Valores: Usa `convenio || 'dentro'` (fallback)
   - ✅ Query: `UPDATE usuarios SET ..., convenio = ? WHERE id = ?`

### Database Scripts

#### 1. **Script SQL** (`backend/scripts/add-convenio-column.sql`)
   - ✅ ALTER TABLE: Agrega columna `convenio`
   - ✅ Tipo: VARCHAR(20) con valor por defecto 'dentro'
   - ✅ Índice: Crea `idx_usuarios_convenio` para optimizar búsquedas

#### 2. **Script Node.js** (`backend/scripts/add-convenio-migration.js`)
   - ✅ Ejecuta la migración automáticamente
   - ✅ Maneja errores si la columna ya existe
   - ✅ Crea índice de optimización
   - ✅ Verifica que la migración fue exitosa
   - ✅ Muestra detalles de la columna creada

### Documentación

#### 1. **Guía de Migración** (`MIGRACION_CONVENIO.md`)
   - ✅ Instrucciones paso a paso
   - ✅ Dos opciones: Script Node.js o SQL manual
   - ✅ Cambios en Backend y Frontend documentados
   - ✅ Ejemplos de pruebas con curl
   - ✅ Instrucciones de reversión
   - ✅ Verificación post-migración

## 🚀 Próximos Pasos

### 1. **Aplicar Migración a Base de Datos**
```bash
cd backend
node scripts/add-convenio-migration.js
```

### 2. **Reiniciar Backend**
```bash
npm start
# o
npm run dev
```

### 3. **Probar en Frontend**
   - Crear usuario: Verificar que aparece el campo "Convenio"
   - Editar usuario: Cambiar estado de convenio
   - Listar usuarios: Ver columna con indicador visual

## 📊 Resumen de Cambios

| Componente | Cambio | Estado |
|-----------|--------|--------|
| `listarUsuarios` | Include convenio en SELECT | ✅ |
| `crearUsuario` | Accept & store convenio | ✅ |
| `editarUsuario` | Accept & store convenio | ✅ |
| Usuarios.js DataGrid | Add convenio column | ✅ |
| Usuarios.js Form | Add convenio field (crear) | ✅ |
| Usuarios.js Form | Add convenio field (editar) | ✅ |
| Database | Migration script | ✅ |
| Documentación | Guide + examples | ✅ |

## 🔍 Detalles Técnicos

### Valores Permitidos
- `"dentro"` - Empleado dentro de convenio (valor por defecto)
- `"fuera"` - Empleado fuera de convenio

### Default Value
```sql
ALTER TABLE usuarios ADD COLUMN convenio VARCHAR(20) DEFAULT 'dentro';
```

### Índice de Optimización
```sql
CREATE INDEX idx_usuarios_convenio ON usuarios(convenio);
```

### Backward Compatibility
- ✅ Usuarios existentes tendrán `convenio = 'dentro'`
- ✅ Si no se envía `convenio` en request, se usa default
- ✅ No requiere cambios en otras APIs

## 🧪 Validación

Después de aplicar la migración:

### Test 1: Crear usuario
```bash
# Debe incluir convenio en la respuesta
POST /api/usuarios
{
  "legajo": "TEST001",
  "convenio": "fuera",
  ...
}
```

### Test 2: Editar usuario
```bash
# Debe permitir actualizar convenio
PUT /api/usuarios/123
{
  "convenio": "dentro",
  ...
}
```

### Test 3: Listar usuarios
```bash
# Debe retornar convenio en cada usuario
GET /api/usuarios
# Response incluirá: "convenio": "dentro" | "fuera"
```

## ⚠️ Notas Importantes

- La migración es **idempotente** (segura ejecutar múltiples veces)
- La columna tiene **valor por defecto** para usuarios existentes
- El cambio es **compatible** con versión 1.2.1
- No requiere reiniciar la aplicación (solo el backend)
- El frontend ya tiene los cambios listos

## 📝 Versionado

- **Versión**: 1.2.1
- **Cambio**: Agregado campo `convenio` a usuarios
- **Tipo**: Feature (Adición de funcionalidad)
- **Impacto**: Base de datos + Backend + Frontend
