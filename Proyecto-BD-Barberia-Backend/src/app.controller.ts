import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  @Get()
  getHello() {
    return {
      message: 'API de Barbería funcionando correctamente',
      version: '1.0.0',
      endpoints: {
        auth: {
          login: 'POST /auth/login',
          registro: 'POST /auth/registro'
        },
        servicios: {
          listar: 'GET /servicios',
          activos: 'GET /servicios/activos',
          obtener: 'GET /servicios/:id',
          crear: 'POST /servicios (requiere auth admin)',
          actualizar: 'PATCH /servicios/:id (requiere auth admin)',
          eliminar: 'DELETE /servicios/:id (requiere auth admin)'
        },
        barberos: {
          listar: 'GET /barberos',
          activos: 'GET /barberos/activos',
          obtener: 'GET /barberos/:id',
          crear: 'POST /barberos (requiere auth admin)',
          actualizar: 'PATCH /barberos/:id (requiere auth admin)',
          eliminar: 'DELETE /barberos/:id (requiere auth admin)'
        },
        reservas: {
          listar: 'GET /reservas (requiere auth)',
          obtener: 'GET /reservas/:id (requiere auth)',
          crear: 'POST /reservas (requiere auth)',
          actualizar: 'PATCH /reservas/:id (requiere auth)',
          cancelar: 'DELETE /reservas/:id (requiere auth)'
        },
        productos: {
          listar: 'GET /productos',
          activos: 'GET /productos/activos',
          obtener: 'GET /productos/:id',
          crear: 'POST /productos (requiere auth admin)',
          actualizar: 'PATCH /productos/:id (requiere auth admin)',
          eliminar: 'DELETE /productos/:id (requiere auth admin)'
        },
        promociones: {
          listar: 'GET /promociones',
          activas: 'GET /promociones/activas',
          obtener: 'GET /promociones/:id',
          crear: 'POST /promociones (requiere auth admin)',
          actualizar: 'PATCH /promociones/:id (requiere auth admin)',
          eliminar: 'DELETE /promociones/:id (requiere auth admin)'
        }
      }
    };
  }
}

