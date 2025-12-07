-- Script de Implementación de Historial de Stock y Registro de Ventas

-- 1. Trigger para registrar movimientos de stock automáticamente
CREATE OR REPLACE TRIGGER TRG_AU_PRODUCTO_STOCK
AFTER UPDATE OF STOCK ON LTEB_PRODUCTO
FOR EACH ROW
DECLARE
    v_diferencia NUMBER;
    v_tipo VARCHAR2(20);
BEGIN
    v_diferencia := :NEW.STOCK - :OLD.STOCK;
    
    IF v_diferencia != 0 THEN
        IF v_diferencia > 0 THEN
            v_tipo := 'ENTRADA';
        ELSE
            v_tipo := 'SALIDA';
            v_diferencia := ABS(v_diferencia);
        END IF;

        INSERT INTO LTEB_INVENTARIO_MOV (
            ID_MOVIMIENTO, 
            ID_PRODUCTO, 
            TIPO_MOVIMIENTO, 
            CANTIDAD, 
            FECHA, 
            MOTIVO
        ) VALUES (
            LTEB_INVENTARIO_MOV_SEQ.NEXTVAL,
            :NEW.ID_PRODUCTO,
            v_tipo,
            v_diferencia,
            SYSDATE,
            'Actualización de Stock'
        );
    END IF;
END;
/

-- 2. Procedimiento para registrar una venta
CREATE OR REPLACE PROCEDURE SP_REGISTRAR_VENTA(
    p_id_cliente IN NUMBER,
    p_total IN NUMBER,
    p_id_salida OUT NUMBER
) AS
BEGIN
    INSERT INTO LTEB_VENTA (
        ID_VENTA,
        ID_CLIENTE,
        FECHA,
        TOTAL,
        ESTADO
    ) VALUES (
        LTEB_VENTA_SEQ.NEXTVAL,
        p_id_cliente,
        SYSDATE,
        p_total,
        'COMPLETADA'
    )
    RETURNING ID_VENTA INTO p_id_salida;
    
    COMMIT;
END;
/

-- 3. Procedimiento para registrar detalle de venta
CREATE OR REPLACE PROCEDURE SP_REGISTRAR_DETALLE_VENTA(
    p_id_venta IN NUMBER,
    p_id_producto IN NUMBER,
    p_cantidad IN NUMBER,
    p_precio IN NUMBER
) AS
BEGIN
    INSERT INTO LTEB_DETALLE_VENTA (
        ID_DETALLE,
        ID_VENTA,
        ID_PRODUCTO,
        CANTIDAD,
        PRECIO,
        SUBTOTAL
    ) VALUES (
        LTEB_DETALLE_VENTA_SEQ.NEXTVAL,
        p_id_venta,
        p_id_producto,
        p_cantidad,
        p_precio,
        p_cantidad * p_precio
    );
    
    COMMIT;
END;
/

EXIT;
