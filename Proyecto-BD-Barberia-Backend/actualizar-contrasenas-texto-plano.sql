-- Script para actualizar contraseñas hasheadas a texto plano
-- Ejecutar este script si tienes usuarios con contraseñas hasheadas (60 caracteres)
-- y quieres convertirlas a texto plano para el proyecto universitario

-- IMPORTANTE: Este script actualiza TODAS las contraseñas a valores por defecto
-- Ajusta las contraseñas según tus necesidades

-- Opción 1: Actualizar contraseña de un usuario específico
UPDATE LTEB_CLIENTE
SET PASSWORD = 'tu_contraseña_aqui'  -- Reemplaza con la contraseña deseada
WHERE CORREO = 'gamer.nachin.pro@gmail.com';

COMMIT;

-- Opción 2: Actualizar contraseña del admin
UPDATE LTEB_CLIENTE
SET PASSWORD = 'admin123'
WHERE CORREO = 'admin@barberia.com';

COMMIT;

-- Opción 3: Ver usuarios con contraseñas hasheadas (más de 30 caracteres)
SELECT 
  ID_CLIENTE,
  CORREO,
  PASSWORD,
  LENGTH(PASSWORD) as LONGITUD_PASSWORD,
  CASE 
    WHEN LENGTH(PASSWORD) > 30 THEN 'HASHEADO (bcrypt)'
    ELSE 'TEXTO PLANO'
  END as TIPO_PASSWORD
FROM LTEB_CLIENTE
WHERE PASSWORD IS NOT NULL
ORDER BY LONGITUD_PASSWORD DESC;

-- Opción 4: Actualizar todos los usuarios con contraseñas hasheadas a una contraseña por defecto
-- CUIDADO: Esto cambiará todas las contraseñas hasheadas a 'password123'
/*
UPDATE LTEB_CLIENTE
SET PASSWORD = 'password123'
WHERE LENGTH(PASSWORD) > 30;

COMMIT;
*/

