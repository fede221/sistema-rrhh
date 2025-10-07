-- SQL para agregar columna 'apodo' a la tabla usuarios
ALTER TABLE usuarios ADD COLUMN apodo VARCHAR(100) DEFAULT NULL;