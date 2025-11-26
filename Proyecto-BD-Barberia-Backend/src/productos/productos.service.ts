import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { CreateProductoDto } from './dto/create-producto.dto';
import { UpdateProductoDto } from './dto/update-producto.dto';

@Injectable()
export class ProductosService {
  constructor(private databaseService: DatabaseService) {}

  async create(createProductoDto: CreateProductoDto) {
    const { nombre, descripcion, precio, stock, activo = true } = createProductoDto;

    const query = `
      INSERT INTO LTEB_PRODUCTO (ID_PRODUCTO, NOMBRE, DESCRIPCION, PRECIO, STOCK)
      VALUES (:id, :nombre, :descripcion, :precio, :stock)
    `;

    try {
      const newId = await this.databaseService.executeInsertWithId(
        query,
        {
          nombre,
          descripcion,
          precio,
          stock,
        },
        'LTEB_PRODUCTO_SEQ',
      );

      // Obtener el producto creado
      return await this.findOne(newId);
    } catch (error) {
      console.error('Error al crear producto:', error);
      throw new Error('Error al crear el producto');
    }
  }

  async findAll() {
    const query = `
      SELECT ID_PRODUCTO as id, NOMBRE as nombre, DESCRIPCION as descripcion, PRECIO as precio, STOCK as stock
      FROM LTEB_PRODUCTO
      ORDER BY NOMBRE
    `;
    return await this.databaseService.executeQuery(query);
  }

  async findActive() {
    const query = `
      SELECT ID_PRODUCTO as id, NOMBRE as nombre, DESCRIPCION as descripcion, PRECIO as precio, STOCK as stock
      FROM LTEB_PRODUCTO
      WHERE STOCK > 0
      ORDER BY NOMBRE
    `;
    return await this.databaseService.executeQuery(query);
  }

  async findOne(id: number) {
    const query = `
      SELECT ID_PRODUCTO as id, NOMBRE as nombre, DESCRIPCION as descripcion, PRECIO as precio, STOCK as stock
      FROM LTEB_PRODUCTO
      WHERE ID_PRODUCTO = :id
    `;
    const productos = await this.databaseService.executeQuery(query, { id });
    return productos[0] || null;
  }

  async update(id: number, updateProductoDto: UpdateProductoDto) {
    const fields = [];
    const binds: any = { id };

    if (updateProductoDto.nombre !== undefined) {
      fields.push('NOMBRE = :nombre');
      binds.nombre = updateProductoDto.nombre;
    }
    if (updateProductoDto.descripcion !== undefined) {
      fields.push('DESCRIPCION = :descripcion');
      binds.descripcion = updateProductoDto.descripcion;
    }
    if (updateProductoDto.precio !== undefined) {
      fields.push('PRECIO = :precio');
      binds.precio = updateProductoDto.precio;
    }
    if (updateProductoDto.stock !== undefined) {
      fields.push('STOCK = :stock');
      binds.stock = updateProductoDto.stock;
    }

    if (fields.length === 0) {
      return this.findOne(id);
    }

    const query = `
      UPDATE LTEB_PRODUCTO
      SET ${fields.join(', ')}
      WHERE ID_PRODUCTO = :id
    `;

    await this.databaseService.executeUpdate(query, binds);
    return this.findOne(id);
  }

  async remove(id: number) {
    const query = `
      DELETE FROM LTEB_PRODUCTO
      WHERE ID_PRODUCTO = :id
    `;
    await this.databaseService.executeUpdate(query, { id });
    return { message: 'Producto eliminado correctamente' };
  }
}

