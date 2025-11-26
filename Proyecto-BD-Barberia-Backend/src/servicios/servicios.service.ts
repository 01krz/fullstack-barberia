import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { CreateServicioDto } from './dto/create-servicio.dto';
import { UpdateServicioDto } from './dto/update-servicio.dto';

@Injectable()
export class ServiciosService {
  constructor(private databaseService: DatabaseService) {}

  async create(createServicioDto: CreateServicioDto) {
    const { nombre, precio } = createServicioDto;

    const query = `
      INSERT INTO LTEB_SERVICIO (ID_SERVICIO, NOMBRE, PRECIO)
      VALUES (:id, :nombre, :precio)
    `;

    try {
      const newId = await this.databaseService.executeInsertWithId(
        query,
        {
          nombre,
          precio,
        },
        'LTEB_SERVICIO_SEQ',
      );

      // Obtener el servicio creado
      return await this.findOne(newId);
    } catch (error) {
      console.error('Error al crear servicio:', error);
      throw new Error('Error al crear el servicio');
    }
  }

  async findAll() {
    const query = `
      SELECT ID_SERVICIO as id, NOMBRE as nombre, PRECIO as precio
      FROM LTEB_SERVICIO
      ORDER BY NOMBRE
    `;
    return await this.databaseService.executeQuery(query);
  }

  async findActive() {
    // LTEB_SERVICIO no tiene campo activo, retornamos todos
    return this.findAll();
  }

  async findOne(id: number) {
    const query = `
      SELECT ID_SERVICIO as id, NOMBRE as nombre, PRECIO as precio
      FROM LTEB_SERVICIO
      WHERE ID_SERVICIO = :id
    `;
    const servicios = await this.databaseService.executeQuery(query, { id });
    return servicios[0] || null;
  }

  async update(id: number, updateServicioDto: UpdateServicioDto) {
    const fields = [];
    const binds: any = { id };

    if (updateServicioDto.nombre !== undefined) {
      fields.push('NOMBRE = :nombre');
      binds.nombre = updateServicioDto.nombre;
    }
    if (updateServicioDto.precio !== undefined) {
      fields.push('PRECIO = :precio');
      binds.precio = updateServicioDto.precio;
    }

    if (fields.length === 0) {
      return this.findOne(id);
    }

    const query = `
      UPDATE LTEB_SERVICIO
      SET ${fields.join(', ')}
      WHERE ID_SERVICIO = :id
    `;

    await this.databaseService.executeUpdate(query, binds);
    return this.findOne(id);
  }

  async remove(id: number) {
    const query = `
      DELETE FROM LTEB_SERVICIO
      WHERE ID_SERVICIO = :id
    `;
    await this.databaseService.executeUpdate(query, { id });
    return { message: 'Servicio eliminado correctamente' };
  }
}

