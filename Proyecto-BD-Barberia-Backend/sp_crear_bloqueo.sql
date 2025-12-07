-- Procedimiento almacenado para crear bloqueos de horas
-- Este procedimiento es específico para INSERT y no usa cursor

CREATE OR REPLACE PROCEDURE SP_CREAR_BLOQUEO (
    p_id_barbero IN NUMBER,
    p_fecha IN VARCHAR2,
    p_hora IN VARCHAR2,
    p_motivo IN VARCHAR2,
    p_id_salida OUT NUMBER
)
AS
BEGIN
    -- Insertar el bloqueo en la tabla
    INSERT INTO LTEB_BLOQUEO (ID_BARBERO, FECHA, HORA, MOTIVO)
    VALUES (p_id_barbero, TO_DATE(p_fecha, 'YYYY-MM-DD'), p_hora, p_motivo)
    RETURNING ID_BLOQUEO INTO p_id_salida;
    
    COMMIT;
    
EXCEPTION
    WHEN OTHERS THEN
        ROLLBACK;
        RAISE;
END SP_CREAR_BLOQUEO;
/
