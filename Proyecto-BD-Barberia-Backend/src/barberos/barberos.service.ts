import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { CreateBarberoDto } from './dto/create-barbero.dto';
import { UpdateBarberoDto } from './dto/update-barbero.dto';

@Injectable()
export class BarberosService {
  constructor(private databaseService: DatabaseService) {}

  async create(createBarberoDto: CreateBarberoDto) {
    const { clienteId, email, telefono, rut, idDireccion, idSucursal } = createBarberoDto;

    let cliente: any = null;
    let idClienteFinal: number;

    // Si se proporciona clienteId, buscar por ID
    if (clienteId) {
      const clienteQuery = `
        SELECT ID_CLIENTE, NOMBRE, APELLIDOS, CORREO
        FROM LTEB_CLIENTE
        WHERE ID_CLIENTE = :clienteId
      `;
      const clientes = await this.databaseService.executeQuery(clienteQuery, { clienteId });
      
      if (clientes.length === 0) {
        throw new Error('Cliente no encontrado');
      }
      cliente = clientes[0];
      idClienteFinal = clienteId;
    } 
    // Si se proporciona email, buscar cliente por correo
    else if (email) {
      const clienteQuery = `
        SELECT ID_CLIENTE, NOMBRE, APELLIDOS, CORREO
        FROM LTEB_CLIENTE
        WHERE CORREO = :email
      `;
      const clientes = await this.databaseService.executeQuery(clienteQuery, { email });
      
      if (clientes.length === 0) {
        throw new Error('No existe un usuario con ese email. El usuario debe estar registrado primero como cliente.');
      }
      cliente = clientes[0];
      idClienteFinal = cliente.ID_CLIENTE;

      // Verificar si ya es barbero
      const barberoExistente = await this.findByClienteId(idClienteFinal);
      if (barberoExistente) {
        throw new Error('Este usuario ya es un barbero');
      }
    } 
    else {
      throw new Error('Debe proporcionar un clienteId o un email para crear un barbero');
    }

    // Actualizar cliente para marcarlo como barbero
    const updateClienteQuery = `
      UPDATE LTEB_CLIENTE
      SET ES_BARBERO = 1
      WHERE ID_CLIENTE = :clienteId
    `;
    await this.databaseService.executeUpdate(updateClienteQuery, { clienteId: idClienteFinal });

    // Separar nombre en apellidos
    const partesNombre = (cliente.NOMBRE || '').split(' ');
    const apellidoPaterno = partesNombre.length > 0 ? partesNombre[0] : '';
    const apellidoMaterno = partesNombre.length > 1 ? partesNombre.slice(1).join(' ') : cliente.APELLIDOS || '';

    // Crear registro en LTEB_BARBERO vinculado al cliente
    const insertQuery = `
      INSERT INTO LTEB_BARBERO (
        ID_BARBERO, ID_CLIENTE, RUT, CORREO, TELEFONO, 
        APELLIDO_PATERNO, APELLIDO_MATERNO, ID_DIRECCION, ID_SUCURSAL
      )
      VALUES (
        :id, :clienteId, :rut, :correo, :telefono,
        :apellidoPaterno, :apellidoMaterno, :idDireccion, :idSucursal
      )
    `;

    try {
      const newId = await this.databaseService.executeInsertWithId(
        insertQuery,
        {
          clienteId: idClienteFinal,
          rut: rut || null,
          correo: cliente.CORREO || email,
          telefono: telefono || null,
          apellidoPaterno,
          apellidoMaterno,
          idDireccion: idDireccion || null,
          idSucursal: idSucursal || null,
        },
        'LTEB_BARBERO_SEQ',
      );

      return await this.findOne(newId);
    } catch (error) {
      console.error('Error al crear barbero:', error);
      throw new Error('Error al crear el barbero: ' + (error.message || 'Error desconocido'));
    }
  }

  async findAll() {
    const query = `
      SELECT 
        b.ID_BARBERO as id,
        b.CORREO as email,
        b.TELEFONO as telefono,
        b.APELLIDO_PATERNO || ' ' || b.APELLIDO_MATERNO as nombre,
        b.RUT as rut,
        b.ID_DIRECCION as idDireccion,
        b.ID_SUCURSAL as idSucursal,
        b.ID_CLIENTE as idCliente,
        c.NOMBRE || ' ' || c.APELLIDOS as nombreCompleto
      FROM LTEB_BARBERO b
      LEFT JOIN LTEB_CLIENTE c ON b.ID_CLIENTE = c.ID_CLIENTE
      ORDER BY b.APELLIDO_PATERNO, b.APELLIDO_MATERNO
    `;
    return await this.databaseService.executeQuery(query);
  }

  async findActive() {
    // LTEB_BARBERO no tiene campo activo, retornamos todos
    return this.findAll();
  }

  async findOne(id: number) {
    const query = `
      SELECT 
        b.ID_BARBERO as id,
        b.CORREO as email,
        b.TELEFONO as telefono,
        b.APELLIDO_PATERNO || ' ' || b.APELLIDO_MATERNO as nombre,
        b.RUT as rut,
        b.ID_DIRECCION as idDireccion,
        b.ID_SUCURSAL as idSucursal,
        b.ID_CLIENTE as idCliente,
        c.NOMBRE || ' ' || c.APELLIDOS as nombreCompleto
      FROM LTEB_BARBERO b
      LEFT JOIN LTEB_CLIENTE c ON b.ID_CLIENTE = c.ID_CLIENTE
      WHERE b.ID_BARBERO = :id
    `;
    const barberos = await this.databaseService.executeQuery(query, { id });
    return barberos[0] || null;
  }

  async findByClienteId(clienteId: number) {
    const query = `
      SELECT 
        b.ID_BARBERO as id,
        b.CORREO as email,
        b.TELEFONO as telefono,
        b.APELLIDO_PATERNO || ' ' || b.APELLIDO_MATERNO as nombre,
        b.RUT as rut,
        b.ID_DIRECCION as idDireccion,
        b.ID_SUCURSAL as idSucursal,
        b.ID_CLIENTE as idCliente
      FROM LTEB_BARBERO b
      WHERE b.ID_CLIENTE = :clienteId
    `;
    const barberos = await this.databaseService.executeQuery(query, { clienteId });
    return barberos[0] || null;
  }

  async update(id: number, updateBarberoDto: UpdateBarberoDto) {
    const fields = [];
    const binds: any = { id };

    if (updateBarberoDto.email !== undefined) {
      fields.push('CORREO = :email');
      binds.email = updateBarberoDto.email;
    }
    if (updateBarberoDto.telefono !== undefined) {
      fields.push('TELEFONO = :telefono');
      binds.telefono = updateBarberoDto.telefono;
    }

    if (fields.length === 0) {
      return this.findOne(id);
    }

    const query = `
      UPDATE LTEB_BARBERO
      SET ${fields.join(', ')}
      WHERE ID_BARBERO = :id
    `;

    await this.databaseService.executeUpdate(query, binds);
    return this.findOne(id);
  }

  async remove(id: number) {
    const query = `
      DELETE FROM LTEB_BARBERO
      WHERE ID_BARBERO = :id
    `;
    await this.databaseService.executeUpdate(query, { id });
    return { message: 'Barbero eliminado correctamente' };
  }
}

