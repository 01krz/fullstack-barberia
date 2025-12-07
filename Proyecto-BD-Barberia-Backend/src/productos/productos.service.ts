import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { CreateProductoDto } from './dto/create-producto.dto';
import { UpdateProductoDto } from './dto/update-producto.dto';
import * as oracledb from 'oracledb';

@Injectable()
export class ProductosService {
  constructor(private databaseService: DatabaseService) { }

  async create(createProductoDto: CreateProductoDto) {
    const { nombre, descripcion, precio, stock, activo = true } = createProductoDto;
    const activoNum = activo ? 1 : 0;

    try {
      const result = await this.databaseService.executeProcedure(
        'BEGIN SP_GESTIONAR_PRODUCTO(p_accion => :accion, p_nombre => :nombre, p_descripcion => :descripcion, p_precio => :precio, p_stock => :stock, p_activo => :activo, p_cursor => :cursor, p_id_salida => :id_salida); END;',
        {
          accion: 'C',
          nombre,
          descripcion,
          precio,
          stock,
          activo: activoNum,
          cursor: { dir: oracledb.BIND_OUT, type: oracledb.CURSOR },
          id_salida: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER }
        }
      );

      const newId = result.outBinds.id_salida;
      return await this.findOne(newId);
    } catch (error) {
      console.error('Error al crear producto:', error);
      throw new InternalServerErrorException(error.message || 'Error al crear el producto');
    }
  }

  async findAll() {
    const productos = await this.databaseService.executeCursorProcedure(
      'BEGIN SP_GESTIONAR_PRODUCTO(p_accion => :accion, p_cursor => :cursor, p_id_salida => :id_salida); END;',
      {
        accion: 'R',
        cursor: { dir: oracledb.BIND_OUT, type: oracledb.CURSOR },
        id_salida: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER }
      },
      'cursor'
    );
    return this.mapProductos(productos);
  }

  async findActive() {
    // SP_GESTIONAR_PRODUCTO 'R' devuelve todos. Filtramos en memoria o creamos acción específica.
    // Para mantener consistencia con SP unificado, filtramos en memoria por ahora.
    const all = await this.findAll();
    return all.filter(p => p.activo === 1 && p.stock > 0);
  }

  async findOne(id: number) {
    const productos = await this.databaseService.executeCursorProcedure(
      'BEGIN SP_GESTIONAR_PRODUCTO(p_accion => :accion, p_id_producto => :id, p_cursor => :cursor, p_id_salida => :id_salida); END;',
      {
        accion: 'R',
        id,
        cursor: { dir: oracledb.BIND_OUT, type: oracledb.CURSOR },
        id_salida: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER }
      },
      'cursor'
    );
    const p = productos[0];
    return p ? this.mapProducto(p) : null;
  }

  async update(id: number, updateProductoDto: UpdateProductoDto) {
    const { nombre, descripcion, precio, stock, activo } = updateProductoDto;

    await this.databaseService.executeProcedure(
      'BEGIN SP_GESTIONAR_PRODUCTO(p_accion => :accion, p_id_producto => :id, p_nombre => :nombre, p_descripcion => :descripcion, p_precio => :precio, p_stock => :stock, p_activo => :activo, p_cursor => :cursor, p_id_salida => :id_salida); END;',
      {
        accion: 'U',
        id,
        nombre,
        descripcion,
        precio,
        stock,
        activo: activo !== undefined ? (activo ? 1 : 0) : undefined,
        cursor: { dir: oracledb.BIND_OUT, type: oracledb.CURSOR },
        id_salida: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER }
      }
    );
    return this.findOne(id);
  }

  async remove(id: number) {
    await this.databaseService.executeProcedure(
      'BEGIN SP_GESTIONAR_PRODUCTO(p_accion => :accion, p_id_producto => :id, p_cursor => :cursor, p_id_salida => :id_salida); END;',
      {
        accion: 'D',
        id,
        cursor: { dir: oracledb.BIND_OUT, type: oracledb.CURSOR },
        id_salida: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER }
      }
    );
    return { message: 'Producto eliminado correctamente' };
  }

  async updateStock(id: number, cantidad: number) {
    await this.databaseService.executeProcedure(
      'BEGIN SP_GESTIONAR_PRODUCTO(p_accion => :accion, p_id_producto => :id, p_stock => :cantidad, p_cursor => :cursor, p_id_salida => :id_salida); END;',
      {
        accion: 'S',
        id,
        cantidad,
        cursor: { dir: oracledb.BIND_OUT, type: oracledb.CURSOR },
        id_salida: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER }
      }
    );
  }

  private mapProductos(rows: any[]) {
    return rows.map(r => this.mapProducto(r));
  }

  private mapProducto(r: any) {
    return {
      id: r.ID_PRODUCTO,
      nombre: r.NOMBRE,
      descripcion: r.DESCRIPCION,
      precio: r.PRECIO,
      stock: r.STOCK,
      activo: r.ACTIVO
    };
  }
}

