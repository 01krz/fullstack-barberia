CREATE OR REPLACE PROCEDURE SP_GESTIONAR_PROMOCION(
    p_accion IN CHAR,
    p_id_promocion IN NUMBER DEFAULT NULL,
    p_servicio_id IN NUMBER DEFAULT NULL,
    p_producto_id IN NUMBER DEFAULT NULL,
    p_descuento IN NUMBER DEFAULT NULL,
    p_nombre IN VARCHAR2 DEFAULT NULL,
    p_condiciones IN VARCHAR2 DEFAULT NULL,
    p_fecha_inicio IN DATE DEFAULT NULL,
    p_fecha_fin IN DATE DEFAULT NULL,
    p_activa IN NUMBER DEFAULT NULL,
    p_cursor OUT SYS_REFCURSOR,
    p_id_salida OUT NUMBER
) AS
BEGIN
    p_id_salida := 0;

    IF p_accion = 'C' THEN
        INSERT INTO LTEB_PROMOCION (SERVICIO_ID, PRODUCTO_ID, DESCUENTO, NOMBRE, CONDICIONES, FECHA_INICIO, FECHA_FIN, ACTIVA)
        VALUES (p_servicio_id, p_producto_id, p_descuento, p_nombre, p_condiciones, p_fecha_inicio, p_fecha_fin, NVL(p_activa, 1))
        RETURNING ID_PROMOCION INTO p_id_salida;
        COMMIT;
        
        OPEN p_cursor FOR SELECT * FROM LTEB_PROMOCION WHERE ID_PROMOCION = p_id_salida;

    ELSIF p_accion = 'R' THEN
        IF p_id_promocion IS NOT NULL THEN
            OPEN p_cursor FOR SELECT * FROM LTEB_PROMOCION WHERE ID_PROMOCION = p_id_promocion;
        ELSIF p_servicio_id IS NOT NULL THEN
            OPEN p_cursor FOR SELECT * FROM LTEB_PROMOCION WHERE SERVICIO_ID = p_servicio_id AND ACTIVA = 1;
        ELSE
            OPEN p_cursor FOR SELECT * FROM LTEB_PROMOCION;
        END IF;

    ELSIF p_accion = 'U' THEN
        UPDATE LTEB_PROMOCION
        SET SERVICIO_ID = NVL(p_servicio_id, SERVICIO_ID),
            PRODUCTO_ID = NVL(p_producto_id, PRODUCTO_ID),
            DESCUENTO = NVL(p_descuento, DESCUENTO),
            NOMBRE = NVL(p_nombre, NOMBRE),
            CONDICIONES = NVL(p_condiciones, CONDICIONES),
            FECHA_INICIO = NVL(p_fecha_inicio, FECHA_INICIO),
            FECHA_FIN = NVL(p_fecha_fin, FECHA_FIN),
            ACTIVA = NVL(p_activa, ACTIVA)
        WHERE ID_PROMOCION = p_id_promocion;
        COMMIT;
        p_id_salida := p_id_promocion;
        
        OPEN p_cursor FOR SELECT * FROM LTEB_PROMOCION WHERE ID_PROMOCION = p_id_promocion;

    ELSIF p_accion = 'D' THEN
        DELETE FROM LTEB_PROMOCION WHERE ID_PROMOCION = p_id_promocion;
        COMMIT;
        p_id_salida := p_id_promocion;
        
        -- Return empty cursor since the record no longer exists
        OPEN p_cursor FOR SELECT * FROM LTEB_PROMOCION WHERE 1=0;
    END IF;
END;
/
EXIT;
