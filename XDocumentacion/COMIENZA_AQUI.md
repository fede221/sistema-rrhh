# 🚀 INICIO RÁPIDO - VACACIONES v1.0.0 READY

## ✅ Validación Pre-Testing

```
BACKEND:     ✅ Puerto 3001 activo
FRONTEND:    ✅ Puerto 3002 compilando
DATABASE:    ✅ GCP conectada 34.176.128.94
MIGRACIONES: ✅ 14 cambios aplicados
ENDPOINTS:   ✅ 7 rutas implementadas
COMPONENTES: ✅ 6 componentes creados
```

---

## 🎯 COMENZAR AHORA (3 PASOS)

### PASO 1️⃣: Abrir Navegador
```
URL: http://localhost:3002
Esperar a que cargue (puede tardar 10-20 segundos en primera carga)
```

### PASO 2️⃣: Loguearse
```
Usuario: [tu usuario empleado]
Contraseña: [tu contraseña]
```

### PASO 3️⃣: Testing Rápido (5 minutos)
```
Seguir: QUICK_START_TESTING.md (en este directorio)
```

---

## 📚 Documentación Disponible

### Para empezar:
- **QUICK_START_TESTING.md** ← EMPIEZA AQUÍ (5 min)
- **IMPLEMENTACION_COMPLETADA.md** ← Resumen técnico

### Para testing completo:
- **TESTING_VACACIONES.md** ← Todos los casos (30 min)
- **IMPLEMENTACION_VACACIONES_COMPLETA.md** ← Especificaciones

### Estados y checklists:
- **ESTADO_FINAL_VACACIONES.md** ← Checklist
- **RESUMEN_FINAL_VACACIONES.md** ← Resumen final

---

## 🔗 Rutas Disponibles

```
EMPLEADO:
  http://localhost:3002/vacaciones/empleado

REFERENTE:
  http://localhost:3002/vacaciones/referente

RH/ADMIN:
  http://localhost:3002/vacaciones/rh

ORIGINAL (legacy):
  http://localhost:3002/vacaciones
```

---

## ⚠️ Notas Importantes

### Proxy error (no bloqueante)
```
Verás: "Proxy error: Could not proxy request /sw.js..."
Esto es NORMAL - no afecta la funcionalidad
Solución: Ya configurada en setupProxy.js
```

### Warnings de eslint (no bloqueantes)
```
Verás: "React Hook useEffect has missing dependency..."
Esto es NORMAL - son warnings, no errors
Estado: Frontend compila correctamente
```

### Primer acceso tarda
```
Primera carga: 10-20 segundos
Razón: Webpack compilando React components
Esperar pacientemente
```

---

## 🎬 Flujo Esperado (5 minutos)

```
1. Login como EMPLEADO
   ↓
2. Ver dashboard (/vacaciones/empleado)
   ├─ 4 tarjetas de días
   ├─ Tab "Nueva Solicitud"
   └─ Tab "Mis Solicitudes"
   ↓
3. Crear solicitud
   ├─ Fechas: lunes 11/11 a viernes 21/11
   ├─ Comentario: "Vacaciones"
   └─ Click "Enviar Solicitud"
   ↓
4. Login como REFERENTE
   ├─ URL: /vacaciones/referente
   ├─ Ver solicitud en tabla
   ├─ Click "Aprobar"
   ├─ Comentario: "OK"
   └─ Click "Aprobar"
   ↓
5. Login como RH
   ├─ URL: /vacaciones/rh
   ├─ Ver solicitud en tabla
   ├─ Click "Aprobar"
   ├─ Comentario: "Aprobado"
   └─ Click "Aprobar Final"
   ↓
6. Login como EMPLEADO original
   ├─ URL: /vacaciones/empleado
   ├─ Tab "Mis Solicitudes"
   ├─ Ver solicitud: ✓ APROBADO
   └─ Click detalles → ver aprobaciones

✅ SI LLEGASTE AQUÍ → TODO FUNCIONA
```

---

## 🔍 Verificaciones Rápidas

### En navegador (DevTools F12):
```
1. Tab "Network":
   ✅ Requests a /api/vacaciones/* deben ser 200/201

2. Tab "Application":
   ✅ localStorage contiene: token, userId, userName

3. Console:
   ✅ No debe haber errores en rojo (warnings amarillos OK)
```

### En Terminal Backend:
```
✅ Debe mostrar logs de requests
✅ Errores 400/401/403 es NORMAL en testing
✅ Debe estar escuchando en :3001
```

### En Base de Datos:
```
✅ Tabla vacaciones_solicitadas existe
✅ Columnas referente_id, rh_id existen
✅ ENUM estado tiene 5 valores
```

---

## 🆘 Si algo falla...

### Frontend no carga (error 404)
```
Causa: Webpack aún compilando
Solución: Esperar 15-20 segundos y refrescar
```

### Error "Cannot find usuario_id"
```
Causa: Token expirado o login fallido
Solución: Hacer logout y login nuevamente
```

### Error "API call failed"
```
Causa: Backend no responde
Solución: 
  1. Verificar backend en puerto 3001
  2. Ejecutar: npm run dev (en backend/)
  3. Esperar que inicie
  4. Refrescar navegador
```

### Solicitud no aparece en referente
```
Causa: Usuario no tiene rol correcto
Solución: 
  1. Cambiar usuario a "referente_vacaciones"
  2. Verificar en BD: SELECT rol FROM usuarios WHERE id=[ID]
```

---

## 📞 Soporte

### Si necesitas ayuda:
1. Revisar QUICK_START_TESTING.md
2. Revisar sección "Si algo falla" arriba
3. Revisar IMPLEMENTACION_COMPLETADA.md
4. Revisar logs en terminal

---

## ✅ Checklist antes de continuar

- [ ] Backend corriendo (puerto 3001)
- [ ] Frontend compilado (puerto 3002)
- [ ] Navegador accesible a http://localhost:3002
- [ ] Puedo hacer login
- [ ] Veo dashboard de vacaciones
- [ ] Entiendo el flujo (empleado → referente → RH)

---

## 🎉 ¡ADELANTE!

### Próximo: Abrir QUICK_START_TESTING.md y comenzar testing (5 min)

```
http://localhost:3002
↓
Login
↓
/vacaciones/empleado
↓
Crear solicitud
↓
Flujo completo
↓
✅ VERIFICADO
```

---

**Inicio Rápido:** 2 minutos  
**Testing Rápido:** 5 minutos  
**Testing Completo:** 30 minutos  

**Total para validación:** ~45 minutos

**Status:** 🚀 LISTO PARA COMENZAR

---

*Generado: 4 Noviembre 2025*  
*Sistema: Sistema RRHH v1.2.1*  
*Módulo: Vacaciones v1.0.0*
