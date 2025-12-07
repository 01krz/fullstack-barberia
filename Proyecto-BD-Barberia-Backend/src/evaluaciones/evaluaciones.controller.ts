import { Controller, Get, Post, Body, Param, ParseIntPipe } from '@nestjs/common';
import { EvaluacionesService } from './evaluaciones.service';
import { CreateEvaluacionDto } from './dto/create-evaluacion.dto';

@Controller('evaluaciones')
export class EvaluacionesController {
    constructor(private readonly evaluacionesService: EvaluacionesService) { }

    @Post()
    create(@Body() createEvaluacionDto: CreateEvaluacionDto) {
        return this.evaluacionesService.create(createEvaluacionDto);
    }

    @Get()
    findAll() {
        return this.evaluacionesService.findAll();
    }

    @Get(':id')
    findOne(@Param('id', ParseIntPipe) id: number) {
        return this.evaluacionesService.findOne(id);
    }

    @Get('cita/:citaId')
    findByCita(@Param('citaId', ParseIntPipe) citaId: number) {
        return this.evaluacionesService.findByCita(citaId);
    }
}
