# 📋 IMPLEMENTACIÓN FRONTEND - Vacaciones Ley 20.744

## 🎯 Objetivo
Actualizar componentes del frontend para reflejar las validaciones de la Ley 20.744.

---

## 📁 Archivos a Actualizar

### 1. `frontend/src/pages/Vacaciones/components/SolicitarVacaciones.js`

#### Cambios Necesarios

**A) Selector de Fecha - Solo Permitir Lunes**

```javascript
// Agregar validación en el DatePicker
const isLunes = (date) => {
  return date.getDay() === 1; // 1 = lunes
};

// En el componente, usar:
<DatePicker
  selected={fechaInicio}
  onChange={(date) => setFechaInicio(date)}
  filterDate={isLunes}
  disabled={date => date.getDay() !== 1}
  placeholderText="Selecciona un LUNES"
  dateFormat="dd/MM/yyyy"
/>
```

**B) Validación de Período**

```javascript
const validarPeriodo = (fechaInicio, fechaFin) => {
  const año = fechaInicio.getFullYear();
  const limiteMax = new Date(año, 4, 31); // 31 mayo
  
  if (fechaFin > limiteMax) {
    return {
      valido: false,
      error: `Vacaciones deben terminar antes del 31 de mayo. Máximo: ${limiteMax.toLocaleDateString('es-AR')}`
    };
  }
  
  const inicioMin = new Date(año - 1, 9, 1); // 1 octubre año anterior
  if (fechaInicio < inicioMin) {
    return {
      valido: false,
      error: `Período de vacaciones comienza el 1 de octubre. Mínimo: ${inicioMin.toLocaleDateString('es-AR')}`
    };
  }
  
  return { valido: true };
};
```

**C) Mostrar Requisitos Mínimos**

```javascript
// Antes del botón "Solicitar", mostrar:
{diasDisponibles < diasSolicitados && (
  <Alert severity="warning">
    ⚠️ No tienes suficientes días disponibles
    <br/>
    Disponibles: {diasDisponibles} | Solicitados: {diasSolicitados}
  </Alert>
)}

{diasDisponibles > 0 && (
  <Box sx={{ mt: 2, p: 2, bgcolor: '#f0f7ff', borderRadius: 1 }}>
    <Typography variant="body2">
      <strong>✅ Requisitos verificados:</strong>
      <ul>
        <li>✓ Antigüedad: {antiguedad} años</li>
        <li>✓ Días correspondientes: {diasCorrespondientes}</li>
        <li>✓ Días acumulados: {diasAcumulados}</li>
        <li>✓ Días disponibles: {diasDisponibles}</li>
      </ul>
    </Typography>
  </Box>
)}
```

---

### 2. `frontend/src/pages/Vacaciones/components/ResumenVacaciones.js`

#### Cambios Necesarios

**A) Mostrar Desglose de Días**

```javascript
<Card>
  <CardContent>
    <Typography variant="h6">📊 Resumen de Días de Vacaciones</Typography>
    
    <Table size="small" sx={{ mt: 2 }}>
      <TableBody>
        <TableRow>
          <TableCell>Días por antigüedad ({antiguedad} años)</TableCell>
          <TableCell align="right"><strong>{diasCorrespondientes} días</strong></TableCell>
        </TableRow>
        <TableRow>
          <TableCell>Días acumulados (año anterior)</TableCell>
          <TableCell align="right">{diasNoTomados} días</TableCell>
        </TableRow>
        <TableRow>
          <TableCell>Días ya utilizados (aprobados)</TableCell>
          <TableCell align="right">-{diasTomados} días</TableCell>
        </TableRow>
        <TableRow sx={{ bgcolor: '#e8f5e9' }}>
          <TableCell><strong>TOTAL DISPONIBLE</strong></TableCell>
          <TableCell align="right"><strong>{diasDisponibles} días</strong></TableCell>
        </TableRow>
      </TableBody>
    </Table>
    
    {diasNoTomados > 0 && (
      <Alert severity="info" sx={{ mt: 2 }}>
        ℹ️ Los {diasNoTomados} días acumulados del año anterior vencen el 31 de mayo.
        Asegúrate de usarlos antes de esa fecha.
      </Alert>
    )}
  </CardContent>
</Card>
```

**B) Información Legal**

```javascript
<Card sx={{ mt: 3, bgcolor: '#fff3cd' }}>
  <CardContent>
    <Typography variant="body2">
      <strong>ℹ️ Información Legal (Ley 20.744):</strong>
      <ul style={{ marginTop: '10px' }}>
        <li>Las vacaciones se toman entre el <strong>1 de octubre</strong> y el <strong>30 de abril</strong></li>
        <li>Deben <strong>comenzar un lunes</strong> (o día hábil siguiente si es feriado)</li>
        <li>Deben <strong>terminar antes del 31 de mayo</strong></li>
        <li>Requieren <strong>45 días de anticipación</strong> (comunicación del empleador)</li>
      </ul>
    </Typography>
  </CardContent>
</Card>
```

---

### 3. `frontend/src/pages/Vacaciones/components/MisSolicitudes.js`

#### Cambios Necesarios

**A) Mostrar Razones de Rechazo**

```javascript
const obtenerMensajeError = (respuesta) => {
  if (respuesta.error === 'Solicitud inválida - No cumple con Ley 20.744') {
    return (
      <Alert severity="error">
        <strong>❌ Rechazada por:</strong>
        <ul>
          {respuesta.errores.map((error, i) => (
            <li key={i}>{error}</li>
          ))}
        </ul>
      </Alert>
    );
  }
  return <Alert severity="error">{respuesta.error}</Alert>;
};
```

**B) Mostrar Estado con Colores**

```javascript
const obtenerColorEstado = (estado) => {
  switch (estado) {
    case 'aprobado': return 'success'; // Verde
    case 'rechazado': return 'error';   // Rojo
    case 'pendiente': return 'warning'; // Amarillo
    default: return 'default';
  }
};

// Usar en Chip:
<Chip
  label={estado.toUpperCase()}
  color={obtenerColorEstado(estado)}
  variant="outlined"
/>
```

---

### 4. `frontend/src/pages/Vacaciones/Vacaciones.js`

#### Cambios Necesarios

**A) Agregar Pestaña de Información Legal**

```javascript
import { Tabs, TabContext, TabList, TabPanel } from '@mui/lab';

const [tabValue, setTabValue] = React.useState('0');

<TabContext value={tabValue}>
  <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
    <TabList onChange={(e, v) => setTabValue(v)}>
      <Tab label="📅 Mis Vacaciones" value="0" />
      <Tab label="📋 Historial" value="1" />
      <Tab label="📚 Información Legal" value="2" />
    </TabList>
  </Box>
  
  <TabPanel value="0">
    <ResumenVacaciones />
    <SolicitarVacaciones />
    <MisSolicitudes />
  </TabPanel>
  
  <TabPanel value="1">
    <HistorialVacaciones />
  </TabPanel>
  
  <TabPanel value="2">
    <Card>
      <CardContent>
        <Typography variant="h6">Ley de Contrato de Trabajo 20.744 - Vacaciones</Typography>
        <Typography variant="body2" sx={{ mt: 2, whiteSpace: 'pre-line' }}>
{`PERÍODO:
• Del 1 de octubre de cada año al 30 de abril del año siguiente
• Deben terminar ANTES del 31 de mayo

INICIO:
• LUNES (o primer día hábil si el lunes es feriado)
• No se pueden comenzar en otro día

REQUISITOS:
• Mínimo 6 meses de antigüedad
• Haber trabajado la mitad de los días hábiles del año (~125 días)

DURACIÓN:
• Hasta 5 años: 14 días
• Mayor 5 años hasta 10: 21 días
• Mayor 10 años hasta 20: 28 días
• Mayor 20 años: 35 días

ACUMULACIÓN:
• Los días no tomados del año anterior se suman
• Vencen el 31 de mayo si no se usan

COMUNICACIÓN:
• El empleador debe avisar con 45 días de anticipación
• Si no avisa, puedes solicitar directamente`}
        </Typography>
      </CardContent>
    </Card>
  </TabPanel>
</TabContext>
```

---

## 🎨 Estilos Recomendados

### Alertas para Información Legal

```javascript
// Alerta de período
<Alert
  severity="info"
  icon={<InfoIcon />}
  sx={{ mb: 2 }}
>
  📅 Período: 1 octubre - 30 abril (máximo 31 mayo)
</Alert>

// Alerta de requisitos
<Alert
  severity="success"
  icon={<CheckCircleIcon />}
  sx={{ mb: 2 }}
>
  ✅ Cumples todos los requisitos para solicitar vacaciones
</Alert>

// Alerta de error
<Alert
  severity="error"
  icon={<ErrorIcon />}
  sx={{ mb: 2 }}
>
  ❌ No puedes solicitar vacaciones: {razón}
</Alert>
```

---

## ✅ Checklist de Implementación

- [ ] Validar que solo se permita lunes en selector de fecha
- [ ] Mostrar error si fin es después del 31 mayo
- [ ] Mostrar desglose de días disponibles
- [ ] Agregar información legal en componente
- [ ] Mostrar razones de rechazo claras
- [ ] Actualizar colores según estado
- [ ] Agregar pestaña de información legal
- [ ] Probar con diferentes casos (6, 11, 21+ años)
- [ ] Verificar mensajes de error en producción

---

## 🧪 Casos de Prueba Frontend

1. **Usuario con 3 años**: Debe ver 14 días disponibles
2. **Usuario con 6 años**: Debe ver 21 días (no 14)
3. **Usuario con < 6 meses**: No debe poder solicitar
4. **Seleccionar martes**: Debe rechazar con alerta
5. **Seleccionar después 31 mayo**: Debe rechazar con alerta
6. **Usuario con días acumulados**: Debe mostrar total + acumulados

---

## 📞 Soporte

Si encuentras problemas:
1. Revisar `VACACIONES_RESUMEN_EJECUTIVO.md`
2. Revisar backend logs: `npm run logs`
3. Probar con datos de prueba en staging

