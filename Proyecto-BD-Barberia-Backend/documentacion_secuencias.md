# Documentación Técnica de Secuencias
## Proyecto Barbería Fullstack

Este documento detalla las Secuencias (Sequences) implementadas en la base de datos Oracle. Estas estructuras son responsables de generar identificadores numéricos únicos y autoincrementales para cada tabla del sistema.

---

### 1. Propósito y Funcionamiento
En Oracle, a diferencia de otras bases de datos que usan campos "AUTO_INCREMENT", se utilizan objetos independientes llamados **Secuencias**.

*   **Funcionamiento:** Cada vez que se inserta un registro nuevo, el Trigger asociado llama a `SECUENCIA.NEXTVAL` para obtener el siguiente número disponible.
*   **Configuración:** Todas las secuencias inician en 1 (o en el último valor importado) e incrementan de 1 en 1 (`INCREMENT BY 1`).

---

### 2. Listado de Secuencias Implementadas

Cada tabla principal del sistema tiene su propia secuencia dedicada para garantizar la independencia de los IDs.

#### Secuencias de Entidades Principales
1.  **LTEB_CLIENTE_SEQ:** Genera IDs para Clientes.
2.  **LTEB_BARBERO_SEQ:** Genera IDs para Barberos.
3.  **LTEB_SERVICIO_SEQ:** Genera IDs para Servicios.
4.  **LTEB_PRODUCTO_SEQ:** Genera IDs para Productos.
5.  **LTEB_CITA_SEQ:** Genera IDs para Citas/Reservas.

#### Secuencias de Operación y Negocio
6.  **LTEB_BLOQUEO_SEQ:** Identificadores para los bloqueos de horario.
7.  **LTEB_PROMOCION_SEQ:** Identificadores para las promociones.
8.  **LTEB_EVALUACION_SEQ:** Identificadores para las evaluaciones de servicio.
9.  **LTEB_VENTA_SEQ:** Identificadores únicos para cada venta realizada.
10. **LTEB_DETALLE_VENTA_SEQ:** Identificadores para cada línea de detalle de venta.
11. **LTEB_INVENTARIO_MOV_SEQ:** Identificadores para el historial de movimientos de stock.

#### Secuencias de Auditoría y Sistema
12. **LTEB_AUDITORIA_SEQ:** Identificadores para registros de auditoría general.

#### Secuencias Geográficas (Tablas Auxiliares)
13. **LTEB_SUCURSAL_SEQ:** Identificadores de Sucursales.
14. **LTEB_REGION_SEQ:** Identificadores de Regiones.
15. **LTEB_CIUDAD_SEQ:** Identificadores de Ciudades.
16. **LTEB_DIRECCION_SEQ:** Identificadores de Direcciones.

---

### 3. Uso en el Código
Aunque las secuencias son objetos de base de datos, son invocadas implícitamente por los Triggers `BEFORE INSERT`.
*   **Ejemplo:** Al ejecutar `INSERT INTO LTEB_CLIENTE (NOMBRE...) VALUES ('Juan'...)`, el trigger `TRG_BI_CLIENTE` intercepta la operación, solicita `LTEB_CLIENTE_SEQ.NEXTVAL` y lo asigna al campo `ID_CLIENTE`.
