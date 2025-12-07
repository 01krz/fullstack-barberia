import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import * as oracledb from 'oracledb';

@Injectable()
export class UsuariosService {
  constructor(private databaseService: DatabaseService) { }

  async findAll() {
    const usuarios = await this.databaseService.executeCursorProcedure(
      'BEGIN SP_GESTIONAR_CLIENTE(p_accion => :accion, p_cursor => :cursor, p_id_salida => :id_salida); END;',
      {
        accion: 'R',
        cursor: { dir: oracledb.BIND_OUT, type: oracledb.CURSOR },
        id_salida: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER }
      },
      'cursor'
    );

    return usuarios.map(usuario => ({
      id: usuario.ID_CLIENTE,
      email: usuario.CORREO ? String(usuario.CORREO).trim() : null,
      nombre: (usuario.NOMBRE + ' ' + usuario.APELLIDOS).trim(),
      rol: usuario.ES_ADMIN === 1 ? 'admin' : (usuario.ES_BARBERO === 1 ? 'barbero' : 'usuario'),
      esAdmin: usuario.ES_ADMIN,
      esBarbero: usuario.ES_BARBERO,
      activo: usuario.ACTIVO
    }));
  }

  async findOne(id: number) {
    const users = await this.databaseService.executeCursorProcedure(
      'BEGIN SP_GESTIONAR_CLIENTE(p_accion => :accion, p_id_cliente => :id, p_cursor => :cursor, p_id_salida => :id_salida); END;',
      {
        accion: 'R',
        id,
        cursor: { dir: oracledb.BIND_OUT, type: oracledb.CURSOR },
        id_salida: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER }
      },
      'cursor'
    );

    const usuario = users[0];

    if (!usuario) return null;

    return {
      id: usuario.ID_CLIENTE,
      email: usuario.CORREO,
      nombre: (usuario.NOMBRE + ' ' + usuario.APELLIDOS).trim(),
      rol: usuario.ES_ADMIN === 1 ? 'admin' : (usuario.ES_BARBERO === 1 ? 'barbero' : 'usuario'),
      esAdmin: usuario.ES_ADMIN,
      esBarbero: usuario.ES_BARBERO,
      activo: usuario.ACTIVO
    };
  }

  async findByEmail(email: string) {
    const emailNormalizado = email ? String(email).trim() : '';

    if (!emailNormalizado) return null;

    const users = await this.databaseService.executeCursorProcedure(
      'BEGIN SP_GESTIONAR_CLIENTE(p_accion => :accion, p_correo => :email, p_cursor => :cursor, p_id_salida => :id_salida); END;',
      {
        accion: 'R',
        email: emailNormalizado,
        cursor: { dir: oracledb.BIND_OUT, type: oracledb.CURSOR },
        id_salida: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER }
      },
      'cursor'
    );

    const usuario = users[0];

    if (!usuario) return null;

    // Mapear al formato esperado
    return {
      id: usuario.ID_CLIENTE,
      email: usuario.CORREO ? String(usuario.CORREO).trim() : null,
      nombre: (usuario.NOMBRE + ' ' + usuario.APELLIDOS).trim(),
      rol: usuario.ES_ADMIN === 1 ? 'admin' : (usuario.ES_BARBERO === 1 ? 'barbero' : 'usuario'),
      esAdmin: usuario.ES_ADMIN,
      esBarbero: usuario.ES_BARBERO,
      activo: usuario.ACTIVO,
      password: usuario.PASSWORD // Necesario para auth
    };
  }

  async convertirClienteABarbero(clienteId: number, datosBarbero: {
    telefono?: number;
    idDireccion?: number;
    idSucursal?: number;
  }) {
    // Primero actualizar el cliente para marcarlo como barbero
    const updateClienteQuery = `
      UPDATE LTEB_CLIENTE
      SET ES_BARBERO = 1
      WHERE ID_CLIENTE = :clienteId
    `;
    await this.databaseService.executeUpdate(updateClienteQuery, { clienteId });

    // Obtener datos del cliente
    const cliente = await this.findOne(clienteId);
    if (!cliente) {
      throw new Error('Cliente no encontrado');
    }

    // Crear registro en LTEB_BARBERO vinculado al cliente
    const insertBarberoQuery = `
      INSERT INTO LTEB_BARBERO (
        ID_BARBERO, ID_CLIENTE, CORREO, TELEFONO, 
        APELLIDO_PATERNO, APELLIDO_MATERNO, ID_DIRECCION, ID_SUCURSAL
      )
      VALUES (
        LTEB_BARBERO_SEQ.NEXTVAL, :clienteId, :correo, :telefono,
        :apellidoPaterno, :apellidoMaterno, :idDireccion, :idSucursal
      )
    `;

    // Separar nombre en apellidos
    const partesNombre = cliente.nombre.split(' ');
    const apellidoPaterno = partesNombre.length > 0 ? partesNombre[0] : '';
    const apellidoMaterno = partesNombre.length > 1 ? partesNombre.slice(1).join(' ') : '';

    await this.databaseService.executeInsert(insertBarberoQuery, {
      clienteId,
      correo: cliente.email,
      telefono: datosBarbero.telefono || null,
      apellidoPaterno,
      apellidoMaterno,
      idDireccion: datosBarbero.idDireccion || null,
      idSucursal: datosBarbero.idSucursal || null,
    });

    return { success: true, message: 'Cliente convertido a barbero exitosamente' };
  }

  async hacerAdmin(clienteId: number) {
    const query = `
      UPDATE LTEB_CLIENTE
      SET ES_ADMIN = 1
      WHERE ID_CLIENTE = :clienteId
    `;
    await this.databaseService.executeUpdate(query, { clienteId });
    return { success: true, message: 'Usuario convertido a administrador' };
  }

  async quitarAdmin(clienteId: number) {
    const query = `
      UPDATE LTEB_CLIENTE
      SET ES_ADMIN = 0
      WHERE ID_CLIENTE = :clienteId
    `;
    await this.databaseService.executeUpdate(query, { clienteId });
    return { success: true, message: 'Permisos de administrador removidos' };
  }
}
