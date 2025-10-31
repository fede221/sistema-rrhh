# 📊 Flujo de Importación de Excel con Generación Automática de Contraseñas

## Diagrama del Proceso

```
┌─────────────────────────────────────────────────────────────────┐
│                    ARCHIVO EXCEL DEL USUARIO                    │
│                                                                  │
│  Legajo │ DNI      │ Nombre   │ Apellido │ Email       │ ...   │
│  ─────────────────────────────────────────────────────────      │
│  N00001 │ 39266568 │ OCTAVIO  │ SANZA    │ octavio@... │       │
│  N00002 │ 29161944 │ DAMIAN   │ PACHECO  │ damian@...  │       │
└─────────────────────────────────────────────────────────────────┘
                              ↓
                    ┌─────────────────────┐
                    │ Frontend procesa    │
                    │ archivo Excel       │
                    │ con XLSX.js         │
                    └─────────────────────┘
                              ↓
        ┌─────────────────────────────────────────┐
        │  Frontend asigna automáticamente:       │
        │  password: '[PRESENTE]'                 │
        │                                         │
        │  Datos formateados:                     │
        │  {                                      │
        │    legajo: 'N00001',                    │
        │    dni: '39266568',                     │
        │    nombre: 'OCTAVIO',                   │
        │    apellido: 'SANZA',                   │
        │    correo: 'octavio.sanza@temp.com',   │
        │    password: '[PRESENTE]'   ← Marcador │
        │  }                                      │
        └─────────────────────────────────────────┘
                              ↓
                  ┌───────────────────────┐
                  │ Envía al backend      │
                  │ /api/usuarios/        │
                  │ importar-masivo       │
                  └───────────────────────┘
                              ↓
        ┌─────────────────────────────────────────┐
        │  Backend recibe y valida                │
        │                                         │
        │  ¿password = '[PRESENTE]'? → SÍ        │
        │                                         │
        │  Genera contraseña automática:          │
        │  • Método: user-data                    │
        │  • Formula: 4dígitosDNI +               │
        │             5charApellido +             │
        │             número + símbolo            │
        │  • Resultado: 6568Sanza1!               │
        │                                         │
        │  Hash con bcrypt(10)                    │
        │  Crea usuario con contraseña hasheada   │
        └─────────────────────────────────────────┘
                              ↓
        ┌─────────────────────────────────────────┐
        │  Base de datos                          │
        │                                         │
        │  INSERT INTO usuarios:                  │
        │  • legajo: 'N00001'                     │
        │  • dni: '39266568'                      │
        │  • password: '$2b$10$...' (hash)        │
        │  • rol: 'empleado'                      │
        │                                         │
        │  ✅ Usuario creado exitosamente         │
        └─────────────────────────────────────────┘
```

## Flujo Paso a Paso

### 1️⃣ Usuario sube archivo Excel

**Archivo Excel (tal como lo proporciona):**
```
Legajo    DNI         Nombre      Apellido
N00001    39266568    OCTAVIO     SANZA
N00002    29161944    DAMIAN      PACHECO
N00003    37521912    ANDRES      SOSA
```

⚠️ **Nota:** El archivo NO necesita una columna `password`. El sistema la genera automáticamente.

### 2️⃣ Frontend procesa (frontend/src/pages/Usuarios/Usuarios.js)

```javascript
// Línea 515
password: '[PRESENTE]',  // ← Asignado automáticamente
```

**Datos enviados al backend:**
```json
{
  "usuarios": [
    {
      "legajo": "N00001",
      "dni": "39266568",
      "nombre": "OCTAVIO",
      "apellido": "SANZA",
      "correo": "octavio.sanza@temp.com",
      "password": "[PRESENTE]",  ← Marcador
      "rol": "empleado"
    }
  ]
}
```

### 3️⃣ Backend valida y genera (backend/controllers/usuariosController.js)

```javascript
// Detecta el marcador
if (isPasswordMarker(password)) {
  const result = processPassword(password, dni, apellido);
  passwordFinal = result.password;  // → '6568Sanza1!'
}

// Hashea
const hash = await bcrypt.hash(passwordFinal, 10);

// Inserta usuario
INSERT INTO usuarios (dni, password, ...) VALUES ('39266568', hash, ...)
```

### 4️⃣ Resultado en BD

```sql
SELECT dni, password FROM usuarios WHERE dni = '39266568';

dni      │ password
─────────┼──────────────────────────────────────
39266568 │ $2b$10$eJ0neDr3klsj92ndk... (hash)
```

## Contraseñas Generadas

### Método: User-Data (Recomendado)

**Fórmula:** `últimos4DNI + primeros5APELLIDO + aleatorio + símbolo`

**Ejemplos reales:**

| DNI | Apellido | Contraseña Generada |
|-----|----------|-------------------|
| 39266568 | SANZA | 6568Sanza1! |
| 29161944 | PACHECO | 1944Pachec2@ |
| 37521912 | SOSA | 1912Sosa3# |
| 45209890 | PEREYRA | 9890Pereyr4$ |

### Características

- ✅ 8+ caracteres
- ✅ Mayúscula (primer apellido en mayúscula)
- ✅ Minúscula (primeros dígitos del DNI)
- ✅ Número
- ✅ Símbolo
- ✅ Basada en datos del usuario (fácil de recordar en el contexto)

## Comparación: Antes vs Después

### ❌ ANTES (código anterior)
```javascript
password: dniLimpio  // → "39266568"
```
**Resultado:** Error de validación
```
❌ La contraseña debe contener al menos una letra mayúscula
❌ La contraseña debe contener al menos una letra minúscula
```

### ✅ AHORA (código nuevo)
```javascript
password: '[PRESENTE]'  // → Backend genera automáticamente
```
**Resultado:** Contrase ña segura
```
✅ 6568Sanza1!
✅ Cumple todos los requisitos
✅ Usuario creado exitosamente
```

## Flujo de Uso

### Paso 1: Prepara tu Excel
```csv
Legajo,DNI,Nombre,Apellido,Email
N00001,39266568,OCTAVIO,SANZA,octavio@empresa.com
N00002,29161944,DAMIAN,PACHECO,damian@empresa.com
```

❌ **NO necesitas:** Columna de contraseña
✅ **Solo necesitas:** Legajo, DNI, Nombre, Apellido

### Paso 2: Sube en el módulo de Usuarios
1. Click en **"Importar Usuarios"**
2. Selecciona tu archivo Excel
3. Previsualiza los datos
4. Click en **"Confirmar"**

### Paso 3: El sistema genera
- ✅ Frontend convierte Excel a JSON
- ✅ Frontend asigna `password: '[PRESENTE]'`
- ✅ Frontend envía al backend
- ✅ Backend genera contraseña segura
- ✅ Backend hashea y crea usuarios

### Paso 4: Resultado
```
✅ Importación completada: 3 usuarios

Usuario 1: OCTAVIO SANZA
 • Contraseña: 6568Sanza1!
 
Usuario 2: DAMIAN PACHECO
 • Contraseña: 1944Pachec2@
 
Usuario 3: ANDRES SOSA
 • Contraseña: 1912Sosa3#
```

## Archivos Modificados

| Archivo | Cambio |
|---------|--------|
| `frontend/src/pages/Usuarios/Usuarios.js` | Línea 515: `password: '[PRESENTE]'` |
| `backend/utils/passwordGenerator.js` | Generador automático (nuevo) |
| `backend/controllers/usuariosController.js` | Detecta marcadores y genera |

## Ventajas

1. **Automatización**: No escribes contraseñas manualmente
2. **Seguridad**: Genera contraseñas fuertes que cumplen todos los requisitos
3. **Velocidad**: Importa 100s de usuarios sin validación manual
4. **Consistencia**: Todas las contraseñas son válidas y seguras
5. **Trazabilidad**: Basada en datos del usuario (DNI + Apellido)

## Preguntas Frecuentes

**P: ¿Y si mi Excel tiene una columna "password"?**
R: El frontend la ignora y asigna automáticamente `[PRESENTE]`

**P: ¿Puedo personalizar la contraseña?**
R: No en importación masiva. Las contraseñas se generan automáticamente. Puedes cambiarlas después desde el panel de administración.

**P: ¿Qué pasa si un usuario ya existe?**
R: El sistema lo reporta como error y sigue con el siguiente.

**P: ¿Cómo comunico las contraseñas a los usuarios?**
R: El sistema genera un informe de importación con las contraseñas generadas. Cópialo y comparte confidencialmente.

**P: ¿Las contraseñas se guardan en texto plano?**
R: No, solo se guarda el hash bcrypt en la BD. Nadie puede ver la contraseña original.

## Notas Técnicas

### Marcadores reconocidos
```
[PRESENTE]
PRESENTE
AUTO
[AUTO]
GENERATE
[GENERATE]
```

### Método de generación
- **user-data**: Basado en DNI + Apellido (Recomendado en masivo)
- **random**: Contraseña completamente aleatoria

### Seguridad
- Hash bcrypt con salt 10
- Cumple requisitos: 8+ chars, mayús, minús, número
- Sin espacios
- Generadas criptográficamente
