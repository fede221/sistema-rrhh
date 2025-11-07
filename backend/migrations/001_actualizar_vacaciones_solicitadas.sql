-- Migración: Actualizar tabla vacaciones_solicitadas para nuevo flujo de aprobación
-- Fecha: 2025-11-04
-- Descripción: Agregar campos para referente y RH con comentarios y fechas

-- 1. Agregar columnas si no existen
-- (Una por una para evitar errores de sintaxis)

ALTER TABLE vacaciones_solicitadas
ADD COLUMN referente_id INT DEFAULT NULL AFTER estado;

ALTER TABLE vacaciones_solicitadas
ADD COLUMN referente_comentario MEDIUMTEXT DEFAULT NULL AFTER referente_id;

ALTER TABLE vacaciones_solicitadas
ADD COLUMN fecha_referente DATETIME DEFAULT NULL AFTER referente_comentario;

ALTER TABLE vacaciones_solicitadas
ADD COLUMN rh_id INT DEFAULT NULL AFTER fecha_referente;

ALTER TABLE vacaciones_solicitadas
ADD COLUMN rh_comentario MEDIUMTEXT DEFAULT NULL AFTER rh_id;

ALTER TABLE vacaciones_solicitadas
ADD COLUMN fecha_rh DATETIME DEFAULT NULL AFTER rh_comentario;

-- 2. Renombrar campo observaciones a comentarios_empleado para consistencia
ALTER TABLE vacaciones_solicitadas
CHANGE COLUMN observaciones comentarios_empleado MEDIUMTEXT;

-- 3. Modificar estado a ENUM con 5 valores (nuevo flujo)
ALTER TABLE vacaciones_solicitadas
MODIFY COLUMN estado ENUM('pendiente_referente', 'pendiente_rh', 'aprobado', 'rechazado_referente', 'rechazado_rh', 'pendiente', 'aprobado', 'rechazado') DEFAULT 'pendiente_referente';

-- 4. Agregar foreign keys para referente y RH
ALTER TABLE vacaciones_solicitadas
ADD CONSTRAINT fk_referente_id FOREIGN KEY (referente_id) REFERENCES usuarios(id) ON DELETE SET NULL;

ALTER TABLE vacaciones_solicitadas
ADD CONSTRAINT fk_rh_id FOREIGN KEY (rh_id) REFERENCES usuarios(id) ON DELETE SET NULL;

-- 5. Agregar índices para mejor performance
ALTER TABLE vacaciones_solicitadas
ADD INDEX IF NOT EXISTS idx_estado (estado),
ADD INDEX IF NOT EXISTS idx_referente_id (referente_id),
ADD INDEX IF NOT EXISTS idx_rh_id (rh_id);

-- 6. Crear tabla de historial si no existe (para auditoría)
CREATE TABLE IF NOT EXISTS vacaciones_historial_completo (
  id INT PRIMARY KEY AUTO_INCREMENT,
  solicitud_id INT NOT NULL,
  accion ENUM('creado', 'aprobado_referente', 'rechazado_referente', 'aprobado_rh', 'rechazado_rh', 'modificado') NOT NULL,
  realizado_por INT,
  comentario MEDIUMTEXT,
  fecha DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (solicitud_id) REFERENCES vacaciones_solicitadas(id) ON DELETE CASCADE,
  FOREIGN KEY (realizado_por) REFERENCES usuarios(id) ON DELETE SET NULL,
  INDEX idx_solicitud_id (solicitud_id),
  INDEX idx_fecha (fecha)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
