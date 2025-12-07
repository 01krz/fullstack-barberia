import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { CreateServicioDto } from './dto/create-servicio.dto';
import { UpdateServicioDto } from './dto/update-servicio.dto';
import * as oracledb from 'oracledb';

@Injectable()
export class ServiciosService {
  constructor(private databaseService: DatabaseService) { }

  async create(createServicioDto: CreateServicioDto) {
    const { nombre, descripcion, precio } = createServicioDto;

    console.log('🔹 [SERVICE] Llamando a SP_GESTIONAR_SERVICIO (C) con:', { nombre, descripcion, precio });

    try {
      const result = await this.databaseService.executeProcedure(
        'BEGIN SP_GESTIONAR_SERVICIO(p_accion => :accion, p_nombre => :nombre, p_descripcion => :descripcion, p_precio => :precio, p_activo => :activo, p_cursor => :cursor, p_id_salida => :id_salida); END;',
        {
          accion: 'C',
          nombre,
          descripcion: descripcion || '',
          precio,
          activo: 1,
          cursor: { dir: oracledb.BIND_OUT, type: oracledb.CURSOR },
          id_salida: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER }
        }
      );

      const newId = result.outBinds.id_salida;
      return await this.findOne(newId);
    } catch (error) {
      console.error('Error al crear servicio:', error);
      throw new Error('Error al crear el servicio');
    }
  }

  async findAll() {
    const servicios = await this.databaseService.executeCursorProcedure(
      'BEGIN SP_GESTIONAR_SERVICIO(p_accion => :accion, p_cursor => :cursor, p_id_salida => :id_salida); END;',
      {
        accion: 'R',
        cursor: { dir: oracledb.BIND_OUT, type: oracledb.CURSOR },
        id_salida: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER }
      },
      'cursor'
    );
    return this.mapServicios(servicios);
  }

  async findActive() {
    return this.findAll();
  }

  async findOne(id: number) {
    const servicios = await this.databaseService.executeCursorProcedure(
      'BEGIN SP_GESTIONAR_SERVICIO(p_accion => :accion, p_id_servicio => :id, p_cursor => :cursor, p_id_salida => :id_salida); END;',
      {
        accion: 'R',
        id,
        cursor: { dir: oracledb.BIND_OUT, type: oracledb.CURSOR },
        id_salida: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER }
      },
      'cursor'
    );
    return servicios.length > 0 ? this.mapServicios(servicios)[0] : null;
  }

  async update(id: number, updateServicioDto: UpdateServicioDto) {
    const { nombre, descripcion, precio, activo } = updateServicioDto;

    await this.databaseService.executeProcedure(
      'BEGIN SP_GESTIONAR_SERVICIO(p_accion => :accion, p_id_servicio => :id, p_nombre => :nombre, p_descripcion => :descripcion, p_precio => :precio, p_activo => :activo, p_cursor => :cursor, p_id_salida => :id_salida); END;',
      {
        accion: 'U',
        id,
        nombre,
        descripcion,
        precio,
        activo: activo !== undefined ? (activo ? 1 : 0) : undefined,
        cursor: { dir: oracledb.BIND_OUT, type: oracledb.CURSOR },
        id_salida: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER }
      }
    );

    return this.findOne(id);
  }

  async remove(id: number) {
    await this.databaseService.executeProcedure(
      'BEGIN SP_GESTIONAR_SERVICIO(p_accion => :accion, p_id_servicio => :id, p_cursor => :cursor, p_id_salida => :id_salida); END;',
      {
        accion: 'D',
        id,
        cursor: { dir: oracledb.BIND_OUT, type: oracledb.CURSOR },
        id_salida: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER }
      }
    );
    return { message: 'Servicio eliminado correctamente' };
  }

  private mapServicios(rows: any[]) {
    return rows.map(s => ({
      id: s.ID_SERVICIO,
      nombre: s.NOMBRE,
      descripcion: s.DESCRIPCION,
      precio: s.PRECIO,
      activo: s.ACTIVO === 1
    }));
  }
}

