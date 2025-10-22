/**
 * Utilidades para prevención de SQL Injection
 *
 * IMPORTANTE: Estas utilidades NO reemplazan el uso de queries parametrizadas.
 * SIEMPRE usa parámetros preparados (placeholders ?) para valores.
 *
 * Estas funciones son para validar nombres de columnas y tablas cuando
 * necesites construcción dinámica de queries.
 */

/**
 * Valida que un nombre de columna sea seguro
 * Solo permite letras, números y guiones bajos
 *
 * @param {string} columnName - Nombre de columna a validar
 * @returns {boolean} - true si es válido
 */
function isValidColumnName(columnName) {
  if (typeof columnName !== 'string') {
    return false;
  }

  // Solo letras, números, guiones bajos
  // No permitir espacios, puntos, punto y coma, comillas, etc.
  const regex = /^[a-zA-Z_][a-zA-Z0-9_]*$/;

  return regex.test(columnName);
}

/**
 * Valida que un nombre de tabla sea seguro
 * Solo permite letras, números y guiones bajos
 *
 * @param {string} tableName - Nombre de tabla a validar
 * @returns {boolean} - true si es válido
 */
function isValidTableName(tableName) {
  if (typeof tableName !== 'string') {
    return false;
  }

  // Solo letras, números, guiones bajos
  const regex = /^[a-zA-Z_][a-zA-Z0-9_]*$/;

  return regex.test(tableName);
}

/**
 * Valida múltiples nombres de columnas contra una whitelist
 *
 * @param {Array<string>} columns - Columnas a validar
 * @param {Array<string>} allowedColumns - Columnas permitidas (whitelist)
 * @returns {boolean} - true si todas las columnas están permitidas
 */
function validateColumnsWhitelist(columns, allowedColumns) {
  if (!Array.isArray(columns) || !Array.isArray(allowedColumns)) {
    return false;
  }

  return columns.every(col => allowedColumns.includes(col));
}

/**
 * Sanitiza un nombre de columna o tabla
 * ADVERTENCIA: NO usar esto como única protección.
 * Siempre preferir whitelist y queries parametrizadas.
 *
 * @param {string} identifier - Nombre a sanitizar
 * @returns {string} - Identificador escapado
 */
function escapeIdentifier(identifier) {
  if (typeof identifier !== 'string') {
    throw new Error('Identifier must be a string');
  }

  // Remover cualquier cosa que no sea alfanumérica o guión bajo
  return identifier.replace(/[^a-zA-Z0-9_]/g, '');
}

/**
 * Valida un ORDER BY clause contra columnas permitidas
 *
 * @param {string} orderBy - Columna para ordenar
 * @param {Array<string>} allowedColumns - Columnas permitidas
 * @param {string} direction - 'ASC' o 'DESC'
 * @returns {Object|null} - {column, direction} si es válido, null si no
 */
function validateOrderBy(orderBy, allowedColumns, direction = 'ASC') {
  if (!orderBy || !Array.isArray(allowedColumns)) {
    return null;
  }

  // Validar columna
  if (!allowedColumns.includes(orderBy)) {
    return null;
  }

  // Validar dirección
  const dir = direction.toUpperCase();
  if (dir !== 'ASC' && dir !== 'DESC') {
    return null;
  }

  return {
    column: orderBy,
    direction: dir
  };
}

/**
 * Construye cláusula WHERE segura con múltiples condiciones
 * IMPORTANTE: Los valores deben ser parametrizados separadamente
 *
 * @param {Object} conditions - Objeto con condiciones {columna: operator}
 * @param {Array<string>} allowedColumns - Columnas permitidas
 * @returns {Object} - {whereClause, params} para usar con query parametrizada
 *
 * @example
 * const {whereClause, placeholders} = buildWhereClause(
 *   {nombre: '=', edad: '>='},
 *   ['nombre', 'edad', 'email']
 * );
 * // whereClause = 'nombre = ? AND edad >= ?'
 * // Luego: db.query(`SELECT * FROM tabla WHERE ${whereClause}`, [valorNombre, valorEdad])
 */
function buildWhereClause(conditions, allowedColumns) {
  if (!conditions || typeof conditions !== 'object') {
    return { whereClause: '1=1', placeholders: 0 };
  }

  const validOperators = ['=', '!=', '<', '>', '<=', '>=', 'LIKE', 'NOT LIKE', 'IN', 'NOT IN'];
  const clauses = [];
  let placeholderCount = 0;

  for (const [column, operator] of Object.entries(conditions)) {
    // Validar columna
    if (!allowedColumns.includes(column)) {
      console.warn(`⚠️  Column '${column}' not in whitelist, skipping`);
      continue;
    }

    // Validar operador
    const op = operator.toUpperCase();
    if (!validOperators.includes(op)) {
      console.warn(`⚠️  Invalid operator '${operator}', skipping`);
      continue;
    }

    clauses.push(`${column} ${op} ?`);
    placeholderCount++;
  }

  return {
    whereClause: clauses.length > 0 ? clauses.join(' AND ') : '1=1',
    placeholders: placeholderCount
  };
}

/**
 * EJEMPLOS DE USO SEGURO
 */

// ❌ NUNCA HACER ESTO:
// const sql = `SELECT * FROM users WHERE name = '${req.body.name}'`;

// ✅ SIEMPRE HACER ESTO:
// const sql = 'SELECT * FROM users WHERE name = ?';
// db.query(sql, [req.body.name], callback);

// ✅ Para nombres de columnas dinámicos, usar whitelist:
// const allowedColumns = ['nombre', 'apellido', 'email', 'telefono'];
// if (!validateColumnsWhitelist([req.query.sortBy], allowedColumns)) {
//   return res.status(400).json({ error: 'Invalid sort column' });
// }
// const sql = `SELECT * FROM users ORDER BY ${req.query.sortBy} ASC`;

module.exports = {
  isValidColumnName,
  isValidTableName,
  validateColumnsWhitelist,
  escapeIdentifier,
  validateOrderBy,
  buildWhereClause
};
