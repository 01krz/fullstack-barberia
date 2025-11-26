import { Controller, Get, Param, Post, Patch, UseGuards, Body } from '@nestjs/common';
import { UsuariosService } from './usuarios.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { ConvertirBarberoDto } from './dto/convertir-barbero.dto';

@Controller('usuarios')
@UseGuards(JwtAuthGuard)
export class UsuariosController {
  constructor(private readonly usuariosService: UsuariosService) {}

  @Get()
  findAll() {
    // Este endpoint requiere autenticación JWT pero no roles específicos
    // Cualquier usuario autenticado puede ver la lista de usuarios
    return this.usuariosService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.usuariosService.findOne(+id);
  }

  @Post(':id/convertir-barbero')
  @UseGuards(RolesGuard)
  @Roles('admin')
  convertirABarbero(@Param('id') id: string, @Body() datosBarbero: ConvertirBarberoDto) {
    return this.usuariosService.convertirClienteABarbero(+id, datosBarbero);
  }

  @Patch(':id/hacer-admin')
  @UseGuards(RolesGuard)
  @Roles('admin')
  hacerAdmin(@Param('id') id: string) {
    return this.usuariosService.hacerAdmin(+id);
  }

  @Patch(':id/quitar-admin')
  @UseGuards(RolesGuard)
  @Roles('admin')
  quitarAdmin(@Param('id') id: string) {
    return this.usuariosService.quitarAdmin(+id);
  }
}

