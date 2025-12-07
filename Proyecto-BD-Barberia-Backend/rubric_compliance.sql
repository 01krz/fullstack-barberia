-- Script para cubrir brechas de la Rúbrica (Funciones y Excepciones)

-- 1. Crear una Función (Requisito: "Crea la función correctamente... Utiliza prefijo con sus iniciales")
-- Función para calcular el total estimado de una cita (Servicio + Productos)
CREATE OR REPLACE FUNCTION FN_CALCULAR_TOTAL_CITA(
    p_id_cita IN NUMBER
) RETURN NUMBER IS
    v_total NUMBER := 0;
    v_precio_servicio NUMBER := 0;
    v_total_productos NUMBER := 0;
BEGIN
    -- Obtener precio del servicio
    SELECT s.PRECIO INTO v_precio_servicio
    FROM LTEB_CITA c
    JOIN LTEB_SERVICIO s ON c.ID_SERVICIO = s.ID_SERVICIO
    WHERE c.ID_CITA = p_id_cita;

    -- Obtener total de productos (si hay venta asociada)
    -- Nota: Esto asume que la venta ya se registró. Si no, devuelve solo el servicio.
    BEGIN
        SELECT SUM(dv.SUBTOTAL) INTO v_total_productos
        FROM LTEB_VENTA v
        JOIN LTEB_DETALLE_VENTA dv ON v.ID_VENTA = dv.ID_VENTA
        WHERE v.ID_CITA = p_id_cita; -- Asumiendo que agregamos ID_CITA a VENTA o lo buscamos por fecha/cliente
    EXCEPTION
        WHEN NO_DATA_FOUND THEN
            v_total_productos := 0;
    END;

    v_total := v_precio_servicio + NVL(v_total_productos, 0);
    RETURN v_total;
EXCEPTION
    WHEN OTHERS THEN
        RETURN 0;
END;
/

-- 2. Actualizar un SP con Manejo de Excepciones (Requisito: "Maneja excepciones")
-- Modificamos SP_GESTIONAR_CITA para incluir un bloque EXCEPTION real
CREATE OR REPLACE PROCEDURE SP_GESTIONAR_CITA(
    p_accion IN VARCHAR2,
    p_id_cita IN NUMBER DEFAULT NULL,
    p_id_cliente IN NUMBER DEFAULT NULL,
    p_id_servicio IN NUMBER DEFAULT NULL,
    p_id_barbero IN NUMBER DEFAULT NULL,
    p_fecha IN DATE DEFAULT NULL,
    p_hora IN VARCHAR2 DEFAULT NULL,
    p_estado IN VARCHAR2 DEFAULT NULL,
    p_comentario IN VARCHAR2 DEFAULT NULL,
    p_cursor OUT SYS_REFCURSOR,
    p_id_salida OUT NUMBER
) AS
BEGIN
    p_id_salida := 0;
    
    IF p_accion = 'C' THEN
        INSERT INTO LTEB_CITA (ID_CITA, ID_CLIENTE, ID_SERVICIO, ID_BARBERO, FECHA, HORA_INICIO, ESTADO, COMENTARIO)
        VALUES (LTEB_CITA_SEQ.NEXTVAL, p_id_cliente, p_id_servicio, p_id_barbero, p_fecha, p_hora, 'PENDIENTE', p_comentario)
        RETURNING ID_CITA INTO p_id_salida;
        COMMIT;
        OPEN p_cursor FOR SELECT * FROM LTEB_CITA WHERE ID_CITA = p_id_salida;

    ELSIF p_accion = 'R' THEN
        IF p_id_cita IS NOT NULL THEN
            OPEN p_cursor FOR 
                SELECT c.*, 
                       cl.NOMBRE || ' ' || cl.APELLIDOS as CLIENTE_NOMBRE_COMPLETO,
                       b.NOMBRE_COMPLETO as BARBERO_NOMBRE,
                       s.NOMBRE as SERVICIO_NOMBRE
                FROM LTEB_CITA c
                LEFT JOIN LTEB_CLIENTE cl ON c.ID_CLIENTE = cl.ID_CLIENTE
                LEFT JOIN LTEB_BARBERO b ON c.ID_BARBERO = b.ID_BARBERO
                LEFT JOIN LTEB_SERVICIO s ON c.ID_SERVICIO = s.ID_SERVICIO
                WHERE c.ID_CITA = p_id_cita;
        ELSIF p_id_barbero IS NOT NULL THEN
            OPEN p_cursor FOR 
                SELECT c.*, 
                       cl.NOMBRE || ' ' || cl.APELLIDOS as CLIENTE_NOMBRE_COMPLETO,
                       b.NOMBRE_COMPLETO as BARBERO_NOMBRE,
                       s.NOMBRE as SERVICIO_NOMBRE
                FROM LTEB_CITA c
                LEFT JOIN LTEB_CLIENTE cl ON c.ID_CLIENTE = cl.ID_CLIENTE
                LEFT JOIN LTEB_BARBERO b ON c.ID_BARBERO = b.ID_BARBERO
                LEFT JOIN LTEB_SERVICIO s ON c.ID_SERVICIO = s.ID_SERVICIO
                WHERE c.ID_BARBERO = p_id_barbero
                ORDER BY c.FECHA DESC, c.HORA_INICIO ASC;
        ELSIF p_id_cliente IS NOT NULL THEN
            OPEN p_cursor FOR 
                SELECT c.*, 
                       cl.NOMBRE || ' ' || cl.APELLIDOS as CLIENTE_NOMBRE_COMPLETO,
                       b.NOMBRE_COMPLETO as BARBERO_NOMBRE,
                       s.NOMBRE as SERVICIO_NOMBRE
                FROM LTEB_CITA c
                LEFT JOIN LTEB_CLIENTE cl ON c.ID_CLIENTE = cl.ID_CLIENTE
                LEFT JOIN LTEB_BARBERO b ON c.ID_BARBERO = b.ID_BARBERO
                LEFT JOIN LTEB_SERVICIO s ON c.ID_SERVICIO = s.ID_SERVICIO
                WHERE c.ID_CLIENTE = p_id_cliente
                ORDER BY c.FECHA DESC, c.HORA_INICIO ASC;
        ELSE
            OPEN p_cursor FOR SELECT * FROM LTEB_CITA ORDER BY ID_CITA DESC;
        END IF;

    ELSIF p_accion = 'U' THEN
        UPDATE LTEB_CITA
        SET ESTADO = NVL(p_estado, ESTADO),
            COMENTARIO = NVL(p_comentario, COMENTARIO)
        WHERE ID_CITA = p_id_cita;
        COMMIT;
        OPEN p_cursor FOR SELECT * FROM LTEB_CITA WHERE ID_CITA = p_id_cita;

    ELSIF p_accion = 'D' THEN
        UPDATE LTEB_CITA SET ESTADO = 'CANCELADA' WHERE ID_CITA = p_id_cita;
        COMMIT;
        OPEN p_cursor FOR SELECT * FROM LTEB_CITA WHERE ID_CITA = p_id_cita;
    END IF;

EXCEPTION
    WHEN OTHERS THEN
        p_id_salida := -1;
        -- En un caso real, registraríamos el error en una tabla de logs
        ROLLBACK;
        RAISE; -- Re-lanzar el error para que el backend lo note
END;
/

EXIT;
