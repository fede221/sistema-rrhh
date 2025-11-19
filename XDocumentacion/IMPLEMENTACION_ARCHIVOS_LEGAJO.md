# Implementación: Sistema de Archivos Adjuntos para Legajos

**Fecha:** 18 de Noviembre de 2025  
**Versión:** 1.2.2  
**Estado:** ✅ Backend Completo - Pendiente Frontend

---

## 📋 Resumen

Implementación de funcionalidad para adjuntar documentos a los legajos de empleados (DNI frente/dorso, títulos, certificados, constancias, etc.)

---

## 🗄️ Base de Datos

### Tabla Creada: `legajo_archivos`

```sql
CREATE TABLE legajo_archivos (
  id INT PRIMARY KEY AUTO_INCREMENT,
  legajo_id INT NOT NULL,
  tipo_documento ENUM('dni_frente', 'dni_dorso', 'titulo', 'certificado', 'constancia', 'otro'),
  nombre_archivo VARCHAR(255) NOT NULL,
  ruta_archivo VARCHAR(500) NOT NULL,
  tamaño_kb INT NOT NULL,
  mime_type VARCHAR(100) NOT NULL,
  descripcion TEXT,
  fecha_subida DATETIME DEFAULT CURRENT_TIMESTAMP,
  subido_por INT,
  activo BOOLEAN DEFAULT TRUE,
  FOREIGN KEY (legajo_id) REFERENCES legajos(id) ON DELETE CASCADE,
  FOREIGN KEY (subido_por) REFERENCES usuarios(id) ON DELETE SET NULL
);
```

**Índices:**
- `idx_legajo_id` - Búsqueda rápida por legajo
- `idx_tipo_documento` - Filtrado por tipo
- `idx_fecha_subida` - Ordenamiento temporal

**Migración Ejecutada:** ✅ 18/11/2025 20:06:04

---

## 🔧 Backend Implementado

### 1. Middleware de Upload (`uploadLegajoArchivo.js`)

**Ubicación:** `backend/middlewares/uploadLegajoArchivo.js`

**Configuración:**
- Storage: Disk (carpetas por legajo)
- Ruta: `uploads/legajos/{legajo_id}/`
- Tamaño máximo: **10MB**
- Tipos permitidos:
  - Imágenes: JPG, JPEG, PNG, GIF
  - Documentos: PDF, DOC, DOCX

**Formato de nombres:**
```
{tipo_documento}_{nombre_limpio}_{timestamp}.{extension}
Ejemplo: dni_frente_Juan_Perez_1700345678123.jpg
```

### 2. Controlador (`legajosController.js`)

**Funciones Agregadas:**

#### `subirArchivo(req, res)`
- Sube un archivo al servidor
- Guarda metadata en la base de datos
- Valida permisos (empleado: solo su legajo, admin: todos)
- Endpoint: `POST /api/legajos/:legajo_id/archivos`

**Body Parameters:**
- `archivo` (file): Archivo a subir
- `tipo_documento` (string): dni_frente | dni_dorso | titulo | certificado | constancia | otro
- `descripcion` (string, opcional): Descripción del documento

**Response:**
```json
{
  "success": true,
  "message": "Archivo subido exitosamente",
  "archivo": {
    "id": 1,
    "legajo_id": 123,
    "tipo_documento": "dni_frente",
    "nombre_archivo": "dni_frente_Juan_Perez_1700345678.jpg",
    "ruta_archivo": "uploads/legajos/123/dni_frente_Juan_Perez_1700345678.jpg",
    "tamaño_kb": 245,
    "mime_type": "image/jpeg",
    "descripcion": "DNI Frente actualizado",
    "fecha_subida": "2025-11-18T23:06:04.000Z",
    "subido_por": 45
  }
}
```

#### `obtenerArchivos(req, res)`
- Lista todos los archivos de un legajo
- Filtra por tipo_documento (opcional)
- Solo archivos activos
- Endpoint: `GET /api/legajos/:legajo_id/archivos`

**Query Parameters:**
- `tipo_documento` (opcional): Filtrar por tipo

**Response:**
```json
{
  "success": true,
  "archivos": [
    {
      "id": 1,
      "tipo_documento": "dni_frente",
      "nombre_archivo": "dni_frente_Juan_Perez_1700345678.jpg",
      "tamaño_kb": 245,
      "mime_type": "image/jpeg",
      "descripcion": "DNI Frente",
      "fecha_subida": "2025-11-18T23:06:04.000Z",
      "subido_por": 45,
      "nombre_usuario": "Juan Pérez"
    }
  ]
}
```

#### `descargarArchivo(req, res)`
- Descarga un archivo específico
- Valida existencia y permisos
- Envía el archivo con nombre correcto
- Endpoint: `GET /api/legajos/:legajo_id/archivos/:archivo_id/descargar`

**Response:** Archivo binario con headers:
```
Content-Type: {mime_type}
Content-Disposition: attachment; filename="{nombre_archivo}"
```

#### `eliminarArchivo(req, res)`
- Elimina archivo del sistema de archivos
- Marca como inactivo en la base de datos (soft delete)
- Solo admin_rrhh y superadmin
- Endpoint: `DELETE /api/legajos/:legajo_id/archivos/:archivo_id`

**Response:**
```json
{
  "success": true,
  "message": "Archivo eliminado exitosamente"
}
```

### 3. Rutas (`legajosRoutes.js`)

```javascript
// Subir archivo (DNI, títulos, certificados, etc.)
router.post('/:legajo_id/archivos', 
  verifyToken, 
  uploadLegajoArchivo.single('archivo'), 
  legajosController.subirArchivo
);

// Listar archivos de un legajo
router.get('/:legajo_id/archivos', 
  verifyToken, 
  legajosController.obtenerArchivos
);

// Descargar archivo específico
router.get('/:legajo_id/archivos/:archivo_id/descargar', 
  verifyToken, 
  legajosController.descargarArchivo
);

// Eliminar archivo (solo admin)
router.delete('/:legajo_id/archivos/:archivo_id', 
  verifyToken, 
  legajosController.eliminarArchivo
);
```

---

## 🔐 Permisos

| Acción | Empleado | Referente | Admin RRHH | Superadmin |
|--------|----------|-----------|------------|------------|
| Subir archivo (propio legajo) | ✅ | ✅ | ✅ | ✅ |
| Subir archivo (otros legajos) | ❌ | ❌ | ✅ | ✅ |
| Ver archivos (propio legajo) | ✅ | ✅ | ✅ | ✅ |
| Ver archivos (otros legajos) | ❌ | ❌ | ✅ | ✅ |
| Descargar archivos | ✅ | ✅ | ✅ | ✅ |
| Eliminar archivos | ❌ | ❌ | ✅ | ✅ |

---

## 📁 Estructura de Archivos

```
backend/
├── uploads/
│   └── legajos/
│       ├── 1/
│       │   ├── dni_frente_Juan_Perez_1700345678.jpg
│       │   ├── dni_dorso_Juan_Perez_1700345679.jpg
│       │   └── titulo_Ingenieria_1700345680.pdf
│       ├── 2/
│       │   └── ...
│       └── ...
├── middlewares/
│   └── uploadLegajoArchivo.js  ✅ CREADO
├── controllers/
│   └── legajosController.js    ✅ MODIFICADO (4 funciones nuevas)
├── routes/
│   └── legajosRoutes.js        ✅ MODIFICADO (4 rutas nuevas)
└── migrations/
    └── add_legajo_archivos.sql ✅ EJECUTADO
```

---

## ✅ Checklist de Implementación

### Backend
- [x] Crear tabla `legajo_archivos`
- [x] Ejecutar migración en base de datos RRHH
- [x] Crear middleware `uploadLegajoArchivo`
- [x] Implementar `subirArchivo` controller
- [x] Implementar `obtenerArchivos` controller
- [x] Implementar `descargarArchivo` controller
- [x] Implementar `eliminarArchivo` controller
- [x] Agregar rutas en `legajosRoutes.js`
- [x] Validar permisos por rol
- [x] Configurar manejo de errores

### Pendiente - Frontend
- [ ] Crear componente `ArchivosList.jsx`
- [ ] Crear componente `UploadArchivo.jsx`
- [ ] Agregar sección en vista de legajo
- [ ] Implementar drag & drop para subir archivos
- [ ] Mostrar previews de imágenes
- [ ] Agregar iconos por tipo de archivo
- [ ] Botones de descarga/eliminación
- [ ] Validación de tamaño/tipo en cliente
- [ ] Loading states y feedback visual
- [ ] Confirmación antes de eliminar

### Testing
- [ ] Probar upload con diferentes tipos de archivos
- [ ] Verificar límite de 10MB
- [ ] Probar permisos por rol
- [ ] Validar soft delete
- [ ] Probar descarga de archivos
- [ ] Verificar creación de carpetas automática
- [ ] Test con nombres especiales (ñ, tildes, etc.)

---

## 🧪 Pruebas con Postman/Insomnia

### 1. Subir Archivo

```http
POST http://localhost:3001/api/legajos/123/archivos
Authorization: Bearer {token}
Content-Type: multipart/form-data

Body (form-data):
- archivo: [seleccionar archivo]
- tipo_documento: dni_frente
- descripcion: DNI Frente actualizado 2025
```

### 2. Listar Archivos

```http
GET http://localhost:3001/api/legajos/123/archivos
Authorization: Bearer {token}
```

Con filtro:
```http
GET http://localhost:3001/api/legajos/123/archivos?tipo_documento=dni_frente
Authorization: Bearer {token}
```

### 3. Descargar Archivo

```http
GET http://localhost:3001/api/legajos/123/archivos/1/descargar
Authorization: Bearer {token}
```

### 4. Eliminar Archivo

```http
DELETE http://localhost:3001/api/legajos/123/archivos/1
Authorization: Bearer {token}
```

---

## 📦 Dependencias

```json
{
  "multer": "^2.0.2",
  "fs": "built-in",
  "path": "built-in",
  "mysql2": "^3.11.3"
}
```

Todas las dependencias ya están instaladas en el proyecto.

---

## 🐛 Manejo de Errores

| Error | Código | Mensaje |
|-------|--------|---------|
| Sin archivo | 400 | "No se proporcionó ningún archivo" |
| Tipo no permitido | 400 | "Tipo de archivo no permitido. Solo JPG, PNG, PDF, DOC, DOCX" |
| Tamaño excedido | 400 | "El archivo excede el tamaño máximo de 10MB" |
| Legajo no existe | 404 | "Legajo no encontrado" |
| Sin permisos | 403 | "No tienes permisos para subir archivos a este legajo" |
| Archivo no existe | 404 | "Archivo no encontrado" |
| Error servidor | 500 | Mensaje específico del error |

---

## 🔜 Próximos Pasos

1. **Testing Backend** (inmediato)
   - Probar endpoints con Postman
   - Verificar permisos
   - Validar uploads/downloads

2. **Frontend** (siguiente fase)
   - Diseñar UI/UX para carga de archivos
   - Implementar drag & drop
   - Vista previa de documentos
   - Gestión de archivos existentes

3. **Mejoras Futuras** (opcional)
   - Versionado de documentos
   - Compresión automática de imágenes
   - OCR para extraer texto de DNI
   - Notificaciones al subir documentos importantes
   - Expiración automática de documentos

---

## 📝 Notas Técnicas

1. **Soft Delete:** Los archivos no se eliminan físicamente de inmediato, solo se marcan como `activo = FALSE`. Esto permite recuperación en caso de error.

2. **Nombres Sanitizados:** Los nombres de archivo se limpian automáticamente removiendo caracteres especiales para evitar problemas en el sistema de archivos.

3. **Carpetas Auto-creadas:** El middleware crea automáticamente la carpeta del legajo si no existe.

4. **Timestamp Único:** Cada archivo incluye un timestamp en milisegundos para garantizar nombres únicos.

5. **MIME Type Validation:** Se valida tanto la extensión como el MIME type del archivo para mayor seguridad.

---

## 👨‍💻 Autor

Sistema desarrollado por el equipo de desarrollo RRHH.

**Última actualización:** 18/11/2025 20:06
