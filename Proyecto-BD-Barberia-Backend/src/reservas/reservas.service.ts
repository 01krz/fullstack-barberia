import { Injectable, BadRequestException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { CreateReservaDto } from './dto/create-reserva.dto';
import { UpdateReservaDto } from './dto/update-reserva.dto';
import * as oracledb from 'oracledb';

import { ProductosService } from '../productos/productos.service';

@Injectable()
export class ReservasService {
  constructor(
    private databaseService: DatabaseService,
    private productosService: ProductosService
  ) { }

  async create(createReservaDto: CreateReservaDto) {
    const {
      clienteId,
      barberoId,
      servicioId,
      fecha,
      hora,
      notas,
      productos
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

    // Sanitize inputs
    const fechaStr = (fecha as any) instanceof Date ? (fecha as any).toISOString().split('T')[0] : (fecha as any).split('T')[0];
    const horaStr = hora;

    try {
      const rows = await this.databaseService.executeCursorProcedure(
        'BEGIN SP_GESTIONAR_CITA(p_accion => :accion, p_id_cliente => :clienteId, p_id_servicio => :servicioId, p_id_barbero => :barberoId, p_fecha => TO_DATE(:fecha, \'YYYY-MM-DD\'), p_hora => :hora, p_comentario => :comentario, p_cursor => :cursor, p_id_salida => :id_salida); END;',
        {
          accion: 'C',
          clienteId,
          servicioId,
          barberoId,
          fecha: fechaStr,
          hora: horaStr,
          comentario: notas || '',
          cursor: { dir: oracledb.BIND_OUT, type: oracledb.CURSOR },
          id_salida: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER }
        },
        'cursor'
      );

      // Actualizar stock de productos si los hay
      if (productos && productos.length > 0) {
        for (const productoId of productos) {
          await this.productosService.updateStock(productoId, -1);
        }
      }

      return this.mapReservas(rows)[0];
    } catch (error) {
      console.error('Error al crear reserva:', error);
      throw new Error(`Error al crear la reserva: ${error.message}`);
    }
  }

  async findAll() {
    const reservas = await this.databaseService.executeCursorProcedure(
      'BEGIN SP_GESTIONAR_CITA(p_accion => :accion, p_cursor => :cursor, p_id_salida => :id_salida); END;',
      {
        accion: 'R',
        cursor: { dir: oracledb.BIND_OUT, type: oracledb.CURSOR },
        id_salida: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER }
      },
      'cursor'
    );
    return this.mapReservas(reservas);
  }

  async findByBarbero(barberoId: number) {
    const reservas = await this.databaseService.executeCursorProcedure(
      'BEGIN SP_GESTIONAR_CITA(p_accion => :accion, p_id_barbero => :barberoId, p_cursor => :cursor, p_id_salida => :id_salida); END;',
      {
        accion: 'R',
        barberoId,
        cursor: { dir: oracledb.BIND_OUT, type: oracledb.CURSOR },
        id_salida: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER }
      },
      'cursor'
    );
    return this.mapReservas(reservas);
  }

  async findByCliente(clienteId: number) {
    const reservas = await this.databaseService.executeCursorProcedure(
      'BEGIN SP_GESTIONAR_CITA(p_accion => :accion, p_id_cliente => :clienteId, p_cursor => :cursor, p_id_salida => :id_salida); END;',
      {
        accion: 'R',
        clienteId,
        cursor: { dir: oracledb.BIND_OUT, type: oracledb.CURSOR },
        id_salida: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER }
      },
      'cursor'
    );
    return this.mapReservas(reservas);
  }

  async findOne(id: number) {
    const reservas = await this.databaseService.executeCursorProcedure(
      'BEGIN SP_GESTIONAR_CITA(p_accion => :accion, p_id_cita => :id, p_cursor => :cursor, p_id_salida => :id_salida); END;',
      {
        accion: 'R',
        id,
        cursor: { dir: oracledb.BIND_OUT, type: oracledb.CURSOR },
        id_salida: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER }
      },
      'cursor'
    );

    if (reservas.length === 0) return null;
    const r = reservas[0];
    return {
      id: r.ID_CITA,
      clienteId: r.ID_CLIENTE,
      cliente: r.CLIENTE_NOMBRE_COMPLETO || r.CLIENTE || 'Desconocido',
      barberoId: r.ID_BARBERO,
      barbero: r.BARBERO_NOMBRE || r.BARBERO || 'Desconocido',
      servicioId: r.ID_SERVICIO,
      servicio: r.SERVICIO_NOMBRE || r.SERVICIO || 'Desconocido',
      fecha: r.FECHA instanceof Date ? r.FECHA.toISOString().split('T')[0] : r.FECHA,
      hora: r.HORA_INICIO,
      estado: r.ESTADO,
      notas: r.COMENTARIO
    };
  }

  async update(id: number, updateReservaDto: UpdateReservaDto) {
    const { estado, notas } = updateReservaDto;
    await this.databaseService.executeProcedure(
      'BEGIN SP_GESTIONAR_CITA(p_accion => :accion, p_id_cita => :id, p_estado => :estado, p_comentario => :comentario, p_cursor => :cursor, p_id_salida => :id_salida); END;',
      {
        accion: 'U',
        id,
        estado,
        comentario: notas,
        cursor: { dir: oracledb.BIND_OUT, type: oracledb.CURSOR },
        id_salida: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER }
      }
    );
    return this.findOne(id);
  }

  async remove(id: number) {
    await this.databaseService.executeProcedure(
      'BEGIN SP_GESTIONAR_CITA(p_accion => :accion, p_id_cita => :id, p_cursor => :cursor, p_id_salida => :id_salida); END;',
      {
        accion: 'D',
        id,
        cursor: { dir: oracledb.BIND_OUT, type: oracledb.CURSOR },
        id_salida: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER }
      }
    );
    return { message: 'Cita cancelada correctamente' };
  }

  async verificarDisponibilidad(
    barberoId: number,
    fecha: string,
    hora: string,
  ): Promise<boolean> {
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

  private mapReservas(rows: any[]) {
    if (rows.length > 0) {
      const debugInfo = {
        keys: Object.keys(rows[0]),
        firstRow: rows[0]
      };
      // Write to file for debugging
      const fs = require('fs');
      fs.writeFileSync('backend_debug.log', JSON.stringify(debugInfo, null, 2));

      console.log('DEBUG: Keys of first row:', Object.keys(rows[0]));
      console.log('DEBUG: First row sample:', JSON.stringify(rows[0], null, 2));
    }
    return rows.map(r => {
      // Intentar obtener el nombre del cliente de varias formas posibles
      const clienteNombre = r.CLIENTE_NOMBRE_COMPLETO || r.CLIENTE || r.CLIENTE_NOMBRE || r.NOMBRE_CLIENTE ||
        (r.NOMBRE ? r.NOMBRE + (r.APELLIDOS ? ' ' + r.APELLIDOS : '') : 'Desconocido');

      return {
        id: r.ID_CITA,
        clienteId: r.ID_CLIENTE,
        cliente: clienteNombre,
        barberoId: r.ID_BARBERO,
        barbero: r.BARBERO_NOMBRE || r.BARBERO || (r.NOMBRE_COMPLETO ? r.NOMBRE_COMPLETO : 'Desconocido'),
        servicio: r.SERVICIO_NOMBRE || r.SERVICIO || r.NOMBRE_SERVICIO,
        fecha: r.FECHA instanceof Date ? r.FECHA.toISOString().split('T')[0] : r.FECHA,
        hora: r.HORA_INICIO,
        estado: r.ESTADO,
        notas: r.COMENTARIO
      };
    });
  }
}
