-- Script para agregar campos de autenticación a LTEB_CLIENTE
-- Ejecutar este script en Oracle Database

-- Agregar campos de autenticación a la tabla LTEB_CLIENTE
ALTER TABLE LTEB_CLIENTE ADD PASSWORD VARCHAR2(255);
ALTER TABLE LTEB_CLIENTE ADD ES_ADMIN NUMBER(1) DEFAULT 0; -- 0 = false, 1 = true
ALTER TABLE LTEB_CLIENTE ADD ES_BARBERO NUMBER(1) DEFAULT 0; -- 0 = false, 1 = true
ALTER TABLE LTEB_CLIENTE ADD ACTIVO NUMBER(1) DEFAULT 1;

-- Crear índice para mejorar búsquedas por correo
CREATE INDEX IDX_LTEB_CLIENTE_CORREO ON LTEB_CLIENTE(CORREO);

-- Actualizar clientes existentes
UPDATE LTEB_CLIENTE SET ES_ADMIN = 0 WHERE ES_ADMIN IS NULL;
UPDATE LTEB_CLIENTE SET ES_BARBERO = 0 WHERE ES_BARBERO IS NULL;
UPDATE LTEB_CLIENTE SET ACTIVO = 1 WHERE ACTIVO IS NULL;

-- Agregar relación entre LTEB_CLIENTE y LTEB_BARBERO si no existe
-- Esto permite que un barbero esté vinculado a un cliente
-- Verificar si la columna ya existe antes de agregarla
BEGIN
  EXECUTE IMMEDIATE 'ALTER TABLE LTEB_BARBERO ADD ID_CLIENTE NUMBER';
EXCEPTION
  WHEN OTHERS THEN
    IF SQLCODE = -1430 THEN -- Columna ya existe
      NULL;
    ELSE
      RAISE;
    END IF;
END;
/

-- Agregar constraint si no existe
BEGIN
  EXECUTE IMMEDIATE 'ALTER TABLE LTEB_BARBERO ADD CONSTRAINT FK_LTEB_BARBERO_CLIENTE 
    FOREIGN KEY (ID_CLIENTE) REFERENCES LTEB_CLIENTE(ID_CLIENTE)';
EXCEPTION
  WHEN OTHERS THEN
    IF SQLCODE = -2260 OR SQLCODE = -2275 THEN -- Constraint ya existe
      NULL;
    ELSE
      RAISE;
    END IF;
END;
/

COMMIT;

