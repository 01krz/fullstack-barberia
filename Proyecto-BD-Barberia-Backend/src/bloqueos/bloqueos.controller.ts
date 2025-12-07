import { Controller, Get, Post, Body, Param, Delete, Query } from '@nestjs/common';
import { BloqueosService } from './bloqueos.service';

@Controller('bloqueos')
export class BloqueosController {
    constructor(private readonly bloqueosService: BloqueosService) { }

    @Post()
    create(@Body() createBloqueoDto: any) {
        return this.bloqueosService.create(createBloqueoDto);
    }

    @Get()
    findAll(@Query('barberoId') barberoId?: string) {
        if (barberoId) {
            return this.bloqueosService.findByBarbero(+barberoId);
        }
        return this.bloqueosService.findAll();
    }

    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.bloqueosService.remove(+id);
    }

    @Delete()
    removeByFechaHora(
        @Query('barberoId') barberoId: string,
        @Query('fecha') fecha: string,
        @Query('hora') hora: string
    ) {
        if (barberoId && fecha && hora) {
            return this.bloqueosService.removeByFechaHora(+barberoId, fecha, hora);
        }
        return { message: 'Faltan parámetros' };
    }
}
