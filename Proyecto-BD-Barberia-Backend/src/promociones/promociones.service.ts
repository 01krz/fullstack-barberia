import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { CreatePromocionDto } from './dto/create-promocion.dto';
import { UpdatePromocionDto } from './dto/update-promocion.dto';

@Injectable()
export class PromocionesService {
  constructor(private databaseService: DatabaseService) {}

  async create(createPromocionDto: CreatePromocionDto) {
    const {
      servicioId,
      productoId,
      porcentajeDescuento,
      fechaInicio,
      fechaFin,
      activa = true,
    } = createPromocionDto;

    // LTEB_PROMOCION tiene estructura diferente: DESCUENTO, NOMBRE, CONDICIONES, FECHA_INICIO, FECHA_FIN
    const query = `
      INSERT INTO LTEB_PROMOCION (
        ID_PROMOCION, DESCUENTO, NOMBRE, CONDICIONES, FECHA_INICIO, FECHA_FIN
      )
      VALUES (
        :id, :descuento, :nombre, :condiciones,
        TO_DATE(:fechaInicio, 'YYYY-MM-DD'), TO_DATE(:fechaFin, 'YYYY-MM-DD')
      )
    `;

    try {
      const newId = await this.databaseService.executeInsertWithId(
        query,
        {
          descuento: porcentajeDescuento,
          nombre: `Promoción ${porcentajeDescuento}%`,
          condiciones: `Descuento del ${porcentajeDescuento}%`,
          fechaInicio,
          fechaFin,
        },
        'LTEB_PROMOCION_SEQ',
      );

      return await this.findOne(newId);
    } catch (error) {
      console.error('Error al crear promoción:', error);
      throw new Error('Error al crear la promoción');
    }
  }

  async findAll() {
    const query = `
      SELECT 
        id, servicio_id as servicioId, producto_id as productoId,
        porcentaje_descuento as porcentajeDescuento,
        TO_CHAR(fecha_inicio, 'YYYY-MM-DD') as fechaInicio,
        TO_CHAR(fecha_fin, 'YYYY-MM-DD') as fechaFin,
        activa, fecha_creacion as fechaCreacion
      FROM promociones
      ORDER BY fecha_creacion DESC
    `;
    return await this.databaseService.executeQuery(query);
  }

  async findActive() {
    const query = `
      SELECT 
        id, servicio_id as servicioId, producto_id as productoId,
        porcentaje_descuento as porcentajeDescuento,
        TO_CHAR(fecha_inicio, 'YYYY-MM-DD') as fechaInicio,
        TO_CHAR(fecha_fin, 'YYYY-MM-DD') as fechaFin,
        activa, fecha_creacion as fechaCreacion
      FROM promociones
      WHERE activa = 1
        AND fecha_inicio <= SYSDATE
        AND fecha_fin >= SYSDATE
      ORDER BY fecha_creacion DESC
    `;
    return await this.databaseService.executeQuery(query);
  }

  async findByServicio(servicioId: number) {
    const query = `
      SELECT 
        id, servicio_id as servicioId, producto_id as productoId,
        porcentaje_descuento as porcentajeDescuento,
        TO_CHAR(fecha_inicio, 'YYYY-MM-DD') as fechaInicio,
        TO_CHAR(fecha_fin, 'YYYY-MM-DD') as fechaFin,
        activa, fecha_creacion as fechaCreacion
      FROM promociones
      WHERE servicio_id = :servicioId
        AND activa = 1
        AND fecha_inicio <= SYSDATE
        AND fecha_fin >= SYSDATE
      ORDER BY fecha_creacion DESC
    `;
    return await this.databaseService.executeQuery(query, { servicioId });
  }

  async findOne(id: number) {
    const query = `
      SELECT 
        id, servicio_id as servicioId, producto_id as productoId,
        porcentaje_descuento as porcentajeDescuento,
        TO_CHAR(fecha_inicio, 'YYYY-MM-DD') as fechaInicio,
        TO_CHAR(fecha_fin, 'YYYY-MM-DD') as fechaFin,
        activa, fecha_creacion as fechaCreacion
      FROM promociones
      WHERE id = :id
    `;
    const promociones = await this.databaseService.executeQuery(query, { id });
    return promociones[0] || null;
  }

  async update(id: number, updatePromocionDto: UpdatePromocionDto) {
    const fields = [];
    const binds: any = { id };

    if (updatePromocionDto.porcentajeDescuento !== undefined) {
      fields.push('porcentaje_descuento = :porcentajeDescuento');
      binds.porcentajeDescuento = updatePromocionDto.porcentajeDescuento;
    }
    if (updatePromocionDto.fechaInicio !== undefined) {
      fields.push('fecha_inicio = TO_DATE(:fechaInicio, \'YYYY-MM-DD\')');
      binds.fechaInicio = updatePromocionDto.fechaInicio;
    }
    if (updatePromocionDto.fechaFin !== undefined) {
      fields.push('fecha_fin = TO_DATE(:fechaFin, \'YYYY-MM-DD\')');
      binds.fechaFin = updatePromocionDto.fechaFin;
    }
    if (updatePromocionDto.activa !== undefined) {
      fields.push('activa = :activa');
      binds.activa = updatePromocionDto.activa ? 1 : 0;
    }

    if (fields.length === 0) {
      return this.findOne(id);
    }

    const query = `
      UPDATE promociones
      SET ${fields.join(', ')}
      WHERE id = :id
    `;

    await this.databaseService.executeUpdate(query, binds);
    return this.findOne(id);
  }

  async remove(id: number) {
    const query = `
      UPDATE promociones
      SET activa = 0
      WHERE id = :id
    `;
    await this.databaseService.executeUpdate(query, { id });
    return { message: 'Promoción desactivada correctamente' };
  }
}

