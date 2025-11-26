-- Ejemplos de procedimientos almacenados para Oracle Database
-- Estos procedimientos pueden ser utilizados desde el backend usando DatabaseService.executeProcedure()

-- Procedimiento para obtener reservas por barbero y fecha
CREATE OR REPLACE PROCEDURE obtener_reservas_barbero_fecha(
  p_barbero_id IN NUMBER,
  p_fecha IN DATE,
  p_cursor OUT SYS_REFCURSOR
) AS
BEGIN
  OPEN p_cursor FOR
    SELECT 
      r.id,
      r.cliente_id as clienteId,
      u.nombre as cliente,
      r.barbero_id as barberoId,
      b.nombre as barbero,
      s.nombre as servicio,
      TO_CHAR(r.fecha, 'YYYY-MM-DD') as fecha,
      r.hora,
      r.estado,
      r.notas,
      TO_CHAR(r.fecha_creacion, 'YYYY-MM-DD"T"HH24:MI:SS') as fechaCreacion
    FROM reservas r
    INNER JOIN usuarios u ON r.cliente_id = u.id
    INNER JOIN barberos b ON r.barbero_id = b.id
    INNER JOIN servicios s ON r.servicio_id = s.id
    WHERE r.barbero_id = p_barbero_id
      AND r.fecha = p_fecha
      AND r.estado NOT IN ('cancelada')
    ORDER BY r.hora;
END;
/

-- Procedimiento para crear una reserva con validaciones
CREATE OR REPLACE PROCEDURE crear_reserva_validada(
  p_cliente_id IN NUMBER,
  p_barbero_id IN NUMBER,
  p_servicio_id IN NUMBER,
  p_fecha IN DATE,
  p_hora IN VARCHAR2,
  p_notas IN VARCHAR2 DEFAULT NULL,
  p_reserva_id OUT NUMBER,
  p_resultado OUT VARCHAR2
) AS
  v_existe_reserva NUMBER;
  v_hora_bloqueada NUMBER;
BEGIN
  -- Verificar si ya existe una reserva en esa fecha y hora
  SELECT COUNT(*) INTO v_existe_reserva
  FROM reservas
  WHERE barbero_id = p_barbero_id
    AND fecha = p_fecha
    AND hora = p_hora
    AND estado NOT IN ('cancelada', 'completada');

  IF v_existe_reserva > 0 THEN
    p_resultado := 'HORA_NO_DISPONIBLE';
    RETURN;
  END IF;

  -- Verificar si la hora está bloqueada
  SELECT COUNT(*) INTO v_hora_bloqueada
  FROM horas_bloqueadas
  WHERE barbero_id = p_barbero_id
    AND fecha = p_fecha
    AND hora = p_hora;

  IF v_hora_bloqueada > 0 THEN
    p_resultado := 'HORA_BLOQUEADA';
    RETURN;
  END IF;

  -- Crear la reserva
  INSERT INTO reservas (
    id, cliente_id, barbero_id, servicio_id, 
    fecha, hora, estado, notas, fecha_creacion
  )
  VALUES (
    reservas_seq.NEXTVAL, p_cliente_id, p_barbero_id, p_servicio_id,
    p_fecha, p_hora, 'pendiente', p_notas, SYSDATE
  )
  RETURNING id INTO p_reserva_id;

  COMMIT;
  p_resultado := 'EXITO';
EXCEPTION
  WHEN OTHERS THEN
    ROLLBACK;
    p_resultado := 'ERROR: ' || SQLERRM;
END;
/

-- Procedimiento para obtener estadísticas de reservas
CREATE OR REPLACE PROCEDURE obtener_estadisticas_reservas(
  p_fecha_inicio IN DATE,
  p_fecha_fin IN DATE,
  p_cursor OUT SYS_REFCURSOR
) AS
BEGIN
  OPEN p_cursor FOR
    SELECT 
      TO_CHAR(r.fecha, 'YYYY-MM-DD') as fecha,
      COUNT(*) as total_reservas,
      SUM(CASE WHEN r.estado = 'confirmada' THEN 1 ELSE 0 END) as confirmadas,
      SUM(CASE WHEN r.estado = 'completada' THEN 1 ELSE 0 END) as completadas,
      SUM(CASE WHEN r.estado = 'cancelada' THEN 1 ELSE 0 END) as canceladas,
      SUM(s.precio) as ingresos_totales
    FROM reservas r
    INNER JOIN servicios s ON r.servicio_id = s.id
    WHERE r.fecha BETWEEN p_fecha_inicio AND p_fecha_fin
    GROUP BY r.fecha
    ORDER BY r.fecha;
END;
/

-- Procedimiento para bloquear horas de un barbero
CREATE OR REPLACE PROCEDURE bloquear_horas_barbero(
  p_barbero_id IN NUMBER,
  p_fecha IN DATE,
  p_hora_inicio IN VARCHAR2,
  p_hora_fin IN VARCHAR2,
  p_motivo IN VARCHAR2 DEFAULT NULL,
  p_resultado OUT VARCHAR2
) AS
  v_hora_actual VARCHAR2(5);
BEGIN
  v_hora_actual := p_hora_inicio;

  WHILE v_hora_actual <= p_hora_fin LOOP
    -- Verificar si ya está bloqueada
    IF NOT EXISTS (
      SELECT 1 FROM horas_bloqueadas
      WHERE barbero_id = p_barbero_id
        AND fecha = p_fecha
        AND hora = v_hora_actual
    ) THEN
      INSERT INTO horas_bloqueadas (
        id, barbero_id, fecha, hora, motivo, fecha_creacion
      )
      VALUES (
        horas_bloqueadas_seq.NEXTVAL, p_barbero_id, p_fecha, 
        v_hora_actual, p_motivo, SYSDATE
      );
    END IF;

    -- Incrementar hora (asumiendo intervalos de 30 minutos)
    v_hora_actual := TO_CHAR(
      TO_DATE(v_hora_actual, 'HH24:MI') + INTERVAL '30' MINUTE,
      'HH24:MI'
    );
  END LOOP;

  COMMIT;
  p_resultado := 'EXITO';
EXCEPTION
  WHEN OTHERS THEN
    ROLLBACK;
    p_resultado := 'ERROR: ' || SQLERRM;
END;
/

-- Nota: Asegúrate de crear la secuencia horas_bloqueadas_seq si no existe:
-- CREATE SEQUENCE horas_bloqueadas_seq START WITH 1 INCREMENT BY 1;

