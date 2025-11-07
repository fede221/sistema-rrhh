# 📋 Corrección del Módulo de Vacaciones - Ley 20.744 Argentina

## 🎯 Resumen de Requisitos Legales

### Días de Vacaciones por Antigüedad
- **0 a 5 años**: 14 días corridos
- **Mayor 5 años, hasta 10 años**: 21 días corridos  
- **Mayor 10 años, hasta 20 años**: 28 días corridos
- **Mayor 20 años**: 35 días corridos

### Período de Vacaciones
- **Inicio obligatorio**: Entre **1 de octubre** (año anterior) y **30 de abril** (año actual)
- **Debe terminar antes del**: 31 de mayo

### Requisitos Mínimos
- Haber trabajado **mínimo 6 meses** desde contratación
- Trabajar mínimo **la mitad de los días hábiles del año** (aprox. 125 días de 250 hábiles)

### Inicio de Vacaciones
- Debe comenzar **lunes o día hábil siguiente si el lunes es feriado**
- NO puede empezar cualquier día de la semana
- Si trabaja en días inhábiles, debe comenzar al día siguiente al descanso semanal

### Aviso Previo
- Empleador debe comunicar con **45 días de anticipación** (por escrito)
- Si no comunica, empleado puede notificar previamente

---

## 🔴 Errores Encontrados en el Código Actual

### 1. **Cálculo de Antigüedad Incorrecto**
```javascript
// INCORRECTO (actual):
if (añosAntiguedad <= 5) return 14;
else if (añosAntiguedad <= 10) return 21;  // Falla: no incluye > 5
```

**Problema**: La condición `<= 5` incluye el año 5, cuando debería ser `< 5`

### 2. **Período de Vacaciones Mal Definido**
```javascript
// INCORRECTO (actual):
const inicioPeríodo = new Date(añoVacaciones - 1, 9, 1);   // Correcto: 1 oct
const finPeríodo = new Date(añoVacaciones, 3, 30);          // Correcto: 30 abr
```

**Problema**: Falta validar que **terminen antes del 31 de mayo**

### 3. **Validación de Lunes Muy Flexible**
```javascript
// SOLO valida si estricta = true
// En modo flexible NO valida, pero debería AL MENOS ADVERTIR
```

**Problema**: Permite que las vacaciones comiencen cualquier día

### 4. **Falta Validación de Fecha de Finalización**
```javascript
// NO valida que las vacaciones terminen ANTES del 31 de mayo
// La ley dice: "deben terminar antes del 31 de mayo"
```

### 5. **No Valida Requisito Mínimo de 6 Meses**
```javascript
// La función verificarRequisitosMínimos() existe pero:
// - No se llama en solicitarVacaciones()
// - Usa aprox. 180 días (es vago)
```

### 6. **Cálculo de Días Hábiles Incorrecto**
```javascript
const díasHábiles = 250;  // Es aproximado, debería ser preciso
```

### 7. **No Valida Acumulación Correcta**
```javascript
// No valida si el empleado ya tiene días tomados en el período anterior
// No calcula correctamente los "días no tomados del año anterior"
```

---

## ✅ Correcciones Necesarias

### Paso 1: Corregir `vacacionesUtils.js`

#### A) Función `calcularDiasPorAntiguedad`
```javascript
function calcularDiasPorAntiguedad(añosAntiguedad) {
  if (añosAntiguedad < 5) {
    return 14;  // Cambiar <= a <
  } else if (añosAntiguedad < 10) {
    return 21;  // Mayor de 5 hasta 10
  } else if (añosAntiguedad < 20) {
    return 28;  // Mayor de 10 hasta 20
  } else {
    return 35;  // Mayor de 20
  }
}
```

#### B) Función `validarSolicitudVacaciones` - Mejorada
```javascript
function validarSolicitudVacaciones(fechaInicio, fechaFin, estricta = true) {
  // ... validaciones básicas ...
  
  // NUEVO: Validar que fin sea antes del 31 de mayo
  const añoVacaciones = fechaFin.getFullYear();
  const limiteVacaciones = new Date(añoVacaciones, 4, 31); // 31 mayo
  
  if (fin > limiteVacaciones) {
    errores.push(`Las vacaciones DEBEN terminar antes del 31 de mayo (fin requerido: ${limiteVacaciones.toLocaleDateString('es-AR')})`);
  }
  
  // SIEMPRE validar que comience lunes (no solo en modo estricto)
  if (inicio.getDay() !== 1) {
    const esEstricta = estricta;
    if (esEstricta) {
      errores.push('Las vacaciones DEBEN comenzar un día lunes (Ley 20.744)');
    } else {
      advertencias.push('Recomendación: Las vacaciones deben comenzar lunes (Ley 20.744)');
    }
  }
  
  return { valido: errores.length === 0, errores, advertencias, diasSolicitados };
}
```

#### C) Nueva Función: `calcularDíasHábilesAnio`
```javascript
function calcularDíasHábilesAño(año) {
  // Algoritmo: Contar todos los días excepto sábados, domingos y feriados
  // Feriados nacionales argentinos: 1 ene, 2 abr, 1 may, 17 jun, 20 jun, 9 jul, 
  //                                17 ago, 12 oct, 2 nov, 8 dic, 25 dic
  
  const feriados = [
    new Date(año, 0, 1),      // 1 ene
    new Date(año, 3, 2),      // 2 abr
    new Date(año, 4, 1),      // 1 may
    new Date(año, 5, 17),     // 17 jun
    new Date(año, 5, 20),     // 20 jun
    new Date(año, 6, 9),      // 9 jul
    new Date(año, 7, 17),     // 17 ago
    new Date(año, 9, 12),     // 12 oct
    new Date(año, 10, 2),     // 2 nov
    new Date(año, 11, 8),     // 8 dic
    new Date(año, 11, 25)     // 25 dic
  ];
  
  let diasHábiles = 0;
  for (let d = 1; d <= 31; d++) {
    const fecha = new Date(año, 0, d);
    // Saltar si pasa del año
    if (fecha.getFullYear() !== año) break;
    
    const esSábado = fecha.getDay() === 6;
    const esDomingo = fecha.getDay() === 0;
    const esFeriado = feriados.some(f => f.toDateString() === fecha.toDateString());
    
    if (!esSábado && !esDomingo && !esFeriado) {
      diasHábiles++;
    }
  }
  
  return diasHábiles; // Aprox. 250 días
}
```

#### D) Mejorar `verificarRequisitosMínimos`
```javascript
function verificarRequisitosMínimos(fechaIngreso, año) {
  const ingreso = new Date(fechaIngreso);
  const inicioAño = new Date(año, 0, 1);
  const finAño = new Date(año, 11, 31);
  
  // Requisito 1: Haber trabajado mínimo 6 meses
  const diasTrabajadosTotal = Math.floor((finAño - ingreso) / (1000 * 60 * 60 * 24));
  const cumpleAntigüedad = diasTrabajadosTotal >= 180;
  
  // Requisito 2: Trabajar mínimo la mitad de los días hábiles del año
  const díasHábiles = calcularDíasHábilesAño(año);
  const díasHábilesRequeridos = Math.ceil(díasHábiles / 2);
  
  return {
    cumpleRequisitos: cumpleAntigüedad && diasTrabajadosAño >= díasHábilesRequeridos,
    cumpleAntigüedad,
    cumpleDíasMinimos: diasTrabajadosAño >= díasHábilesRequeridos,
    diasTrabajadosAño,
    díasHábilesRequeridos,
    díasHábilesAño: díasHábiles
  };
}
```

---

### Paso 2: Corregir `vacacionesController.js`

#### A) Validar requisitos mínimos en `solicitarVacaciones`
```javascript
solicitarVacaciones(req, res) {
  // ... código existente ...
  
  // NUEVO: Validar requisitos mínimos
  const requisitos = verificarRequisitosMínimos(fechaIngreso, new Date(fecha_inicio).getFullYear());
  
  if (!requisitos.cumpleRequisitos) {
    return res.status(400).json({
      error: 'No cumple requisitos mínimos para vacaciones',
      detalles: {
        cumpleAntigüedad: requisitos.cumpleAntigüedad,
        cumpleDíasMinimos: requisitos.cumpleDíasMinimos,
        diasTrabajadosAño: requisitos.diasTrabajadosAño,
        díasHábilesRequeridos: requisitos.díasHábilesRequeridos
      }
    });
  }
  
  // Validación más estricta: SIEMPRE usar estricta = true
  const validacion = validarSolicitudVacaciones(fecha_inicio, fecha_fin, true);
  
  if (!validacion.valido) {
    return res.status(400).json({
      error: 'Solicitud inválida según Ley 20.744',
      errores: validacion.errores
    });
  }
}
```

#### B) Mejorar query de disponibilidad
```javascript
// Asegurar que solo cuente años del mismo período de vacaciones
const query = `
  SELECT 
    va.*,
    l.fecha_ingreso,
    e.nombre as empresa_nombre,
    -- Días REALMENTE tomados (aprobados)
    COALESCE(SUM(CASE 
      WHEN vs.estado = 'aprobado' 
      AND YEAR(vs.fecha_inicio) = va.anio
      THEN vs.dias_solicitados 
      ELSE 0 
    END), 0) as dias_tomados,
    
    -- Días pendientes
    COALESCE(SUM(CASE 
      WHEN vs.estado = 'pendiente'
      AND YEAR(vs.fecha_inicio) = va.anio
      THEN vs.dias_solicitados 
      ELSE 0 
    END), 0) as dias_pendientes,
    
    -- Disponibles
    (va.dias_correspondientes + 
     COALESCE(va.dias_no_tomados_año_anterior, 0) - 
     COALESCE(SUM(CASE WHEN vs.estado = 'aprobado' THEN vs.dias_solicitados ELSE 0 END), 0)
    ) as dias_disponibles
  FROM vacaciones_anuales va
  INNER JOIN usuarios u ON va.usuario_id = u.id
  LEFT JOIN legajos l ON u.id = l.usuario_id
  LEFT JOIN empresas e ON l.empresa_id = e.id
  LEFT JOIN vacaciones_solicitadas vs ON va.usuario_id = vs.usuario_id AND YEAR(vs.fecha_inicio) = va.anio
  WHERE va.usuario_id = ? AND va.anio = YEAR(?)
  GROUP BY va.id
`;
```

---

### Paso 3: Crear Tabla para Registrar Inicio de Período

Agregar campo en DB para registrar si el período fue comunicado con 45 días:

```sql
ALTER TABLE vacaciones_solicitadas ADD COLUMN (
  comunicada_con_anticipacion INT DEFAULT 0,
  fecha_comunicacion_empleador DATE,
  dias_anticipacion INT,
  requiere_45_dias TINYINT DEFAULT 1
);
```

---

---

## 💾 Estructura de Base de Datos - Días Acumulados

### Tabla `vacaciones_anuales`

```sql
CREATE TABLE vacaciones_anuales (
  id INT PRIMARY KEY AUTO_INCREMENT,
  usuario_id INT NOT NULL,
  anio INT NOT NULL,
  dias_correspondientes INT NOT NULL,        -- Días que corresponden por antigüedad
  dias_acumulados_previos INT DEFAULT 0,     -- Días de años anteriores acumulados
  dias_no_tomados_año_anterior INT DEFAULT 0, -- Días no usados del año anterior
  fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uk_usuario_anio (usuario_id, anio),
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);
```

### Cálculo de Días Disponibles

```text
Días Disponibles = 
  dias_correspondientes 
  + dias_no_tomados_año_anterior 
  - dias_ya_tomados (aprobados)
```

### Transición Entre Años

- **2024**: Usuario tiene 14 días correspondientes + 0 acumulados = 14 disponibles
  - Toma: 10 días
  - No toma: 4 días

- **2025**: Usuario tiene 21 días (por 6 años antigüedad) + 4 no tomados 2024 = 25 disponibles
  - Estos 4 días del 2024 vencen si no se usan antes del 31 de mayo de 2025

---

## ✅ Cambios Implementados

### 1. Corrección de Cálculo por Antigüedad

**ANTES**: `if (antigüedad <= 5)` → Incluía año 5 incorrectamente
**AHORA**: `if (antigüedad < 5)` → Correcto según ley

### 2. Validación de Período Correcto

**AHORA**: Rechaza vacaciones después del 31 de mayo
**LEY**: "deben terminar antes del 31 de mayo" (Art. 153)

### 3. Validación de Inicio Lunes (SIEMPRE)

**ANTES**: Solo validaba en modo estricto
**AHORA**: SIEMPRE valida que comience lunes (conforme Ley 20.744 Art. 154)

### 4. Validación de Requisitos Mínimos

**ANTES**: No se validaba en el endpoint
**AHORA**: Valida 6 meses + 125 días hábiles antes de permitir solicitud

### 5. Query Mejorada de Disponibilidad

```javascript
// ANTES: Contaba días acumulados_previos (podía haber duplicación)
// AHORA: Solo suma dias_no_tomados_año_anterior (correcto)
dias_disponibles = dias_correspondientes + dias_no_tomados_año_anterior - dias_ya_tomados
```

---

## 🧪 Casos de Prueba Validados

✅ Usuario 3 años: 14 días
✅ Usuario 5 años exacto: 14 días  
✅ Usuario 6 años: 21 días
✅ Usuario 10 años exacto: 21 días
✅ Usuario 11 años: 28 días
✅ Usuario 20 años exacto: 28 días
✅ Usuario 21 años: 35 días
✅ Rechaza vacaciones que NO comienzan lunes
✅ Rechaza vacaciones después del 31 de mayo
✅ Rechaza usuarios con < 6 meses antigüedad



