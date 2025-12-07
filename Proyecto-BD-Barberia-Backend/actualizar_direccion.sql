-- ============================================
-- Actualizar dirección de la barbería
-- Nueva dirección: San Javier, Villa Don Oscar, Pasaje Ramiro Castro #949
-- Región: Maule (ID=1, ya existe)
-- Ciudad: San Javier (ID=2, se creará)
-- ============================================

-- Paso 1: Crear la ciudad "San Javier" en la región Maule (ID=1)
INSERT INTO LTEB_CIUDAD(ID_CIUDAD, ID_REGION, NOMBRE)
VALUES(2, 1, 'San Javier');

-- Paso 2: Actualizar la dirección de la barbería
UPDATE LTEB_DIRECCION 
SET CALLE_NUMERO = 'Villa Don Oscar, Pasaje Ramiro Castro #949',
    ID_CIUDAD = 2
WHERE ID_DIRECCION = 1;

-- Verificar los cambios
SELECT d.ID_DIRECCION, 
       d.CALLE_NUMERO, 
       c.NOMBRE AS CIUDAD, 
       r.NOMBRE AS REGION
FROM LTEB_DIRECCION d
JOIN LTEB_CIUDAD c ON d.ID_CIUDAD = c.ID_CIUDAD
JOIN LTEB_REGION r ON c.ID_REGION = r.ID_REGION
WHERE d.ID_DIRECCION = 1;

COMMIT;
