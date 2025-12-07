import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { CreateBarberoDto } from './dto/create-barbero.dto';
import { UpdateBarberoDto } from './dto/update-barbero.dto';
import * as oracledb from 'oracledb';

@Injectable()
export class BarberosService {
  constructor(private databaseService: DatabaseService) { }

  async create(createBarberoDto: CreateBarberoDto) {
    const { clienteId, email, telefono, idDireccion, idSucursal } = createBarberoDto;

    let cliente: any = null;
    let idClienteFinal: number;

    // Lógica de validación de cliente (se mantiene en backend por ahora para reutilizar SP_LEER_CLIENTES)
    // Podría moverse a un SP más complejo en el futuro
    if (clienteId) {
      const result = await this.databaseService.executeCursorProcedure(
        'BEGIN SP_GESTIONAR_CLIENTE(p_accion => :accion, p_id_cliente => :id, p_cursor => :cursor, p_id_salida => :id_salida); END;',
        {
          accion: 'R',
          id: clienteId,
          cursor: { dir: oracledb.BIND_OUT, type: oracledb.CURSOR },
          id_salida: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER }
        },
        'cursor'
      );
      if (result.length === 0) throw new Error('Cliente no encontrado');
      cliente = result[0];
      idClienteFinal = clienteId;
    } else if (email) {
      const result = await this.databaseService.executeCursorProcedure(
        'BEGIN SP_GESTIONAR_CLIENTE(p_accion => :accion, p_correo => :email, p_cursor => :cursor, p_id_salida => :id_salida); END;',
        {
          accion: 'R',
          email: email,
          cursor: { dir: oracledb.BIND_OUT, type: oracledb.CURSOR },
          id_salida: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER }
        },
        'cursor'
      );
      if (result.length === 0) throw new Error('No existe un usuario con ese email.');
      cliente = result[0];
      idClienteFinal = cliente.ID_CLIENTE;

      const barberoExistente = await this.findByClienteId(idClienteFinal);
      if (barberoExistente) throw new Error('Este usuario ya es un barbero');
    } else {
      throw new Error('Debe proporcionar un clienteId o un email');
    }

    // Actualizar flag ES_BARBERO en cliente (esto podría ir en SP_CREAR_BARBERO pero por ahora lo mantenemos separado o asumimos que el SP lo maneja si se actualiza)
    // El SP_CREAR_BARBERO actual NO actualiza LTEB_CLIENTE, así que mantenemos el update manual o creamos un SP para esto.
    // Por simplicidad y tiempo, hacemos el update directo o usamos un SP simple si existiera.
    // Vamos a usar SQL directo para este update pequeño por ahora, o idealmente moverlo al SP.
    // MANTENEMOS SQL DIRECTO SOLO PARA ESTE UPDATE POR AHORA PARA NO MODIFICAR MAS SPS, 
    // PERO LO IDEAL SERIA QUE SP_CREAR_BARBERO LO HICIERA.
    const updateClienteQuery = `UPDATE LTEB_CLIENTE SET ES_BARBERO = 1 WHERE ID_CLIENTE = :id`;
    await this.databaseService.executeUpdate(updateClienteQuery, { id: idClienteFinal });

    // Separar nombre (solo paterno ahora)
    const partesNombre = (cliente.NOMBRE || '').split(' ');
    const apellidoPaterno = partesNombre.length > 0 ? partesNombre[0] : '';
    // Apellido materno ya no se usa

    try {
      const rows = await this.databaseService.executeCursorProcedure(
        'BEGIN SP_GESTIONAR_BARBERO_V2(p_accion => :accion, p_id_cliente => :clienteId, p_nombre_completo => :nombre, p_correo => :correo, p_telefono => :telefono, p_cursor => :cursor, p_id_salida => :id_salida); END;',
        {
          accion: 'C',
          clienteId: idClienteFinal,
          nombre: apellidoPaterno, // Usamos apellido paterno como nombre principal en barbero
          correo: cliente.CORREO || email,
          telefono: telefono || null,
          cursor: { dir: oracledb.BIND_OUT, type: oracledb.CURSOR },
          id_salida: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER }
        },
        'cursor'
      );

      return this.mapBarberos(rows)[0];
    } catch (error) {
      console.error('Error al crear barbero:', error);
      throw new Error('Error al crear el barbero: ' + (error.message || 'Error desconocido'));
    }
  }

  async findAll() {
    const barberos = await this.databaseService.executeCursorProcedure(
      'BEGIN SP_GESTIONAR_BARBERO_V2(p_accion => :accion, p_cursor => :cursor, p_id_salida => :id_salida); END;',
      {
        accion: 'R',
        cursor: { dir: oracledb.BIND_OUT, type: oracledb.CURSOR },
        id_salida: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER }
      },
      'cursor'
    );
    return this.mapBarberos(barberos);
  }

  async findActive() {
    return this.findAll(); // No hay filtro de activo en SP aun
  }

  async findOne(id: number) {
    const barberos = await this.databaseService.executeCursorProcedure(
      'BEGIN SP_GESTIONAR_BARBERO_V2(p_accion => :accion, p_id_barbero => :id, p_cursor => :cursor, p_id_salida => :id_salida); END;',
      {
        accion: 'R',
        id,
        cursor: { dir: oracledb.BIND_OUT, type: oracledb.CURSOR },
        id_salida: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER }
      },
      'cursor'
    );
    return barberos.length > 0 ? this.mapBarberos(barberos)[0] : null;
  }

  async findByClienteId(clienteId: number) {
    const barberos = await this.databaseService.executeCursorProcedure(
      'BEGIN SP_GESTIONAR_BARBERO_V2(p_accion => :accion, p_id_cliente => :id, p_cursor => :cursor, p_id_salida => :id_salida); END;',
      {
        accion: 'R',
        id: clienteId,
        cursor: { dir: oracledb.BIND_OUT, type: oracledb.CURSOR },
        id_salida: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER }
      },
      'cursor'
    );
    return barberos.length > 0 ? this.mapBarberos(barberos)[0] : null;
  }

  async update(id: number, updateBarberoDto: UpdateBarberoDto) {
    // SP_ACTUALIZAR_BARBERO solo actualiza correo y telefono por ahora
    // Si vienen otros campos, se ignoran o deberíamos actualizar el SP.
    // Asumimos que solo se actualizan esos por ahora.

    const barbero = await this.findOne(id);
    if (!barbero) return null;

    const rows = await this.databaseService.executeCursorProcedure(
      'BEGIN SP_GESTIONAR_BARBERO_V2(p_accion => :accion, p_id_barbero => :id, p_correo => :correo, p_telefono => :telefono, p_cursor => :cursor, p_id_salida => :id_salida); END;',
      {
        accion: 'U',
        id,
        correo: updateBarberoDto.email || barbero.email,
        telefono: updateBarberoDto.telefono || barbero.telefono,
        cursor: { dir: oracledb.BIND_OUT, type: oracledb.CURSOR },
        id_salida: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER }
      },
      'cursor'
    );

    return this.mapBarberos(rows)[0];
  }

  async remove(id: number) {
    await this.databaseService.executeCursorProcedure(
      'BEGIN SP_GESTIONAR_BARBERO_V2(p_accion => :accion, p_id_barbero => :id, p_cursor => :cursor, p_id_salida => :id_salida); END;',
      {
        accion: 'D',
        id,
        cursor: { dir: oracledb.BIND_OUT, type: oracledb.CURSOR },
        id_salida: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER }
      },
      'cursor'
    );
    return { message: 'Barbero eliminado correctamente' };
  }

  private mapBarberos(rows: any[]) {
    return rows.map(b => ({
      id: b.ID_BARBERO,
      email: b.CORREO,
      telefono: b.TELEFONO,
      nombre: b.NOMBRE_COMPLETO, // Nombre completo
      idDireccion: b.ID_DIRECCION,
      idSucursal: b.ID_SUCURSAL,
      idCliente: b.ID_CLIENTE,
      sucursal: b.SUCURSAL_NOMBRE,
      activo: b.ACTIVO === 1 // Mapear 1 a true, 0 a false
    }));
  }
}

