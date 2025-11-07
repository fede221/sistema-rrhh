# 🧪 GUÍA DE TESTING - SISTEMA DE VACACIONES

## ✅ Estado Actual
- ✅ Backend corriendo en puerto 3001
- ✅ Frontend corriendo en puerto 3000
- ✅ Base de datos actualizada
- ✅ 7 endpoints implementados
- ✅ 6 componentes frontend creados

## 📋 USUARIOS DE PRUEBA

Para testing, necesitamos usuarios con diferentes roles:

```
EMPLEADO:
  Usuario ID: [Tu usuario logueado]
  Rol: empleado
  Rol Ref: referente_vacaciones (si aplica)

REFERENTE:
  Usuario: [Usuario con rol referente_vacaciones]
  Acción: Aprobar/rechazar solicitudes de empleados

RH/ADMIN:
  Usuario: [Usuario con rol admin_rrhh]
  Acción: Aprobación final de solicitudes
```

## 🎯 CASOS DE PRUEBA

### TEST 1: Empleado crea solicitud ✅

**Objetivo:** Validar que un empleado puede crear una solicitud que cumple Ley 20.744

**Pasos:**
1. Acceder a `http://localhost:3000`
2. Loguearse como empleado
3. Navegar a: `/vacaciones/empleado`
4. Verificar resumen de días:
   - Disponibles 2025: debe mostrar un número
   - Acumulados: 5 días (previamente cargados)
   - Total disponible: suma correcta

5. Hacer click en tab "Nueva Solicitud"
6. Completar formulario:
   - Fecha inicio: **lunes próximo** (e.g., 11/11/2025)
   - Fecha fin: **viernes de la siguiente semana** (e.g., 21/11/2025)
   - Comentarios: "Vacaciones de familia"
7. Hacer click "📤 Enviar Solicitud"

**Resultado Esperado:**
```
✓ Mensaje: "Solicitud creada exitosamente"
✓ Estado: "PENDIENTE_REFERENTE"
✓ Página recarga automáticamente
✓ Solicitud aparece en "Mis Solicitudes"
```

**Validar en BD:**
```sql
SELECT * FROM vacaciones_solicitadas 
WHERE usuario_id = [TU_ID] 
ORDER BY id DESC LIMIT 1;

Debe mostrar:
- estado: 'pendiente_referente'
- referente_id: NULL (aún no)
- rh_id: NULL (aún no)
```

---

### TEST 2: Referente aprueba solicitud ✅

**Objetivo:** Validar que referente puede aprobar y pasa a estado "pendiente_rh"

**Pasos (como REFERENTE):**
1. Loguearse con usuario que tenga rol `referente_vacaciones`
2. Navegar a: `/vacaciones/referente`
3. Verificar tabla "Solicitudes Pendientes de Aprobación"
4. Debe aparecer la solicitud del TEST 1 con:
   - Nombre empleado
   - Período: 11/11 - 21/11
   - 11 días (se cuentan días hábiles)
   - Comentario: "Vacaciones de familia"

5. Hacer click "✓ Aprobar"
6. En dialog:
   - Comentario: "OK, coordinado con equipo"
   - Hacer click "Aprobar"

**Resultado Esperado:**
```
✓ Mensaje: "Solicitud aprobada por referente"
✓ Tabla refresca automáticamente
✓ Solicitud desaparece de "Pendientes"
```

**Validar en BD:**
```sql
SELECT estado, referente_id, referente_comentario, fecha_referente 
FROM vacaciones_solicitadas 
WHERE id = [SOLICITUD_ID];

Debe mostrar:
- estado: 'pendiente_rh'
- referente_id: [ID_DEL_REFERENTE]
- referente_comentario: 'OK, coordinado con equipo'
- fecha_referente: NOW()
```

---

### TEST 3: RH aprueba solicitud final ✅

**Objetivo:** Validar que RH puede aprobar final y pasa a estado "aprobado"

**Pasos (como RH/ADMIN):**
1. Loguearse con usuario que tenga rol `admin_rrhh`
2. Navegar a: `/vacaciones/rh`
3. Verificar tabla "Solicitudes de Vacaciones - Aprobación RH"
4. Debe aparecer la solicitud con:
   - Nombre empleado: [Del TEST 1]
   - Período: 11/11 - 21/11
   - Referente: [Del TEST 2]

5. Hacer click "✓ Aprobar"
6. En dialog:
   - Comentario: "Aprobado conforme"
   - Hacer click "Aprobar Final"

**Resultado Esperado:**
```
✓ Mensaje: "Solicitud aprobada por RH"
✓ Tabla refresca automáticamente
✓ Solicitud desaparece de "Pendientes"
```

**Validar en BD:**
```sql
SELECT estado, rh_id, rh_comentario, fecha_rh 
FROM vacaciones_solicitadas 
WHERE id = [SOLICITUD_ID];

Debe mostrar:
- estado: 'aprobado'
- rh_id: [ID_DEL_RH]
- rh_comentario: 'Aprobado conforme'
- fecha_rh: NOW()
```

---

### TEST 4: Empleado ve solicitud aprobada ✅

**Objetivo:** Validar que empleado ve solicitud en estado "aprobado" con todas las aprobaciones

**Pasos (como EMPLEADO del TEST 1):**
1. Navegar a `/vacaciones/empleado`
2. Hacer click tab "Mis Solicitudes"
3. Verificar tabla muestra solicitud con:
   - Período: 11/11 - 21/11
   - Estado: **✓ Aprobado** (chip verde)
   - Días: 11

4. Hacer click "Ver detalles"
5. En dialog debe mostrar:
   - Período: 11/11 - 21/11
   - Días: 11
   - Estado: ✓ Aprobado
   - Comentarios: Vacaciones de familia
   - **Aprobado por: [Nombre Referente]** con comentario
   - **Aprobado por RH: [Nombre RH]** con comentario

**Resultado Esperado:**
```
✓ Solicitud completa con ambas aprobaciones visibles
✓ Comentarios de referente y RH mostrados
```

---

### TEST 5: Empleado ve historial actualizado ✅

**Objetivo:** Validar cálculo correcto de días tomados vs disponibles

**Pasos (como EMPLEADO del TEST 1):**
1. Navegar a `/vacaciones/empleado`
2. Hacer click tab "Historial"
3. Verificar card "Año 2025":
   - Días Base: 15 (ley base)
   - Acumulados años anteriores: 5
   - No tomados años anteriores: [cantidad]
   - Total Disponible: [suma correcta]
   - Días Tomados: **11** (de la solicitud aprobada)
   - Días Disponibles: **[Total - 11]**

**Resultado Esperado:**
```
✓ Cálculo correcto de días tomados
✓ Disponibles = Total - Tomados
```

---

### TEST 6: Rechazo por Referente ✅

**Objetivo:** Validar flujo de rechazo

**Pasos:**
1. Como EMPLEADO: Crear nueva solicitud
   - Período: 01/12 - 10/12 (10 días)
   - Comentario: "Solicitud para rechazar"

2. Como REFERENTE:
   - Ver solicitud en "Pendientes de Aprobación"
   - Hacer click "✗ Rechazar"
   - Comentario: "No autorizado - conflicto de proyecto"
   - Hacer click "Rechazar"

**Validar en BD:**
```sql
SELECT estado, referente_comentario 
FROM vacaciones_solicitadas 
WHERE id = [NUEVA_SOLICITUD_ID];

Debe mostrar:
- estado: 'rechazado_referente'
- referente_comentario: 'No autorizado - conflicto de proyecto'
```

3. Como EMPLEADO:
   - Ir a "Mis Solicitudes"
   - Verificar solicitud con estado: **✗ Rechazado (Referente)**
   - Ver comentario del rechazo

**Resultado Esperado:**
```
✓ Solicitud rechazada no pasa a RH
✓ Comentario de rechazo visible
```

---

### TEST 7: Rechazo por RH (desde Referente) ✅

**Objetivo:** Validar rechazo en etapa RH

**Pasos:**
1. Como EMPLEADO: Crear nueva solicitud
   - Período: 05/12 - 15/12

2. Como REFERENTE:
   - Aprobar solicitud
   - Estado pasa a "pendiente_rh"

3. Como RH:
   - Ver solicitud en "Pendientes RH"
   - Hacer click "✗ Rechazar"
   - Comentario: "Rechazado por problemas de cobertura"
   - Hacer click "Rechazar"

**Validar en BD:**
```sql
SELECT estado, rh_comentario 
FROM vacaciones_solicitadas 
WHERE id = [SOLICITUD_ID];

Debe mostrar:
- estado: 'rechazado_rh'
- rh_comentario: 'Rechazado por problemas de cobertura'
```

3. Como EMPLEADO:
   - Ir a "Mis Solicitudes"
   - Verificar estado: **✗ Rechazado (RH)**

**Resultado Esperado:**
```
✓ Solicitud rechazada por RH
✓ Referente aprobó pero RH rechazó
```

---

### TEST 8: Validación Ley 20.744 ✅

**Objetivo:** Validar que solo se aceptan solicitudes conformes a ley

**Prueba A - Menos de 10 días (DEBE FALLAR):**
```
1. Como EMPLEADO: Intenta crear solicitud
   - Período: 10/11 - 12/11 (3 días hábiles)
   - Resultado esperado: ✗ Error
   - Mensaje: "Mínimo 10 días hábiles"
```

**Prueba B - No comienza lunes (DEBE FALLAR):**
```
1. Como EMPLEADO: Intenta crear solicitud
   - Período: 12/11 - 22/11 (Miércoles a Sábado)
   - Resultado esperado: ✗ Error
   - Mensaje: "Debe comenzar en lunes"
```

**Prueba C - Después del 31/5 (DEBE FALLAR en 2026):**
```
1. Como EMPLEADO: Intenta crear solicitud
   - Período: 01/06/2026 - 15/06/2026
   - Resultado esperado: ✗ Error
   - Mensaje: "Debe ser antes del 31 de mayo"
```

**Resultado Esperado:**
```
✓ Sistema rechaza solicitudes inválidas
✓ Mensajes de error descriptivos
```

---

## 📊 CHECKLIST DE VALIDACIÓN

```
BASE DE DATOS:
✓ Tabla vacaciones_solicitadas tiene 19 columnas
✓ Campos: referente_id, referente_comentario, fecha_referente, rh_id, rh_comentario, fecha_rh
✓ ENUM estado tiene 5 valores: pendiente_referente, pendiente_rh, aprobado, rechazado_referente, rechazado_rh
✓ Foreign keys apuntan a usuarios.id
✓ Índices creados en estado, referente_id, rh_id

API ENDPOINTS:
✓ POST /vacaciones/crear-solicitud - Crea solicitud
✓ GET /vacaciones/mis-solicitudes-nuevo/:id - Lista solicitudes empleado
✓ GET /vacaciones/historial-completo/:id - Historial por año
✓ GET /vacaciones/pendientes-referente - Solicitudes para referente
✓ PUT /vacaciones/responder-referente/:id - Respuesta referente
✓ GET /vacaciones/pendientes-rh - Solicitudes para RH
✓ PUT /vacaciones/responder-rh/:id - Respuesta RH final

FRONTEND:
✓ PanelEmpleado.js - Dashboard con 4 cards de resumen
✓ NuevaSolicitud.js - Formulario funcional
✓ MisSolicitudes.js - Tabla y dialog de detalles
✓ Historial.js - Resumen por año
✓ PanelReferente.js - Lista y aprobación
✓ PanelRH.js - Lista y aprobación final

LÓGICA:
✓ Estado progresa: pendiente_referente → pendiente_rh → aprobado
✓ Rechazos detienen el flujo
✓ Comentarios se guardan en cada etapa
✓ Días se calculan correctamente
✓ Ley 20.744 se valida
✓ Cálculos de historial son correctos
```

---

## 🚨 POSIBLES ERRORES Y SOLUCIONES

| Error | Causa | Solución |
|-------|-------|----------|
| `GET /vacaciones/... - 401 Unauthorized` | Token expirado o inválido | Reloguearse |
| `Connection refused :3001` | Backend no corriendo | `npm run dev` en backend |
| `403 Forbidden` | Rol incorrecto | Verificar rol del usuario |
| `Solicitud inválida - No cumple Ley 20.744` | Período incorrecto | Verificar: 10+ días, lunes, antes 31/5 |
| `Ya existe una solicitud en ese período` | Solapamiento | Crear período diferente |
| Componentes no cargan | Rutas no integradas | Agregar rutas en App.js |
| Estados no actualizan | Cache del navegador | Limpiar caché o Ctrl+Shift+R |

---

## ✅ NEXT STEPS DESPUÉS DEL TESTING

1. **Integrar rutas en App.js**
   ```javascript
   import PanelEmpleado from './pages/Vacaciones/PanelEmpleado';
   import PanelReferente from './pages/Vacaciones/PanelReferente';
   import PanelRH from './pages/Vacaciones/PanelRH';
   
   <Route path="/vacaciones/empleado" element={<PanelEmpleado />} />
   <Route path="/vacaciones/referente" element={<PanelReferente />} />
   <Route path="/vacaciones/rh" element={<PanelRH />} />
   ```

2. **Agregar notificaciones por email** (opcional)

3. **Deploy a producción**

---

**Fecha de Testing:** 4 Noviembre 2025
**Estado:** Listo para ejecución
**Duración estimada:** 30-45 minutos
