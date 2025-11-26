-- Script para verificar usuarios y sus contraseñas en la base de datos
-- Ejecutar este script para diagnosticar problemas de login

-- Ver todos los usuarios con sus contraseñas (texto plano)
SELECT 
  ID_CLIENTE,
  NOMBRE || ' ' || APELLIDOS as NOMBRE_COMPLETO,
  CORREO,
  PASSWORD,
  LENGTH(PASSWORD) as LONGITUD_PASSWORD,
  ES_ADMIN,
  ES_BARBERO,
  ACTIVO
FROM LTEB_CLIENTE
ORDER BY ID_CLIENTE;

-- Verificar un usuario específico (reemplaza el email)
/*
SELECT 
  ID_CLIENTE,
  NOMBRE || ' ' || APELLIDOS as NOMBRE_COMPLETO,
  CORREO,
  PASSWORD,
  LENGTH(PASSWORD) as LONGITUD_PASSWORD,
  DUMP(PASSWORD) as DUMP_PASSWORD,  -- Muestra el contenido exacto incluyendo espacios
  ES_ADMIN,
  ES_BARBERO,
  ACTIVO
FROM LTEB_CLIENTE
WHERE CORREO = 'admin@barberia.com';
*/

-- Actualizar contraseña de un usuario (si es necesario)
-- Reemplaza el email y la contraseña
/*
UPDATE LTEB_CLIENTE
SET PASSWORD = 'admin123'  -- Nueva contraseña
WHERE CORREO = 'admin@barberia.com';

COMMIT;
*/

