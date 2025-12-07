import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import * as oracledb from 'oracledb';

@Injectable()
export class ReportesService {
    constructor(private databaseService: DatabaseService) { }

    async getCitasPorMes(anio?: number) {
        const result = await this.databaseService.executeCursorProcedure(
            'BEGIN SP_REPORTE_CITAS_MES(p_anio => :anio, p_cursor => :cursor); END;',
            {
                anio: anio || null,
                cursor: { dir: oracledb.BIND_OUT, type: oracledb.CURSOR }
            },
            'cursor'
        );
        return result;
    }

    async getIngresosPorBarbero(mes?: number, anio?: number) {
        const result = await this.databaseService.executeCursorProcedure(
            'BEGIN SP_REPORTE_INGRESOS(p_mes => :mes, p_anio => :anio, p_cursor => :cursor); END;',
            {
                mes: mes || null,
                anio: anio || null,
                cursor: { dir: oracledb.BIND_OUT, type: oracledb.CURSOR }
            },
            'cursor'
        );
        return result;
    }

    async getRankingBarberos() {
        const result = await this.databaseService.executeCursorProcedure(
            'BEGIN SP_REPORTE_RANKING_BARBEROS(p_cursor => :cursor); END;',
            {
                cursor: { dir: oracledb.BIND_OUT, type: oracledb.CURSOR }
            },
            'cursor'
        );
        return result;
    }

    async getServiciosPopulares() {
        const result = await this.databaseService.executeCursorProcedure(
            'BEGIN SP_REPORTE_SERVICIOS_POPULARES(p_cursor => :cursor); END;',
            {
                cursor: { dir: oracledb.BIND_OUT, type: oracledb.CURSOR }
            },
            'cursor'
        );
        return result;
    }

    async getClientesFrecuentes() {
        const result = await this.databaseService.executeCursorProcedure(
            'BEGIN SP_REPORTE_CLIENTES_FRECUENTES(p_cursor => :cursor); END;',
            {
                cursor: { dir: oracledb.BIND_OUT, type: oracledb.CURSOR }
            },
            'cursor'
        );
        return result;
    }

    async getProductosVendidos() {
        const result = await this.databaseService.executeCursorProcedure(
            'BEGIN SP_REPORTE_PRODUCTOS_VENDIDOS(p_cursor => :cursor); END;',
            {
                cursor: { dir: oracledb.BIND_OUT, type: oracledb.CURSOR }
            },
            'cursor'
        );
        return result;
    }
}
