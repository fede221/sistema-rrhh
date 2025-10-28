-- 🔧 Migración: Agregar campo 'convenio' a tabla 'usuarios'
-- Descripción: Permite clasificar empleados como dentro o fuera de convenio
-- Versión: 1.0
-- Fecha: 2024
-- Base de datos: MySQL

-- Verificar si la columna ya existe e intentar agregarla
ALTER TABLE usuarios
ADD COLUMN convenio VARCHAR(20) DEFAULT 'dentro' COMMENT 'Clasificación: "dentro" (dentro de convenio) o "fuera" (fuera de convenio)';

-- Crear índice para búsquedas rápidas por convenio (opcional: solo si no existe)
CREATE INDEX idx_usuarios_convenio ON usuarios(convenio);
