# Backend NestJS - Sistema de Barbería

Backend desarrollado en NestJS que se conecta a una base de datos Oracle local utilizando SQL puro y procedimientos almacenados.

## Requisitos Previos

- Node.js (v18 o superior)
- Oracle Database 21c o superior
- Oracle Instant Client instalado y configurado

## Instalación

1. Instalar las dependencias:
```bash
npm install
```

2. Asegúrate de tener Oracle Instant Client instalado y configurado en tu sistema.

3. Configurar las variables de entorno (opcional, actualmente están hardcodeadas en `database.service.ts`):
   - Usuario: `usuario_bd_personal`
   - Contraseña: `corkineta123`
   - Host: `localhost`
   - Puerto: `1521`
   - Servicio: `XEPDB1`

## Estructura de la Base de Datos

El backend espera las siguientes tablas en Oracle:

### Tablas Principales

- `usuarios`: Usuarios del sistema (clientes, barberos, administradores)
- `servicios`: Servicios ofrecidos por la barbería
- `barberos`: Información de los barberos
- `reservas`: Reservas de citas
- `productos`: Productos disponibles
- `promociones`: Promociones y descuentos
- `reserva_productos`: Relación entre reservas y productos
- `horas_bloqueadas`: Horas bloqueadas por barbero

### Secuencias Necesarias

Asegúrate de crear las siguientes secuencias en Oracle:

```sql
CREATE SEQUENCE usuarios_seq START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE servicios_seq START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE barberos_seq START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE reservas_seq START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE productos_seq START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE promociones_seq START WITH 1 INCREMENT BY 1;
```

## Ejecutar la Aplicación

### Desarrollo
```bash
npm run start:dev
```

### Producción
```bash
npm run build
npm run start:prod
```

La aplicación estará disponible en `http://localhost:3000`

## Endpoints Principales

### Autenticación
- `POST /auth/login` - Iniciar sesión
- `POST /auth/registro` - Registrar nuevo usuario

### Servicios
- `GET /servicios` - Obtener todos los servicios
- `GET /servicios/activos` - Obtener servicios activos
- `POST /servicios` - Crear servicio (requiere autenticación admin)
- `PATCH /servicios/:id` - Actualizar servicio (requiere autenticación admin)
- `DELETE /servicios/:id` - Desactivar servicio (requiere autenticación admin)

### Barberos
- `GET /barberos` - Obtener todos los barberos
- `GET /barberos/activos` - Obtener barberos activos
- `POST /barberos` - Crear barbero (requiere autenticación admin)
- `PATCH /barberos/:id` - Actualizar barbero (requiere autenticación admin)
- `DELETE /barberos/:id` - Desactivar barbero (requiere autenticación admin)

### Reservas
- `GET /reservas` - Obtener todas las reservas (requiere autenticación)
- `GET /reservas?barberoId=X` - Obtener reservas por barbero
- `GET /reservas?clienteId=X` - Obtener reservas por cliente
- `POST /reservas` - Crear reserva (requiere autenticación)
- `PATCH /reservas/:id` - Actualizar reserva (requiere autenticación)
- `DELETE /reservas/:id` - Cancelar reserva (requiere autenticación)

### Productos
- `GET /productos` - Obtener todos los productos
- `GET /productos/activos` - Obtener productos activos
- `POST /productos` - Crear producto (requiere autenticación admin)
- `PATCH /productos/:id` - Actualizar producto (requiere autenticación admin)
- `DELETE /productos/:id` - Desactivar producto (requiere autenticación admin)

### Promociones
- `GET /promociones` - Obtener todas las promociones
- `GET /promociones/activas` - Obtener promociones activas
- `GET /promociones/servicio/:servicioId` - Obtener promociones por servicio
- `POST /promociones` - Crear promoción (requiere autenticación admin)
- `PATCH /promociones/:id` - Actualizar promoción (requiere autenticación admin)
- `DELETE /promociones/:id` - Desactivar promoción (requiere autenticación admin)

## Autenticación

El backend utiliza JWT (JSON Web Tokens) para la autenticación. Para acceder a endpoints protegidos, incluye el token en el header:

```
Authorization: Bearer <token>
```

## Procedimientos Almacenados

El backend está preparado para usar procedimientos almacenados. Puedes crear procedimientos en Oracle y llamarlos usando el método `executeProcedure` del `DatabaseService`.

Ejemplo de procedimiento almacenado:

```sql
CREATE OR REPLACE PROCEDURE obtener_reservas_por_fecha(
  p_fecha IN DATE,
  p_cursor OUT SYS_REFCURSOR
) AS
BEGIN
  OPEN p_cursor FOR
    SELECT * FROM reservas WHERE fecha = p_fecha;
END;
```

## CORS

El backend está configurado para aceptar peticiones desde `http://localhost:4200` (frontend Angular). Puedes modificar esto en `src/main.ts`.

## Notas Importantes

- Las contraseñas se almacenan hasheadas usando bcrypt
- Los IDs se generan automáticamente usando secuencias de Oracle
- Las fechas se manejan en formato Oracle DATE
- El backend utiliza SQL puro, no TypeORM

