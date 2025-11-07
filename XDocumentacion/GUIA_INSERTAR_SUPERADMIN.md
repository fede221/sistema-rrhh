# 🔐 Guía: Insertar Superadmin

## Descripción

Script para crear un usuario **SUPERADMIN** en el sistema. El superadmin tiene acceso total a todas las funciones de administración.

## Requisitos

- Node.js instalado
- Base de datos MySQL configurada
- Conexión a base de datos funcional

## Opción 1: Script Node.js (Recomendado)

### Uso básico con valores por defecto

```bash
cd backend
node scripts/insert-superadmin.js
```

**Resultado esperado:**
```
🚀 Iniciando inserción de SUPERADMIN...

🔐 Hasheando contraseña...

✅ SUPERADMIN CREADO EXITOSAMENTE

📋 Detalles del Usuario:
──────────────────────────────────────────────────
  ID:           1
  Legajo:       SUPER001
  DNI:          99999999
  Nombre:       Super Admin
  Correo:       superadmin@sistema.local
  Rol:          superadmin
  Convenio:     dentro
  Activo:       Sí
──────────────────────────────────────────────────

🔑 Credenciales de Acceso:
──────────────────────────────────────────────────
  DNI:          99999999
  Contraseña:   SuperAdmin123!
──────────────────────────────────────────────────

⚠️  IMPORTANTE: Guarda estas credenciales en un lugar seguro
💡 Se recomienda cambiar la contraseña en el primer acceso
```

### Uso con parámetros personalizados

```bash
# Crear con DNI personalizado
node scripts/insert-superadmin.js --dni=12345678 --legajo=SA001

# Crear con contraseña personalizada
node scripts/insert-superadmin.js --password="MiContraseñaSegura123"

# Crear con todos los datos personalizados
node scripts/insert-superadmin.js \
  --legajo=ADM001 \
  --dni=12345678 \
  --nombre=Juan \
  --apellido=García \
  --correo=juan.garcia@empresa.com \
  --password="ContraseñaSegura2025" \
  --convenio=fuera
```

### Parámetros disponibles

| Parámetro | Valor por defecto | Descripción |
|-----------|------------------|-------------|
| `--legajo` | SUPER001 | Código de legajo único |
| `--dni` | 99999999 | **DNI del usuario (REQUERIDO para login)** |
| `--nombre` | Super | Nombre del usuario |
| `--apellido` | Admin | Apellido del usuario |
| `--correo` | superadmin@sistema.local | Email (opcional) |
| `--password` | SuperAdmin123! | Contraseña (se hashea con bcrypt) |
| `--convenio` | dentro | dentro o fuera |

### Ver ayuda

```bash
node scripts/insert-superadmin.js --help
```

## Opción 2: Script SQL

### Preparar el script

1. Abre `backend/scripts/insert-superadmin.sql`
2. Personaliza los valores si es necesario:
   - Legajo: `SUPER001`
   - DNI: `99999999`
   - Email: `superadmin@sistema.local`
   - Contraseña hash: se proporciona precomputada
3. Descomenta las líneas de INSERT

### Ejecutar

```bash
# Con usuario y contraseña interactivos
mysql -u usuario -p nombre_base_datos < backend/scripts/insert-superadmin.sql

# Con usuario y contraseña en línea de comando
mysql -u usuario -pcontraseña nombre_base_datos < backend/scripts/insert-superadmin.sql
```

## Verificación

### Verificar que se creó correctamente

```bash
# En MySQL CLI
SELECT id, legajo, dni, nombre, apellido, correo, rol, activo FROM usuarios 
WHERE rol = 'superadmin' 
ORDER BY id DESC;
```

### Probar login

1. Abre el navegador: `http://localhost:3000/login` (o tu URL)
2. Usa las credenciales generadas:
   - **DNI:** 99999999 (o el que ingresaste)
   - **Contraseña:** SuperAdmin123! (o la que ingresaste)
3. Deberías ver el panel de administración

## Seguridad

### ⚠️ Importante

1. **Guarda las credenciales en un lugar seguro**
2. **Cambia la contraseña en el primer acceso**
3. **No compartas el script con la contraseña incluida**
4. **Usa contraseñas fuertes** (mayúsculas, minúsculas, números, símbolos)

### Contraseña segura recomendada

Mínimo:
- 12 caracteres
- Incluir mayúsculas (A-Z)
- Incluir minúsculas (a-z)
- Incluir números (0-9)
- Incluir símbolos (!@#$%^&*)

**Ejemplo:** `S1st3m@2025Adm!n`

### Cambiar contraseña después

Usa la interfaz web de administración:
1. Login con el DNI del superadmin
2. Ve a **Usuarios**
3. Edita el superadmin
4. Actualiza la contraseña

O directamente en base de datos:

```bash
# Generar nuevo hash en Node.js
node -e "const b=require('bcrypt'); b.hash('NuevaContraseña123!',10,(e,h)=>console.log(h))"

# Luego ejecutar en MySQL
UPDATE usuarios SET password = 'hash_generado' WHERE dni = '99999999';
```

## Problemas comunes

### Error: "Access denied for user"
- Verifica credenciales de MySQL
- Asegúrate de tener permisos en la tabla `usuarios`

### Error: "Duplicate entry"
- Ya existe un usuario con ese DNI o correo
- Usa valores diferentes con `--dni` y `--correo`

### Error: "Column doesn't exist"
- La tabla `usuarios` no tiene el esquema esperado
- Verifica que la base de datos esté actualizada

### El script no se ejecuta
- Asegúrate de estar en el directorio `backend`
- Verifica que Node.js esté instalado: `node --version`
- Verifica que bcrypt esté instalado: `npm install bcrypt`

## Ejemplos de uso

### Crear superadmin de producción

```bash
node scripts/insert-superadmin.js \
  --legajo=ADMIN-PROD-001 \
  --dni=11111111 \
  --nombre=Administrador \
  --apellido=Sistema \
  --correo=admin@empresa.local \
  --password="ContraseñaSegura2025!" \
  --convenio=dentro
```

### Crear superadmin de desarrollo

```bash
node scripts/insert-superadmin.js \
  --dni=88888888 \
  --password="dev123"
```

### Crear múltiples superadmins

```bash
# Superadmin 1
node scripts/insert-superadmin.js --legajo=SA001 --dni=11111111

# Superadmin 2
node scripts/insert-superadmin.js --legajo=SA002 --dni=22222222
```

## Notas

- Solo crea un usuario, no crea roles ni permisos
- El rol se establece como `'superadmin'` en la tabla
- La contraseña se hashea con bcrypt (algoritmo de hashing seguro)
- El usuario se marca como activo por defecto (`activo: 1`)
- Se asigna la fecha actual como `fecha_ingreso`

## Soporte

Si tienes problemas:
1. Verifica la conexión a la base de datos: `node backend/scripts/test-db.js`
2. Verifica el esquema de la tabla: `DESCRIBE usuarios;`
3. Revisa los logs del backend: `backend/logs/` (si están configurados)
