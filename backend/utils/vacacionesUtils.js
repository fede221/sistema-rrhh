// Utilidades para cálculo de vacaciones según ley argentina

/**
 * Calcula los días de vacaciones correspondientes según la antigüedad
 * Basado en la Ley de Contrato de Trabajo 20.744 de Argentina
 * @param {number} añosAntiguedad - Años de antigüedad del empleado
 * @returns {number} - Días de vacaciones correspondientes
 */
function calcularDiasPorAntiguedad(añosAntiguedad) {
  if (añosAntiguedad <= 5) {
    return 14; // 14 días corridos
  } else if (añosAntiguedad <= 10) {
    return 21; // 21 días corridos
  } else if (añosAntiguedad <= 20) {
    return 28; // 28 días corridos
  } else {
    return 35; // 35 días corridos
  }
}

/**
 * Calcula la antigüedad en años a partir de la fecha de ingreso
 * @param {Date|string} fechaIngreso - Fecha de ingreso del empleado
 * @param {Date} fechaReferencia - Fecha de referencia (por defecto hoy)
 * @returns {number} - Años de antigüedad
 */
function calcularAntiguedad(fechaIngreso, fechaReferencia = new Date()) {
  const ingreso = new Date(fechaIngreso);
  const referencia = new Date(fechaReferencia);
  
  let años = referencia.getFullYear() - ingreso.getFullYear();
  const diferenciaMeses = referencia.getMonth() - ingreso.getMonth();
  
  // Ajustar si aún no ha cumplido años en la fecha de referencia
  if (diferenciaMeses < 0 || (diferenciaMeses === 0 && referencia.getDate() < ingreso.getDate())) {
    años--;
  }
  
  return Math.max(0, años);
}

/**
 * Valida si una solicitud de vacaciones cumple con los requisitos legales
 * @param {Date|string} fechaInicio - Fecha de inicio de vacaciones
 * @param {Date|string} fechaFin - Fecha de fin de vacaciones
 * @param {boolean} estricta - Si aplicar validaciones estrictas de la ley argentina
 * @returns {Object} - Resultado de la validación
 */
function validarSolicitudVacaciones(fechaInicio, fechaFin, estricta = false) {
  const inicio = new Date(fechaInicio);
  const fin = new Date(fechaFin);
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0); // Normalizar a medianoche para comparación
  inicio.setHours(0, 0, 0, 0);
  fin.setHours(0, 0, 0, 0);
  
  const errores = [];
  const advertencias = [];
  
  // Validar que las fechas sean válidas
  if (isNaN(inicio.getTime()) || isNaN(fin.getTime())) {
    errores.push('Las fechas proporcionadas no son válidas');
  }
  
  // Validar que la fecha de inicio no sea anterior a hoy
  if (inicio < hoy) {
    errores.push('La fecha de inicio no puede ser anterior a hoy');
  }
  
  // Validar que la fecha de inicio sea anterior a la fecha de fin
  if (inicio >= fin) {
    errores.push('La fecha de inicio debe ser anterior a la fecha de fin');
  }
  
  // Calcular días solicitados (días corridos)
  const diasSolicitados = Math.ceil((fin - inicio) / (1000 * 60 * 60 * 24)) + 1;
  
  if (estricta) {
    // Validar que las vacaciones comiencen un lunes (según ley argentina)
    if (inicio.getDay() !== 1) { // 1 = lunes
      errores.push('Las vacaciones deben comenzar un día lunes según la legislación argentina');
    }
    
    // Validar período de vacaciones (entre 1 oct y 30 abr del año siguiente)
    const añoVacaciones = inicio.getFullYear();
    const inicioPeríodo = new Date(añoVacaciones - 1, 9, 1); // 1 octubre año anterior
    const finPeríodo = new Date(añoVacaciones, 3, 30); // 30 abril año actual
    
    if (inicio < inicioPeríodo || fin > finPeríodo) {
      errores.push(`Las vacaciones deben tomarse entre el 1° de octubre ${añoVacaciones - 1} y el 30 de abril ${añoVacaciones}`);
    }
  } else {
    // Modo flexible: solo advertencias para mejores prácticas
    if (inicio.getDay() !== 1) {
      advertencias.push('Recomendamos iniciar las vacaciones un día lunes según la legislación argentina');
    }
    
    // Verificar si está en período recomendado
    const añoVacaciones = inicio.getFullYear();
    const inicioPeríodo = new Date(añoVacaciones - 1, 9, 1);
    const finPeríodo = new Date(añoVacaciones, 3, 30);
    
    if (inicio < inicioPeríodo || fin > finPeríodo) {
      advertencias.push(`Período recomendado: 1° de octubre ${añoVacaciones - 1} al 30 de abril ${añoVacaciones}`);
    }
  }
  
  return {
    valido: errores.length === 0,
    errores,
    advertencias,
    diasSolicitados
  };
}

/**
 * Calcula el período de vacaciones para un año determinado
 * @param {number} año - Año para calcular el período
 * @returns {Object} - Fechas de inicio y fin del período de vacaciones
 */
function calcularPeriodoVacaciones(año) {
  return {
    inicio: new Date(año - 1, 9, 1), // 1 octubre del año anterior
    fin: new Date(año, 3, 30), // 30 abril del año
    descripcion: `1 de octubre ${año - 1} al 30 de abril ${año}`
  };
}

/**
 * Verifica si un empleado cumple los requisitos mínimos para vacaciones
 * @param {Date|string} fechaIngreso - Fecha de ingreso del empleado
 * @param {number} diasTrabajados - Días trabajados en el año
 * @returns {Object} - Resultado de la verificación
 */
function verificarRequisitosMínimos(fechaIngreso, diasTrabajados) {
  const ingreso = new Date(fechaIngreso);
  const hoy = new Date();
  const diasTrabajo = Math.floor((hoy - ingreso) / (1000 * 60 * 60 * 24));
  
  // Requiere haber trabajado al menos 6 meses
  const seisM = 180; // días aprox
  const cumpleAntigüedad = diasTrabajo >= seisM;
  
  // Requiere haber trabajado al menos la mitad de los días hábiles del año
  const díasHábiles = 250; // días hábiles aprox por año
  const cumpleDíasMinimos = diasTrabajados >= (díasHábiles / 2);
  
  return {
    cumpleRequisitos: cumpleAntigüedad && cumpleDíasMinimos,
    cumpleAntigüedad,
    cumpleDíasMinimos,
    diasTrabajados,
    diasMínimosRequeridos: díasHábiles / 2
  };
}

module.exports = {
  calcularDiasPorAntiguedad,
  calcularAntiguedad,
  validarSolicitudVacaciones,
  calcularPeriodoVacaciones,
  verificarRequisitosMínimos
};
