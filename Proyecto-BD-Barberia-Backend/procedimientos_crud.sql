-- Script de Procedimientos Almacenados (CRUDs)
-- Ejecutar en Oracle Database

-- ============================================
-- 0. SEMILLA DE DATOS (Para dependencias FK)
-- ============================================
DECLARE
    v_count NUMBER;
BEGIN
    -- Crear Región por defecto
    SELECT COUNT(*) INTO v_count FROM LTEB_REGION WHERE ID_REGION = 1;
    IF v_count = 0 THEN INSERT INTO LTEB_REGION VALUES (1, 'Maule'); END IF;

    -- Crear Ciudad por defecto
    SELECT COUNT(*) INTO v_count FROM LTEB_CIUDAD WHERE ID_CIUDAD = 1;
    IF v_count = 0 THEN INSERT INTO LTEB_CIUDAD VALUES (1, 1, 'Talca'); END IF;

    -- Crear Dirección por defecto
    SELECT COUNT(*) INTO v_count FROM LTEB_DIRECCION WHERE ID_DIRECCION = 1;
    IF v_count = 0 THEN INSERT INTO LTEB_DIRECCION VALUES (1, 'Esmeralda', 1); END IF;

    -- Crear Sucursal por defecto
    SELECT COUNT(*) INTO v_count FROM LTEB_SUCURSAL WHERE ID_SUCURSAL = 1;
    IF v_count = 0 THEN INSERT INTO LTEB_SUCURSAL VALUES (1, 1, '123456', 'Sucursal Esmeralda', 99999999); END IF;
    
    COMMIT;
END;
/

-- ============================================
-- 1. PROCEDIMIENTOS CLIENTES
-- ============================================

-- Crear Cliente
CREATE OR REPLACE PROCEDURE SP_CREAR_CLIENTE(
    p_nombre IN VARCHAR2,
    p_apellidos IN VARCHAR2,
    p_telefono IN NUMBER,
    p_correo IN VARCHAR2,
    p_password IN VARCHAR2,
    p_id_salida OUT NUMBER
) AS
BEGIN
    INSERT INTO LTEB_CLIENTE (NOMBRE, APELLIDOS, TELEFONO, CORREO, PASSWORD, ACTIVO, ES_ADMIN, ES_BARBERO)
    VALUES (p_nombre, p_apellidos, p_telefono, p_correo, p_password, 1, 0, 0)
    RETURNING ID_CLIENTE INTO p_id_salida;
    
    COMMIT;
END;
/

-- Leer Clientes (Todos, por ID o por Correo)
CREATE OR REPLACE PROCEDURE SP_LEER_CLIENTES(
    p_id_cliente IN NUMBER DEFAULT NULL,
    p_correo IN VARCHAR2 DEFAULT NULL,
    p_cursor OUT SYS_REFCURSOR
) AS
BEGIN
    IF p_id_cliente IS NOT NULL THEN
        OPEN p_cursor FOR SELECT * FROM LTEB_CLIENTE WHERE ID_CLIENTE = p_id_cliente AND ACTIVO = 1;
    ELSIF p_correo IS NOT NULL THEN
        OPEN p_cursor FOR SELECT * FROM LTEB_CLIENTE WHERE CORREO = p_correo AND ACTIVO = 1;
    ELSE
        OPEN p_cursor FOR SELECT * FROM LTEB_CLIENTE WHERE ACTIVO = 1;
    END IF;
END;
/

-- Actualizar Cliente
CREATE OR REPLACE PROCEDURE SP_ACTUALIZAR_CLIENTE(
    p_id_cliente IN NUMBER,
    p_nombre IN VARCHAR2,
    p_apellidos IN VARCHAR2,
    p_telefono IN NUMBER
) AS
BEGIN
    UPDATE LTEB_CLIENTE
    SET NOMBRE = p_nombre,
        APELLIDOS = p_apellidos,
        TELEFONO = p_telefono
    WHERE ID_CLIENTE = p_id_cliente;
    
    COMMIT;
END;
/

-- Eliminar Cliente (Lógico)
CREATE OR REPLACE PROCEDURE SP_ELIMINAR_CLIENTE(
    p_id_cliente IN NUMBER
) AS
BEGIN
    UPDATE LTEB_CLIENTE SET ACTIVO = 0 WHERE ID_CLIENTE = p_id_cliente;
    COMMIT;
END;
/

-- ============================================
-- 2. PROCEDIMIENTOS BARBEROS
-- ============================================

-- Crear Barbero
CREATE OR REPLACE PROCEDURE SP_CREAR_BARBERO(
    p_rut IN NUMBER,
    p_nombre IN VARCHAR2, -- Usaremos Apellido Paterno como nombre principal
    p_correo IN VARCHAR2,
    p_telefono IN NUMBER,
    p_id_salida OUT NUMBER
) AS
BEGIN
    -- Asumimos Sucursal 1 y Dirección 1 por defecto
    INSERT INTO LTEB_BARBERO (RUT, APELLIDO_PATERNO, CORREO, TELEFONO, ID_SUCURSAL, ID_DIRECCION)
    VALUES (p_rut, p_nombre, p_correo, p_telefono, 1, 1)
    RETURNING ID_BARBERO INTO p_id_salida;
    
    COMMIT;
END;
/

-- Leer Barberos (Todos, por ID o por ID Cliente)
CREATE OR REPLACE PROCEDURE SP_LEER_BARBEROS(
    p_id_barbero IN NUMBER DEFAULT NULL,
    p_id_cliente IN NUMBER DEFAULT NULL,
    p_cursor OUT SYS_REFCURSOR
) AS
BEGIN
    IF p_id_barbero IS NOT NULL THEN
        OPEN p_cursor FOR 
        SELECT b.*, s.NOMBRE as SUCURSAL_NOMBRE 
        FROM LTEB_BARBERO b
        LEFT JOIN LTEB_SUCURSAL s ON b.ID_SUCURSAL = s.ID_SUCURSAL
        WHERE b.ID_BARBERO = p_id_barbero;
    ELSIF p_id_cliente IS NOT NULL THEN
        OPEN p_cursor FOR 
        SELECT b.*, s.NOMBRE as SUCURSAL_NOMBRE 
        FROM LTEB_BARBERO b
        LEFT JOIN LTEB_SUCURSAL s ON b.ID_SUCURSAL = s.ID_SUCURSAL
        WHERE b.ID_CLIENTE = p_id_cliente;
    ELSE
        OPEN p_cursor FOR 
        SELECT b.*, s.NOMBRE as SUCURSAL_NOMBRE 
        FROM LTEB_BARBERO b
        LEFT JOIN LTEB_SUCURSAL s ON b.ID_SUCURSAL = s.ID_SUCURSAL;
    END IF;
END;
/

-- Actualizar Barbero
CREATE OR REPLACE PROCEDURE SP_ACTUALIZAR_BARBERO(
    p_id_barbero IN NUMBER,
    p_correo IN VARCHAR2,
    p_telefono IN NUMBER
) AS
BEGIN
    UPDATE LTEB_BARBERO
    SET CORREO = p_correo,
        TELEFONO = p_telefono
    WHERE ID_BARBERO = p_id_barbero;
    COMMIT;
END;
/

-- Eliminar Barbero
CREATE OR REPLACE PROCEDURE SP_ELIMINAR_BARBERO(
    p_id_barbero IN NUMBER
) AS
BEGIN
    DELETE FROM LTEB_BARBERO WHERE ID_BARBERO = p_id_barbero;
    COMMIT;
END;
/

-- ============================================
-- 3. PROCEDIMIENTOS SERVICIOS
-- ============================================

CREATE OR REPLACE PROCEDURE SP_CREAR_SERVICIO(
    p_nombre IN VARCHAR2,
    p_descripcion IN VARCHAR2,
    p_precio IN NUMBER,
    p_activo IN NUMBER DEFAULT 1,
    p_id_salida OUT NUMBER
) AS
BEGIN
    INSERT INTO LTEB_SERVICIO (ID_SERVICIO, NOMBRE, DESCRIPCION, PRECIO, ACTIVO)
    VALUES (LTEB_SERVICIO_SEQ.NEXTVAL, p_nombre, p_descripcion, p_precio, p_activo)
    RETURNING ID_SERVICIO INTO p_id_salida;
    COMMIT;
END;
/

CREATE OR REPLACE PROCEDURE SP_LEER_SERVICIOS(
    p_id_servicio IN NUMBER DEFAULT NULL,
    p_cursor OUT SYS_REFCURSOR
) AS
BEGIN
    IF p_id_servicio IS NOT NULL THEN
        OPEN p_cursor FOR SELECT * FROM LTEB_SERVICIO WHERE ID_SERVICIO = p_id_servicio;
    ELSE
        OPEN p_cursor FOR SELECT * FROM LTEB_SERVICIO ORDER BY ID_SERVICIO DESC;
    END IF;
END;
/

CREATE OR REPLACE PROCEDURE SP_ACTUALIZAR_SERVICIO(
    p_id_servicio IN NUMBER,
    p_nombre IN VARCHAR2,
    p_descripcion IN VARCHAR2,
    p_precio IN NUMBER,
    p_activo IN NUMBER
) AS
BEGIN
    UPDATE LTEB_SERVICIO
    SET NOMBRE = p_nombre,
        DESCRIPCION = p_descripcion,
        PRECIO = p_precio,
        ACTIVO = p_activo
    WHERE ID_SERVICIO = p_id_servicio;
    COMMIT;
END;
/

CREATE OR REPLACE PROCEDURE SP_ELIMINAR_SERVICIO(
    p_id_servicio IN NUMBER
) AS
BEGIN
    DELETE FROM LTEB_SERVICIO WHERE ID_SERVICIO = p_id_servicio;
    COMMIT;
END;
/

-- ============================================
-- 4. PROCEDIMIENTOS PRODUCTOS
-- ============================================

CREATE OR REPLACE PROCEDURE SP_CREAR_PRODUCTO(
    p_nombre IN VARCHAR2,
    p_descripcion IN VARCHAR2,
    p_precio IN NUMBER,
    p_stock IN NUMBER,
    p_id_salida OUT NUMBER
) AS
BEGIN
    INSERT INTO LTEB_PRODUCTO (NOMBRE, DESCRIPCION, PRECIO, STOCK)
    VALUES (p_nombre, p_descripcion, p_precio, p_stock)
    RETURNING ID_PRODUCTO INTO p_id_salida;
    COMMIT;
END;
/

CREATE OR REPLACE PROCEDURE SP_LEER_PRODUCTOS(
    p_cursor OUT SYS_REFCURSOR
) AS
BEGIN
    OPEN p_cursor FOR SELECT * FROM LTEB_PRODUCTO;
END;
/

CREATE OR REPLACE PROCEDURE SP_ACTUALIZAR_STOCK(
    p_id_producto IN NUMBER,
    p_cantidad IN NUMBER -- Puede ser positivo (agregar) o negativo (restar)
) AS
BEGIN
    UPDATE LTEB_PRODUCTO
    SET STOCK = STOCK + p_cantidad
    WHERE ID_PRODUCTO = p_id_producto;
    COMMIT;
END;
/

-- ============================================
-- 5. PROCEDIMIENTOS CITAS
-- ============================================

CREATE OR REPLACE PROCEDURE SP_CREAR_CITA(
    p_id_cliente IN NUMBER,
    p_id_servicio IN NUMBER,
    p_id_barbero IN NUMBER,
    p_fecha IN DATE,
    p_hora IN VARCHAR2,
    p_comentario IN VARCHAR2 DEFAULT NULL,
    p_id_salida OUT NUMBER
) AS
BEGIN
    INSERT INTO LTEB_CITA (ID_CLIENTE, ID_SERVICIO, ID_BARBERO, FECHA, HORA_INICIO, ESTADO, COMENTARIO)
    VALUES (p_id_cliente, p_id_servicio, p_id_barbero, p_fecha, p_hora, 'PENDIENTE', p_comentario)
    RETURNING ID_CITA INTO p_id_salida;
    COMMIT;
END;
/

CREATE OR REPLACE PROCEDURE SP_LEER_CITAS(
    p_id_cliente IN NUMBER DEFAULT NULL,
    p_id_barbero IN NUMBER DEFAULT NULL,
    p_cursor OUT SYS_REFCURSOR
) AS
BEGIN
    IF p_id_cliente IS NOT NULL THEN
        OPEN p_cursor FOR 
            SELECT c.*, s.NOMBRE as SERVICIO, b.APELLIDO_PATERNO as BARBERO
            FROM LTEB_CITA c
            JOIN LTEB_SERVICIO s ON c.ID_SERVICIO = s.ID_SERVICIO
            JOIN LTEB_BARBERO b ON c.ID_BARBERO = b.ID_BARBERO
            WHERE c.ID_CLIENTE = p_id_cliente;
    ELSIF p_id_barbero IS NOT NULL THEN
        OPEN p_cursor FOR 
            SELECT c.*, s.NOMBRE as SERVICIO, cl.NOMBRE as CLIENTE
            FROM LTEB_CITA c
            JOIN LTEB_SERVICIO s ON c.ID_SERVICIO = s.ID_SERVICIO
            JOIN LTEB_CLIENTE cl ON c.ID_CLIENTE = cl.ID_CLIENTE
            WHERE c.ID_BARBERO = p_id_barbero;
    ELSE
        OPEN p_cursor FOR SELECT * FROM LTEB_CITA;
    END IF;
END;
/
