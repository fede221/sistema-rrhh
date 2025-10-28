# 🔧 Migración: Campo "Convenio" en Usuarios

## 📋 Descripción

Esta migración agrega el campo `convenio` a la tabla `usuarios`, permitiendo clasificar empleados como:
- **dentro**: Dentro de convenio (default)
- **fuera**: Fuera de convenio

## 🚀 Pasos de Migración

### Opción 1: Ejecutar script Node.js (Recomendado)

```bash
cd backend
node scripts/add-convenio-migration.js
```

**Qué hace:**
1. ✅ Agrega la columna `convenio` a la tabla `usuarios`
2. ✅ Crea un índice para optimizar búsquedas
3. ✅ Verifica que la migración fue exitosa
4. ✅ Muestra los detalles de la columna creada

### Opción 2: Ejecutar SQL manualmente

```sql
-- Agregar columna
ALTER TABLE usuarios
ADD COLUMN convenio VARCHAR(20) DEFAULT 'dentro' 
COMMENT 'Clasificación: dentro/fuera de convenio';

-- Crear índice
CREATE INDEX idx_usuarios_convenio ON usuarios(convenio);

-- Verificar
SELECT COLUMN_NAME, COLUMN_TYPE, COLUMN_DEFAULT
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'usuarios' AND COLUMN_NAME = 'convenio';
```

## 🔄 Cambios en Backend

Se han actualizado los siguientes archivos:

### `backend/controllers/usuariosController.js`

**Función `listarUsuarios`**
- Ahora incluye `convenio` en el SELECT
- Query: `SELECT ..., convenio FROM usuarios`

**Función `crearUsuario`**
- Acepta parámetro `convenio` del request body
- Si no se envía, usa valor default `'dentro'`
- INSERT incluye: `convenio VARCHAR(20)`

**Función `editarUsuario`**
- Acepta parámetro `convenio` del request body
- UPDATE incluye: `convenio = ?`

## 📱 Cambios en Frontend

Se han actualizado los siguientes archivos:

### `frontend/src/pages/Usuarios/Usuarios.js`

**Columna en DataGrid**
- Nueva columna "Convenio" con indicador visual
- 🟢 Verde para "Dentro"
- 🔴 Rojo para "Fuera"

**Formulario de Creación**
- Campo select: "Convenio"
- Posición: Entre fecha_nacimiento y password
- Opciones:
  - ✅ Dentro de Convenio
  - ❌ Fuera de Convenio

**Formulario de Edición**
- Campo select: "Convenio"
- Posición: Entre Rol y Referente
- Permite cambiar el estado de convenio

## 🧪 Pruebas

### Test 1: Crear usuario con convenio

```bash
curl -X POST http://localhost:3001/api/usuarios \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "legajo": "TEST001",
    "dni": "12345678",
    "nombre": "Juan",
    "apellido": "Pérez",
    "correo": "juan@example.com",
    "password": "Password123!",
    "rol": "empleado",
    "convenio": "fuera"
  }'
```

**Respuesta esperada:**
```json
{
  "id": 123,
  "mensaje": "Usuario y legajo creados exitosamente",
  "legajo": "TEST001",
  "dni": "12345678",
  "nombre": "Juan Pérez"
}
```

### Test 2: Editar usuario y cambiar convenio

```bash
curl -X PUT http://localhost:3001/api/usuarios/123 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "legajo": "TEST001",
    "dni": "12345678",
    "nombre": "Juan",
    "apellido": "Pérez",
    "correo": "juan@example.com",
    "rol": "empleado",
    "convenio": "dentro"
  }'
```

**Respuesta esperada:**
```json
{
  "message": "✅ Usuario y legajo actualizados correctamente"
}
```

### Test 3: Listar usuarios con convenio

```bash
curl http://localhost:3001/api/usuarios \
  -H "Authorization: Bearer <token>"
```

**Respuesta esperada:**
```json
[
  {
    "id": 123,
    "legajo": "TEST001",
    "dni": "12345678",
    "nombre": "Juan",
    "apellido": "Pérez",
    "correo": "juan@example.com",
    "rol": "empleado",
    "activo": 1,
    "referente_id": null,
    "convenio": "fuera"
  },
  ...
]
```

## 🔄 Reversión (si es necesario)

Si necesitas revertir esta migración:

```sql
-- Eliminar índice
DROP INDEX idx_usuarios_convenio ON usuarios;

-- Eliminar columna
ALTER TABLE usuarios DROP COLUMN convenio;
```

## ✅ Verificación

Después de ejecutar la migración, verifica:

1. **Base de datos**: La columna existe con el valor por defecto correcto
   ```sql
   DESCRIBE usuarios;
   -- Debe mostrar: convenio VARCHAR(20) DEFAULT 'dentro'
   ```

2. **Frontend**: 
   - Crear usuario → aparece campo "Convenio"
   - Editar usuario → aparece campo "Convenio"
   - Listar usuarios → aparece columna "Convenio" con indicador visual

3. **Backend**: 
   - GET `/api/usuarios` devuelve convenio
   - POST `/api/usuarios` acepta convenio
   - PUT `/api/usuarios/:id` acepta convenio

## 📝 Notas

- La migración es **idempotente** (segura para ejecutar múltiples veces)
- Los usuarios existentes tendrán valor default `'dentro'`
- El campo se puede buscar usando el índice creado
- Compatible con versión 1.2.1 del sistema

## 📞 Soporte

Si encontras problemas:
1. Verifica que la base de datos esté ejecutándose
2. Confirma que tienes permisos para ALTER TABLE
3. Revisa los logs: `backend/logs/error.log`
