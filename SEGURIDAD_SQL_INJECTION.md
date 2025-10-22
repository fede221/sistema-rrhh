# 🛡️ Prevención de SQL Injection

## 📋 Qué es SQL Injection

SQL Injection es una vulnerabilidad que permite a un atacante ejecutar comandos SQL arbitrarios en la base de datos al manipular inputs de usuario que se concatenan directamente en queries SQL.

**Ejemplo de ataque:**
```javascript
// ❌ CÓDIGO VULNERABLE:
const username = req.body.username; // Usuario ingresa: admin' OR '1'='1
const sql = `SELECT * FROM usuarios WHERE username = '${username}'`;
db.query(sql);

// Query resultante:
// SELECT * FROM usuarios WHERE username = 'admin' OR '1'='1'
// ⚠️ Esto devuelve TODOS los usuarios!
```

---

## ✅ Estado Actual del Proyecto

### Análisis de Seguridad Realizado

Hemos revisado todos los controladores y **NO se encontraron vulnerabilidades activas de SQL Injection**.

**Resumen:**
- ✅ Todas las queries usan **parámetros preparados** (placeholders `?`)
- ✅ No hay concatenación directa de valores de usuario
- ✅ Queries dinámicas solo usan keys hardcodeadas
- ✅ Se agregó whitelist a `updateHistoryRecord` como defensa adicional

---

## 🔒 Mejoras Implementadas

### 1. Utilidad de Sanitización SQL

**Archivo:** `backend/utils/sqlSanitizer.js`

Funciones disponibles:
- `isValidColumnName()` - Valida nombres de columnas
- `isValidTableName()` - Valida nombres de tablas
- `validateColumnsWhitelist()` - Valida contra whitelist
- `validateOrderBy()` - Valida ORDER BY clauses
- `buildWhereClause()` - Construye WHERE seguros

### 2. Whitelist en updateHistoryRecord

**Archivo:** `backend/controllers/recibosController.js`

```javascript
const ALLOWED_HISTORY_COLUMNS = [
  'estado_importacion',
  'fecha_fin',
  'tiempo_procesamiento',
  // ...
];

// Solo acepta columnas en whitelist
if (!ALLOWED_HISTORY_COLUMNS.includes(key)) {
  console.warn(`Attempted to update non-whitelisted column: ${key}`);
  return;
}
```

---

## 📚 Guía de Buenas Prácticas

### ✅ SIEMPRE Hacer

#### 1. Usar Queries Parametrizadas

```javascript
// ✅ CORRECTO - Parámetros preparados
const sql = 'SELECT * FROM usuarios WHERE dni = ? AND activo = ?';
db.query(sql, [dni, 1], (err, results) => {
  // ...
});

// ✅ CORRECTO - Múltiples parámetros
const sql = 'INSERT INTO legajos (nombre, apellido, dni) VALUES (?, ?, ?)';
db.query(sql, [nombre, apellido, dni], callback);

// ✅ CORRECTO - UPDATE con parámetros
const sql = 'UPDATE usuarios SET nombre = ?, apellido = ? WHERE id = ?';
db.query(sql, [nombre, apellido, id], callback);
```

#### 2. Usar Whitelist para Nombres Dinámicos

```javascript
const { validateColumnsWhitelist } = require('../utils/sqlSanitizer');

const sortBy = req.query.sortBy;
const allowedColumns = ['nombre', 'apellido', 'fecha_ingreso', 'salario'];

if (!validateColumnsWhitelist([sortBy], allowedColumns)) {
  return res.status(400).json({ error: 'Invalid sort column' });
}

const sql = `SELECT * FROM empleados ORDER BY ${sortBy} ASC`;
db.query(sql, callback);
```

#### 3. Validar Nombres de Columnas

```javascript
const { isValidColumnName } = require('../utils/sqlSanitizer');

const columnName = req.query.column;

if (!isValidColumnName(columnName)) {
  return res.status(400).json({ error: 'Invalid column name' });
}
```

#### 4. Usar WHERE Dinámicos Seguros

```javascript
const { buildWhereClause } = require('../utils/sqlSanitizer');

const filters = {
  nombre: '=',
  edad: '>='
};

const allowedColumns = ['nombre', 'apellido', 'edad', 'ciudad'];

const { whereClause } = buildWhereClause(filters, allowedColumns);
const values = [req.body.nombre, req.body.edad];

const sql = `SELECT * FROM usuarios WHERE ${whereClause}`;
db.query(sql, values, callback);
```

---

### ❌ NUNCA Hacer

#### 1. Concatenación Directa

```javascript
// ❌ NUNCA HACER ESTO - VULNERABLE A SQL INJECTION
const sql = `SELECT * FROM usuarios WHERE username = '${req.body.username}'`;

// ❌ NUNCA HACER ESTO - VULNERABLE
const sql = 'SELECT * FROM usuarios WHERE id = ' + req.params.id;

// ❌ NUNCA HACER ESTO - VULNERABLE
const sql = `DELETE FROM usuarios WHERE dni = ${req.body.dni}`;
```

#### 2. Template Strings con Valores

```javascript
// ❌ NUNCA HACER ESTO
const { nombre, apellido } = req.body;
const sql = `INSERT INTO usuarios (nombre, apellido) VALUES ('${nombre}', '${apellido}')`;

// ✅ CORRECTO
const sql = 'INSERT INTO usuarios (nombre, apellido) VALUES (?, ?)';
db.query(sql, [nombre, apellido], callback);
```

#### 3. Nombres de Columnas sin Validar

```javascript
// ❌ NUNCA HACER ESTO
const sortBy = req.query.sortBy; // Usuario puede enviar: "id; DROP TABLE usuarios--"
const sql = `SELECT * FROM usuarios ORDER BY ${sortBy}`;

// ✅ CORRECTO - Con whitelist
const allowedColumns = ['id', 'nombre', 'fecha_creacion'];
if (!allowedColumns.includes(sortBy)) {
  return res.status(400).json({ error: 'Invalid sort column' });
}
const sql = `SELECT * FROM usuarios ORDER BY ${sortBy}`;
```

#### 4. LIKE sin Escapar

```javascript
// ⚠️ CUIDADO - Puede causar problemas
const searchTerm = req.query.search;
const sql = `SELECT * FROM usuarios WHERE nombre LIKE '%${searchTerm}%'`;

// ✅ CORRECTO - Con parámetros
const sql = 'SELECT * FROM usuarios WHERE nombre LIKE ?';
db.query(sql, [`%${searchTerm}%`], callback);
```

---

## 🧪 Testing para SQL Injection

### Test Manual

#### Test 1: Login Bypass
```bash
# Intentar bypass con comilla simple
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"dni":"admin'\'' OR '\''1'\''='\''1","password":"anything"}'

# Debe responder: 401 Unauthorized
```

#### Test 2: Union Attack
```bash
# Intentar UNION injection en búsqueda
curl "http://localhost:3001/api/usuarios?search=' UNION SELECT password FROM usuarios--"

# Debe responder: 400 Bad Request o resultados vacíos
```

#### Test 3: Time-based Blind
```bash
# Intentar time-based injection
curl "http://localhost:3001/api/legajos/1' AND SLEEP(5)--"

# Debe responder inmediatamente sin delay
```

### Test Automatizado con SQLMap

```bash
# Instalar sqlmap
sudo apt-get install sqlmap

# Test de endpoint de login
sqlmap -u "http://localhost:3001/api/auth/login" \
  --method=POST \
  --data='{"dni":"test","password":"test"}' \
  --headers="Content-Type: application/json" \
  --level=5 \
  --risk=3

# Resultado esperado: No se encuentra vulnerabilidad
```

---

## 🔍 Auditoría de Código

### Checklist de Revisión

Al revisar código SQL, verifica:

- [ ] ¿Se usan parámetros preparados (`?`) para todos los valores?
- [ ] ¿Nombres de columnas/tablas dinámicos tienen whitelist?
- [ ] ¿No hay concatenación de strings con valores de usuario?
- [ ] ¿Se validan todos los inputs antes de usar?
- [ ] ¿ORDER BY, LIMIT, y OFFSET usan valores seguros?
- [ ] ¿Se loguean queries ejecutadas para auditoría?

### Patrones a Buscar

```bash
# Buscar concatenación peligrosa
grep -r "db.query.*+.*req\." backend/

# Buscar template strings con req
grep -r 'db.query.*\${.*req\.' backend/

# Buscar queries sin parámetros
grep -r "db.query('[^?]*')" backend/
```

---

## 🛠️ Herramientas de Prevención

### 1. ORM (Alternativa)

Considera usar un ORM para abstraer queries:

```javascript
// Sequelize
const users = await Usuario.findAll({
  where: { dni: req.body.dni }
});

// Knex.js
const users = await knex('usuarios').where('dni', req.body.dni);
```

### 2. Query Builder

```javascript
// mysql2 con parámetros nombrados
const sql = 'SELECT * FROM usuarios WHERE dni = :dni AND activo = :activo';
await db.execute(sql, { dni, activo: 1 });
```

### 3. Linter SQL

```bash
npm install eslint-plugin-sql

# .eslintrc.js
plugins: ['sql'],
rules: {
  'sql/no-unsafe-query': 'error'
}
```

---

## 📊 Casos Específicos del Proyecto

### Queries Revisadas y Seguras

#### 1. authController.js - Login
```javascript
// ✅ SEGURO - Usa parámetros
db.query('SELECT * FROM usuarios WHERE dni = ?', [dni], callback);
```

#### 2. legajosController.js - WHERE Dinámico
```javascript
// ✅ SEGURO - condicionWhere solo tiene strings hardcodeadas
let condicionWhere = 'id = ?';
if (user.rol !== 'admin') {
  condicionWhere += ' AND usuario_id = ?';
}
db.query(`SELECT * FROM legajos WHERE ${condicionWhere}`, parametros, callback);
```

#### 3. recibosController.js - UPDATE Dinámico
```javascript
// ✅ MEJORADO - Ahora con whitelist
const ALLOWED_HISTORY_COLUMNS = ['estado_importacion', 'fecha_fin', ...];
if (!ALLOWED_HISTORY_COLUMNS.includes(key)) {
  return; // Skip
}
```

#### 4. usuariosController.js - Búsquedas
```javascript
// ✅ SEGURO - Valores parametrizados
const sql = 'SELECT * FROM usuarios WHERE nombre LIKE ? OR apellido LIKE ?';
db.query(sql, [`%${search}%`, `%${search}%`], callback);
```

---

## 🚨 Detección de Ataques

### Logs a Monitorear

```javascript
// Loguear queries sospechosas
db.on('query', (sql) => {
  // Detectar patrones de ataque
  if (sql.match(/union|select.*from|drop|insert|update|delete|--|;/gi)) {
    console.warn('🚨 POSSIBLE SQL INJECTION ATTEMPT:', sql);
    // Alertar administrador
  }
});
```

### Señales de Ataque

Monitorear por:
- Muchos errores SQL en corto tiempo
- Queries con palabras clave: UNION, DROP, --, etc.
- Tiempo de respuesta inusual (time-based blind)
- Intentos de autenticación con caracteres especiales

---

## 📈 Mejoras Futuras

### 1. Implementar Prepared Statements

```javascript
// mysql2 soporta prepared statements reales
const [rows] = await pool.execute('SELECT * FROM usuarios WHERE dni = ?', [dni]);
```

### 2. Auditoría Automática

```javascript
// Middleware de auditoría
app.use((req, res, next) => {
  const originalQuery = db.query;
  db.query = function(...args) {
    console.log('SQL Query:', args[0]);
    return originalQuery.apply(this, args);
  };
  next();
});
```

### 3. WAF (Web Application Firewall)

Implementar reglas WAF para detectar patrones de SQL injection:
- ModSecurity
- CloudFlare WAF
- AWS WAF

---

## 📚 Referencias

- [OWASP SQL Injection](https://owasp.org/www-community/attacks/SQL_Injection)
- [OWASP SQL Injection Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/SQL_Injection_Prevention_Cheat_Sheet.html)
- [CWE-89: SQL Injection](https://cwe.mitre.org/data/definitions/89.html)
- [MySQL Prepared Statements](https://dev.mysql.com/doc/refman/8.0/en/sql-prepared-statements.html)

---

## ✅ Resumen

**Estado del Proyecto:** ✅ SEGURO

- ✅ No se encontraron vulnerabilidades activas de SQL Injection
- ✅ Todas las queries usan parámetros preparados
- ✅ Se agregó whitelist adicional en queries dinámicas
- ✅ Se crearon utilidades de sanitización SQL
- ✅ Documentación completa para desarrolladores

**Recomendaciones:**
1. Mantener el uso de queries parametrizadas
2. Revisar código nuevo con checklist de seguridad
3. Considerar migrar a Prepared Statements (mysql2)
4. Implementar logging de queries para auditoría

---

**Última actualización:** 2025-10-22
**Próxima auditoría recomendada:** 2025-11-22
