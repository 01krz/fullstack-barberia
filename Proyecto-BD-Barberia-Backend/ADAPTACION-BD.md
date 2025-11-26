# Adaptación del Backend a la Estructura Real de la BD

## Cambios Principales

### 1. Nombres de Tablas
- Todas las tablas tienen prefijo `LTEB_`
- Nombres de columnas en MAYÚSCULAS con guiones bajos

### 2. Mapeo de Tablas

| Backend Original | BD Real | Notas |
|-----------------|---------|-------|
| `usuarios` | `LTEB_CLIENTE` | No tiene password ni rol |
| `reservas` | `LTEB_CITA` | Campo `hora` → `HORA_INICIO` |
| `barberos` | `LTEB_BARBERO` | Estructura diferente (RUT, apellidos) |
| `servicios` | `LTEB_SERVICIO` | Solo tiene ID_SERVICIO, NOMBRE, PRECIO |
| `productos` | `LTEB_PRODUCTO` | Similar pero nombres en mayúsculas |
| `promociones` | `LTEB_PROMOCION` | Estructura diferente |

### 3. Estructura de LTEB_CLIENTE
```sql
ID_CLIENTE NUMBER
NOMBRE VARCHAR2(50)
APELLIDOS VARCHAR2(50)
TELEFONO NUMBER
CORREO VARCHAR2(70)
```
**No tiene:** password, rol, activo

### 4. Estructura de LTEB_CITA (Reservas)
```sql
ID_CITA NUMBER
ID_CLIENTE NUMBER
ID_SERVICIO NUMBER
ID_BARBERO NUMBER
FECHA DATE
HORA_INICIO VARCHAR2(50)  -- En lugar de 'hora'
ESTADO VARCHAR2(10)
```
**No tiene:** notas, fecha_creacion

### 5. Estructura de LTEB_BARBERO
```sql
ID_BARBERO NUMBER
RUT NUMBER
CORREO VARCHAR2(70)
TELEFONO NUMBER
APELLIDO_PATERNO VARCHAR2(50)
APELLIDO_MATERNO VARCHAR2(50)
ID_DIRECCION NUMBER
ID_SUCURSAL NUMBER
```
**No tiene:** nombre (se construye con apellidos), activo, google_calendar_email

### 6. Estructura de LTEB_SERVICIO
```sql
ID_SERVICIO NUMBER
NOMBRE VARCHAR2(70)
PRECIO NUMBER
```
**No tiene:** descripcion, duracion, activo, fecha_creacion

### 7. Secuencias Necesarias
Las secuencias deben tener el prefijo `LTEB_`:
- `LTEB_CLIENTE_SEQ`
- `LTEB_CITA_SEQ`
- `LTEB_BARBERO_SEQ`
- `LTEB_SERVICIO_SEQ`
- `LTEB_PRODUCTO_SEQ`
- `LTEB_PROMOCION_SEQ`

### 8. Autenticación
Como `LTEB_CLIENTE` no tiene password ni rol, se necesita:
- Crear una tabla adicional para autenticación, O
- Usar solo el correo para identificación, O
- Modificar la BD para agregar estos campos

