-- Script de creación de tablas y secuencias para el sistema de barbería
-- Ejecutar este script en Oracle Database antes de usar el backend

-- Crear secuencias
CREATE SEQUENCE usuarios_seq START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE servicios_seq START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE barberos_seq START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE reservas_seq START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE productos_seq START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE promociones_seq START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE horas_bloqueadas_seq START WITH 1 INCREMENT BY 1;

-- Tabla de usuarios
CREATE TABLE usuarios (
  id NUMBER PRIMARY KEY,
  email VARCHAR2(255) UNIQUE NOT NULL,
  password VARCHAR2(255) NOT NULL,
  nombre VARCHAR2(255) NOT NULL,
  rol VARCHAR2(50) NOT NULL DEFAULT 'usuario',
  activo NUMBER(1) DEFAULT 1,
  fecha_creacion DATE DEFAULT SYSDATE
);

-- Tabla de servicios
CREATE TABLE servicios (
  id NUMBER PRIMARY KEY,
  nombre VARCHAR2(255) NOT NULL,
  descripcion VARCHAR2(1000),
  precio NUMBER(10,2) NOT NULL,
  duracion NUMBER(3) NOT NULL, -- en minutos
  activo NUMBER(1) DEFAULT 1,
  fecha_creacion DATE DEFAULT SYSDATE
);

-- Tabla de barberos
CREATE TABLE barberos (
  id NUMBER PRIMARY KEY,
  nombre VARCHAR2(255) NOT NULL,
  email VARCHAR2(255) UNIQUE NOT NULL,
  telefono VARCHAR2(50),
  activo NUMBER(1) DEFAULT 1,
  google_calendar_email VARCHAR2(255),
  fecha_creacion DATE DEFAULT SYSDATE
);

-- Tabla de productos
CREATE TABLE productos (
  id NUMBER PRIMARY KEY,
  nombre VARCHAR2(255) NOT NULL,
  descripcion VARCHAR2(1000),
  precio NUMBER(10,2) NOT NULL,
  stock NUMBER(10) DEFAULT 0,
  activo NUMBER(1) DEFAULT 1,
  fecha_creacion DATE DEFAULT SYSDATE
);

-- Tabla de promociones
CREATE TABLE promociones (
  id NUMBER PRIMARY KEY,
  servicio_id NUMBER NOT NULL,
  producto_id NUMBER,
  porcentaje_descuento NUMBER(5,2) NOT NULL,
  fecha_inicio DATE NOT NULL,
  fecha_fin DATE NOT NULL,
  activa NUMBER(1) DEFAULT 1,
  fecha_creacion DATE DEFAULT SYSDATE,
  CONSTRAINT fk_promocion_servicio FOREIGN KEY (servicio_id) REFERENCES servicios(id),
  CONSTRAINT fk_promocion_producto FOREIGN KEY (producto_id) REFERENCES productos(id)
);

-- Tabla de reservas
CREATE TABLE reservas (
  id NUMBER PRIMARY KEY,
  cliente_id NUMBER NOT NULL,
  barbero_id NUMBER NOT NULL,
  servicio_id NUMBER NOT NULL,
  fecha DATE NOT NULL,
  hora VARCHAR2(5) NOT NULL,
  estado VARCHAR2(50) DEFAULT 'pendiente',
  notas VARCHAR2(1000),
  fecha_creacion DATE DEFAULT SYSDATE,
  CONSTRAINT fk_reserva_cliente FOREIGN KEY (cliente_id) REFERENCES usuarios(id),
  CONSTRAINT fk_reserva_barbero FOREIGN KEY (barbero_id) REFERENCES barberos(id),
  CONSTRAINT fk_reserva_servicio FOREIGN KEY (servicio_id) REFERENCES servicios(id)
);

-- Tabla de relación reserva-productos
CREATE TABLE reserva_productos (
  reserva_id NUMBER NOT NULL,
  producto_id NUMBER NOT NULL,
  CONSTRAINT fk_reserva_producto_reserva FOREIGN KEY (reserva_id) REFERENCES reservas(id),
  CONSTRAINT fk_reserva_producto_producto FOREIGN KEY (producto_id) REFERENCES productos(id),
  CONSTRAINT pk_reserva_producto PRIMARY KEY (reserva_id, producto_id)
);

-- Tabla de horas bloqueadas
CREATE TABLE horas_bloqueadas (
  id NUMBER PRIMARY KEY,
  barbero_id NUMBER NOT NULL,
  fecha DATE NOT NULL,
  hora VARCHAR2(5) NOT NULL,
  motivo VARCHAR2(500),
  fecha_creacion DATE DEFAULT SYSDATE,
  CONSTRAINT fk_hora_bloqueada_barbero FOREIGN KEY (barbero_id) REFERENCES barberos(id)
);

-- Crear índices para mejorar el rendimiento
CREATE INDEX idx_reservas_fecha ON reservas(fecha);
CREATE INDEX idx_reservas_barbero ON reservas(barbero_id);
CREATE INDEX idx_reservas_cliente ON reservas(cliente_id);
CREATE INDEX idx_horas_bloqueadas_barbero_fecha ON horas_bloqueadas(barbero_id, fecha);

-- Insertar datos de ejemplo (opcional)
-- Usuario administrador (password: admin123 - debe ser hasheado con bcrypt)
INSERT INTO usuarios (id, email, password, nombre, rol, activo) 
VALUES (usuarios_seq.NEXTVAL, 'admin@barberia.com', '$2b$10$rOzJqKqKqKqKqKqKqKqKqOqKqKqKqKqKqKqKqKqKqKqKqKqKqKqKqKq', 'Administrador', 'admin', 1);

-- Nota: La contraseña debe ser hasheada usando bcrypt antes de insertarla
-- Para generar el hash, puedes usar Node.js:
-- const bcrypt = require('bcrypt');
-- const hash = await bcrypt.hash('admin123', 10);

COMMIT;

