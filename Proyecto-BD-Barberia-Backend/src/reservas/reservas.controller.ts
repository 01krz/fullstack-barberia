import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ReservasService } from './reservas.service';
import { CreateReservaDto } from './dto/create-reserva.dto';
import { UpdateReservaDto } from './dto/update-reserva.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('reservas')
export class ReservasController {
  constructor(private readonly reservasService: ReservasService) { }

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Body() createReservaDto: CreateReservaDto) {
    console.log('DEBUG: Received createReservaDto:', JSON.stringify(createReservaDto, null, 2));
    return this.reservasService.create(createReservaDto);
  }

  @Get()
  findAll(@Query('barberoId') barberoId?: string, @Query('clienteId') clienteId?: string) {
    // Permitir consultas públicas por barberoId para que los invitados puedan ver disponibilidad
    // Las consultas por clienteId o todas las reservas requieren autenticación (se valida en el frontend)
    if (barberoId) {
      return this.reservasService.findByBarbero(+barberoId);
    }
    if (clienteId) {
      return this.reservasService.findByCliente(+clienteId);
    }
    return this.reservasService.findAll();
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  findOne(@Param('id') id: string) {
    return this.reservasService.findOne(+id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  update(@Param('id') id: string, @Body() updateReservaDto: UpdateReservaDto) {
    return this.reservasService.update(+id, updateReservaDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  remove(@Param('id') id: string) {
    return this.reservasService.remove(+id);
  }
}

