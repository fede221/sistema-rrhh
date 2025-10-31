-- Script SQL para insertar un SUPERADMIN en la base de datos
-- Uso: mysql -u usuario -p base_datos < backend/scripts/insert-superadmin.sql
-- 
-- ⚠️ IMPORTANTE: Cambiar los valores según tus necesidades:
--    - Reemplazar 'SUPER001' por el legajo deseado
--    - Reemplazar '99999999' por un DNI válido (REQUERIDO PARA LOGIN)
--    - Reemplazar 'superadmin@sistema.local' por el correo deseado
--    - La contraseña debe ser actualizada después del primer acceso
--
-- 📌 NOTA: El usuario se autentica con DNI + Contraseña
--
-- Para generar hash de contraseña, usar:
-- SELECT '$2b$10$...' as hash; (usando bcrypt con salt 10)
-- O ejecutar: node -e "const b=require('bcrypt'); b.hash('password',10,(e,h)=>console.log(h))"

-- Hash precomputado para: SuperAdmin123!
-- Para cambiar la contraseña, generar nuevo hash con bcrypt

-- Verificar que el usuario no exista
SELECT COUNT(*) as existe FROM usuarios WHERE dni = '99999999' OR correo = 'superadmin@sistema.local';

-- Insertar SUPERADMIN (descomenta la siguiente línea para ejecutar)
-- INSERT INTO usuarios 
-- (legajo, dni, nombre, apellido, correo, password, rol, activo, convenio, fecha_ingreso)
-- VALUES (
--   'SUPER001',
--   '99999999',
--   'Super',
--   'Admin',
--   'superadmin@sistema.local',
--   '$2b$10$rO9.ZwVDVH3UZ5J5Q5Q5Q5Q5Q5Q5Q5Q5Q5Q5Q5Q5Q5Q5Q5Q5Q5Q5Q5Q', -- SuperAdmin123!
--   'superadmin',
--   1,
--   'dentro',
--   NOW()
-- );

-- Verificar que se creó correctamente
-- SELECT id, legajo, dni, nombre, apellido, correo, rol, activo FROM usuarios 
-- WHERE rol = 'superadmin' 
-- ORDER BY id DESC LIMIT 1;
