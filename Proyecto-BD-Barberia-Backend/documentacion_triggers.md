# Documentación Técnica de Triggers (Disparadores)
## Proyecto Barbería Fullstack

Este documento detalla los Triggers implementados en la base de datos Oracle para automatizar tareas de integridad, secuencias y auditoría de inventario.

---

### 1. Triggers de Monitoreo y Auditoría
Estos triggers se disparan por eventos de negocio específicos para registrar historial o realizar cálculos automáticos.

#### 1.1. TRG_AU_PRODUCTO_STOCK
*   **Tabla Afectada:** `LTEB_PRODUCTO`
*   **Evento:** `AFTER UPDATE OF STOCK` (Después de actualizar la columna STOCK).
*   **Tipo:** `FOR EACH ROW` (Por cada fila afectada).
*   **Propósito:** Auditoría automática de inventario.
*   **Funcionamiento:**
    1.  Detecta cuando cambia el stock de un producto (ya sea por una venta o por una carga manual).
    2.  Calcula la diferencia entre el valor nuevo (`:NEW.STOCK`) y el antiguo (`:OLD.STOCK`).
    3.  Determina si es una 'ENTRADA' (diferencia positiva) o 'SALIDA' (diferencia negativa).
    4.  Inserta automáticamente un registro en la tabla `LTEB_INVENTARIO_MOV` con la fecha, cantidad y tipo de movimiento.
    *   *Beneficio:* Permite tener un historial exacto de qué pasó con cada producto sin ensuciar el código del backend.

---

### 2. Triggers de Secuencias (Integridad de Datos)
Estos triggers son fundamentales para la arquitectura de la base de datos. Se encargan de asignar automáticamente el Identificador Único (Primary Key) a cada nuevo registro antes de que se guarde (`BEFORE INSERT`).

**Patrón General:**
```sql
BEFORE INSERT ON [NOMBRE_TABLA]
FOR EACH ROW
BEGIN
  IF :NEW.[ID_PK] IS NULL THEN
    SELECT [NOMBRE_SECUENCIA].NEXTVAL INTO :NEW.[ID_PK] FROM DUAL;
  END IF;
END;
```

#### Lista de Triggers de Secuencia Implementados:

1.  **TRG_BI_CLIENTE:** Genera ID para `LTEB_CLIENTE`.
2.  **TRG_BI_BARBERO:** Genera ID para `LTEB_BARBERO`.
3.  **TRG_BI_SERVICIO:** Genera ID para `LTEB_SERVICIO`.
4.  **TRG_BI_PRODUCTO:** Genera ID para `LTEB_PRODUCTO`.
5.  **TRG_BI_CITA:** Genera ID para `LTEB_CITA`.
6.  **TRG_BI_BLOQUEO:** Genera ID para `LTEB_BLOQUEO`.
7.  **TRG_BI_PROMOCION:** Genera ID para `LTEB_PROMOCION`.
8.  **TRG_BI_EVALUACION:** Genera ID para `LTEB_EVALUACION`.
9.  **TRG_BI_VENTA:** Genera ID para `LTEB_VENTA`.
10. **TRG_BI_DETALLE_VENTA:** Genera ID para `LTEB_DETALLE_VENTA`.
11. **TRG_BI_INVENTARIO_MOV:** Genera ID para `LTEB_INVENTARIO_MOV`.
12. **TRG_BI_AUDITORIA:** Genera ID para `LTEB_AUDITORIA`.
13. **TRG_BI_SUCURSAL:** Genera ID para `LTEB_SUCURSAL`.
14. **TRG_BI_REGION:** Genera ID para `LTEB_REGION`.
15. **TRG_BI_CIUDAD:** Genera ID para `LTEB_CIUDAD`.
16. **TRG_BI_DIRECCION:** Genera ID para `LTEB_DIRECCION`.

---

### Resumen de Automatización
Gracias a estos triggers, la aplicación (Backend) **nunca** necesita preocuparse por generar IDs numéricos ni por insertar manualmente en el historial de movimientos de stock. La base de datos se encarga de mantener la integridad y la trazabilidad por sí misma.
