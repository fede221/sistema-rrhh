-- Migración: Tabla para archivos adjuntos de legajos
-- Fecha: 2025-11-18
-- Descripción: Permite adjuntar documentos a los legajos (DNI, títulos, certificados, etc.)

CREATE TABLE IF NOT EXISTS legajo_archivos (
  id INT PRIMARY KEY AUTO_INCREMENT,
  legajo_id INT NOT NULL,
  tipo_documento ENUM('dni_frente', 'dni_dorso', 'titulo', 'certificado', 'constancia', 'otro') NOT NULL,
  nombre_archivo VARCHAR(255) NOT NULL,
  ruta_archivo VARCHAR(500) NOT NULL,
  tamaño_kb INT NOT NULL,
  mime_type VARCHAR(100) NOT NULL,
  descripcion TEXT,
  fecha_subida DATETIME DEFAULT CURRENT_TIMESTAMP,
  subido_por INT,
  activo BOOLEAN DEFAULT TRUE,
  FOREIGN KEY (legajo_id) REFERENCES legajos(id) ON DELETE CASCADE,
  FOREIGN KEY (subido_por) REFERENCES usuarios(id) ON DELETE SET NULL,
  INDEX idx_legajo_id (legajo_id),
  INDEX idx_tipo_documento (tipo_documento),
  INDEX idx_fecha_subida (fecha_subida)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Comentarios para documentación
ALTER TABLE legajo_archivos 
  COMMENT = 'Almacena archivos adjuntos de legajos (documentos, certificados, etc.)';
