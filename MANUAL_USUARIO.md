# 📖 Manual de Usuario - Sistema RRHH

## DB Consulting - Sistema de Recursos Humanos

**Versión**: 1.0  
**Fecha**: Octubre 2025  
**URL**: https://rrhh.dbconsulting.com.ar

---

## 📑 Tabla de Contenidos

1. [Introducción](#introducción)
2. [Acceso al Sistema](#acceso-al-sistema)
3. [Roles y Permisos](#roles-y-permisos)
4. [Módulos del Sistema](#módulos-del-sistema)
5. [Guías por Rol](#guías-por-rol)
6. [Preguntas Frecuentes](#preguntas-frecuentes)
7. [Solución de Problemas](#solución-de-problemas)
8. [Contacto y Soporte](#contacto-y-soporte)

---

## 🎯 Introducción

### ¿Qué es el Sistema RRHH?

El Sistema RRHH de DB Consulting es una plataforma web integral diseñada para gestionar todos los aspectos de Recursos Humanos de múltiples empresas desde un único lugar centralizado.

### Características Principales

✅ **Gestión de Legajos**: Administración completa de información de empleados  
✅ **Control de Vacaciones**: Solicitud y aprobación de vacaciones  
✅ **Gestión de Permisos**: Solicitud y seguimiento de permisos laborales  
✅ **Recibos de Sueldo**: Generación y descarga de recibos digitales  
✅ **Multi-empresa**: Gestión de múltiples empresas desde un solo sistema  
✅ **Dashboard Interactivo**: Visualización de estadísticas y métricas  
✅ **Acceso Seguro**: Sistema con SSL/TLS y autenticación por token  

### Requisitos del Sistema

- **Navegador Web**: Chrome, Firefox, Safari, Edge (versiones actuales)
- **Conexión a Internet**: Estable para acceso al sistema
- **Dispositivos**: Compatible con PC, Tablet y Smartphone

---

## 🔐 Acceso al Sistema

### Primera Vez - Inicio de Sesión

1. **Abrir el navegador** y visitar:
   ```
   https://rrhh.dbconsulting.com.ar
   ```

2. **Ingresar credenciales**:
   - **DNI**: Tu número de documento sin puntos ni espacios
   - **Contraseña**: Proporcionada por RRHH

   ![Pantalla de Login](ejemplo-login.png)

3. **Hacer clic en "Iniciar Sesión"**

### Cambio de Contraseña (Recomendado)

Por seguridad, se recomienda cambiar la contraseña en el primer inicio:

1. Ir a **Perfil** (icono de usuario arriba a la derecha)
2. Seleccionar **"Cambiar Contraseña"**
3. Ingresar:
   - Contraseña actual
   - Nueva contraseña (mínimo 8 caracteres)
   - Confirmar nueva contraseña
4. Hacer clic en **"Guardar"**

### Recuperación de Contraseña

Si olvidaste tu contraseña:

1. En la pantalla de login, hacer clic en **"¿Olvidaste tu contraseña?"**
2. Ingresar tu DNI
3. Recibirás instrucciones por email
4. Contactar a soporte si no recibes el correo

### Cerrar Sesión

1. Hacer clic en tu **nombre/icono** (esquina superior derecha)
2. Seleccionar **"Cerrar Sesión"**

**⚠️ Importante**: Siempre cierra sesión al terminar, especialmente en computadoras compartidas.

---

## 👥 Roles y Permisos

El sistema tiene diferentes roles con permisos específicos:

### 1. **Administrador** 🔧

**Permisos completos**:
- ✅ Gestionar empresas
- ✅ Crear y modificar usuarios
- ✅ Gestionar legajos de todos los empleados
- ✅ Aprobar/rechazar vacaciones y permisos
- ✅ Generar recibos de sueldo
- ✅ Ver dashboard con todas las estadísticas
- ✅ Acceso a configuración del sistema
- ✅ Gestionar referentes de empresas

### 2. **Referente de Empresa** 👔

**Permisos de gestión por empresa**:
- ✅ Ver legajos de su empresa
- ✅ Aprobar/rechazar vacaciones de su empresa
- ✅ Aprobar/rechazar permisos de su empresa
- ✅ Ver dashboard de su empresa
- ✅ Generar reportes de su empresa
- ❌ No puede crear usuarios
- ❌ No puede modificar empresas

### 3. **Empleado** 👤

**Permisos básicos**:
- ✅ Ver su propio legajo
- ✅ Solicitar vacaciones
- ✅ Solicitar permisos
- ✅ Descargar sus recibos de sueldo
- ✅ Ver su historial de vacaciones/permisos
- ❌ No puede ver otros empleados
- ❌ No puede aprobar solicitudes
- ❌ No accede al dashboard administrativo

---

## 📊 Módulos del Sistema

### 🏢 1. Dashboard

**¿Para quién?** Administradores y Referentes

El dashboard muestra métricas y estadísticas del sistema:

#### Para Administradores:
- Total de empresas activas
- Total de empleados registrados
- Vacaciones pendientes de aprobación
- Permisos pendientes de aprobación
- Gráficos de uso del sistema
- Alertas y notificaciones

#### Para Referentes:
- Estadísticas de su empresa
- Empleados activos
- Solicitudes pendientes
- Próximos vencimientos de vacaciones

**Cómo acceder:**
1. Hacer clic en **"Dashboard"** en el menú principal
2. Visualizar las tarjetas con información
3. Hacer clic en gráficos para ver detalles

---

### 🏢 2. Gestión de Empresas

**¿Para quién?** Solo Administradores

Administra las empresas del sistema.

#### Ver Empresas

1. Ir a **"Empresas"** en el menú
2. Ver listado de todas las empresas
3. Usar la búsqueda para filtrar

#### Crear Nueva Empresa

1. Hacer clic en **"+ Nueva Empresa"**
2. Completar formulario:
   - **Nombre**: Razón social
   - **CUIT**: Sin guiones
   - **Dirección**: Domicilio fiscal
   - **Teléfono**: Número de contacto
   - **Email**: Correo de contacto
3. Hacer clic en **"Guardar"**

#### Editar Empresa

1. En el listado, hacer clic en el **icono de lápiz** ✏️
2. Modificar los campos necesarios
3. Hacer clic en **"Guardar Cambios"**

#### Eliminar Empresa

⚠️ **Precaución**: Esto eliminará todos los datos relacionados.

1. Hacer clic en el **icono de basurero** 🗑️
2. Confirmar la eliminación

---

### 👤 3. Gestión de Legajos

**¿Para quién?** Administradores y Referentes (de su empresa)

Administra la información de los empleados.

#### Ver Legajos

1. Ir a **"Legajos"** en el menú
2. Ver listado de empleados
3. Filtrar por:
   - Empresa
   - Estado (Activo/Inactivo)
   - Búsqueda por nombre/DNI

#### Crear Nuevo Legajo

1. Hacer clic en **"+ Nuevo Legajo"**
2. Completar el formulario:

   **Datos Personales**:
   - Nombre y Apellido
   - DNI (sin puntos)
   - Fecha de Nacimiento
   - Género
   - Estado Civil
   - Email personal
   - Teléfono

   **Datos Laborales**:
   - Empresa
   - Fecha de Ingreso
   - Puesto/Cargo
   - Tipo de Contrato
   - Salario Base
   - Obra Social

   **Información de Acceso**:
   - Email corporativo
   - Contraseña inicial
   - Rol (Empleado/Referente)

3. Hacer clic en **"Guardar Legajo"**

#### Editar Legajo

1. Hacer clic en el legajo a editar
2. Modificar los campos necesarios
3. Hacer clic en **"Guardar Cambios"**

#### Subir Documentación

1. Entrar al legajo del empleado
2. Ir a la sección **"Documentos"**
3. Hacer clic en **"Subir Documento"**
4. Seleccionar:
   - Tipo de documento (DNI, Título, Certificado, etc.)
   - Archivo (PDF, JPG, PNG)
5. Hacer clic en **"Subir"**

#### Desactivar Empleado

Para empleados que ya no trabajan en la empresa:

1. Editar el legajo
2. Cambiar **Estado** a "Inactivo"
3. Ingresar **Fecha de Baja**
4. Guardar cambios

---

### 🏖️ 4. Gestión de Vacaciones

#### 4.1 Para Empleados - Solicitar Vacaciones

1. Ir a **"Vacaciones"** en el menú
2. Hacer clic en **"+ Nueva Solicitud"**
3. Completar:
   - **Fecha Desde**: Primer día de vacaciones
   - **Fecha Hasta**: Último día de vacaciones
   - **Observaciones**: Motivo o comentarios (opcional)
4. Verificar:
   - Días solicitados
   - Días disponibles restantes
5. Hacer clic en **"Enviar Solicitud"**

**Estados de Solicitud**:
- 🟡 **Pendiente**: Esperando aprobación
- 🟢 **Aprobada**: Vacaciones confirmadas
- 🔴 **Rechazada**: No aprobadas (ver motivo)

#### 4.2 Para Administradores/Referentes - Aprobar Vacaciones

1. Ir a **"Vacaciones"** → **"Pendientes"**
2. Ver listado de solicitudes pendientes
3. Hacer clic en una solicitud para ver detalles:
   - Nombre del empleado
   - Fechas solicitadas
   - Días disponibles del empleado
   - Historial de vacaciones
4. Decidir:
   - **Aprobar**: Hacer clic en ✅ "Aprobar"
   - **Rechazar**: Hacer clic en ❌ "Rechazar" e ingresar motivo
5. El empleado recibirá una notificación

#### Ver Historial de Vacaciones

1. Ir a **"Vacaciones"** → **"Historial"**
2. Ver todas las solicitudes (aprobadas, rechazadas, pendientes)
3. Filtrar por:
   - Empleado
   - Fecha
   - Estado

#### Asignación de Días de Vacaciones

**Para Administradores**:

1. Ir a **"Vacaciones"** → **"Asignación"**
2. Seleccionar período (año)
3. Asignar días correspondientes según antigüedad:
   - Menos de 5 años: 14 días
   - 5-10 años: 21 días
   - 10-20 años: 28 días
   - Más de 20 años: 35 días
4. Hacer clic en **"Asignar"**

---

### 📋 5. Gestión de Permisos

#### 5.1 Para Empleados - Solicitar Permiso

1. Ir a **"Permisos"** en el menú
2. Hacer clic en **"+ Nuevo Permiso"**
3. Completar:
   - **Tipo de Permiso**:
     - Enfermedad
     - Trámite Personal
     - Estudio
     - Fallecimiento Familiar
     - Matrimonio
     - Nacimiento
     - Otros
   - **Fecha**: Día del permiso
   - **Hora Desde/Hasta**: Si es por horas
   - **Días Completos**: Si es por días
   - **Motivo**: Descripción detallada
   - **Adjuntar Certificado**: Si corresponde (médico, etc.)
4. Hacer clic en **"Enviar Solicitud"**

#### 5.2 Para Administradores/Referentes - Gestionar Permisos

1. Ir a **"Permisos"** → **"Pendientes"**
2. Ver solicitudes de permisos
3. Revisar:
   - Tipo de permiso
   - Justificación
   - Certificados adjuntos
4. Aprobar o rechazar con comentarios

#### Ver Historial de Permisos

1. Ir a **"Permisos"** → **"Historial"**
2. Ver todos los permisos solicitados
3. Filtrar por empleado, tipo o estado

---

### 💰 6. Recibos de Sueldo

#### 6.1 Para Empleados - Descargar Recibos

1. Ir a **"Recibos"** en el menú
2. Ver listado de recibos disponibles por mes/año
3. Hacer clic en **"Descargar"** 📥 para obtener el PDF
4. El recibo se descarga automáticamente

**Información en el Recibo**:
- Datos del empleado
- Datos de la empresa
- Período liquidado
- Conceptos remunerativos
- Deducciones (jubilación, obra social, etc.)
- Neto a cobrar

#### 6.2 Para Administradores - Generar Recibos

1. Ir a **"Recibos"** → **"Generar"**
2. Seleccionar:
   - Período (mes/año)
   - Empresa
   - Empleados (individual o todos)
3. Ingresar conceptos:
   - Sueldo básico
   - Adicionales
   - Horas extra
   - Bonificaciones
   - Deducciones
4. Hacer clic en **"Generar Recibos"**
5. Los recibos quedan disponibles para los empleados

#### Reenviar Recibo

Si un empleado no puede descargar un recibo:

1. Buscar el recibo en el listado
2. Hacer clic en **"Reenviar"** 📧
3. Se envía por email al empleado

---

### 👔 7. Gestión de Referentes

**¿Para quién?** Solo Administradores

Asigna referentes a las empresas.

#### Asignar Referente

1. Ir a **"Referentes"** en el menú
2. Hacer clic en **"+ Asignar Referente"**
3. Seleccionar:
   - Empresa
   - Empleado que será referente
4. Hacer clic en **"Asignar"**
5. El empleado ahora tiene permisos de referente para esa empresa

#### Quitar Referente

1. En el listado de referentes
2. Hacer clic en **"Quitar"** ❌
3. Confirmar acción
4. El empleado vuelve a rol de empleado normal

---

### ❓ 8. Preguntas Frecuentes

#### Módulo para Empleados

Sección de autoayuda con preguntas comunes:

1. Ir a **"Preguntas Frecuentes"**
2. Navegar por categorías:
   - Vacaciones
   - Permisos
   - Recibos
   - Legajo
   - Sistema
3. Hacer clic en una pregunta para ver la respuesta

#### Buscar Pregunta

1. Usar el **buscador** en la parte superior
2. Escribir palabras clave
3. Ver resultados relacionados

---

## 📱 Uso desde Dispositivos Móviles

El sistema es **responsive** y se adapta a smartphones y tablets.

### Funcionalidades Móviles

✅ Solicitar vacaciones  
✅ Solicitar permisos  
✅ Descargar recibos  
✅ Ver estado de solicitudes  
✅ Consultar legajo personal  

### Recomendaciones para Móvil

- Usa WiFi para descargar recibos (archivos pesados)
- Mantén el navegador actualizado
- Agrega el sitio a favoritos para acceso rápido
- Puedes agregar un acceso directo en la pantalla de inicio

---

## 🎯 Guías Rápidas por Rol

### Guía Rápida - EMPLEADO

**Tareas Comunes**:

1. **Ver mis datos**:
   - Menú → Mi Legajo

2. **Solicitar vacaciones**:
   - Menú → Vacaciones → Nueva Solicitud

3. **Solicitar permiso**:
   - Menú → Permisos → Nuevo Permiso

4. **Descargar recibo**:
   - Menú → Recibos → Descargar

5. **Ver estado de solicitudes**:
   - Menú → Mis Solicitudes

---

### Guía Rápida - REFERENTE

**Tareas Comunes**:

1. **Aprobar vacaciones**:
   - Dashboard → Vacaciones Pendientes → Aprobar/Rechazar

2. **Aprobar permisos**:
   - Dashboard → Permisos Pendientes → Revisar

3. **Ver empleados de mi empresa**:
   - Menú → Legajos → Filtrar por mi empresa

4. **Ver estadísticas**:
   - Dashboard → Métricas de mi empresa

---

### Guía Rápida - ADMINISTRADOR

**Tareas Comunes**:

1. **Crear nueva empresa**:
   - Menú → Empresas → Nueva Empresa

2. **Dar de alta empleado**:
   - Menú → Legajos → Nuevo Legajo

3. **Asignar referente**:
   - Menú → Referentes → Asignar

4. **Generar recibos mensuales**:
   - Menú → Recibos → Generar → Seleccionar mes

5. **Ver todas las solicitudes pendientes**:
   - Dashboard → Sección Pendientes

---

## ❓ Preguntas Frecuentes

### Acceso y Seguridad

**P: ¿Olvidé mi contraseña, qué hago?**  
R: En la pantalla de login, hacer clic en "¿Olvidaste tu contraseña?" e ingresar tu DNI. Recibirás instrucciones por email.

**P: ¿Cuánto tiempo permanezco logueado?**  
R: Tu sesión permanece activa por 8 horas de inactividad. Después deberás volver a iniciar sesión.

**P: ¿Es seguro el sistema?**  
R: Sí, el sistema usa encriptación SSL/TLS (https) y todas las contraseñas están cifradas.

---

### Vacaciones

**P: ¿Cuántos días de vacaciones tengo?**  
R: Depende de tu antigüedad:
- Menos de 5 años: 14 días
- 5-10 años: 21 días
- 10-20 años: 28 días
- Más de 20 años: 35 días

**P: ¿Puedo solicitar vacaciones fraccionadas?**  
R: Sí, puedes dividir tus vacaciones según lo permita tu empresa.

**P: ¿Cuánto tiempo antes debo solicitar vacaciones?**  
R: Se recomienda solicitar con al menos 15 días de anticipación para que tu referente pueda aprobarlas a tiempo.

**P: ¿Qué pasa si me rechazan las vacaciones?**  
R: Recibirás una notificación con el motivo del rechazo. Puedes hablar con tu referente y hacer una nueva solicitud para otras fechas.

**P: ¿Los feriados se descuentan de mis vacaciones?**  
R: No, los feriados no se descuentan de tus días de vacaciones.

---

### Permisos

**P: ¿Qué tipos de permisos puedo solicitar?**  
R: Enfermedad, trámites, estudio, fallecimiento familiar, matrimonio, nacimiento, y otros justificados.

**P: ¿Necesito certificado para permisos médicos?**  
R: Sí, para permisos por enfermedad debes adjuntar el certificado médico.

**P: ¿Los permisos se descuentan del sueldo?**  
R: Depende del tipo de permiso y las políticas de tu empresa. Los permisos justificados generalmente no se descuentan.

---

### Recibos de Sueldo

**P: ¿Cuándo están disponibles los recibos?**  
R: Generalmente los primeros días del mes siguiente al período liquidado.

**P: ¿No puedo descargar mi recibo, qué hago?**  
R: Verifica tu conexión a internet. Si el problema persiste, contacta a tu referente o RRHH.

**P: ¿Puedo ver recibos de meses anteriores?**  
R: Sí, todos tus recibos históricos están disponibles en la sección Recibos.

**P: ¿El recibo es válido legalmente?**  
R: Sí, el recibo digital tiene la misma validez legal que uno impreso.

---

### Legajo

**P: ¿Puedo actualizar mis datos personales?**  
R: Algunos datos puedes modificarlos tú mismo (email, teléfono). Para otros cambios, contacta a RRHH.

**P: ¿Cómo actualizo mi dirección?**  
R: Ir a Mi Legajo → Editar → Actualizar dirección → Guardar.

**P: ¿Puedo ver el legajo de otros empleados?**  
R: No, solo tu referente o RRHH pueden ver otros legajos por motivos de privacidad.

---

## 🔧 Solución de Problemas

### No puedo iniciar sesión

**Posibles causas y soluciones**:

1. **Usuario o contraseña incorrectos**:
   - Verifica que el DNI esté sin puntos ni espacios
   - Usa "¿Olvidaste tu contraseña?" si no recuerdas

2. **Bloq Mayús activado**:
   - Verifica que no esté activado Bloq Mayús
   - Las contraseñas distinguen mayúsculas/minúsculas

3. **Navegador obsoleto**:
   - Actualiza tu navegador a la última versión
   - Prueba con otro navegador

4. **Cookies/Caché**:
   - Limpia las cookies y caché del navegador
   - Intenta en modo incógnito/privado

---

### La página no carga o es muy lenta

**Soluciones**:

1. **Verifica tu conexión a internet**:
   - Prueba abrir otros sitios web
   - Reinicia tu router

2. **Actualiza la página**:
   - Presiona F5 o Ctrl+F5 (Windows)
   - Command+R (Mac)

3. **Limpia caché del navegador**:
   - Chrome: Ctrl+Shift+Delete
   - Firefox: Ctrl+Shift+Delete
   - Selecciona "Imágenes y archivos en caché"

4. **Prueba desde otro dispositivo**:
   - Si funciona desde otro dispositivo, el problema es local

---

### No puedo descargar archivos (recibos, documentos)

**Soluciones**:

1. **Verifica permisos del navegador**:
   - El navegador puede estar bloqueando descargas
   - Permite descargas para el sitio

2. **Desactiva bloqueadores de pop-ups**:
   - Agrega el sitio a la lista blanca
   - Desactiva temporalmente el bloqueador

3. **Verifica espacio en disco**:
   - Asegúrate de tener espacio disponible
   - Cambia la carpeta de descargas

4. **Prueba con otro navegador**:
   - Si el problema persiste, contacta soporte

---

### Veo un error al enviar un formulario

**Soluciones**:

1. **Revisa que todos los campos obligatorios estén completos**:
   - Los campos con * son obligatorios

2. **Verifica el formato de los datos**:
   - Fechas en formato correcto (DD/MM/AAAA)
   - Emails con @ y dominio válido
   - DNI sin puntos ni espacios

3. **Intenta nuevamente**:
   - Puede ser un problema temporal
   - Espera unos segundos y reintenta

4. **Captura el error**:
   - Toma screenshot del mensaje de error
   - Contacta soporte con la imagen

---

### Mi sesión se cierra sola

**Causas normales**:

- Por seguridad, la sesión expira después de 8 horas de inactividad
- Si cierras el navegador, deberás volver a iniciar sesión

**Si se cierra en menos tiempo**:

1. **Verifica cookies habilitadas**:
   - El navegador debe permitir cookies
   - No uses modo incógnito para sesiones largas

2. **No uses múltiples pestañas**:
   - Evita abrir múltiples sesiones simultáneas

---

### No veo mi solicitud de vacaciones/permiso

**Soluciones**:

1. **Actualiza la página**:
   - Presiona F5 para recargar

2. **Verifica que se haya enviado**:
   - Debes recibir mensaje de confirmación
   - Revisa en "Historial" de solicitudes

3. **Verifica filtros**:
   - Puede estar oculta por un filtro activo
   - Elimina filtros y busca nuevamente

---

## 📞 Contacto y Soporte

### Soporte Técnico

Para problemas técnicos con el sistema:

📧 **Email**: soporte@dbconsulting.com.ar  
📱 **WhatsApp**: +54 9 XXX XXX-XXXX  
🕒 **Horario**: Lunes a Viernes, 9:00 - 18:00 hs

### Consultas de RRHH

Para consultas sobre liquidaciones, legajos, políticas:

📧 **Email**: rrhh@dbconsulting.com.ar  
📞 **Teléfono**: +54 XXX XXX-XXXX  
🕒 **Horario**: Lunes a Viernes, 9:00 - 17:00 hs

### ¿Qué información incluir al contactar soporte?

Para resolver tu problema más rápido, incluye:

1. **Tu nombre completo y DNI**
2. **Empresa a la que perteneces**
3. **Descripción del problema**
4. **Pasos que realizaste antes del error**
5. **Mensaje de error** (si hay alguno)
6. **Navegador y sistema operativo** que usas
7. **Screenshots** del problema (si es posible)

---

## 📚 Recursos Adicionales

### Tutoriales en Video

Próximamente disponibles en:
- Canal de YouTube de DB Consulting
- Sección "Tutoriales" dentro del sistema

### Actualizaciones del Sistema

El sistema se actualiza periódicamente. Los cambios importantes se notificarán por:
- Email corporativo
- Banner en el sistema
- Mensajes en el dashboard

### Sugerencias y Mejoras

Tu opinión es importante. Envía sugerencias a:
📧 mejoras@dbconsulting.com.ar

---

## ⚖️ Políticas y Privacidad

### Privacidad de Datos

- Tus datos personales están protegidos según la Ley 25.326 de Protección de Datos Personales
- Solo personal autorizado de RRHH accede a tu información completa
- Nunca compartas tu contraseña con terceros
- El sistema registra accesos por seguridad

### Uso Responsable

- El sistema es para uso laboral exclusivamente
- No intentes acceder a información de otros empleados
- Reporta cualquier comportamiento sospechoso
- Mantén tu contraseña segura y cámbiala periódicamente

---

## 📋 Glosario

**Legajo**: Expediente digital con toda la información del empleado.

**Referente**: Persona autorizada a gestionar empleados de una empresa específica.

**Días Hábiles**: Lunes a viernes, excluyendo feriados.

**Estado Activo/Inactivo**: Indica si el empleado está actualmente trabajando en la empresa.

**SSL/TLS**: Protocolo de seguridad para encriptar la conexión (el candado 🔒 en el navegador).

**Dashboard**: Tablero con información resumida y estadísticas.

**Token**: Código de seguridad que mantiene tu sesión activa.

---

## 📝 Registro de Cambios del Manual

**Versión 1.0** (Octubre 2025)
- Primera versión del manual
- Cobertura completa de todos los módulos
- Guías por rol incluidas

---

## ✅ Checklist de Inicio Rápido

### Para Empleados:

- [ ] Inicié sesión por primera vez
- [ ] Cambié mi contraseña inicial
- [ ] Verifiqué mi información en "Mi Legajo"
- [ ] Descargué mi último recibo
- [ ] Revisé mis días de vacaciones disponibles
- [ ] Leí las políticas de vacaciones y permisos
- [ ] Agregué el sitio a favoritos
- [ ] Guardé el número de soporte técnico

### Para Referentes:

- [ ] Revisé los empleados de mi empresa
- [ ] Exploré el dashboard
- [ ] Probé aprobar una solicitud de prueba
- [ ] Verifiqué permisos de acceso
- [ ] Contacté a soporte para capacitación adicional

### Para Administradores:

- [ ] Verifiqué todas las empresas cargadas
- [ ] Revisé usuarios y roles asignados
- [ ] Probé generar un recibo
- [ ] Configuré referentes
- [ ] Exploré todas las secciones del sistema

---

**© 2025 DB Consulting - Todos los derechos reservados**

*Este manual está sujeto a actualizaciones. Verifica siempre que tengas la última versión.*

**URL del Sistema**: https://rrhh.dbconsulting.com.ar  
**Versión del Manual**: 1.0  
**Última actualización**: Octubre 2025

---

## 🎓 Certificación de Lectura

He leído y comprendido este manual de usuario del Sistema RRHH.

**Nombre**: ___________________________  
**DNI**: ___________________________  
**Empresa**: ___________________________  
**Fecha**: ___________________________  
**Firma**: ___________________________

*Este documento debe ser firmado y entregado a RRHH como constancia de capacitación.*
