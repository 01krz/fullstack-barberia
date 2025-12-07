import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { CreatePromocionDto } from './dto/create-promocion.dto';
import { UpdatePromocionDto } from './dto/update-promocion.dto';
import * as oracledb from 'oracledb';

import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class PromocionesService {
  constructor(private databaseService: DatabaseService) { }

  private logError(context: string, error: any) {
    const logPath = path.join(process.cwd(), 'backend_error.log');
    const message = `[${new Date().toISOString()}] Error in ${context}: ${error.message}\nStack: ${error.stack}\n\n`;
    fs.appendFileSync(logPath, message);
    console.error(message);
  }

  async create(createPromocionDto: CreatePromocionDto) {
    const {
      servicioId,
      productoId,
      porcentajeDescuento,
      fechaInicio,
      fechaFin,
      activa = true,
    } = createPromocionDto;

    try {
      const rows = await this.databaseService.executeCursorProcedure(
        'BEGIN SP_GESTIONAR_PROMOCION(p_accion => :accion, p_servicio_id => :servicioId, p_producto_id => :productoId, p_descuento => :descuento, p_nombre => :nombre, p_condiciones => :condiciones, p_fecha_inicio => TO_DATE(:fechaInicio, \'YYYY-MM-DD\'), p_fecha_fin => TO_DATE(:fechaFin, \'YYYY-MM-DD\'), p_activa => :activa, p_cursor => :cursor, p_id_salida => :id_salida); END;',
        {
          accion: 'C',
          servicioId,
          productoId: productoId ? { val: productoId, type: oracledb.NUMBER } : { val: null, type: oracledb.NUMBER },
          descuento: porcentajeDescuento,
          nombre: `Promoción ${porcentajeDescuento}%`,
          condiciones: `Descuento del ${porcentajeDescuento}% en servicio`,
          fechaInicio: fechaInicio.substring(0, 10),
          fechaFin: fechaFin.substring(0, 10),
          activa: activa ? 1 : 0,
          cursor: { dir: oracledb.BIND_OUT, type: oracledb.CURSOR },
          id_salida: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER }
        },
        'cursor'
      );

      return this.mapPromociones(rows)[0];
    } catch (error) {
      console.error('Error al crear promoción:', error);
      throw new Error('Error al crear la promoción');
    }
  }

  async findAll() {
    try {
      const promociones = await this.databaseService.executeCursorProcedure(
        'BEGIN SP_GESTIONAR_PROMOCION(p_accion => :accion, p_cursor => :cursor, p_id_salida => :id_salida); END;',
        {
          accion: 'R',
          cursor: { dir: oracledb.BIND_OUT, type: oracledb.CURSOR },
          id_salida: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER }
        },
        'cursor'
      );
      return this.mapPromociones(promociones);
    } catch (error) {
      this.logError('findAll', error);
      throw error;
    }
  }

  async findActive() {
    try {
      // Filtrar en memoria para consistencia
      const all = await this.findAll();
      const now = new Date();
      return all.filter(p =>
        p.activa &&
        new Date(p.fechaInicio) <= now &&
        new Date(p.fechaFin) >= now
      );
    } catch (error) {
      this.logError('findActive', error);
      throw error;
    }
  }

  async findByServicio(servicioId: number) {
    const promociones = await this.databaseService.executeCursorProcedure(
      'BEGIN SP_GESTIONAR_PROMOCION(p_accion => :accion, p_servicio_id => :servicioId, p_cursor => :cursor, p_id_salida => :id_salida); END;',
      {
        accion: 'R',
        servicioId,
        cursor: { dir: oracledb.BIND_OUT, type: oracledb.CURSOR },
        id_salida: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER }
      },
      'cursor'
    );
    return this.mapPromociones(promociones);
  }

  async findOne(id: number) {
    const promociones = await this.databaseService.executeCursorProcedure(
      'BEGIN SP_GESTIONAR_PROMOCION(p_accion => :accion, p_id_promocion => :id, p_cursor => :cursor, p_id_salida => :id_salida); END;',
      {
        accion: 'R',
        id,
        cursor: { dir: oracledb.BIND_OUT, type: oracledb.CURSOR },
        id_salida: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER }
      },
      'cursor'
    );
    return promociones.length > 0 ? this.mapPromociones(promociones)[0] : null;
  }

  async update(id: number, updatePromocionDto: UpdatePromocionDto) {
    const promocion = await this.findOne(id);
    if (!promocion) return null;

    const rows = await this.databaseService.executeCursorProcedure(
      'BEGIN SP_GESTIONAR_PROMOCION(p_accion => :accion, p_id_promocion => :id, p_descuento => :descuento, p_fecha_inicio => TO_DATE(:fechaInicio, \'YYYY-MM-DD\'), p_fecha_fin => TO_DATE(:fechaFin, \'YYYY-MM-DD\'), p_activa => :activa, p_cursor => :cursor, p_id_salida => :id_salida); END;',
      {
        accion: 'U',
        id,
        descuento: updatePromocionDto.porcentajeDescuento !== undefined ? updatePromocionDto.porcentajeDescuento : promocion.porcentajeDescuento,
        fechaInicio: updatePromocionDto.fechaInicio ? updatePromocionDto.fechaInicio.substring(0, 10) : promocion.fechaInicio,
        fechaFin: updatePromocionDto.fechaFin ? updatePromocionDto.fechaFin.substring(0, 10) : promocion.fechaFin,
        activa: updatePromocionDto.activa !== undefined ? (updatePromocionDto.activa ? 1 : 0) : (promocion.activa ? 1 : 0),
        cursor: { dir: oracledb.BIND_OUT, type: oracledb.CURSOR },
        id_salida: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER }
      },
      'cursor'
    );
    return this.mapPromociones(rows)[0];
  }

  async remove(id: number) {
    await this.databaseService.executeCursorProcedure(
      'BEGIN SP_GESTIONAR_PROMOCION(p_accion => :accion, p_id_promocion => :id, p_cursor => :cursor, p_id_salida => :id_salida); END;',
      {
        accion: 'D',
        id,
        cursor: { dir: oracledb.BIND_OUT, type: oracledb.CURSOR },
        id_salida: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER }
      },
      'cursor'
    );
    return { message: 'Promoción desactivada correctamente' };
  }

  private mapPromociones(rows: any[]) {
    return rows.map(r => ({
      id: r.ID_PROMOCION,
      servicioId: r.SERVICIO_ID,
      productoId: r.PRODUCTO_ID,
      porcentajeDescuento: r.DESCUENTO,
      fechaInicio: r.FECHA_INICIO instanceof Date ? r.FECHA_INICIO.toISOString().split('T')[0] : r.FECHA_INICIO,
      fechaFin: r.FECHA_FIN instanceof Date ? r.FECHA_FIN.toISOString().split('T')[0] : r.FECHA_FIN,
      activa: r.ACTIVA === 1
    }));
  }
}
