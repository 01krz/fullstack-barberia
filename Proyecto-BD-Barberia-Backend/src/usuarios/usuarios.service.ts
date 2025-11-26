import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class UsuariosService {
  constructor(private databaseService: DatabaseService) {}

  async findAll() {
    const query = `
      SELECT 
        ID_CLIENTE as id, 
        TRIM(CORREO) as email, 
        TRIM(NOMBRE || ' ' || APELLIDOS) as nombre, 
        CASE 
          WHEN ES_ADMIN = 1 THEN 'admin'
          WHEN ES_BARBERO = 1 THEN 'barbero'
          ELSE 'usuario'
        END as rol,
        ES_ADMIN as esAdmin,
        ES_BARBERO as esBarbero,
        ACTIVO as activo
      FROM LTEB_CLIENTE
      WHERE CORREO IS NOT NULL
      ORDER BY ID_CLIENTE DESC
    `;
    const usuarios = await this.databaseService.executeQuery(query);
    
    // Asegurar que los emails estén normalizados (trim adicional por si acaso)
    return usuarios.map(usuario => ({
      ...usuario,
      email: usuario.email ? String(usuario.email).trim() : usuario.email
    }));
  }

  async findOne(id: number) {
    const query = `
      SELECT 
        ID_CLIENTE as id, 
        CORREO as email, 
        NOMBRE || ' ' || APELLIDOS as nombre, 
        CASE 
          WHEN ES_ADMIN = 1 THEN 'admin'
          WHEN ES_BARBERO = 1 THEN 'barbero'
          ELSE 'usuario'
        END as rol,
        ES_ADMIN as esAdmin,
        ES_BARBERO as esBarbero,
        ACTIVO as activo
      FROM LTEB_CLIENTE
      WHERE ID_CLIENTE = :id
    `;
    const users = await this.databaseService.executeQuery(query, { id });
    return users[0] || null;
  }

  async findByEmail(email: string) {
    const query = `
      SELECT 
        ID_CLIENTE as id, 
        CORREO as email, 
        NOMBRE || ' ' || APELLIDOS as nombre, 
        CASE 
          WHEN ES_ADMIN = 1 THEN 'admin'
          WHEN ES_BARBERO = 1 THEN 'barbero'
          ELSE 'usuario'
        END as rol,
        ES_ADMIN as esAdmin,
        ES_BARBERO as esBarbero,
        ACTIVO as activo
      FROM LTEB_CLIENTE
      WHERE CORREO = :email
    `;
    const users = await this.databaseService.executeQuery(query, { email });
    return users[0] || null;
  }

  async convertirClienteABarbero(clienteId: number, datosBarbero: {
    rut?: number;
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
        ID_BARBERO, ID_CLIENTE, RUT, CORREO, TELEFONO, 
        APELLIDO_PATERNO, APELLIDO_MATERNO, ID_DIRECCION, ID_SUCURSAL
      )
      VALUES (
        LTEB_BARBERO_SEQ.NEXTVAL, :clienteId, :rut, :correo, :telefono,
        :apellidoPaterno, :apellidoMaterno, :idDireccion, :idSucursal
      )
    `;

    // Separar nombre en apellidos
    const partesNombre = cliente.nombre.split(' ');
    const apellidoPaterno = partesNombre.length > 0 ? partesNombre[0] : '';
    const apellidoMaterno = partesNombre.length > 1 ? partesNombre.slice(1).join(' ') : '';

    await this.databaseService.executeInsert(insertBarberoQuery, {
      clienteId,
      rut: datosBarbero.rut || null,
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

