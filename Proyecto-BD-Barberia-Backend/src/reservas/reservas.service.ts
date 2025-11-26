import { Injectable, BadRequestException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { CreateReservaDto } from './dto/create-reserva.dto';
import { UpdateReservaDto } from './dto/update-reserva.dto';

@Injectable()
export class ReservasService {
  constructor(private databaseService: DatabaseService) {}

  async create(createReservaDto: CreateReservaDto) {
    const {
      clienteId,
      barberoId,
      servicioId,
      fecha,
      hora,
      estado = 'pendiente',
      notas,
      productos = [],
    } = createReservaDto;

    // Verificar disponibilidad
    const disponibilidad = await this.verificarDisponibilidad(
      barberoId,
      fecha,
      hora,
    );
    if (!disponibilidad) {
      throw new BadRequestException('La hora seleccionada no está disponible');
    }

    const query = `
      INSERT INTO LTEB_CITA (
        ID_CITA, ID_CLIENTE, ID_BARBERO, ID_SERVICIO, FECHA, HORA_INICIO, ESTADO
      )
      VALUES (
        :id, :clienteId, :barberoId, :servicioId, 
        TO_DATE(:fecha, 'YYYY-MM-DD'), :hora, :estado
      )
    `;

    try {
      // Insertar la cita y obtener el ID
      const reservaId = await this.databaseService.executeInsertWithId(
        query,
        {
          clienteId,
          barberoId,
          servicioId,
          fecha,
          hora,
          estado,
        },
        'LTEB_CITA_SEQ',
      );

      // Nota: No hay tabla reserva_productos en la BD real
      // Los productos se manejan a través de LTEB_VENTA y LTEB_DETALLE_VENTA

      // Obtener la reserva creada con información relacionada
      return await this.findOne(reservaId);
    } catch (error) {
      console.error('Error al crear reserva:', error);
      throw new Error('Error al crear la reserva');
    }
  }

  async findAll() {
    const query = `
      SELECT 
        c.ID_CITA as id,
        c.ID_CLIENTE as clienteId,
        cl.NOMBRE || ' ' || cl.APELLIDOS as cliente,
        c.ID_BARBERO as barberoId,
        b.APELLIDO_PATERNO || ' ' || b.APELLIDO_MATERNO as barbero,
        s.NOMBRE as servicio,
        TO_CHAR(c.FECHA, 'YYYY-MM-DD') as fecha,
        c.HORA_INICIO as hora,
        c.ESTADO as estado
      FROM LTEB_CITA c
      INNER JOIN LTEB_CLIENTE cl ON c.ID_CLIENTE = cl.ID_CLIENTE
      INNER JOIN LTEB_BARBERO b ON c.ID_BARBERO = b.ID_BARBERO
      INNER JOIN LTEB_SERVICIO s ON c.ID_SERVICIO = s.ID_SERVICIO
      ORDER BY c.FECHA DESC, c.HORA_INICIO DESC
    `;
    return await this.databaseService.executeQuery(query);
  }

  async findByBarbero(barberoId: number) {
    const query = `
      SELECT 
        c.ID_CITA as id,
        c.ID_CLIENTE as clienteId,
        cl.NOMBRE || ' ' || cl.APELLIDOS as cliente,
        c.ID_BARBERO as barberoId,
        b.APELLIDO_PATERNO || ' ' || b.APELLIDO_MATERNO as barbero,
        s.NOMBRE as servicio,
        TO_CHAR(c.FECHA, 'YYYY-MM-DD') as fecha,
        c.HORA_INICIO as hora,
        c.ESTADO as estado
      FROM LTEB_CITA c
      INNER JOIN LTEB_CLIENTE cl ON c.ID_CLIENTE = cl.ID_CLIENTE
      INNER JOIN LTEB_BARBERO b ON c.ID_BARBERO = b.ID_BARBERO
      INNER JOIN LTEB_SERVICIO s ON c.ID_SERVICIO = s.ID_SERVICIO
      WHERE c.ID_BARBERO = :barberoId
      ORDER BY c.FECHA DESC, c.HORA_INICIO DESC
    `;
    return await this.databaseService.executeQuery(query, { barberoId });
  }

  async findByCliente(clienteId: number) {
    const query = `
      SELECT 
        c.ID_CITA as id,
        c.ID_CLIENTE as clienteId,
        cl.NOMBRE || ' ' || cl.APELLIDOS as cliente,
        c.ID_BARBERO as barberoId,
        b.APELLIDO_PATERNO || ' ' || b.APELLIDO_MATERNO as barbero,
        s.NOMBRE as servicio,
        TO_CHAR(c.FECHA, 'YYYY-MM-DD') as fecha,
        c.HORA_INICIO as hora,
        c.ESTADO as estado
      FROM LTEB_CITA c
      INNER JOIN LTEB_CLIENTE cl ON c.ID_CLIENTE = cl.ID_CLIENTE
      INNER JOIN LTEB_BARBERO b ON c.ID_BARBERO = b.ID_BARBERO
      INNER JOIN LTEB_SERVICIO s ON c.ID_SERVICIO = s.ID_SERVICIO
      WHERE c.ID_CLIENTE = :clienteId
      ORDER BY c.FECHA DESC, c.HORA_INICIO DESC
    `;
    return await this.databaseService.executeQuery(query, { clienteId });
  }

  async findOne(id: number) {
    const query = `
      SELECT 
        c.ID_CITA as id,
        c.ID_CLIENTE as clienteId,
        cl.NOMBRE || ' ' || cl.APELLIDOS as cliente,
        c.ID_BARBERO as barberoId,
        b.APELLIDO_PATERNO || ' ' || b.APELLIDO_MATERNO as barbero,
        s.NOMBRE as servicio,
        TO_CHAR(c.FECHA, 'YYYY-MM-DD') as fecha,
        c.HORA_INICIO as hora,
        c.ESTADO as estado
      FROM LTEB_CITA c
      INNER JOIN LTEB_CLIENTE cl ON c.ID_CLIENTE = cl.ID_CLIENTE
      INNER JOIN LTEB_BARBERO b ON c.ID_BARBERO = b.ID_BARBERO
      INNER JOIN LTEB_SERVICIO s ON c.ID_SERVICIO = s.ID_SERVICIO
      WHERE c.ID_CITA = :id
    `;
    const reservas = await this.databaseService.executeQuery(query, { id });
    return reservas[0] || null;
  }

  async update(id: number, updateReservaDto: UpdateReservaDto) {
    const fields = [];
    const binds: any = { id };

    if (updateReservaDto.estado !== undefined) {
      fields.push('ESTADO = :estado');
      binds.estado = updateReservaDto.estado;
    }

    if (fields.length === 0) {
      return this.findOne(id);
    }

    const query = `
      UPDATE LTEB_CITA
      SET ${fields.join(', ')}
      WHERE ID_CITA = :id
    `;

    await this.databaseService.executeUpdate(query, binds);
    return this.findOne(id);
  }

  async remove(id: number) {
    const query = `
      UPDATE LTEB_CITA
      SET ESTADO = 'cancelada'
      WHERE ID_CITA = :id
    `;
    await this.databaseService.executeUpdate(query, { id });
    return { message: 'Cita cancelada correctamente' };
  }

  async verificarDisponibilidad(
    barberoId: number,
    fecha: string,
    hora: string,
  ): Promise<boolean> {
    // Verificar si hay una cita activa en esa fecha y hora
    const reservaQuery = `
      SELECT ID_CITA FROM LTEB_CITA
      WHERE ID_BARBERO = :barberoId
        AND FECHA = TO_DATE(:fecha, 'YYYY-MM-DD')
        AND HORA_INICIO = :hora
        AND ESTADO NOT IN ('cancelada', 'completada')
    `;
    const reservas = await this.databaseService.executeQuery(reservaQuery, {
      barberoId,
      fecha,
      hora,
    });

    return reservas.length === 0;
  }
}

