# Documentación Técnica de Procedimientos Almacenados
## Proyecto Barbería Fullstack

Este documento detalla el funcionamiento de los Procedimientos Almacenados (Stored Procedures) utilizados en la capa de base de datos Oracle para la lógica de negocio del sistema.

---

### 1. Procedimientos de Gestión (CRUD Unificado)
Estos procedimientos siguen el patrón "GESTIONAR", donde un solo SP maneja todas las operaciones (Crear, Leer, Actualizar, Borrar) basándose en un parámetro de acción (`p_accion`).

**Parámetro `p_accion` común:**
*   `'C'`: **Create** (Insertar nuevo registro).
*   `'R'`: **Read** (Leer registros, devuelve un cursor).
*   `'U'`: **Update** (Actualizar registro existente).
*   `'D'`: **Delete** (Eliminado lógico o físico).

#### 1.1. SP_GESTIONAR_CLIENTE
*   **Propósito:** Administra la tabla `LTEB_CLIENTE`.
*   **Lógica:**
    *   **C:** Inserta nombre, correo, teléfono y contraseña. Asigna ID con secuencia.
    *   **R:** Permite buscar por ID o por Correo (usado para Login y validación de Barberos).
    *   **U:** Actualiza datos de contacto.
    *   **D:** Realiza un borrado lógico (`ACTIVO = 0`).

#### 1.2. SP_GESTIONAR_BARBERO_V2
*   **Propósito:** Administra la tabla `LTEB_BARBERO`.
*   **Lógica:**
    *   **C:** Vincula un cliente existente (`ID_CLIENTE`) como barbero.
    *   **R:** Devuelve datos del barbero junto con su Sucursal (JOIN).
    *   **U:** Actualiza teléfono o correo de contacto profesional.
    *   **D:** Elimina el registro de barbero (físico o lógico según implementación).

#### 1.3. SP_GESTIONAR_SERVICIO
*   **Propósito:** Catálogo de servicios (`LTEB_SERVICIO`).
*   **Lógica:**
    *   **C:** Crea un nuevo servicio (ej. "Corte Degradado") con su precio.
    *   **R:** Lista todos los servicios activos para mostrar en la reserva.
    *   **U:** Modifica precio o descripción.
    *   **D:** Desactiva el servicio para que no sea reservable.

#### 1.4. SP_GESTIONAR_PRODUCTO
*   **Propósito:** Inventario de productos (`LTEB_PRODUCTO`).
*   **Lógica:**
    *   **C:** Registra un producto nuevo con stock inicial.
    *   **R:** Lista productos disponibles.
    *   **U:** Actualiza precio o descripción. **Nota:** El stock se actualiza por separado o via Trigger.
    *   **D:** Desactiva el producto.

#### 1.5. SP_GESTIONAR_CITA
*   **Propósito:** Núcleo del sistema de reservas (`LTEB_CITA`).
*   **Lógica:**
    *   **C:** Crea la reserva validando FKs de Cliente, Barbero y Servicio. Estado inicial: 'PENDIENTE'.
    *   **R:** Permite filtrar citas por Cliente (Historial personal), por Barbero (Agenda) o por ID. Hace JOINs para traer nombres legibles.
    *   **U:** Cambia el estado (ej. a 'COMPLETADA', 'CANCELADA') o notas.
    *   **D:** Cancela la cita (Estado 'CANCELADA').
    *   **Manejo de Errores:** Incluye bloque `EXCEPTION` con `ROLLBACK` para integridad transaccional.

#### 1.6. SP_GESTIONAR_BLOQUEO
*   **Propósito:** Gestión de horarios no disponibles (`LTEB_BLOQUEO`).
*   **Lógica:**
    *   **C:** Registra una fecha y hora específica donde el barbero no atenderá.
    *   **R:** Lista bloqueos futuros para pintar en el calendario.
    *   **D:** Libera el horario (Borrado físico).

#### 1.7. SP_GESTIONAR_PROMOCION
*   **Propósito:** Marketing (`LTEB_PROMOCION`).
*   **Lógica:**
    *   **C:** Crea reglas de descuento vinculando un Servicio y un Producto.
    *   **R:** Lista promociones vigentes.

#### 1.8. SP_GESTIONAR_EVALUACION
*   **Propósito:** Feedback (`LTEB_EVALUACION`).
*   **Lógica:**
    *   **C:** Registra puntuación (1-5) y comentario asociado a una Cita.
    *   **R:** Lista evaluaciones por Barbero para calcular su reputación.

---

### 2. Procedimientos de Ventas y Finanzas
Estos procedimientos son específicos para el flujo transaccional de cierre de caja.

#### 2.1. SP_REGISTRAR_VENTA
*   **Tabla:** `LTEB_VENTA`
*   **Propósito:** Genera la cabecera de una transacción financiera.
*   **Lógica:** Recibe el ID del Cliente y el Monto Total calculado. Inserta el registro con fecha `SYSDATE` y estado 'COMPLETADA'. Retorna el `ID_VENTA` generado.

#### 2.2. SP_REGISTRAR_DETALLE_VENTA
*   **Tabla:** `LTEB_DETALLE_VENTA`
*   **Propósito:** Guarda el desglose de productos de una venta.
*   **Lógica:** Recibe `ID_VENTA`, `ID_PRODUCTO`, Cantidad y Precio Unitario. Calcula el Subtotal (`Cantidad * Precio`) y lo inserta.

---

### 3. Procedimientos de Reportes (Dashboard)
Estos procedimientos están optimizados para lectura y agregación de datos (OLAP ligero). Solo tienen modo lectura (devuelven cursor).

#### 3.1. SP_REPORTE_INGRESOS
*   **Métrica:** Dinero recaudado por Barbero.
*   **Lógica:** Suma el precio de los servicios (`LTEB_SERVICIO.PRECIO`) de todas las citas completadas. Agrupa por Barbero. Permite filtrar por Mes y Año.

#### 3.2. SP_REPORTE_PRODUCTOS_VENDIDOS
*   **Métrica:** Rotación de inventario.
*   **Lógica:** Suma la cantidad (`SUM(CANTIDAD)`) desde `LTEB_DETALLE_VENTA`. Agrupa por nombre de Producto y ordena descendente para mostrar el "Top 5".

#### 3.3. SP_REPORTE_SERVICIOS_POPULARES
*   **Métrica:** Preferencias de clientes.
*   **Lógica:** Cuenta la frecuencia (`COUNT(*)`) de cada `ID_SERVICIO` en la tabla de Citas. Muestra los 5 más solicitados.

#### 3.4. SP_REPORTE_CITAS_MES
*   **Métrica:** Volumen de atención.
*   **Lógica:** Agrupa las citas por Mes del año seleccionado y las cuenta. Útil para ver estacionalidad.

#### 3.5. SP_REPORTE_RANKING_BARBEROS
*   **Métrica:** Productividad.
*   **Lógica:** Cuenta el número total de citas atendidas por cada barbero en un periodo.

#### 3.6. SP_REPORTE_CLIENTES_FRECUENTES
*   **Métrica:** Fidelización.
*   **Lógica:** Identifica a los clientes con mayor número de citas completadas históricamente.

---

### 4. Funciones Auxiliares

#### 4.1. FN_CALCULAR_TOTAL_CITA
*   **Tipo:** `FUNCTION`
*   **Propósito:** Cálculo encapsulado de deuda.
*   **Lógica:** Recibe un `ID_CITA`. Busca el precio del servicio base y le suma el subtotal de todos los productos asociados en la tabla de ventas. Retorna el monto final a pagar.
