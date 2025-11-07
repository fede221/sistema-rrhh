# 📋 REDISEÑO DEL MÓDULO DE VACACIONES

## 1. FLUJO COMPLETO DE SOLICITUD Y APROBACIÓN

```
EMPLEADO (paso 1-4)
  ↓
1. Visualiza: Días disponibles | Acumulados | Total
2. Crea solicitud (fecha inicio, fecha fin, motivo opcional)
3. Envía solicitud → Estado: "PENDIENTE_REFERENTE"
  ↓
REFERENTE (paso 5-6)
  ↓
5. Recibe notificación de solicitud pendiente
6. Aprueba/rechaza con comentario → Estado: "PENDIENTE_RH" o "RECHAZADO_REFERENTE"
  ↓
RH/ADMIN (paso 7-8)
  ↓
7. Recibe solicitud aprobada por referente
8. Aprueba/rechaza con comentario → Estado: "APROBADO" o "RECHAZADO_RH"
  ↓
EMPLEADO (paso 9-10)
  ↓
9. Ve historial con todas sus solicitudes
10. Verifica estado en cada momento (pendiente, aprobado, rechazado)
```

## 2. TABLA: VACACIONES_SOLICITADAS (ACTUALIZADA)

```sql
CREATE TABLE vacaciones_solicitadas (
  id INT PRIMARY KEY AUTO_INCREMENT,
  usuario_id INT NOT NULL,
  anio INT NOT NULL,
  fecha_inicio DATE NOT NULL,
  fecha_fin DATE NOT NULL,
  dias_solicitados INT NOT NULL,
  
  -- Estados del flujo
  estado ENUM('pendiente_referente', 'pendiente_rh', 'aprobado', 'rechazado_referente', 'rechazado_rh') DEFAULT 'pendiente_referente',
  
  -- Aprobadores
  referente_id INT,
  referente_comentario TEXT,
  fecha_referente DATETIME,
  
  rh_id INT,
  rh_comentario TEXT,
  fecha_rh DATETIME,
  
  -- Auditoría
  comentarios_empleado TEXT,
  fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
  fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id),
  FOREIGN KEY (referente_id) REFERENCES usuarios(id),
  FOREIGN KEY (rh_id) REFERENCES usuarios(id)
);
```

## 3. ROLES Y PERMISOS

| Rol | Acción | Endpoint |
|-----|--------|----------|
| **empleado** | Crear solicitud | POST /vacaciones/solicitar |
| **empleado** | Ver mis solicitudes | GET /vacaciones/mis-solicitudes/:usuario_id |
| **empleado** | Ver historial | GET /vacaciones/historial/:usuario_id |
| **empleado** | Ver días disponibles | GET /vacaciones/dias-disponibles/:usuario_id |
| **referente_vacaciones** | Ver solicitudes pendientes referente | GET /vacaciones/pendientes-referente |
| **referente_vacaciones** | Aprobar/rechazar solicitud | PUT /vacaciones/responder-referente/:id |
| **admin_rrhh** | Ver solicitudes pendientes RH | GET /vacaciones/pendientes-rh |
| **admin_rrhh** | Aprobar/rechazar solicitud | PUT /vacaciones/responder-rh/:id |
| **admin_rrhh** | Ver todas las solicitudes | GET /vacaciones/todas-solicitudes |
| **admin_rrhh** | Generar reportes | GET /vacaciones/reporte |

## 4. ENDPOINTS API NUEVOS/MODIFICADOS

### 4.1 EMPLEADO - Solicitar vacaciones
```
POST /vacaciones/solicitar
Body: {
  usuario_id: number,
  fecha_inicio: "2025-10-01",
  fecha_fin: "2025-10-15",
  comentarios: "Viaje familiar" (opcional)
}
Response: {
  id: number,
  estado: "pendiente_referente",
  dias_solicitados: 15,
  fecha_creacion: "2025-11-03"
}
```

### 4.2 EMPLEADO - Mis solicitudes
```
GET /vacaciones/mis-solicitudes/:usuario_id
Response: [
  {
    id: number,
    fecha_inicio: "2025-10-01",
    fecha_fin: "2025-10-15",
    dias_solicitados: 15,
    estado: "aprobado",
    referente_nombre: "Juan García",
    referente_comentario: "OK",
    rh_nombre: "María López",
    rh_comentario: "Aprobado",
    fecha_creacion: "2025-11-03"
  }
]
```

### 4.3 EMPLEADO - Historial completo
```
GET /vacaciones/historial/:usuario_id
Response: [
  {
    anio: 2025,
    solicitudes: [ { ...solicitud } ],
    dias_disponibles: 15,
    dias_tomados: 10,
    dias_acumulados: 5,
    total_disponible: 20
  }
]
```

### 4.4 REFERENTE - Solicitudes pendientes
```
GET /vacaciones/pendientes-referente
Response: [
  {
    id: number,
    usuario_nombre: "Carlos Ruiz",
    fecha_inicio: "2025-10-01",
    fecha_fin: "2025-10-15",
    dias_solicitados: 15,
    comentarios_empleado: "Viaje",
    fecha_creacion: "2025-11-03"
  }
]
```

### 4.5 REFERENTE - Responder solicitud
```
PUT /vacaciones/responder-referente/:id
Body: {
  aprobado: true,
  comentario: "Aprobado por referente"
}
Response: {
  id: number,
  estado: "pendiente_rh"  // Si aprobó, pasa a RH
}
```

### 4.6 RH - Solicitudes pendientes
```
GET /vacaciones/pendientes-rh
Response: [
  {
    id: number,
    usuario_nombre: "Carlos Ruiz",
    fecha_inicio: "2025-10-01",
    estado: "pendiente_rh",
    referente_comentario: "Aprobado"
  }
]
```

### 4.7 RH - Responder solicitud
```
PUT /vacaciones/responder-rh/:id
Body: {
  aprobado: true,
  comentario: "Aprobado por RH"
}
Response: {
  id: number,
  estado: "aprobado"  // Si aprobó, termina el flujo
}
```

## 5. COMPONENTES FRONTEND

### 5.1 PANEL EMPLEADO (/vacaciones)
```
┌─────────────────────────────────┐
│  MIS VACACIONES - AÑO 2025      │
├─────────────────────────────────┤
│ 📊 RESUMEN                      │
│  • Días disponibles: 15         │
│  • Días acumulados: 5           │
│  • Total: 20                    │
│  • Tomados: 10                  │
├─────────────────────────────────┤
│ ✋ NUEVA SOLICITUD              │
│  [Fecha inicio] [Fecha fin]     │
│  [Comentarios]                  │
│  [ENVIAR]                       │
├─────────────────────────────────┤
│ 📋 MIS SOLICITUDES              │
│  ✓ 01/10-15/10 [APROBADO]       │
│  ⏳ 20/11-25/11 [PENDIENTE]      │
│  ✗ 01/09-05/09 [RECHAZADO]      │
├─────────────────────────────────┤
│ 📚 HISTORIAL COMPLETO           │
│  [Ver detalles de años previos] │
└─────────────────────────────────┘
```

### 5.2 PANEL REFERENTE
```
┌─────────────────────────────────┐
│  SOLICITUDES PENDIENTES         │
│  (Rol: Referente Vacaciones)    │
├─────────────────────────────────┤
│ 1. Carlos Ruiz                  │
│    01/10 - 15/10 (15 días)      │
│    Comentario: "Viaje familiar" │
│    [APROBAR] [RECHAZAR]         │
│                                 │
│ 2. Ana García                   │
│    20/11 - 25/11 (5 días)       │
│    [APROBAR] [RECHAZAR]         │
└─────────────────────────────────┘
```

### 5.3 PANEL RH/ADMIN
```
┌─────────────────────────────────┐
│  SOLICITUDES PENDIENTES RH      │
│  (Rol: Admin RH)                │
├─────────────────────────────────┤
│ • Carlos Ruiz (Aprobado ref.)   │
│   01/10 - 15/10                 │
│   [APROBAR] [RECHAZAR]          │
│                                 │
│ TODAS LAS SOLICITUDES           │
│ [Ver reporte] [Estadísticas]    │
└─────────────────────────────────┘
```

## 6. VALIDACIONES

### 6.1 Validación de Solicitud (EMPLEADO)
- ✅ Debe cumplir Ley 20.744 (10 días mínimo, lunes-viernes, antes 31/5)
- ✅ Debe tener días disponibles
- ✅ No puede haber solapamiento con solicitud existente
- ✅ 6 meses + 125 días trabajados
- ✅ No puede solicitar periodos pasados

### 6.2 Validación de Aprobación (REFERENTE)
- ✅ Verificar que tiene permisos
- ✅ Registrar quién aprueba y cuándo
- ✅ Guardar comentario

### 6.3 Validación de Aprobación (RH)
- ✅ Verificar que tiene permisos
- ✅ Registrar quién aprueba y cuándo
- ✅ Guardar comentario
- ✅ Si rechaza en RH, vuelve a empleado con motivo

## 7. NOTIFICACIONES (FUTURA MEJORA)
- 📧 Empleado: Confirmar recepción solicitud
- 📧 Referente: Nueva solicitud pendiente
- 📧 Empleado: Referente aprobó/rechazó
- 📧 RH: Nueva solicitud aprobada por referente
- 📧 Empleado: RH aprobó/rechazó solicitud

## 8. REPORTE ADMIN
```
Solicitudes por estado:
- Pendiente Referente: 5
- Pendiente RH: 3
- Aprobadas: 45
- Rechazadas: 2

Empleado con más días: Juan (25 días)
Empleado sin solicitud: Ana
```

---

**PRÓXIMOS PASOS:**
1. Crear/actualizar tabla `vacaciones_solicitadas`
2. Implementar endpoints API
3. Crear componentes frontend
4. Integrar validaciones Ley 20.744
5. Pruebas completas del flujo
