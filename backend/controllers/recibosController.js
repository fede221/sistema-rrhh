// Firmar recibo: valida la contraseña y marca el recibo como firmado
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');

// Función para sanitizar texto y manejar caracteres especiales
const sanitizeText = (text) => {
  if (text === null || text === undefined) return null;
  
  // Convertir a string
  let str = String(text);
  
  // Remover caracteres de control y BOM
  str = str.replace(/[\x00-\x1F\x7F-\x9F\uFEFF\uFFFE\uFFFF]/g, '');
  
  // Normalizar caracteres especiales comunes usando códigos Unicode
  str = str.replace(/[áàäâãå]/g, 'a');
  str = str.replace(/[éèëê]/g, 'e');
  str = str.replace(/[íìïî]/g, 'i');
  str = str.replace(/[óòöôõø]/g, 'o');
  str = str.replace(/[úùüû]/g, 'u');
  str = str.replace(/ñ/g, 'n');
  str = str.replace(/ç/g, 'c');
  str = str.replace(/[ÁÀÄÂÃÅ]/g, 'A');
  str = str.replace(/[ÉÈËÊ]/g, 'E');
  str = str.replace(/[ÍÌÏÎ]/g, 'I');
  str = str.replace(/[ÓÒÖÔÕØ]/g, 'O');
  str = str.replace(/[ÚÙÜÛ]/g, 'U');
  str = str.replace(/Ñ/g, 'N');
  str = str.replace(/Ç/g, 'C');
  
  // Remover acentos sueltos y caracteres problemáticos
  str = str.replace(/[´`¨^~]/g, '');
  
  // Normalizar comillas y guiones
  str = str.replace(/['']/g, "'");
  str = str.replace(/[""]/g, '"');
  str = str.replace(/[–—]/g, '-');
  str = str.replace(/…/g, '...');
  
  // Trim espacios
  str = str.trim();
  
  // Limitar longitud para evitar truncamiento
  if (str.length > 255) {
    str = str.substring(0, 255);
  }
  
  return str;
};

// Función para sanitizar campos numéricos (DNI, CUIL, Legajo, etc.)
const sanitizeNumericField = (value) => {
  if (value === null || value === undefined) return null;
  
  // Convertir a string
  let str = String(value);
  
  // Remover espacios, tabs y caracteres de control
  str = str.replace(/[\s\t\r\n\x00-\x1F\x7F-\x9F]/g, '');
  
  // Si queda vacío después de limpiar, devolver null
  if (str === '') return null;
  
  return str;
};

exports.firmarRecibo = async (req, res) => {
  const user = req.user;
  const { periodo, password, legajo } = req.body;
  if (!user || !user.dni || !periodo || !password) {
    return res.status(400).json({ error: 'Datos faltantes' });
  }
  try {
    // Buscar usuario y validar contraseña
    db.query('SELECT password FROM usuarios WHERE dni = ?', [user.dni], async (err, results) => {
      if (err || !results.length) {
        return res.status(401).json({ error: 'Usuario no encontrado' });
      }
      const hash = results[0].password;
      const match = await bcrypt.compare(password, hash);
      if (!match) {
        return res.status(401).json({ error: 'Contraseña incorrecta' });
      }
      // Marcar recibo como firmado y guardar fecha/hora de firma
      const fechaFirma = new Date();
      
      // Si se especifica un legajo, filtrar por él también
      let updateQuery = 'UPDATE recibos_excel_raw SET Firmado = 1, fecha_firma = ? WHERE DocNumero = ? AND PeriodoLiquidacion = ?';
      let updateParams = [fechaFirma, user.dni, periodo];
      
      if (legajo) {
        updateQuery += ' AND Legajo = ?';
        updateParams.push(legajo);
      }
      
      db.query(updateQuery, updateParams, (err2) => {
        if (err2) {
          return res.status(500).json({ error: 'No se pudo firmar el recibo' });
        }
        return res.json({ 
          success: true,
          fechaFirma: fechaFirma,
          legajo: legajo 
        });
      });
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Error al firmar recibo' });
  }
};
let cancelRequested = false;
let currentImportId = null; // ID único de la importación en curso

// Función para crear registro en el historial
const createHistoryRecord = (importData) => {
  return new Promise((resolve, reject) => {
    const sql = `
      INSERT INTO historial_importaciones_recibos 
      (importID, usuario_importador, usuario_id, archivo_importado, periodo_liquidacion, fecha_pago, tipo_liquidacion, fecha_inicio, total_registros, estado_importacion)
      VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), ?, 'en_proceso')
    `;
    
    db.query(sql, [
      importData.importID,
      importData.usuario_importador,
      importData.usuario_id,
      importData.archivo_importado,
      importData.periodo_liquidacion,
      importData.fecha_pago,
      importData.tipo_liquidacion,
      importData.total_registros
    ], (err, result) => {
      if (err) reject(err);
      else resolve(result);
    });
  });
};

// Función para actualizar el historial
// Whitelist de columnas permitidas para prevenir SQL injection
const ALLOWED_HISTORY_COLUMNS = [
  'estado_importacion',
  'fecha_fin',
  'tiempo_procesamiento',
  'registros_procesados',
  'registros_exitosos',
  'registros_fallidos',
  'observaciones'
];

const updateHistoryRecord = (importID, updates) => {
  return new Promise((resolve, reject) => {
    const fields = [];
    const values = [];

    Object.keys(updates).forEach(key => {
      // Validación de seguridad: solo permitir columnas en whitelist
      if (!ALLOWED_HISTORY_COLUMNS.includes(key)) {
        console.warn(`⚠️  Attempted to update non-whitelisted column: ${key}`);
        return; // Skip columna no permitida
      }

      fields.push(`${key} = ?`);
      values.push(updates[key]);
    });

    if (fields.length === 0) return resolve();

    values.push(importID);
    const sql = `UPDATE historial_importaciones_recibos SET ${fields.join(', ')}, updated_at = NOW() WHERE importID = ?`;

    db.query(sql, values, (err, result) => {
      if (err) reject(err);
      else resolve(result);
    });
  });
};

exports.cancelImport = async (req, res) => {
  cancelRequested = true;
  try {
    if (currentImportId) {
      // Actualizar el historial antes de eliminar registros
      await updateHistoryRecord(currentImportId, {
        estado_importacion: 'cancelada',
        fecha_fin: new Date(),
        tiempo_procesamiento: importProgress.startTime ? Math.floor((Date.now() - importProgress.startTime) / 1000) : 0,
        registros_procesados: importProgress.processed || 0,
        observaciones: 'Importación cancelada por el usuario'
      });
      
      // Eliminar solo los registros de la importación actual
      await new Promise((resolve, reject) => {
        db.query(
          'DELETE FROM recibos_excel_raw WHERE importID = ?',
          [currentImportId],
          (err, result) => {
            if (err) reject(err);
            else resolve(result);
          }
        );
      });
      console.log(`Registros eliminados para importID: ${currentImportId}`);
    }
    
    importProgress = {
      total: 0,
      processed: 0,
      startTime: null,
      estimatedTime: null,
      finished: true
    };
    
    // Reset del import ID
    const cancelledImportId = currentImportId;
    currentImportId = null;
    
    return res.json({ 
      message: 'Importación cancelada y registros eliminados.',
      importId: cancelledImportId
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Error al cancelar la importación.' });
  }
};
// Variable global para progreso
let importProgress = {
  total: 0,
  processed: 0,
  startTime: null,
  estimatedTime: null,
  finished: false
};
const db = require('../config/db');
const reciboTemplate = require('../utils/reciboTemplate');

// Función helper para construir URLs absolutas de imágenes
const buildAbsoluteUrl = (relativePath) => {
  if (!relativePath) return null;
  
  // Si ya es una URL absoluta, devolverla tal como está
  if (relativePath.startsWith('http://') || relativePath.startsWith('https://')) {
    return relativePath;
  }
  
  // Para frontend con proxy configurado, usar URL relativa
  // El proxy redirigirá /uploads/* a http://localhost:3001/uploads/*
  const path = relativePath.startsWith('/') ? relativePath : `/${relativePath}`;
  return path; // Devolver solo la ruta relativa
};
// Generar HTML de recibo para un usuario y periodo
exports.generarReciboHTML = async (req, res) => {
  const user = req.user;
  const { periodo, legajo } = req.query;
  if (!user || !user.dni || !periodo) {
    return res.status(400).json({ error: 'Datos faltantes' });
  }
  try {
    // Buscar recibos y datos de empresa
    let query = `
      SELECT r.*, r.fecha_firma, e.nombre as empresa_nombre, e.razon_social as empresa_razon_social, 
             e.cuit as empresa_cuit, e.direccion as empresa_direccion, e.logo_url as empresa_logo_url, 
             e.firma_url as empresa_firma_url, l.numero_legajo
      FROM recibos_excel_raw r
      LEFT JOIN legajos l ON r.DocNumero = l.nro_documento AND (r.Legajo = l.numero_legajo OR r.Legajo = REPLACE(REPLACE(l.numero_legajo, 'R0', ''), 'R', ''))
      LEFT JOIN empresas e ON l.empresa_id = e.id
      WHERE r.DocNumero = ? AND r.PeriodoLiquidacion = ?
    `;
    let params = [user.dni, periodo];
    
    // Si se especifica un legajo específico, filtrar por él
    if (legajo) {
      query += ` AND r.Legajo = ?`;
      params.push(legajo);
    }
    
    query += ` ORDER BY e.nombre, r.Legajo`;
    
    db.query(query, params, (err, results) => {
      if (err || !results.length) {
        return res.status(404).json({ error: 'Recibo no encontrado' });
      }
      
      // Si hay múltiples recibos (múltiples empresas), generar HTML combinado
      if (results.length > 1 && !legajo) {
        // Agrupar recibos por empresa
        const recibosPorEmpresa = {};
        results.forEach(r => {
          const empresaKey = r.empresa_nombre || 'Sin Empresa';
          if (!recibosPorEmpresa[empresaKey]) {
            recibosPorEmpresa[empresaKey] = [];
          }
          recibosPorEmpresa[empresaKey].push(r);
        });
        
        // Generar HTML con múltiples empresas
        let htmlCompleto = '';
        const empresaDataArray = []; // Para modo debug
        const empresaKeys = Object.keys(recibosPorEmpresa);
        empresaKeys.forEach((empresaNombre, index) => {
          const recibosEmpresa = recibosPorEmpresa[empresaNombre];
          const r = recibosEmpresa[0]; // Tomar el primer recibo como referencia

          // LOG: Mostrar todos los conceptos disponibles
          console.log('========================================');
          console.log(`EMPRESA: ${empresaNombre}`);
          console.log(`Total de conceptos: ${recibosEmpresa.length}`);
          console.log('Conceptos disponibles:');
          recibosEmpresa.forEach((concepto, idx) => {
            console.log(`  [${idx}] ConcDescr: "${concepto.ConcDescr}" | ConcImpHabCRet: ${concepto.ConcImpHabCRet}`);
          });

          // Buscar el concepto "Basico" para obtener el sueldo correcto
          const conceptoBasico = recibosEmpresa.find(concepto => 
            concepto.ConcDescr && 
            (concepto.ConcDescr.toLowerCase().includes('basico') || 
             concepto.ConcDescr.toLowerCase().includes('básico') ||
             concepto.ConcDescr.toLowerCase().includes('sueldo'))
          );
          const sueldoBasico = conceptoBasico ? conceptoBasico.ConcImpHabCRet : 0;
          
          // LOG: Resultado de la búsqueda
          console.log('Búsqueda de concepto Básico:');
          if (conceptoBasico) {
            console.log(`  ✓ ENCONTRADO - ConcDescr: "${conceptoBasico.ConcDescr}"`);
            console.log(`  ✓ ConcImpHabCRet: ${conceptoBasico.ConcImpHabCRet}`);
            console.log(`  ✓ sueldoBasico asignado: ${sueldoBasico}`);
          } else {
            console.log('  ✗ NO ENCONTRADO - sueldoBasico será 0');
          }
          console.log('========================================');

          const data = {
            empresa: {
              nombre: r.empresa_nombre,
              razon_social: r.empresa_razon_social,
              cuit: r.empresa_cuit,
              direccion: r.empresa_direccion,
              logoUrl: buildAbsoluteUrl(r.empresa_logo_url),
              firmaUrl: buildAbsoluteUrl(r.empresa_firma_url)
            },
            empleado: {
              legajo: r.Legajo,
              nombre: r.Nombre,
              cuil: r.CUIL,
              sueldo: sueldoBasico,
              ingreso: r.FecIngreso,
              antiguedad: r.FecBaseAnt,
              egreso: r.FecEgreso,
              centro_costos: r.CentroADesc,
              tarea: r.CategoriaNombre
            },
            periodo: r.PeriodoLiquidacion,
            cuenta: r.NroCtaBancaria,
            recibos: recibosEmpresa,
            esMultiEmpresa: true,
            numeroEmpresa: index + 1,
            totalEmpresas: empresaKeys.length,
            _debug: {
              conceptoBasico: conceptoBasico ? conceptoBasico.ConcDescr : null,
              sueldoBasico: sueldoBasico,
              matchedRow: conceptoBasico || null
            }
          };

          empresaDataArray.push(data);

          htmlCompleto += reciboTemplate(data);

          // Agregar salto de página entre empresas (excepto la última)
          if (index < empresaKeys.length - 1) {
            htmlCompleto += '<div style="page-break-after: always;"></div>';
          }
        });

        // Si se solicita modo debug, devolver JSON con los datos por empresa
        if (req.query && req.query.debug === '1') {
          return res.json({ empresas: empresaDataArray });
        }

        res.set('Content-Type', 'text/html');
        res.send(htmlCompleto);
      } else {
        // Un solo recibo o legajo específico
        const r = results[0];
        
        // LOG: Mostrar todos los conceptos disponibles
        console.log('========================================');
        console.log('RECIBO ÚNICO (o legajo específico)');
        console.log(`Total de filas: ${results.length}`);
        console.log('Conceptos disponibles:');
        results.forEach((concepto, idx) => {
          console.log(`  [${idx}] ConcDescr: "${concepto.ConcDescr}" | ConcImpHabCRet: ${concepto.ConcImpHabCRet}`);
        });
        
        // Buscar el concepto "Basico" para obtener el sueldo correcto
        const conceptoBasico = results.find(concepto => 
          concepto.ConcDescr && 
          (concepto.ConcDescr.toLowerCase().includes('basico') || 
           concepto.ConcDescr.toLowerCase().includes('básico') ||
           concepto.ConcDescr.toLowerCase().includes('sueldo'))
        );
        const sueldoBasico = conceptoBasico ? conceptoBasico.ConcImpHabCRet : 0;
        
        // LOG: Resultado de la búsqueda
        console.log('Búsqueda de concepto Básico:');
        if (conceptoBasico) {
          console.log(`  ✓ ENCONTRADO - ConcDescr: "${conceptoBasico.ConcDescr}"`);
          console.log(`  ✓ ConcImpHabCRet: ${conceptoBasico.ConcImpHabCRet}`);
          console.log(`  ✓ sueldoBasico asignado: ${sueldoBasico}`);
        } else {
          console.log('  ✗ NO ENCONTRADO - sueldoBasico será 0');
        }
        console.log('========================================');
        
        const data = {
          empresa: {
            nombre: r.empresa_nombre,
            razon_social: r.empresa_razon_social,
            cuit: r.empresa_cuit,
            direccion: r.empresa_direccion,
            logoUrl: buildAbsoluteUrl(r.empresa_logo_url),
            firmaUrl: buildAbsoluteUrl(r.empresa_firma_url)
          },
          empleado: {
            legajo: r.Legajo,
            nombre: r.Nombre,
            cuil: r.CUIL,
            sueldo: sueldoBasico,
            ingreso: r.FecIngreso,
            antiguedad: r.FecBaseAnt,
            egreso: r.FecEgreso,
            centro_costos: r.CentroADesc,
            tarea: r.CategoriaNombre
          },
          periodo: r.PeriodoLiquidacion,
          cuenta: r.NroCtaBancaria,
          recibos: results,
          esMultiEmpresa: false
        };
        
        // Agregar info de depuración
        data._debug = {
          conceptoBasico: conceptoBasico ? conceptoBasico.ConcDescr : null,
          sueldoBasico: sueldoBasico,
          matchedRow: conceptoBasico || null,
          rowsReturned: results.length
        };

        if (req.query && req.query.debug === '1') {
          return res.json(data);
        }

        const html = reciboTemplate(data);
        res.set('Content-Type', 'text/html');
        res.send(html);
      }
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Error al generar recibo' });
  }
};
const path = require('path');
const fs = require('fs');

const xlsx = require('xlsx');







exports.importarRecibos = async (req, res) => {
  try {
    const { periodoLiquidacion, fechaPago, tipoLiquidacion } = req.body;
    const file = req.file;
    if (!file || !periodoLiquidacion || !fechaPago || !tipoLiquidacion) {
      return res.status(400).json({ 
        error: 'Faltan datos requeridos.',
        detalles: {
          archivo: !file ? 'No se seleccionó archivo' : null,
          periodo: !periodoLiquidacion ? 'No se especificó período de liquidación' : null,
          fechaPago: !fechaPago ? 'No se especificó fecha de pago' : null,
          tipoLiquidacion: !tipoLiquidacion ? 'No se especificó tipo de liquidación' : null
        }
      });
    }

    // Validar formato de archivo
    const allowedExtensions = ['.xlsx', '.xls'];
    const fileExtension = path.extname(file.originalname).toLowerCase();
    if (!allowedExtensions.includes(fileExtension)) {
      // Eliminar archivo subido
      if (fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      }
      return res.status(400).json({ 
        error: 'Formato de archivo no válido',
        detalles: {
          extension: `Archivo tiene extensión ${fileExtension}`,
          permitidos: 'Solo se permiten archivos .xlsx y .xls'
        }
      });
    }

    // Generar un ID único para esta importación
    currentImportId = uuidv4();
    console.log(`Nueva importación iniciada con ID: ${currentImportId}`);
    
    // Obtener información del usuario
    const usuario = req.user;
    const usuarioNombre = `${usuario.nombre || ''} ${usuario.apellido || ''}`.trim() || usuario.email || 'Usuario desconocido';
    
    cancelRequested = false;

    let workbook, sheetName, sheet, rows;

    try {
      workbook = xlsx.readFile(file.path);
      sheetName = workbook.SheetNames[0];
      sheet = workbook.Sheets[sheetName];
      rows = xlsx.utils.sheet_to_json(sheet, { defval: null });
    } catch (excelError) {
      // Eliminar archivo subido
      if (fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      }
      return res.status(400).json({ 
        error: 'Error al procesar el archivo Excel',
        detalles: {
          mensaje: 'No se pudo leer el contenido del archivo',
          sugerencia: 'Verifique que el archivo no esté corrupto y que tenga el formato correcto',
          errorTecnico: excelError.message
        }
      });
    }

    // Validar que el archivo no esté vacío
    if (!rows || rows.length === 0) {
      if (fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      }
      return res.status(400).json({ 
        error: 'El archivo está vacío o no tiene datos válidos',
        detalles: {
          filas: 0,
          sugerencia: 'Verifique que el archivo contenga datos en la primera hoja y que tenga el formato esperado'
        }
      });
    }

    // Validar columnas requeridas
    const columnasRequeridas = ['CUIL', 'Legajo', 'Nombre', 'DocNumero'];
    const columnasPresentes = Object.keys(rows[0] || {});
    const columnasFaltantes = columnasRequeridas.filter(col => !columnasPresentes.includes(col));
    
    if (columnasFaltantes.length > 0) {
      if (fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      }
      return res.status(400).json({ 
        error: 'Faltan columnas requeridas en el archivo',
        detalles: {
          faltantes: columnasFaltantes,
          presentes: columnasPresentes.slice(0, 10), // Mostrar solo las primeras 10
          sugerencia: 'Verifique que el archivo tenga el formato correcto de recibos de sueldo'
        }
      });
    }

    // Crear registro en el historial
    try {
      await createHistoryRecord({
        importID: currentImportId,
        usuario_importador: usuarioNombre,
        usuario_id: usuario.id,
        archivo_importado: file.originalname,
        periodo_liquidacion: periodoLiquidacion,
        fecha_pago: fechaPago,
        tipo_liquidacion: tipoLiquidacion,
        total_registros: rows.length
      });
      console.log(`Registro de historial creado para importación ${currentImportId}`);
    } catch (historyError) {
      console.error('Error al crear registro de historial:', historyError);
      // Continuar con la importación aunque falle el historial
    }

    importProgress = {
      total: rows.length,
      processed: 0,
      startTime: Date.now(),
      estimatedTime: null,
      finished: false,
      errors: [], // Agregar array de errores
      warnings: [] // Agregar array de advertencias
    };

    function excelDateToString(excelDate) {
      if (!excelDate || isNaN(excelDate)) return null;
      
      // Excel fecha serial: días desde 1900-01-01 (pero Excel piensa que 1900 es bisiesto)
      // Ajuste para el bug de Excel: restar 1 si es después del 29/02/1900
      let adjustedDate = excelDate;
      if (excelDate > 60) {
        adjustedDate = excelDate - 1; // Corrección por el bug del año bisiesto de 1900
      }
      
      // Convertir a milisegundos desde epoch Unix
      // 25569 es el número serial de Excel para 1970-01-01
      const date = new Date((adjustedDate - 25569) * 86400 * 1000);
      
      // Usar métodos UTC para evitar problemas con zona horaria
      const yyyy = date.getUTCFullYear();
      const mm = String(date.getUTCMonth() + 1).padStart(2, '0');
      const dd = String(date.getUTCDate()).padStart(2, '0');
      return `${yyyy}-${mm}-${dd}`;
    }

    const dateFields = ['FecIngreso','FecEgreso','FecBaseAnt','FecBaseIndem','FecJubilacion'];

    let i = 0;
    let registrosExitosos = 0;
    let registrosFallidos = 0;
    
    async function processRow() {
      if (cancelRequested) {
        try {
          // Eliminar solo los registros de esta importación específica
          await new Promise((resolve, reject) => {
            db.query(
              'DELETE FROM recibos_excel_raw WHERE importID = ?',
              [currentImportId],
              (err, result) => {
                if (err) reject(err);
                else resolve(result);
              }
            );
          });
          console.log(`Importación ${currentImportId} cancelada y registros eliminados`);
        } catch (err) {
          console.error('Error al borrar registros cancelados:', err);
        }
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
        importProgress.finished = true;
        currentImportId = null;
        return;
      }
      
      if (i >= rows.length) {
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
        importProgress.finished = true;
        
        // Actualizar historial como completada
        try {
          const estado = registrosFallidos === 0 ? 'completada' : 'completada_con_errores';
          await updateHistoryRecord(currentImportId, {
            estado_importacion: estado,
            fecha_fin: new Date(),
            tiempo_procesamiento: Math.floor((Date.now() - importProgress.startTime) / 1000),
            registros_procesados: i,
            registros_exitosos: registrosExitosos,
            registros_fallidos: registrosFallidos,
            observaciones: registrosFallidos > 0 ? 
              `Completada con errores - Exitosos: ${registrosExitosos}, Fallidos: ${registrosFallidos}` : 
              'Importación completada exitosamente'
          });
          console.log(`Importación ${currentImportId} completada y registrada en historial`);
        } catch (historyError) {
          console.error('Error al actualizar historial:', historyError);
        }
        
        currentImportId = null; // Reset después de completar
        return;
      }
      
      const row = rows[i];
      
      // Validar datos de la fila
      const filaErrors = [];
      if (!row.CUIL || String(row.CUIL).trim() === '') {
        filaErrors.push('CUIL faltante');
      }
      if (!row.Legajo || String(row.Legajo).trim() === '') {
        filaErrors.push('Legajo faltante');
      }
      if (!row.DocNumero || String(row.DocNumero).trim() === '') {
        filaErrors.push('Número de documento faltante');
      }
      
      if (filaErrors.length > 0) {
        importProgress.errors.push({
          fila: i + 1,
          errores: filaErrors,
          datos: `${row.Nombre || 'N/A'} - Legajo: ${row.Legajo || 'N/A'}`
        });
        registrosFallidos++;
        i++;
        setTimeout(processRow, 50);
        return;
      }

      const columns = [
        'CUIL','Legajo','Nombre','DocTipo','DocumentoDesc','DocNumero','FecIngreso','CentroA','CentroB','NroCtaBancaria',
        'ConcClaseLetras','ConcNro','ConcDescr','ConcCant','UnCant','NumeroRecibo','ConcImpHabCRet','ConcImpHabSRet','ConcImpRet',
        'AtributoEsp1','AtributoEsp2','AtributoEsp3','AtributoEsp4','AtributoEsp5','VariableReg1','VariableReg2','VariableReg3',
        'VariableReg4','VariableReg5','Observacion','IdLiquidacion','IdLegajo','CentroADesc','CentroBDesc','DescOS','TipoOS',
        'FecEgreso','LugarPago','LugarTrabajo','NroCopia','ModContratacionDesc','DescBco','FecBaseAnt','ConcObs','ObservsLibro',
        'provincia','IdPersona','IdCategoria','IdConvenio','ConvenioCodigo','ConvenioDenominacion','CategoriaCodigo',
        'CategoriaNombre','FecBaseIndem','CBU','FecJubilacion','PeriodoLiquidacion','FechaPago','importID','tipo_liquidacion'
      ];
      const placeholders = columns.map(() => '?').join(',');
      const sql = `INSERT INTO recibos_excel_raw (${columns.join(',')}) VALUES (${placeholders})`;
      
      // Definir campos de texto que necesitan sanitización
      const textFields = [
        'Nombre', 'DocumentoDesc', 'ConcClaseLetras', 'ConcDescr', 'AtributoEsp1', 'AtributoEsp2', 
        'AtributoEsp3', 'AtributoEsp4', 'AtributoEsp5', 'VariableReg1', 'VariableReg2', 'VariableReg3',
        'VariableReg4', 'VariableReg5', 'Observacion', 'CentroADesc', 'CentroBDesc', 'DescOS', 'TipoOS',
        'LugarPago', 'LugarTrabajo', 'ModContratacionDesc', 'DescBco', 'ConcObs', 'ObservsLibro',
        'provincia', 'ConvenioCodigo', 'ConvenioDenominacion', 'CategoriaCodigo', 'CategoriaNombre'
      ];
      
      // Definir campos numéricos que necesitan sanitización especial
      const numericFields = [
        'CUIL', 'Legajo', 'DocNumero', 'ConcNro', 'IdLiquidacion', 'IdLegajo', 'IdPersona', 
        'IdCategoria', 'IdConvenio', 'NroCopia', 'NumeroRecibo'
      ];
      
      const values = columns.map(col => {
        if (col === 'PeriodoLiquidacion') return periodoLiquidacion;
        if (col === 'FechaPago') return fechaPago;
        if (col === 'importID') return currentImportId; // Agregar el importID único
        if (col === 'tipo_liquidacion') return tipoLiquidacion; // Agregar el tipo de liquidación
        if (dateFields.includes(col)) {
          if (row[col] && !isNaN(row[col])) return excelDateToString(row[col]);
          return row[col] ?? null;
        }
        
        // Aplicar sanitización a campos numéricos
        if (numericFields.includes(col)) {
          return sanitizeNumericField(row[col]);
        }
        
        // Aplicar sanitización a campos de texto
        if (textFields.includes(col)) {
          return sanitizeText(row[col]);
        }
        
        return row[col] ?? null;
      });
      
      try {
        await new Promise((resolve, reject) => {
          db.query(sql, values, (err, result) => {
            if (err) reject(err);
            else resolve(result);
          });
        });
        registrosExitosos++;
      } catch (err) {
        console.error(`Error en fila ${i + 1}:`, err.message);
        console.error(`Datos problemáticos:`, {
          nombre: row.Nombre,
          legajo: row.Legajo,
          cuil: row.CUIL,
          encoding: row.Nombre ? Buffer.from(String(row.Nombre)).toString('hex') : 'N/A'
        });
        
        let errorMessage = err.message;
        
        // Mensaje más específico para errores de encoding/caracteres
        if (err.code === 'ER_TRUNCATED_WRONG_VALUE_FOR_FIELD') {
          errorMessage = 'Error de caracteres especiales en el texto. Se aplicó sanitización pero el valor sigue siendo problemático.';
        }
        
        importProgress.errors.push({
          fila: i + 1,
          errores: [`Error de base de datos: ${errorMessage}`],
          datos: `${sanitizeText(row.Nombre) || 'N/A'} - Legajo: ${row.Legajo || 'N/A'}`
        });
        registrosFallidos++;
      }
      
      importProgress.processed = i + 1;
      const elapsed = (Date.now() - importProgress.startTime) / 1000;
      const avgPerRow = elapsed / (i + 1);
      importProgress.estimatedTime = avgPerRow * (importProgress.total - importProgress.processed);
      
      // Actualizar progreso en historial cada 100 registros
      if ((i + 1) % 100 === 0) {
        try {
          await updateHistoryRecord(currentImportId, {
            registros_procesados: i + 1,
            registros_exitosos: registrosExitosos,
            registros_fallidos: registrosFallidos
          });
        } catch (historyError) {
          console.error('Error al actualizar progreso en historial:', historyError);
        }
      }
      
      i++;
      setTimeout(processRow, 50);
    }
    setImmediate(processRow);

    return res.json({ 
      message: 'Importación iniciada exitosamente.',
      importId: currentImportId,
      filename: file.originalname,
      totalRecords: rows.length,
      success: true
    });
  } catch (err) {
    console.error(err);
    
    // Limpiar archivo si existe
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    // Marcar como error en historial si existe
    if (currentImportId) {
      try {
        await updateHistoryRecord(currentImportId, {
          estado_importacion: 'error',
          fecha_fin: new Date(),
          observaciones: `Error: ${err.message}`
        });
      } catch (historyError) {
        console.error('Error al registrar error en historial:', historyError);
      }
      currentImportId = null;
    }
    
    return res.status(500).json({ 
      error: 'Error interno del servidor al importar recibos.',
      detalles: {
        mensaje: err.message,
        sugerencia: 'Verifique el formato del archivo y la conexión con la base de datos'
      }
    });
  }
};

// Endpoint para consultar progreso
exports.getImportProgress = (req, res) => {
  res.json({
    ...importProgress,
    currentImportId: currentImportId,
    hasErrors: importProgress.errors && importProgress.errors.length > 0,
    hasWarnings: importProgress.warnings && importProgress.warnings.length > 0,
    errorCount: importProgress.errors ? importProgress.errors.length : 0,
    warningCount: importProgress.warnings ? importProgress.warnings.length : 0
  });
};

// Endpoint para obtener los recibos del usuario autenticado
exports.getMisRecibos = async (req, res) => {
  // Obtener el usuario del token (asumiendo que el middleware lo pone en req.user)
  const user = req.user;
  if (!user) {
    return res.status(401).json({ error: 'No autorizado' });
  }

  // Si es admin y no tiene DNI, devolver array vacío en lugar de error
  if (!user.dni && (user.rol === 'admin' || user.rol === 'superadmin' || user.rol === 'admin_rrhh')) {
    console.log('Usuario admin sin DNI, devolviendo array vacío:', user.email);
    return res.json([]);
  }

  // Si no es admin y no tiene DNI, es un error
  if (!user.dni) {
    return res.status(401).json({ error: 'No autorizado - DNI requerido' });
  }

  // Consulta que obtiene recibos para todos los legajos del usuario
  db.query(`
    SELECT 
      r.*,
      r.fecha_firma,
      e.nombre as empresa_nombre,
      e.razon_social as empresa_razon_social,
      e.cuit as empresa_cuit,
      e.direccion as empresa_direccion,
      e.telefono as empresa_telefono,
      e.email as empresa_email,
      e.contacto_nombre as empresa_contacto_nombre,
      e.logo_url as empresa_logo_url,
      e.firma_url as empresa_firma_url,
      l.numero_legajo as legajo_numero,
      l.empresa_id as legajo_empresa_id
    FROM recibos_excel_raw r
    LEFT JOIN legajos l ON r.DocNumero = l.nro_documento
    LEFT JOIN empresas e ON l.empresa_id = e.id
    WHERE r.DocNumero = ?
    ORDER BY e.nombre, r.PeriodoLiquidacion DESC
  `, [user.dni], (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Error al obtener recibos' });
    }
    res.json(results);
  });
};

// Endpoint para obtener el historial de importaciones (solo admins)
exports.getHistorialImportaciones = async (req, res) => {
  const user = req.user;
  if (!user || (user.rol !== 'superadmin' && user.rol !== 'admin_rrhh' && user.rol !== 'admin')) {
    return res.status(403).json({ error: 'No autorizado para ver el historial' });
  }
  
  try {
    const { page = 1, limit = 20, estado, usuario, periodo } = req.query;
    const offset = (page - 1) * limit;
    
    let whereClause = '';
    let params = [];
    let conditions = [];
    
    if (estado) {
      conditions.push('estado_importacion = ?');
      params.push(estado);
    }
    
    if (usuario) {
      conditions.push('usuario_importador LIKE ?');
      params.push(`%${usuario}%`);
    }
    
    if (periodo) {
      conditions.push('periodo_liquidacion LIKE ?');
      params.push(`%${periodo}%`);
    }
    
    if (conditions.length > 0) {
      whereClause = 'WHERE ' + conditions.join(' AND ');
    }
    
    // Consulta para contar el total
    const countSQL = `SELECT COUNT(*) as total FROM historial_importaciones_recibos ${whereClause}`;
    
    db.query(countSQL, params, (err, countResult) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: 'Error al contar registros' });
      }
      
      const total = countResult[0].total;
      
      // Consulta principal con paginación
      const dataSQL = `
        SELECT 
          id, importID, usuario_importador, archivo_importado, 
          periodo_liquidacion, fecha_pago, fecha_importacion, 
          fecha_inicio, fecha_fin, estado_importacion,
          total_registros, registros_procesados, registros_exitosos, 
          registros_fallidos, tiempo_procesamiento, observaciones
        FROM historial_importaciones_recibos 
        ${whereClause}
        ORDER BY fecha_importacion DESC 
        LIMIT ? OFFSET ?
      `;
      
      params.push(parseInt(limit), parseInt(offset));
      
      db.query(dataSQL, params, (err, results) => {
        if (err) {
          console.error(err);
          return res.status(500).json({ error: 'Error al obtener historial' });
        }
        
        res.json({
          data: results,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: total,
            totalPages: Math.ceil(total / limit)
          }
        });
      });
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// Endpoint para obtener estadísticas del historial
exports.getEstadisticasImportaciones = async (req, res) => {
  const user = req.user;
  if (!user || (user.rol !== 'superadmin' && user.rol !== 'admin_rrhh' && user.rol !== 'admin')) {
    return res.status(403).json({ error: 'No autorizado' });
  }
  
  try {
    const statsSQL = `
      SELECT 
        COUNT(*) as total_importaciones,
        SUM(CASE WHEN estado_importacion = 'completada' THEN 1 ELSE 0 END) as completadas,
        SUM(CASE WHEN estado_importacion = 'cancelada' THEN 1 ELSE 0 END) as canceladas,
        SUM(CASE WHEN estado_importacion = 'error' THEN 1 ELSE 0 END) as con_error,
        SUM(CASE WHEN estado_importacion = 'en_proceso' THEN 1 ELSE 0 END) as en_proceso,
        SUM(registros_exitosos) as total_registros_importados,
        AVG(tiempo_procesamiento) as tiempo_promedio,
        DATE(MAX(fecha_importacion)) as ultima_importacion
      FROM historial_importaciones_recibos
    `;
    
    db.query(statsSQL, (err, results) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: 'Error al obtener estadísticas' });
      }
      
      res.json(results[0]);
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};
