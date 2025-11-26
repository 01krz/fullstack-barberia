-- Script para actualizar la contraseña del usuario gamer.nachin.pro@gmail.com
-- Ejecutar este script en Oracle Database

UPDATE LTEB_CLIENTE
SET PASSWORD = 'Corkineta123#'  -- Contraseña en texto plano
WHERE CORREO = 'gamer.nachin.pro@gmail.com';

COMMIT;

-- Verificar que se actualizó correctamente
SELECT 
  ID_CLIENTE,
  CORREO,
  PASSWORD,
  LENGTH(PASSWORD) as LONGITUD_PASSWORD,
  ES_ADMIN,
  ES_BARBERO,
  ACTIVO
FROM LTEB_CLIENTE
WHERE CORREO = 'gamer.nachin.pro@gmail.com';

