# Documentación de Arquitectura Técnica y Conexión
## Proyecto Barbería Fullstack

Este documento describe la arquitectura técnica del sistema, enfocándose en el modelo de capas, la estrategia de conexión a la base de datos y la implementación del patrón "Cliente Gordo en Base de Datos" (Thick Database), cumpliendo con los estándares de robustez y seguridad solicitados.

---

### 1. Modelo en Capas (Arquitectura Cliente-Servidor)

El sistema sigue una arquitectura estricta de 3 capas, donde cada nivel tiene una responsabilidad única y no accede a los datos de otra forma que no sea a través de la capa inmediatamente inferior.

#### A. Capa de Presentación (Frontend - Cliente)
*   **Tecnología:** Angular (TypeScript, HTML, CSS).
*   **Responsabilidad:** Interfaz de usuario (UI), validaciones básicas de formulario y consumo de APIs REST.
*   **Comunicación:** Realiza peticiones HTTP (GET, POST, PUT, DELETE) al servidor Backend. **Nunca** se conecta directamente a la base de datos.

#### B. Capa de Negocio / Servicios (Backend - Servidor de Aplicaciones)
*   **Tecnología:** NestJS (Node.js).
*   **Responsabilidad:**
    *   Autenticación y Autorización (JWT).
    *   Orquestación de llamadas.
    *   Exposición de Endpoints REST.
*   **Filosofía "Thin Server" (Servidor Delgado):** El backend contiene la mínima lógica posible. Su función principal es recibir los datos del cliente, prepararlos y pasarlos a la Base de Datos para su procesamiento.

#### C. Capa de Datos (Backend - Servidor de Base de Datos)
*   **Tecnología:** Oracle Database 21c Express Edition.
*   **Responsabilidad:**
    *   **Persistencia:** Almacenamiento seguro de la información.
    *   **Lógica de Negocio "Dura":** Toda la lógica crítica (Crear, Validar, Calcular, Borrar) reside aquí en forma de Procedimientos Almacenados y Triggers.
    *   **Integridad:** Restricciones (Constraints), Claves Foráneas y Secuencias.

---

### 2. Estrategia de Conexión a Base de Datos

La conexión se gestiona a través de un módulo dedicado (`DatabaseModule`) que encapsula toda la complejidad técnica, asegurando que el resto de la aplicación sea agnóstica a la infraestructura.

#### 2.1. Driver y Configuración
*   **Driver:** `node-oracledb` (Driver oficial de Oracle para Node.js).
*   **Tipo de Conexión:** Pool de Conexiones (Connection Pooling).
    *   *Justificación:* En lugar de abrir y cerrar una conexión por cada usuario (lo cual es lento y costoso), el sistema mantiene un "estanque" de conexiones listas para usar. Esto permite soportar alta concurrencia y múltiples usuarios simultáneos sin degradar el rendimiento.

#### 2.2. Parámetros de Conexión
La conexión se establece utilizando credenciales seguras y una cadena de conexión estándar:
*   **User:** `usuario_bd_personal` (Usuario dedicado con permisos limitados al esquema).
*   **Connect String:** `localhost:1521/XEPDB1` (Host, Puerto y Nombre del Servicio Pluggable).

#### 2.3. Seguridad en la Conexión
*   Las credenciales no están "quemadas" en el código fuente de los servicios, sino centralizadas en el servicio de base de datos (y en un entorno productivo, vendrían de variables de entorno `.env`).
*   El backend actúa como un "Proxy Seguro": El usuario final (desde el navegador) **jamás** tiene acceso a las credenciales de la base de datos.

---

### 3. Implementación de Lógica: ¿Cuándo se usan los Procedimientos?

Para cumplir con el requerimiento de **"Cliente Gordo en Base de Datos"**, el sistema sigue una regla de oro:

> **"Si implica manipular datos, lo hace un Procedimiento Almacenado."**

#### Flujo de una Operación Típica (Ej: Crear una Cita)

1.  **Frontend:** El usuario llena el formulario y hace clic en "Reservar". Envía un JSON al Backend.
2.  **Backend (Controller):** Recibe la petición `POST /reservas`.
3.  **Backend (Service):**
    *   NO escribe `INSERT INTO...` en el código JavaScript.
    *   En su lugar, prepara los parámetros (`Bind Parameters`) y llama a `SP_GESTIONAR_CITA`.
    ```typescript
    // Ejemplo conceptual del código en NestJS
    await this.databaseService.executeProcedure(
        'BEGIN SP_GESTIONAR_CITA(:accion, :cliente, :servicio, ...); END;',
        { ...params }
    );
    ```
4.  **Base de Datos (Oracle):**
    *   El SP recibe los datos.
    *   Inicia una Transacción.
    *   Valida reglas de negocio.
    *   Inserta el registro.
    *   Los Triggers se disparan automáticamente (Generar ID, Auditar Stock).
    *   Si todo sale bien, hace `COMMIT`. Si falla, hace `ROLLBACK` y devuelve el error.

#### Ventajas de esta Arquitectura (Para la Rúbrica)
1.  **Seguridad:** Evita Inyección SQL, ya que se usan parámetros vinculados (`:param`) y no concatenación de cadenas.
2.  **Rendimiento:** Los planes de ejecución de los SPs están pre-compilados en la base de datos.
3.  **Mantenibilidad:** Si cambia una regla de negocio (ej. cómo se calcula un descuento), se modifica el SP en la base de datos y no es necesario re-compilar ni re-desplegar el Backend ni el Frontend.
4.  **Integridad:** Garantiza que los datos siempre se manipulen de forma completa y correcta, sin importar desde dónde se llame al procedimiento.
