-- 🔐 Script SQL: Insertar 40 Preguntas de Seguridad
-- 
-- Este script inserta 40 preguntas de seguridad en la tabla 'preguntas'
-- Uso: mysql -u usuario -p base_datos < insert-security-questions.sql
--
-- NOTA: Si las preguntas ya existen, algunos INSERTs fallarán con 
-- "Duplicate entry" dependiendo si la tabla tiene UNIQUE constraint.
-- Para limpiar primero: DELETE FROM preguntas;

INSERT INTO preguntas (pregunta, categoria) VALUES
('¿Cuál es el nombre de tu primera mascota?', 'personal'),
('¿En qué ciudad naciste?', 'personal'),
('¿Cuál es el nombre de tu madre?', 'familiar'),
('¿Cuál es el nombre de tu padre?', 'familiar'),
('¿Cuál es tu película favorita?', 'gustos'),
('¿Cuál es tu canción favorita?', 'gustos'),
('¿Cuál es tu comida favorita?', 'gustos'),
('¿Cuál fue tu primera escuela?', 'educacion'),
('¿Cuál es tu equipo de fútbol favorito?', 'gustos'),
('¿En qué mes es tu cumpleaños?', 'personal'),
('¿Cuál es el nombre de tu mejor amigo?', 'social'),
('¿Cuál es tu número de documento favorito?', 'personal'),
('¿Cuál fue tu primer trabajo?', 'laboral'),
('¿En qué ciudad viviste durante tu infancia?', 'personal'),
('¿Cuál es el nombre de tu hermano(a)?', 'familiar'),
('¿Cuál es tu color favorito?', 'gustos'),
('¿Cuál es tu deporte favorito?', 'gustos'),
('¿En qué año te graduaste de la secundaria?', 'educacion'),
('¿Cuál es el nombre de tu profesor favorito?', 'educacion'),
('¿Cuál es la marca de tu automóvil?', 'posesiones'),
('¿Cuál es tu libro favorito?', 'gustos'),
('¿En qué año obtuviste tu licencia de conducir?', 'personal'),
('¿Cuál es el nombre de tu abuelo(a) paterno?', 'familiar'),
('¿Cuál es tu hobby favorito?', 'gustos'),
('¿Cuál es el nombre de tu infancia?', 'personal'),
('¿En qué ciudad estudiaste la universidad?', 'educacion'),
('¿Cuál es tu restaurante favorito?', 'gustos'),
('¿Cuál es tu actriz o actor favorito?', 'gustos'),
('¿Cuál fue tu primera bicicleta?', 'posesiones'),
('¿Cuál es tu marca de ropa favorita?', 'gustos'),
('¿En qué calle viviste cuando eras niño?', 'personal'),
('¿Cuál es el nombre de tu mascota actual?', 'personal'),
('¿Cuál es tu aplicación móvil favorita?', 'tecnologia'),
('¿Cuál es tu videojuego favorito?', 'gustos'),
('¿En qué año compraste tu casa?', 'personal'),
('¿Cuál es tu serie de TV favorita?', 'gustos'),
('¿Cuál es el nombre de tu jefe actual?', 'laboral'),
('¿Cuál es tu idioma favorito para aprender?', 'educacion'),
('¿Cuál es tu plato tradicional favorito?', 'gustos'),
('¿En qué ciudad pretendes vivir en el futuro?', 'personal');

-- Verificar que se insertaron las preguntas
SELECT COUNT(*) as total_preguntas FROM preguntas;
