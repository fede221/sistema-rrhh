# 📋 Guía: Carga Masiva de Usuarios con Generación Automática de Contraseñas

## Problema Resuelto

Anteriormente, cuando cargabas usuarios en forma masiva con `password: '[PRESENTE]'`, el sistema rechazaba la carga por validación de contraseña.

**Solución:** El importador detecta automáticamente cuando el valor de contraseña es un **marcador** (como `[PRESENTE]`, `AUTO`, `GENERATE`) y **genera una contraseña segura automáticamente sin que tengas que hacer nada**.

## 🎯 Resumen Rápido

| Antes | Ahora |
|-------|-------|
| ❌ `password: '[PRESENTE]'` → Error | ✅ `password: '[PRESENTE]'` → Genera automáticamente |
| ❌ Validación fallaba | ✅ Genera contraseña segura (8+ chars, mayúscula, minúscula, número) |
| ❌ Tenías que escribir cada contraseña | ✅ El importador lo hace automáticamente |

## Cómo Funciona

### 1. Marcadores Reconocidos

El sistema reconoce estos marcadores de contraseña para generar automáticamente:

```
[PRESENTE]     ← Recomendado
PRESENTE
AUTO
[AUTO]
GENERATE
[GENERATE]
```

### 2. Métodos de Generación

#### Método 1: Basado en Datos del Usuario (Recomendado)
**Cuando:** El CSV contiene `legajo`, `dni`, `apellido`

**Resultado:** Contraseña derivada de los datos del usuario
- Formato: `últimos4DNI + primeros5APELLIDO + número + símbolo`
- Ejemplo: `39266Sanza1!Paye` para DNI 39266568, Apellido SANZA
- Ventaja: Fácil de recordar/deducir por el usuario en la BD

#### Método 2: Contraseña Segura Aleatoria
**Cuando:** No se tiene datos del usuario o se prefiere aleatoria

**Resultado:** Contraseña completamente aleatoria
- Formato: 12 caracteres aleatorios (mayúscula, minúscula, número, símbolo)
- Ejemplo: `K7mP$xQ2vJnR`
- Ventaja: Más segura, completamente aleatoria

### 3. Requisitos Cumplidos

Las contraseñas generadas SIEMPRE cumplen con:
- ✅ Mínimo 8 caracteres
- ✅ Al menos una letra mayúscula (A-Z)
- ✅ Al menos una letra minúscula (a-z)
- ✅ Al menos un número (0-9)
- ✅ Sin espacios en blanco

## Cómo Usar

### Lo más simple: Usa `[PRESENTE]` en la columna password

**CSV mínimo que funciona:**
```csv
legajo,dni,nombre,apellido,correo,password
N00001,39266568,OCTAVIO,SANZA,octavio@empresa.com,[PRESENTE]
N00002,29161944,DAMIAN,PACHECO,damian@empresa.com,[PRESENTE]
N00003,37521912,ANDRES,SOSA,andres@empresa.com,[PRESENTE]
```

**¿Qué pasa?**
1. Subes el CSV al importador
2. El sistema ve `[PRESENTE]` en cada fila
3. ✅ Automáticamente genera una contraseña segura para CADA usuario
4. ✅ Crea los usuarios con sus contraseñas generadas
5. ✅ Listo, sin hacer nada más

**Contraseñas generadas (ejemplo):**
- Usuario 1: `6568Sanza1!` (basada en DNI + apellido)
- Usuario 2: `1944Pachec2@` (basada en DNI + apellido)
- Usuario 3: `1912Sosa3#` (basada en DNI + apellido)

## Flujo de Validación

```
┌─ ¿Es [PRESENTE], AUTO, o GENERATE? ───→ SÍ ───→ Generar automáticamente
│                                              ↓
│                                         Usar método user-data o random
│                                              ↓
│                                         Hash con bcrypt
│                                              ↓
│                                         ✅ Crear usuario
│
└─ ¿Es una contraseña proporcionada? ───→ SÍ ───→ ¿Cumple requisitos?
                                               ↓
                                          ✅ Sí → Hash y crear
                                          ❌ No  → Mostrar error
```

## Ejemplo Completo

### Archivo CSV:
```csv
legajo,dni,nombre,apellido,correo,password,convenio
SA001,39266568,OCTAVIO,SANZA,octavio.sanza@empresa.com,[PRESENTE],dentro
SA002,29161944,DAMIAN,PACHECO,damian.pacheco@empresa.com,[PRESENTE],dentro
SA003,37521912,ANDRES,SOSA,andres.sosa@empresa.com,[PRESENTE],fuera
```

### Resultado de Carga:
```
✅ Usuario 1: OCTAVIO SANZA
   • DNI: 39266568
   • Password generada: 6568Sanza234#
   • Método: user-data

✅ Usuario 2: DAMIAN PACHECO
   • DNI: 29161944
   • Password generada: 1944Pachec156!
   • Método: user-data

✅ Usuario 3: ANDRES SOSA
   • DNI: 37521912
   • Password generada: 1912Sosa489@
   • Método: user-data

✅ Total: 3 usuarios creados exitosamente
```

## Ventajas

1. **Velocidad**: Carga de 100s de usuarios sin escribir contraseñas
2. **Seguridad**: Contraseñas siguen requisitos de complejidad
3. **Flexibilidad**: 3 métodos diferentes (user-data, random, manual)
4. **Validación**: Detecta y reporta errores antes de insertar
5. **Auditoría**: Registra qué contraseñas fueron generadas vs. manuales

## Parámetros en API

Si usas la API directamente:

```bash
POST /api/usuarios/importar-masivo

{
  "usuarios": [
    {
      "legajo": "N00001",
      "dni": "39266568",
      "nombre": "OCTAVIO",
      "apellido": "SANZA",
      "correo": "octavio@empresa.com",
      "password": "[PRESENTE]",  # ← Será generada automáticamente
      "rol": "empleado",
      "convenio": "dentro"
    }
  ]
}
```

## Solución de Problemas

### ❌ "La contraseña debe contener..."
**Problema:** Aún recibe error de validación

**Solución:** 
1. Verifica que el valor sea exactamente `[PRESENTE]` (con corchetes)
2. Si escribes manualmente, debe cumplir: 8+ chars, mayúscula, minúscula, número
3. Intenta con `AUTO` en lugar de `[PRESENTE]`

### ❌ "DNI duplicado"
**Problema:** El usuario ya existe en la base de datos

**Solución:**
1. Verifica el DNI
2. Usa un DNI diferente
3. O edita el usuario existente en lugar de importar nuevamente

### ❌ "Correo duplicado"
**Problema:** El email ya está registrado

**Solución:**
1. Usa un correo diferente
2. O edita el usuario existente

## Contraseñas Generadas: ¿Cómo Comunicar al Usuario?

Después de la importación masiva, debes comunicar las contraseñas a los usuarios:

### Opción 1: Email Automático (Futuro)
```
Asunto: Tu contraseña temporal - Sistema RRHH

Hola {nombre},

Se ha creado tu cuenta en el Sistema de RRHH.

Credenciales:
- DNI: {dni}
- Contraseña temporal: {password}

Por seguridad, se recomienda cambiar la contraseña en tu primer acceso.
```

### Opción 2: Manual (Actual)
1. Exporta el informe de importación
2. Comparte con cada usuario su DNI y contraseña
3. Solicita cambio de contraseña en primer acceso

### Opción 3: En Persona
1. Imprime credenciales
2. Entrega confidencialmente
3. Solicita cambio en primer acceso

## Cambiar Contraseña Generada

Los usuarios pueden cambiar su contraseña:

1. Login con: DNI + contraseña generada
2. Ir a: **Perfil > Cambiar Contraseña**
3. Ingresar: Contraseña antigua + nueva contraseña
4. Confirmar

## Auditoría

Todas las contraseñas generadas se registran con:
- Fecha/hora de generación
- Usuario que realizó la importación
- Método de generación (user-data vs random)
- DNI y legajo del usuario

Acceso: **Panel Admin > Logs > Importaciones**

## Notas Técnicas

### Función de Generación
```javascript
// Ubicación: backend/utils/passwordGenerator.js

// Generar contraseña segura aleatoria
generateSecurePassword(12)
// Resultado: "K7mP$xQ2vJnR"

// Generar basada en datos del usuario
generatePasswordFromUserData(dni, apellido)
// Resultado: "39266Sanza1!Paye"

// Procesar contraseña (detecta marcadores y genera)
processPassword(password, dni, apellido)
// Resultado: { password, wasGenerated, method }
```

### Validación
```javascript
// Ubicación: backend/utils/passwordValidator.js

// Detectar marcadores
isPasswordMarker('[PRESENTE]')  // true
isPasswordMarker('MyPass123')   // false

// Procesar
processPassword('[PRESENTE]', '39266568', 'SANZA')
// {
//   password: "6568Sanza234#",
//   wasGenerated: true,
//   method: "user-data"
// }
```

## Preguntas Frecuentes

**P: ¿Qué sucede si no pongo contraseña en el CSV?**
R: El sistema rechaza la fila - la contraseña es obligatoria

**P: ¿Puedo usar valores como "1234" o "pass"?**
R: No, serán rechazados - deben cumplir los requisitos

**P: ¿Puedo generar contraseñas sin usar marcadores?**
R: Sí, pero requiere acceso a la API o escribirlas manualmente

**P: ¿Las contraseñas generadas se guardan en algún log?**
R: No, solo se hashean. Se recomienda exportar el informe de importación

**P: ¿Pueden los usuarios ver su propia contraseña?**
R: No, solo el hash se guarda en la BD (por seguridad)

**P: ¿Qué pasa si cambio de opinión después de importar?**
R: Puedes resetear la contraseña desde panel admin

## Historial de Cambios

- **v1.3.0**: Implementación de generación automática de contraseñas
- Soporta marcadores: [PRESENTE], AUTO, GENERATE
- Dos métodos: user-data (recomendado) y random
- Validación mejorada en carga masiva
- Documentación completa

## Soporte

Para problemas o preguntas:
1. Revisa esta guía
2. Consulta los logs del sistema: `/logs/import-usuarios.log`
3. Contacta al administrador del sistema
