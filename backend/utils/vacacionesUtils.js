/**
 * Utilidades para cálculo de vacaciones según Ley 20.744 Argentina
 * Refactorizado para simplicidad y robustez
 */

/**
 * Calcula los días de vacaciones correspondientes según la antigüedad
 * Art. 150 Ley 20.744
 */
function calcularDiasPorAntiguedad(añosAntiguedad) {
  if (añosAntiguedad < 5) return 14;   // Hasta 5 años: 14 días corridos
  if (añosAntiguedad < 10) return 21;  // 5-10 años: 21 días corridos 
  if (añosAntiguedad < 20) return 28;  // 10-20 años: 28 días corridos
  return 35;                           // Más de 20 años: 35 días corridos
}

/**
 * Calcula la antigüedad en años desde la fecha de ingreso
 */
function calcularAntiguedad(fechaIngreso, fechaReferencia = new Date()) {
  const ingreso = new Date(fechaIngreso);
  const referencia = new Date(fechaReferencia);
  
  let años = referencia.getFullYear() - ingreso.getFullYear();
  const diferenciaMeses = referencia.getMonth() - ingreso.getMonth();
  
  // Ajustar si aún no ha cumplido años
  if (diferenciaMeses < 0 || (diferenciaMeses === 0 && referencia.getDate() < ingreso.getDate())) {
    años--;
  }
  
  return Math.max(0, años);
}

/**
 * Valida si una solicitud de vacaciones cumple con los requisitos legales
 * Versión simplificada y robusta
 */
function validarSolicitudVacaciones(fechaInicio, fechaFin, modoEstricto = false) {
  const inicio = new Date(fechaInicio);
  const fin = new Date(fechaFin);
  const hoy = new Date();
  
  // Normalizar a medianoche
  hoy.setHours(0, 0, 0, 0);
  inicio.setHours(0, 0, 0, 0);
  fin.setHours(0, 0, 0, 0);
  
  const errores = [];
  const advertencias = [];
  
  // Validación 1: Fechas válidas
  if (isNaN(inicio.getTime()) || isNaN(fin.getTime())) {
    errores.push('Las fechas proporcionadas no son válidas');
    return { valido: false, errores, advertencias, diasSolicitados: 0 };
  }
  
  // Validación 2: Fecha de inicio no puede ser anterior a hoy
  if (inicio < hoy) {
    errores.push('La fecha de inicio no puede ser anterior a hoy');
  }
  
  // Validación 3: Fecha de inicio debe ser anterior a fecha de fin
  if (inicio >= fin) {
    errores.push('La fecha de inicio debe ser anterior a la fecha de fin');
  }
  
  // Calcular días solicitados (días corridos)
  const diasSolicitados = Math.ceil((fin - inicio) / (1000 * 60 * 60 * 24)) + 1;
  
  // Validación 4: Mínimo 10 días hábiles (Art. 154)
  if (diasSolicitados < 10) {
    if (modoEstricto) {
      errores.push('Las vacaciones deben ser de al menos 10 días hábiles (Ley 20.744 Art. 154)');
    } else {
      advertencias.push('Se recomienda solicitar al menos 10 días hábiles según Ley 20.744');
    }
  }
  
  // Validación 5: Debería comenzar lunes (Art. 154)
  const diaSemana = inicio.getDay(); // 0=domingo, 1=lunes
  if (diaSemana !== 1) {
    const diasSemana = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
    advertencias.push(`Nota: Las vacaciones comienzan ${diasSemana[diaSemana]}. Se recomienda que comiencen lunes (Ley 20.744 Art. 154)`);
  }
  
  // Validación 6: Período recomendado (1 oct - 30 abr)
  const añoVacaciones = fin.getFullYear();
  const inicioPeríodo = new Date(añoVacaciones - 1, 9, 1); // 1 octubre año anterior
  const finPeríodo = new Date(añoVacaciones, 3, 30);       // 30 abril año actual
  
  const dentroPeríodo = (inicio >= inicioPeríodo && fin <= finPeríodo);
  
  if (!dentroPeríodo) {
    advertencias.push(`Período recomendado: 1 octubre ${añoVacaciones - 1} al 30 abril ${añoVacaciones}. Estas vacaciones están fuera del período habitual.`);
  }
  
  // Validación 7: No debe finalizar después del 31 de mayo (solo para período estándar)
  const limite31Mayo = new Date(añoVacaciones, 4, 31); // 31 mayo
  if (dentroPeríodo && fin > limite31Mayo) {
    if (modoEstricto) {
      errores.push(`Las vacaciones del período estándar deben finalizar antes del 31 de mayo (Ley 20.744 Art. 153). Fin solicitado: ${fin.toLocaleDateString('es-AR')}`);
    } else {
      advertencias.push('Se recomienda que las vacaciones del período estándar finalicen antes del 31 de mayo');
    }
  }
  
  return {
    valido: errores.length === 0,
    errores,
    advertencias,
    diasSolicitados,
    dentroPeríodo,
    cumpleRequisitos: errores.length === 0
  };
}

/**
 * Calcula el período de vacaciones para un año determinado
 */
function calcularPeriodoVacaciones(año) {
  return {
    inicio: new Date(año - 1, 9, 1), // 1 octubre del año anterior
    fin: new Date(año, 3, 30),       // 30 abril del año
    descripcion: `1 de octubre ${año - 1} al 30 de abril ${año}`
  };
}

/**
 * Verifica si un empleado cumple los requisitos mínimos para vacaciones
 * Art. 151: Requiere 6 meses de trabajo
 */
function verificarRequisitosMínimos(fechaIngreso, año = new Date().getFullYear()) {
  const ingreso = new Date(fechaIngreso);
  const hoy = new Date();
  
  // Calcular días trabajados
  const diasTrabajados = Math.floor((hoy - ingreso) / (1000 * 60 * 60 * 24));
  const seisM = 180; // días aproximados
  
  const cumpleAntigüedad = diasTrabajados >= seisM;
  
  return {
    cumpleRequisitos: cumpleAntigüedad,
    cumpleAntigüedad,
    diasTrabajados,
    diasRequeridos: seisM,
    detalle: cumpleAntigüedad 
      ? `✓ ${diasTrabajados} días (>= 180)` 
      : `✗ ${diasTrabajados} días (< 180)`
  };
}

module.exports = {
  calcularDiasPorAntiguedad,
  calcularAntiguedad,
  validarSolicitudVacaciones,
  calcularPeriodoVacaciones,
  verificarRequisitosMínimos
};