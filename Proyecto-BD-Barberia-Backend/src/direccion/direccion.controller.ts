import { Controller, Get } from '@nestjs/common';
import { DireccionService } from './direccion.service';

@Controller('direccion')
export class DireccionController {
    constructor(private readonly direccionService: DireccionService) { }

    @Get()
    async obtenerDireccion() {
        return this.direccionService.obtenerDireccionCompleta();
    }
}
