-- Procedimiento almacenado corregido para gestionar bloqueos
-- Solución: FECHA es VARCHAR2, usar comparación directa de strings

CREATE OR REPLACE PROCEDURE SP_GESTIONAR_BLOQUEO(
    p_accion IN CHAR,
    p_id_bloqueo IN NUMBER DEFAULT NULL,
    p_id_barbero IN NUMBER DEFAULT NULL,
    p_fecha IN VARCHAR2 DEFAULT NULL,
    p_hora IN VARCHAR2 DEFAULT NULL,
    p_motivo IN VARCHAR2 DEFAULT NULL,
    p_cursor OUT SYS_REFCURSOR,
    p_id_salida OUT NUMBER
) AS
BEGIN
    p_id_salida := 0;

    IF p_accion = 'C' THEN
        -- FECHA es VARCHAR2, insertar directamente sin TO_DATE
        INSERT INTO LTEB_BLOQUEO (ID_BARBERO, FECHA, HORA, MOTIVO)
        VALUES (p_id_barbero, p_fecha, p_hora, p_motivo)
        RETURNING ID_BLOQUEO INTO p_id_salida;
        COMMIT;
        
        -- Abrir cursor vacío para evitar error "invalid cursor"
        OPEN p_cursor FOR SELECT * FROM LTEB_BLOQUEO WHERE 1=0;

    ELSIF p_accion = 'R' THEN
        IF p_id_barbero IS NOT NULL THEN
            OPEN p_cursor FOR SELECT * FROM LTEB_BLOQUEO WHERE ID_BARBERO = p_id_barbero;
        ELSE
            OPEN p_cursor FOR SELECT * FROM LTEB_BLOQUEO;
        END IF;

    ELSIF p_accion = 'D' THEN
        -- FECHA es VARCHAR2, comparar directamente como string
        DELETE FROM LTEB_BLOQUEO 
        WHERE (p_id_bloqueo IS NOT NULL AND ID_BLOQUEO = p_id_bloqueo)
           OR (p_id_barbero IS NOT NULL AND p_fecha IS NOT NULL AND p_hora IS NOT NULL 
               AND ID_BARBERO = p_id_barbero 
               AND FECHA = p_fecha 
               AND HORA = p_hora);
        COMMIT;
        
        -- Abrir cursor vacío para DELETE también
        OPEN p_cursor FOR SELECT * FROM LTEB_BLOQUEO WHERE 1=0;
    END IF;
END SP_GESTIONAR_BLOQUEO;
/
EXIT;
