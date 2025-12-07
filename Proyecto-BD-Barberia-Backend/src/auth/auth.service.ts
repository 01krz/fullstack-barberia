import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { DatabaseService } from '../database/database.service';
import { UsuariosService } from '../usuarios/usuarios.service';
import { LoginDto } from './dto/login.dto';
import { RegistroDto } from './dto/registro.dto';
import * as oracledb from 'oracledb';

@Injectable()
export class AuthService {
  constructor(
    private databaseService: DatabaseService,
    private jwtService: JwtService,
    private usuariosService: UsuariosService,
  ) { }

  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;

    // Usar el servicio de usuarios que ya usa SP
    const user = await this.usuariosService.findByEmail(email);

    if (!user) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    // Verificar si tiene contraseña
    if (!user.password) {
      throw new UnauthorizedException('Usuario no tiene contraseña configurada.');
    }

    const passwordIngresada = password.trim();
    const passwordBD = String(user.password).trim();

    // Verificar contraseña (texto plano)
    if (passwordIngresada !== passwordBD) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    // Generar token JWT
    const payload = {
      sub: user.id,
      email: user.email,
      nombre: user.nombre,
      rol: user.rol,
    };

    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        nombre: user.nombre,
        rol: user.rol,
      },
    };
  }

  async registro(registroDto: RegistroDto) {
    const { nombre, email, password } = registroDto;

    // Verificar si existe
    const existingUser = await this.usuariosService.findByEmail(email);
    if (existingUser) {
      throw new UnauthorizedException('Este email ya está registrado');
    }

    // Separar nombre
    const partesNombre = nombre.trim().split(' ');
    const nombreCliente = partesNombre[0] || nombre;
    const apellidosCliente = partesNombre.length > 1
      ? partesNombre.slice(1).join(' ')
      : '';

    try {
      // Usar SP_GESTIONAR_CLIENTE
      const result = await this.databaseService.executeProcedure(
        'BEGIN SP_GESTIONAR_CLIENTE(p_accion => :accion, p_nombre => :nombre, p_apellidos => :apellidos, p_telefono => :telefono, p_correo => :correo, p_password => :password, p_cursor => :cursor, p_id_salida => :id_salida); END;',
        {
          accion: 'C',
          nombre: nombreCliente,
          apellidos: apellidosCliente,
          telefono: null,
          correo: email,
          password: password,
          cursor: { dir: oracledb.BIND_OUT, type: oracledb.CURSOR },
          id_salida: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER }
        }
      );

      const newId = result.outBinds.id_salida;

      // Obtener usuario creado
      const newUser = await this.usuariosService.findOne(newId);

      const payload = {
        sub: newUser.id,
        email: newUser.email,
        nombre: newUser.nombre,
        rol: newUser.rol,
      };

      return {
        access_token: this.jwtService.sign(payload),
        user: newUser,
      };
    } catch (error) {
      console.error('Error al registrar usuario:', error);
      throw new Error('Error al crear la cuenta');
    }
  }
}
