# 🔐 Insertar Preguntas de Seguridad (40 preguntas)

## Descripción

Script para insertar 40 preguntas de seguridad en la tabla `preguntas` de la base de datos. Las preguntas están organizadas por categoría para mayor variedad.

## Opciones de Ejecución

### Opción 1: Script Node.js (RECOMENDADO)

**Ventaja:** Muestra progreso en tiempo real y manejo de errores mejorado

```bash
cd backend
node scripts/insert-security-questions.js
```

**Output esperado:**
```
🔄 Iniciando inserción de preguntas de seguridad...

📋 Total de preguntas a insertar: 40

✅ Pregunta 1 insertada: "¿Cuál es el nombre de tu primera mascota?"
✅ Pregunta 2 insertada: "¿En qué ciudad naciste?"
...
✅ Pregunta 40 insertada: "¿En qué ciudad pretendes vivir en el futuro?"

======================================================================
📊 RESUMEN DE INSERCIÓN
======================================================================
✅ Preguntas insertadas exitosamente: 40
❌ Errores: 0
📋 Total: 40
======================================================================
```

### Opción 2: Script SQL (MANUAL)

**Ventaja:** Ejecución directa en MySQL, útil para administradores de BD

```bash
# Opción A: Desde terminal
mysql -u usuario -p nombre_bd < backend/scripts/insert-security-questions.sql

# Opción B: Ejecutar directamente en MySQL CLI
mysql -u usuario -p nombre_bd
mysql> source backend/scripts/insert-security-questions.sql;
```

**Output esperado:**
```
Query OK, 40 rows affected
```

## Categorías de Preguntas

Las 40 preguntas cubren diferentes aspectos de la vida del usuario:

- Familia y relaciones personales
- Gustos y preferencias
- Educación y carrera
- Vida personal y hitos importantes
- Mascotas y animales
- Entretenimiento
- Tecnología
- Y más...

## Estructura de la Tabla

```sql
CREATE TABLE preguntas (
  id INT PRIMARY KEY AUTO_INCREMENT,
  pregunta VARCHAR(255) NOT NULL
);
```

## Verificación

Después de ejecutar el script, puedes verificar:

```bash
# Contar total de preguntas
mysql -u usuario -p nombre_bd -e "SELECT COUNT(*) as total FROM preguntas;"

# Ver todas las preguntas
mysql -u usuario -p nombre_bd -e "SELECT id, pregunta, categoria FROM preguntas LIMIT 10;"

# Ver distribución por categoría
mysql -u usuario -p nombre_bd -e "SELECT categoria, COUNT(*) as cantidad FROM preguntas GROUP BY categoria;"
```

## Si las Preguntas Ya Existen

Si al ejecutar el script obtienes errores de "Duplicate entry", tienes dos opciones:

### Opción A: Limpiar y reinsertar

```sql
-- Eliminar todas las preguntas
TRUNCATE TABLE preguntas;

-- Luego ejecutar el script nuevamente
```

### Opción B: Actualizar solo las que falten

Si quieres mantener las existentes:
- El script intentará insertar todas
- Las que ya existan causarán error (pero se mostrarán en el resumen)
- Las nuevas se insertarán correctamente

## Relación con Usuarios

Estas preguntas de seguridad se usan en:

1. **Recuperación de contraseña** - El usuario responde 3 preguntas aleatorias
2. **Autenticación adicional** - Validación de identidad
3. **Tabla `usuario_respuestas`** - Almacena las respuestas del usuario a cada pregunta

```sql
CREATE TABLE usuario_respuestas (
  id INT PRIMARY KEY AUTO_INCREMENT,
  usuario_id INT NOT NULL,
  pregunta_id INT NOT NULL,
  respuesta VARCHAR(255) NOT NULL,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id),
  FOREIGN KEY (pregunta_id) REFERENCES preguntas(id)
);
```

## Uso en la Aplicación

Las preguntas se utilizan en:

- **API:** `GET /api/preguntas` - Obtiene preguntas para el formulario de recuperación
- **Flujo:** Usuario → Olvida contraseña → Responde 3 preguntas → Cambia contraseña
- **Validación:** Las respuestas se comparan contra lo almacenado en `usuario_respuestas`

## Notas Importantes

✅ **Seguridad:**
- Las respuestas se almacenan en minúsculas y sin espacios extras
- Se valida cantidad mínima de respuestas por usuario
- Las respuestas se comparan sin importar mayúsculas/minúsculas

✅ **Recomendaciones:**
- Ejecutar con suficientes permisos en la BD
- Hacer backup antes si la tabla ya tiene datos
- Verificar que la tabla existe antes de ejecutar

⚠️ **Limitaciones:**
- El script actual no valida duplicados (si ejecutas 2 veces, insertará duplicados)
- Para evitar, usa `TRUNCATE` primero o valida uniqueness en la tabla

## Solución de Problemas

### Error: "Access denied for user"
```bash
# Verifica credenciales en backend/.env
# Asegúrate de tener permisos INSERT en tabla preguntas
```

### Error: "Table doesn't exist"
```bash
# Verifica que la tabla preguntas existe
mysql -u usuario -p nombre_bd -e "DESCRIBE preguntas;"
```

### Error: "Column doesn't exist"
```bash
# Verifica estructura de la tabla
# Debe tener al menos: id, pregunta, categoria
```

## Ejemplo Completo de Uso

```bash
# 1. Conectarse al servidor
ssh usuario@servidor

# 2. Ir a carpeta backend
cd /ruta/a/sistema-rrhh/backend

# 3. Ejecutar script
node scripts/insert-security-questions.js

# 4. Esperar confirmación
# Output: ✅ Preguntas insertadas exitosamente: 40

# 5. Reiniciar backend (si está ejecutándose)
npm restart
# o
pm2 restart all
```

## Próximos Pasos

Después de insertar las preguntas:

1. ✅ Las preguntas estarán disponibles en `/api/preguntas`
2. ✅ Los usuarios podrán usarlas para recuperación de contraseña
3. ✅ El sistema seleccionará 3 aleatorias por usuario
4. ⏳ Los usuarios responderán en el formulario de recuperación

---

**Versión:** 1.0  
**Última actualización:** 2024  
**Preguntas incluidas:** 40  
**Categorías:** 8
