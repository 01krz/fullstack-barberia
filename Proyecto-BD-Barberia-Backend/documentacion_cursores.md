# Documentación Técnica de Cursores
## Proyecto Barbería Fullstack

Este documento detalla el uso de **Cursores** en la base de datos Oracle y su integración con el Backend.

---

### 1. ¿Qué son y por qué se usan?
En este proyecto, se utilizan **Cursores de Referencia (SYS_REFCURSOR)**.
Un cursor actúa como un "puntero" o iterador sobre el conjunto de resultados de una consulta SQL.

**Propósito en la Arquitectura:**
Dado que toda la lógica de negocio reside en **Procedimientos Almacenados**, estos necesitan una forma estándar de devolver múltiples filas de datos (ej: lista de clientes, historial de citas, reporte de ventas) a la aplicación Node.js/NestJS.
El tipo de dato `SYS_REFCURSOR` permite que el procedimiento "abra" la consulta y le pase el control al Backend, el cual se encarga de "leer" (fetch) los datos.

---

### 2. Patrón de Implementación Estándar
Todos los procedimientos del sistema siguen el mismo patrón para garantizar consistencia:

1.  **Definición:** El procedimiento declara un parámetro de salida `p_cursor OUT SYS_REFCURSOR`.
2.  **Apertura:** Dependiendo de la lógica (filtros, búsquedas), se abre el cursor con una consulta específica (`OPEN p_cursor FOR SELECT...`).
3.  **Consumo:** El Backend recibe este cursor y lo itera para transformar las filas de la BD en objetos JSON.

**Ejemplo de Código PL/SQL:**
```sql
PROCEDURE SP_GESTIONAR_CLIENTE(..., p_cursor OUT SYS_REFCURSOR, ...) AS
BEGIN
    IF p_accion = 'R' THEN
        OPEN p_cursor FOR SELECT * FROM LTEB_CLIENTE;
    END IF;
END;
```

---

### 3. Inventario de Cursores Utilizados

Cada procedimiento de lectura o reporte utiliza un cursor dedicado. A continuación se listan los contextos donde se emplean:

#### A. Cursores de Gestión (CRUD)
Se utilizan para devolver los datos de las entidades tras una consulta o inserción.
*   **Cursor de Clientes:** En `SP_GESTIONAR_CLIENTE`. Devuelve datos de perfil y autenticación.
*   **Cursor de Barberos:** En `SP_GESTIONAR_BARBERO_V2`. Devuelve info del barbero y su relación con el usuario.
*   **Cursor de Servicios:** En `SP_GESTIONAR_SERVICIO`. Lista el catálogo de cortes y precios.
*   **Cursor de Citas:** En `SP_GESTIONAR_CITA`. Devuelve el calendario, historial y estado de reservas.
*   **Cursor de Productos:** En `SP_GESTIONAR_PRODUCTO`. Gestiona el inventario y stock.
*   **Cursor de Bloqueos:** En `SP_GESTIONAR_BLOQUEO`. Muestra las horas no disponibles de los barberos.
*   **Cursor de Promociones:** En `SP_GESTIONAR_PROMOCION`. Lista las ofertas activas.
*   **Cursor de Evaluaciones:** En `SP_GESTIONAR_EVALUACION`. Muestra el feedback de los clientes.

#### B. Cursores de Reportes y Analítica
Estos cursores devuelven datos agregados y calculados para el Dashboard.
*   **Cursor de Ingresos:** En `SP_REPORTE_INGRESOS`. Devuelve totales monetarios por mes/semana.
*   **Cursor de Popularidad:** En `SP_REPORTE_SERVICIOS_POPULARES`. Ranking de servicios más solicitados.
*   **Cursor de Ranking:** En `SP_REPORTE_RANKING_BARBEROS`. Desempeño por barbero.
*   **Cursor de Ventas:** En `SP_REPORTE_PRODUCTOS_VENDIDOS`. Métricas de salida de stock.
*   **Cursor de Frecuencia:** En `SP_REPORTE_CLIENTES_FRECUENTES`. Top de clientes leales.

---

### 4. Manejo de Ciclo de Vida
*   **Apertura:** Responsabilidad de la Base de Datos (PL/SQL).
*   **Cierre:** Responsabilidad del Driver de Conexión (`node-oracledb`).
    *   *Nota Técnica:* El sistema está configurado para cerrar automáticamente los cursores una vez que se han leído todos los datos, evitando fugas de memoria (Memory Leaks) en el servidor de base de datos.
