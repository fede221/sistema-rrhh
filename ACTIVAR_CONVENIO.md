# 🚀 PASO A PASO: Activar el campo "Convenio" en Usuarios

## ⏱️ Tiempo estimado: 2 minutos

## 📌 Paso 1: Aplicar Migración a Base de Datos

Ejecuta el script de migración desde la carpeta backend:

```bash
cd backend
node scripts/add-convenio-migration.js
```

**Resultado esperado:**
```
🔄 Iniciando migración: Agregar campo convenio a usuarios...

✅ Columna convenio agregada exitosamente
✅ Índice idx_usuarios_convenio creado exitosamente

✅ Migración completada exitosamente!

Detalles de la columna:
  - Nombre: convenio
  - Tipo: varchar(20)
  - Valor por defecto: dentro

📊 El campo convenio está listo para usarse en:
  - POST /api/usuarios (crear usuario)
  - PUT /api/usuarios/:id (editar usuario)
  - GET /api/usuarios (listar usuarios)
```

## 📌 Paso 2: Reiniciar Backend

```bash
npm start
# o si usas PM2:
pm2 restart all
# o si usas nodemon:
npm run dev
```

## 📌 Paso 3: Verificar en Frontend

### Crear Usuario Nuevo

1. Ve a la sección "👥 Usuarios"
2. Haz clic en "➕ Nuevo Usuario"
3. Completa el formulario:
   - Legajo: TEST001
   - DNI: 12345678
   - Nombre: Juan
   - Apellido: Pérez
   - Email: juan@test.com
   - Fecha de Nacimiento: 01/01/1990
   - **Convenio: ✅ Dentro de Convenio** ← Nuevo campo
   - Contraseña: Password123!
   - Rol: Empleado

4. Haz clic en "Guardar"

### Editar Usuario

1. En la tabla de usuarios, haz clic en el botón "✏️ Editar"
2. Verás el campo "Convenio" entre Rol y Referente
3. Cambia el valor a "❌ Fuera de Convenio"
4. Haz clic en "Guardar cambios"

### Ver Columna Convenio

En la tabla de usuarios, verás una nueva columna "Convenio" que muestra:
- 🟢 Verde con "Dentro" → Dentro de Convenio
- 🔴 Rojo con "Fuera" → Fuera de Convenio

## 🔍 Verificación Técnica

### Verificar en Base de Datos

```bash
# Accede a MySQL
mysql -u usuario -p nombre_bd

# Verifica que la columna existe
DESCRIBE usuarios;

# Deberías ver:
# | convenio | varchar(20) | YES | MUL | dentro | |
```

### Verificar en API

```bash
# Obtener lista de usuarios
curl -X GET http://localhost:3001/api/usuarios \
  -H "Authorization: Bearer <TOKEN>"

# Deberías ver en la respuesta:
# "convenio": "dentro"  o  "convenio": "fuera"
```

## ✅ Checklist de Verificación

- [ ] Script de migración ejecutado sin errores
- [ ] Backend reiniciado correctamente
- [ ] Campo "Convenio" visible en formulario de crear usuario
- [ ] Puedes crear usuario y seleccionar convenio
- [ ] Puedes editar usuario y cambiar convenio
- [ ] Columna "Convenio" visible en tabla de usuarios
- [ ] Indicadores de color funcionan (🟢 y 🔴)
- [ ] GET /api/usuarios retorna convenio en cada usuario

## ⚠️ Si Algo Sale Mal

### Error: "Duplicate column name"
```
Significa que la columna ya existe. Esto es normal si ejecutaste el script antes.
La migración es idempotente, así que puedes ignorar este error.
```

### Error: "Access denied for user"
```
Verifica que:
1. MySQL está ejecutándose
2. Las credenciales en .env son correctas
3. Tienes permisos de ALTER TABLE
```

### Error: "Cannot find module '../config/db'"
```
Asegúrate de ejecutar el script desde la carpeta backend:
cd backend
node scripts/add-convenio-migration.js
```

### Campo no aparece en Frontend
```
1. Limpia caché del navegador (Ctrl+Shift+Del)
2. Recarga la página (Ctrl+R o F5)
3. Si persiste, reinicia el servidor frontend: npm start
```

## 🎯 Resultado Final

Después de completar todos los pasos, tendrás:

✅ Campo "convenio" en tabla usuarios de base de datos
✅ Endpoint POST /api/usuarios acepta convenio
✅ Endpoint PUT /api/usuarios/:id acepta convenio
✅ Endpoint GET /api/usuarios retorna convenio
✅ Frontend: Formulario de crear usuario muestra campo convenio
✅ Frontend: Formulario de editar usuario muestra campo convenio
✅ Frontend: Tabla de usuarios muestra columna convenio con indicadores

## 📱 Uso

Ahora puedes:

1. **Crear empleados dentro de convenio**
   - Estado: ✅ Dentro de Convenio
   - Beneficios: Aplican convenios laborales

2. **Crear empleados fuera de convenio**
   - Estado: ❌ Fuera de Convenio
   - Beneficios: Según acuerdos particulares

3. **Ver estado de convenio en tabla**
   - 🟢 Verde = Dentro
   - 🔴 Rojo = Fuera

4. **Cambiar estado cuando sea necesario**
   - Editar usuario → Cambiar convenio → Guardar

## 📞 Soporte

Si necesitas ayuda:
1. Consulta: `MIGRACION_CONVENIO.md` (documentación completa)
2. Consulta: `CAMBIOS_CONVENIO.md` (resumen de cambios)
3. Revisa logs: `backend/logs/error.log`
4. Verifica conexión a BD: `npm run check-db` (si existe)

¡Listo! Tu sistema ahora maneja el estado de convenio para empleados. 🎉
