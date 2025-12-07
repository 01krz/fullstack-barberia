import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ReportesService } from './reportes.service';

@Controller('reportes')
export class ReportesController {
    constructor(private readonly reportesService: ReportesService) { }

    @Get('citas-mes')
    getCitasPorMes(@Query('anio') anio?: number) {
        return this.reportesService.getCitasPorMes(anio);
    }

    @Get('ingresos')
    getIngresosPorBarbero(@Query('mes') mes?: number, @Query('anio') anio?: number) {
        return this.reportesService.getIngresosPorBarbero(mes, anio);
    }

    @Get('ranking')
    getRankingBarberos() {
        return this.reportesService.getRankingBarberos();
    }

    @Get('servicios-populares')
    getServiciosPopulares() {
        return this.reportesService.getServiciosPopulares();
    }

    @Get('clientes-frecuentes')
    getClientesFrecuentes() {
        return this.reportesService.getClientesFrecuentes();
    }

    @Get('productos-vendidos')
    getProductosVendidos() {
        return this.reportesService.getProductosVendidos();
    }
}
