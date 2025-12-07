CREATE OR REPLACE PROCEDURE SP_GESTIONAR_BARBERO_V2(
    p_accion IN CHAR,
    p_id_barbero IN NUMBER DEFAULT NULL,
    p_id_cliente IN NUMBER DEFAULT NULL,
    p_nombre_completo IN VARCHAR2 DEFAULT NULL,
    p_telefono IN NUMBER DEFAULT NULL,
    p_correo IN VARCHAR2 DEFAULT NULL,
    p_activo IN NUMBER DEFAULT NULL,
    p_cursor OUT SYS_REFCURSOR,
    p_id_salida OUT NUMBER
) AS
BEGIN
    p_id_salida := 0;

    IF p_accion = 'C' THEN
        INSERT INTO LTEB_BARBERO (ID_CLIENTE, NOMBRE_COMPLETO, TELEFONO, CORREO, ACTIVO)
        VALUES (p_id_cliente, p_nombre_completo, p_telefono, p_correo, 1)
        RETURNING ID_BARBERO INTO p_id_salida;
        COMMIT;
        
        OPEN p_cursor FOR SELECT * FROM LTEB_BARBERO WHERE ID_BARBERO = p_id_salida;

    ELSIF p_accion = 'R' THEN
        IF p_id_barbero IS NOT NULL THEN
            OPEN p_cursor FOR SELECT * FROM LTEB_BARBERO WHERE ID_BARBERO = p_id_barbero;
        ELSIF p_id_cliente IS NOT NULL THEN
            OPEN p_cursor FOR SELECT * FROM LTEB_BARBERO WHERE ID_CLIENTE = p_id_cliente;
        ELSE
            OPEN p_cursor FOR SELECT * FROM LTEB_BARBERO WHERE ACTIVO = 1;
        END IF;

    ELSIF p_accion = 'U' THEN
        UPDATE LTEB_BARBERO
        SET NOMBRE_COMPLETO = NVL(p_nombre_completo, NOMBRE_COMPLETO),
            TELEFONO = NVL(p_telefono, TELEFONO),
            CORREO = NVL(p_correo, CORREO),
            ACTIVO = NVL(p_activo, ACTIVO)
        WHERE ID_BARBERO = p_id_barbero;
        COMMIT;
        p_id_salida := p_id_barbero;
        
        OPEN p_cursor FOR SELECT * FROM LTEB_BARBERO WHERE ID_BARBERO = p_id_barbero;

    ELSIF p_accion = 'D' THEN
        UPDATE LTEB_BARBERO SET ACTIVO = 0 WHERE ID_BARBERO = p_id_barbero;
        COMMIT;
        p_id_salida := p_id_barbero;
        
        OPEN p_cursor FOR SELECT * FROM LTEB_BARBERO WHERE ID_BARBERO = p_id_barbero;
    END IF;
END;
/
EXIT;
