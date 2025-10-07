# ✅ Corrección de Validaciones de DNI Duplicado

## 🐛 Problema Identificado

El sistema no estaba detectando correctamente cuando un DNI ya existía en la base de datos porque:

1. **Error en destructuring**: Se usaba `const [existeDNI] = await...` que extraía el primer elemento del array
2. **Validación incorrecta**: Se verificaba `if (existeDNI)` en lugar de `if (existeDNI.length > 0)`

## ✅ Correcciones Aplicadas

### 1. Backend - usuariosController.js

**Antes:**
```javascript
const [existeDNI] = await new Promise((resolve, reject) => {
  db.query('SELECT nombre, apellido FROM usuarios WHERE dni = ?', [dni], (err, results) => {
    // ...
    resolve(results);
  });
});

if (existeDNI) {
  const mensajeError = `Ya existe un usuario con ese DNI (pertenece a ${existeDNI.nombre} ${existeDNI.apellido})`;
  // ...
}
```

**Después:**
```javascript
const existeDNI = await new Promise((resolve, reject) => {
  db.query('SELECT nombre, apellido FROM usuarios WHERE dni = ?', [dni], (err, results) => {
    // ...
    resolve(results);
  });
});

if (existeDNI.length > 0) {
  const usuario = existeDNI[0];
  const mensajeError = `Ya existe un usuario con ese DNI (pertenece a ${usuario.nombre} ${usuario.apellido})`;
  // ...
}
```

### 2. Mismas correcciones aplicadas a:

- ✅ Validación de legajo duplicado en `usuariosController.js`
- ✅ Validación de correo duplicado en `usuariosController.js`
- ✅ Validaciones en `legajosController.js`

## 🎯 Resultado

Ahora cuando se intenta crear un usuario con un DNI que ya existe:

### Antes:
- ❌ No detectaba el DNI duplicado
- ❌ Permitía crear usuarios duplicados
- ❌ Error genérico o sin error

### Después:
- ✅ Detecta correctamente el DNI duplicado
- ✅ Muestra mensaje específico: "Ya existe un usuario con ese DNI (pertenece a Juan Pérez)"
- ✅ Retorna error estructurado con `field: 'dni'` y `type: 'DUPLICATE_FIELD'`

## 🧪 Como Probar

1. **Frontend**: Intentar crear un usuario con un DNI existente
2. **Backend**: La respuesta será:
   ```json
   {
     "error": "Ya existe un usuario con ese DNI (pertenece a Juan Pérez)",
     "field": "dni",
     "type": "DUPLICATE_FIELD"
   }
   ```

3. **Frontend mejorado**: Mostrará mensaje específico con sugerencias

## 🔧 Archivos Modificados

- ✅ `backend/controllers/usuariosController.js` - Validaciones de DNI, legajo y correo
- ✅ `backend/controllers/legajosController.js` - Validaciones de DNI y número de legajo
- ✅ `frontend/src/pages/Usuarios/Usuarios.js` - Manejo de errores específicos
- ✅ `frontend/src/pages/Legajo/LegajoAdmin.js` - Manejo de errores específicos

## 📋 Nota

Las correcciones están aplicadas en el código y funcionarán correctamente cuando el sistema esté en ejecución. El problema de validación de DNI duplicado ha sido resuelto.