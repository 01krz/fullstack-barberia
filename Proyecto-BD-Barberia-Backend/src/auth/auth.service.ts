import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { DatabaseService } from '../database/database.service';
import { LoginDto } from './dto/login.dto';
import { RegistroDto } from './dto/registro.dto';

@Injectable()
export class AuthService {
  constructor(
    private databaseService: DatabaseService,
    private jwtService: JwtService,
  ) {}

  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;

    // Buscar cliente en la base de datos usando LTEB_CLIENTE
    const query = `
      SELECT ID_CLIENTE, CORREO, PASSWORD, NOMBRE, APELLIDOS, ES_ADMIN, ES_BARBERO, ACTIVO
      FROM LTEB_CLIENTE 
      WHERE CORREO = :email AND (ACTIVO = 1 OR ACTIVO IS NULL)
    `;

    const users = await this.databaseService.executeQuery(query, { email });

    if (users.length === 0) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const user = users[0];

    // Verificar si tiene contraseña
    if (!user.PASSWORD) {
      throw new UnauthorizedException('Usuario no tiene contraseña configurada. Por favor, regístrese nuevamente.');
    }

    // Normalizar contraseñas (trim para eliminar espacios, Oracle puede agregar padding)
    const passwordIngresada = password.trim();
    const passwordBD = String(user.PASSWORD).trim();

    // Log de depuración detallado (solo para desarrollo)
    console.log('Debug login:', {
      email: email,
      passwordIngresada: passwordIngresada.substring(0, 3) + '***', // Solo primeros 3 caracteres por seguridad
      passwordIngresadaLength: passwordIngresada.length,
      passwordBD: passwordBD.substring(0, 10) + '...', // Primeros 10 caracteres
      passwordBDLength: passwordBD.length,
      passwordBDIsHashed: passwordBD.length > 30,
      passwordsMatch: passwordIngresada === passwordBD
    });

    // Detectar si la contraseña en BD está hasheada (bcrypt tiene 60 caracteres)
    // Si es así, necesitamos actualizarla a texto plano
    if (passwordBD.length > 30) {
      console.log('⚠️ Usuario tiene contraseña hasheada (60 caracteres). Necesita actualizarse a texto plano.');
      console.log('Ejecuta este SQL para actualizar la contraseña:');
      console.log(`UPDATE LTEB_CLIENTE SET PASSWORD = '${passwordIngresada}' WHERE CORREO = '${email}';`);
      throw new UnauthorizedException('Tu contraseña está en formato antiguo (hasheada). Por favor, ejecuta el SQL para actualizarla o contacta al administrador.');
    }

    // Verificar contraseña (texto plano para proyecto universitario)
    if (passwordIngresada !== passwordBD) {
      console.log('❌ Contraseñas no coinciden');
      throw new UnauthorizedException('Credenciales inválidas');
    }

    console.log('✅ Contraseña correcta');

    // Determinar rol basado en ES_ADMIN y ES_BARBERO
    let rol = 'usuario';
    if (user.ES_ADMIN === 1) {
      rol = 'admin';
    } else if (user.ES_BARBERO === 1) {
      rol = 'barbero';
    }

    // Generar token JWT
    const nombreCompleto = `${user.NOMBRE || ''} ${user.APELLIDOS || ''}`.trim() || user.CORREO;
    const payload = {
      sub: user.ID_CLIENTE,
      email: user.CORREO,
      nombre: nombreCompleto,
      rol: rol,
    };

    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.ID_CLIENTE,
        email: user.CORREO,
        nombre: nombreCompleto,
        rol: rol,
      },
    };
  }

  async registro(registroDto: RegistroDto) {
    const { nombre, email, password } = registroDto;

    // Verificar si el correo ya existe
    const checkQuery = `
      SELECT ID_CLIENTE FROM LTEB_CLIENTE WHERE CORREO = :email
    `;
    const existingUsers = await this.databaseService.executeQuery(
      checkQuery,
      { email },
    );

    if (existingUsers.length > 0) {
      throw new UnauthorizedException('Este email ya está registrado');
    }

    // Separar nombre en nombre y apellidos (simplificado)
    const partesNombre = nombre.trim().split(' ');
    const nombreCliente = partesNombre[0] || nombre;
    const apellidosCliente = partesNombre.length > 1 
      ? partesNombre.slice(1).join(' ') 
      : '';

    // Insertar nuevo cliente usando secuencia (todos empiezan como usuarios normales)
    const insertQuery = `
      INSERT INTO LTEB_CLIENTE (
        ID_CLIENTE, NOMBRE, APELLIDOS, CORREO, PASSWORD, ES_ADMIN, ES_BARBERO, ACTIVO, TELEFONO
      )
      VALUES (
        LTEB_CLIENTE_SEQ.NEXTVAL, :nombre, :apellidos, :email, :password, 0, 0, 1, NULL
      )
    `;

    try {
      await this.databaseService.executeInsert(insertQuery, {
        nombre: nombreCliente,
        apellidos: apellidosCliente,
        email,
        password: password, // Contraseña en texto plano para proyecto universitario
      });

      // Obtener el cliente recién creado
      const getUserQuery = `
        SELECT ID_CLIENTE, CORREO, NOMBRE, APELLIDOS, ES_ADMIN, ES_BARBERO 
        FROM LTEB_CLIENTE 
        WHERE CORREO = :email
        ORDER BY ID_CLIENTE DESC
        FETCH FIRST 1 ROW ONLY
      `;
      const newUsers = await this.databaseService.executeQuery(
        getUserQuery,
        { email },
      );

      if (newUsers.length === 0) {
        throw new Error('Error al obtener el cliente creado');
      }

      const newUser = newUsers[0];
      const nombreCompleto = `${newUser.NOMBRE || ''} ${newUser.APELLIDOS || ''}`.trim() || newUser.CORREO;

      // Determinar rol (nuevos usuarios siempre son 'usuario')
      const rol = 'usuario';

      // Generar token JWT
      const payload = {
        sub: newUser.ID_CLIENTE,
        email: newUser.CORREO,
        nombre: nombreCompleto,
        rol: rol,
      };

      return {
        access_token: this.jwtService.sign(payload),
        user: {
          id: newUser.ID_CLIENTE,
          email: newUser.CORREO,
          nombre: nombreCompleto,
          rol: rol,
        },
      };
    } catch (error) {
      console.error('Error al registrar usuario:', error);
      throw new Error('Error al crear la cuenta: ' + (error.message || 'Error desconocido'));
    }
  }
}

