# Estructura de Roles y Permisos

## Concepto de Roles

El sistema utiliza una estructura basada en **flags booleanos** en lugar de un campo ROL:

- **ES_ADMIN** (NUMBER 0/1): Indica si el usuario tiene permisos de administrador
- **ES_BARBERO** (NUMBER 0/1): Indica si el usuario es barbero
- Si ambos son 0, el usuario es un **cliente normal**

## Flujo de Usuarios

### 1. Registro Inicial
- Todos los usuarios se registran como **clientes** en `LTEB_CLIENTE`
- Por defecto: `ES_ADMIN = 0`, `ES_BARBERO = 0`
- Pueden hacer reservas y ver información pública

### 2. Conversión a Barbero
- Solo un **ADMIN** puede convertir un cliente en barbero
- Proceso:
  1. Se actualiza `LTEB_CLIENTE.ES_BARBERO = 1`
  2. Se crea un registro en `LTEB_BARBERO` vinculado al cliente (`ID_CLIENTE`)
  3. El barbero mantiene su cuenta de cliente pero ahora tiene permisos de barbero

### 3. Asignación de Admin
- Solo un **ADMIN** puede hacer admin a otro usuario
- Se actualiza `LTEB_CLIENTE.ES_ADMIN = 1`
- El usuario ahora tiene acceso completo al sistema

## Mapeo de Roles para el Frontend

El backend calcula el rol basado en los flags:

```sql
CASE 
  WHEN ES_ADMIN = 1 THEN 'admin'
  WHEN ES_BARBERO = 1 THEN 'barbero'
  ELSE 'usuario'
END as rol
```

## Endpoints para Gestión de Roles

### Convertir Cliente a Barbero
```
POST /usuarios/:id/convertir-barbero
Body: {
  rut?: number,
  telefono?: number,
  idDireccion?: number,
  idSucursal?: number
}
Requiere: Rol admin
```

### Hacer Admin
```
PATCH /usuarios/:id/hacer-admin
Requiere: Rol admin
```

### Quitar Admin
```
PATCH /usuarios/:id/quitar-admin
Requiere: Rol admin
```

## Ventajas de esta Estructura

1. **Flexibilidad**: Un usuario puede ser barbero Y admin si es necesario
2. **Trazabilidad**: El barbero está vinculado a su cuenta de cliente original
3. **Simplicidad**: No hay que mantener una tabla de roles separada
4. **Compatibilidad**: Funciona con la estructura existente de `LTEB_BARBERO`

