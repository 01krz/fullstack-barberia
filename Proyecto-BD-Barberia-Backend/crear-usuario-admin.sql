-- Script para crear el primer usuario administrador
-- Ejecutar este script en Oracle Database después de ejecutar script-completo-setup.sql
-- 
-- NOTA: Las contraseñas se guardan en texto plano (proyecto universitario local)

-- Opción 1: Crear usuario admin directamente
INSERT INTO LTEB_CLIENTE (
  ID_CLIENTE, NOMBRE, APELLIDOS, CORREO, PASSWORD, ES_ADMIN, ES_BARBERO, ACTIVO, TELEFONO
)
VALUES (
  LTEB_CLIENTE_SEQ.NEXTVAL, 
  'Administrador', 
  'Sistema', 
  'admin@barberia.com', 
  'admin123',  -- Contraseña en texto plano
  1,  -- ES_ADMIN = 1
  0,  -- ES_BARBERO = 0
  1,  -- ACTIVO = 1
  NULL
);

COMMIT;

-- Opción 2: Actualizar un usuario existente para hacerlo admin
-- Primero regístrate normalmente desde el frontend, luego ejecuta esto:
-- Reemplaza 'tu_email@ejemplo.com' con el email que usaste para registrarte
/*
UPDATE LTEB_CLIENTE
SET ES_ADMIN = 1
WHERE CORREO = 'tu_email@ejemplo.com';

COMMIT;
*/

-- Verificar que el usuario admin fue creado correctamente
SELECT 
  ID_CLIENTE,
  NOMBRE || ' ' || APELLIDOS as NOMBRE_COMPLETO,
  CORREO,
  PASSWORD,
  ES_ADMIN,
  ES_BARBERO,
  ACTIVO
FROM LTEB_CLIENTE
WHERE ES_ADMIN = 1;

