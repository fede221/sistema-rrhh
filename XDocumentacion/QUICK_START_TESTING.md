# ⚡ QUICK START - TESTING VACACIONES (5 MINUTOS)

## 🎯 Objetivo
Validar que el flujo completo de vacaciones funciona: empleado → referente → RH → aprobado

## ✅ Pre-requisitos
- ✅ Backend corriendo en puerto 3001
- ✅ Frontend corriendo en puerto 3002  
- ✅ Navegador abierto en http://localhost:3002
- ✅ DB migrada en 34.176.128.94

## 🚀 PASOS RÁPIDOS (5 MINUTOS)

### PASO 1: Login como EMPLEADO
```
1. Ir a http://localhost:3002
2. Usuario: [tu usuario]
3. Contraseña: [tu contraseña]
4. Login
```

### PASO 2: Ver Dashboard de Vacaciones
```
1. Navegar a: /vacaciones/empleado
2. Verificar que se muestran 4 tarjetas:
   ✅ Disponibles 2025: [número]
   ✅ Acumulados: [número]
   ✅ Tomados: 0 (inicial)
   ✅ Total: suma de los anteriores
```

**✅ Si ves las tarjetas → Sigue al paso 3**

### PASO 3: Crear Solicitud
```
1. Click en tab "Nueva Solicitud"
2. Rellenar:
   - Inicio: lunes próximo (ej: 11/11/2025)
   - Fin: viernes semana siguiente (ej: 21/11/2025)
   - Comentario: "Vacaciones"
3. Click "Enviar Solicitud"
4. Esperar mensaje: "Solicitud creada exitosamente"
```

**✅ Si ves el mensaje → Estado es PENDIENTE_REFERENTE**

### PASO 4: Cambiar a REFERENTE
```
1. Logout del empleado
2. Login como usuario con rol: referente_vacaciones
3. Navegar a: /vacaciones/referente
4. Debe aparecer tabla con solicitud del PASO 3
```

**✅ Si ves la solicitud → Sigue al paso 5**

### PASO 5: Referente Aprueba
```
1. En la tabla, buscar solicitud
2. Click botón "✓ Aprobar"
3. En dialog:
   - Escribir: "Coordinado"
   - Click "Aprobar"
4. Esperar: "Solicitud aprobada por referente"
5. Tabla debe refrescar (solicitud desaparece)
```

**✅ Si solicitud desapareció → Estado es PENDIENTE_RH**

### PASO 6: Cambiar a RH
```
1. Logout del referente
2. Login como usuario con rol: admin_rrhh o superadmin
3. Navegar a: /vacaciones/rh
4. Debe aparecer tabla con solicitud
```

**✅ Si ves la solicitud → Sigue al paso 7**

### PASO 7: RH Aprueba Final
```
1. En la tabla, buscar solicitud  
2. Click botón "✓ Aprobar"
3. En dialog:
   - Escribir: "Aprobado"
   - Click "Aprobar Final"
4. Esperar: "Solicitud aprobada por RH"
5. Tabla debe refrescar (solicitud desaparece)
```

**✅ Si solicitud desapareció → Estado es APROBADO**

### PASO 8: Verificar como EMPLEADO
```
1. Logout de RH
2. Login como empleado original (PASO 1)
3. Navegar a: /vacaciones/empleado
4. Click tab "Mis Solicitudes"
5. Debe ver solicitud con estado: "✓ Aprobado"
6. Click "Ver detalles" → debe mostrar:
   ✅ Referente: [nombre]
   ✅ Comentario referente: "Coordinado"
   ✅ RH: [nombre]
   ✅ Comentario RH: "Aprobado"
```

**✅ SI LLEGASTE AQUÍ → TODO FUNCIONA CORRECTAMENTE**

---

## 🎯 RESULTADO ESPERADO

✅ **Flujo de aprobación completo funciona**
- Empleado crea solicitud
- Referente aprueba
- RH aprueba final
- Empleado ve solicitud aprobada
- Todos los comentarios se guardan

---

## 🐛 Si algo falla...

### Problema: 404 Not Found en /vacaciones/empleado
**Solución:** Las rutas no están integradas en App.js  
→ Verificar que App.js tiene las 3 rutas agregadas

### Problema: "Cannot find usuario_id"
**Solución:** Token o usuario no guardado en localStorage  
→ Verificar que el login fue exitoso
→ Verificar localStorage en DevTools (F12 → Application → Storage)

### Problema: Error "API call failed"
**Solución:** Backend no responde o JWT token inválido  
→ Verificar backend en puerto 3001: `npm run dev`
→ Verificar token en localStorage

### Problema: DB error "Table doesn't exist"
**Solución:** Migraciones no ejecutadas  
→ Ejecutar: `node backend/execute-migration.js`

---

## 📊 VALIDACIÓN EN BD

Después de completar PASO 8, ejecutar en DB:

```sql
SELECT * FROM vacaciones_solicitadas 
WHERE usuario_id = [TU_ID] 
ORDER BY id DESC LIMIT 1;
```

**Esperar columnas:**
- estado: "aprobado"
- referente_id: [ID no NULL]
- referente_comentario: "Coordinado"
- rh_id: [ID no NULL]
- rh_comentario: "Aprobado"
- fecha_referente: [DATE]
- fecha_rh: [DATE]

---

## ✨ SIGUIENTE

Si todo funcionó:
1. Leer: TESTING_VACACIONES.md (casos de prueba completos)
2. Ejecutar: Más test cases (rechazo, errores, etc.)
3. Desplegar: A producción

---

**Time:** ~5 minutos  
**Dificultad:** Básico  
**Status:** Listo para testing  

✅ **ADELANTE CON EL TESTING**
