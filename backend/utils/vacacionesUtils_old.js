/**
 * Utilidades para gestión de vacaciones según Ley 20.744 (Argentina)
 */

/**
 * Valida una solicitud de vacaciones según la Ley 20.744
 * Art. 150-154: Requisitos de días, período, etc.
 */
function validarSolicitudVacaciones(fechaInicio, fechaFin, estricta = false) {
  const inicio = new Date(fechaInicio);
  const fin = new Date(fechaFin);
  const hoy = new Date();
  
  // Normalizar fechas a medianoche
  inicio.setHours(0, 0, 0, 0);
  fin.setHours(0, 0, 0, 0);
  hoy.setHours(0, 0, 0, 0);

  const errores = [];
  const advertencias = [];

  // VALIDACIÓN 1: Fechas válidas
  if (isNaN(inicio.getTime()) || isNaN(fin.getTime())) {
    errores.push('Las fechas proporcionadas no son válidas');
    return { valido: false, errores, advertencias, diasSolicitados: 0 };
  }

  // VALIDACIÓN 2: Fecha de inicio no puede ser anterior a hoy
  if (inicio < hoy) {
    errores.push('La fecha de inicio no puede ser anterior a hoy');
  }

  // VALIDACIÓN 3: Fecha de inicio debe ser anterior a fin
  if (inicio >= fin) {
    errores.push('La fecha de inicio debe ser anterior a la fecha de fin');
  }

  if (errores.length > 0) {
    return { valido: false, errores, advertencias, diasSolicitados: 0 };
  }

  // CÁLCULO: Días solicitados (incluye ambas fechas)
  const diasSolicitados = Math.ceil((fin - inicio) / (1000 * 60 * 60 * 24)) + 1;

  // VALIDACIÓN 4: Debe ser al menos 10 días hábiles (Art. 151)
  // Aproximación: 10 días corridos ~= 7-8 hábiles
  if (diasSolicitados < 7) {
    advertencias.push(`Solicitud de ${diasSolicitados} días. Recomendación: mínimo 10 días según Ley 20.744`);
  }

  // VALIDACIÓN 5: Debe comenzar lunes idealmente (Art. 154)
  const diaSemana = inicio.getDay(); // 0=domingo, 1=lunes...
  if (diaSemana !== 1) {
    const dias = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
    advertencias.push(`Comienza ${dias[diaSemana]}. Idealmente debe comenzar lunes (Ley 20.744 Art. 154)`);
  }

  // VALIDACIÓN 6: Período de vacaciones (1 oct - 30 abr recomendado)
  const year = fin.getFullYear();
  const periodoInicio = new Date(year - 1, 9, 1); // 1 oct año anterior
  const periodoFin = new Date(year, 3, 30); // 30 abr año actual

  const dentroDelPeriodo = (inicio >= periodoInicio && fin <= periodoFin);
  
  if (!dentroDelPeriodo) {
    advertencias.push('Período fuera del recomendado (1 oct - 30 abr). Verificar con RH');
  }

  return {
    valido: errores.length === 0,
    errores,
    advertencias,
    diasSolicitados,
    dentroDelPeriodo
  };
}

/**
 * Calcula la antigüedad en años
 */
function calcularAntiguedad(fechaIngreso) {
  const ingreso = new Date(fechaIngreso);
  const hoy = new Date();
  
  let años = hoy.getFullYear() - ingreso.getFullYear();
  const mesActual = hoy.getMonth();
  const mesIngreso = ingreso.getMonth();
  
  if (mesActual < mesIngreso || (mesActual === mesIngreso && hoy.getDate() < ingreso.getDate())) {
    años--;
  }
  
  return Math.max(0, años);
}

/**
 * Calcula días correspondientes según antigüedad (Ley 20.744 Art. 150)
 */
function calcularDiasPorAntiguedad(antigüedad) {
  if (antigüedad < 5) return 14;      // < 5 años: 14 días
  if (antigüedad < 10) return 21;     // 5-10 años: 21 días
  if (antigüedad < 20) return 28;     // 10-20 años: 28 días
  return 35;                           // > 20 años: 35 días
}

module.exports = {
  validarSolicitudVacaciones,
  calcularAntiguedad,
  calcularDiasPorAntiguedad
};
