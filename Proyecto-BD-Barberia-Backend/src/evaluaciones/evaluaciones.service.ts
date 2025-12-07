import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { CreateEvaluacionDto } from './dto/create-evaluacion.dto';
import * as oracledb from 'oracledb';

@Injectable()
export class EvaluacionesService {
    constructor(private databaseService: DatabaseService) { }

    async create(createEvaluacionDto: CreateEvaluacionDto) {
        const { citaId, puntuacion, comentario } = createEvaluacionDto;

        const result = await this.databaseService.executeProcedure(
            'BEGIN SP_GESTIONAR_EVALUACION(p_accion => :accion, p_id_cita => :id_cita, p_puntuacion => :puntuacion, p_comentario => :comentario, p_cursor => :cursor, p_id_salida => :id_salida); END;',
            {
                accion: 'C',
                id_cita: citaId,
                puntuacion,
                comentario: comentario || '',
                cursor: { dir: oracledb.BIND_OUT, type: oracledb.CURSOR },
                id_salida: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER }
            }
        );

        const newId = result.outBinds.id_salida;
        return this.findOne(newId);
    }

    async findAll() {
        const evaluaciones = await this.databaseService.executeCursorProcedure(
            'BEGIN SP_GESTIONAR_EVALUACION(p_accion => :accion, p_cursor => :cursor, p_id_salida => :id_salida); END;',
            {
                accion: 'R',
                cursor: { dir: oracledb.BIND_OUT, type: oracledb.CURSOR },
                id_salida: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER }
            },
            'cursor'
        );
        return this.mapEvaluaciones(evaluaciones);
    }

    async findOne(id: number) {
        const evaluaciones = await this.databaseService.executeCursorProcedure(
            'BEGIN SP_GESTIONAR_EVALUACION(p_accion => :accion, p_id_evaluacion => :id, p_cursor => :cursor, p_id_salida => :id_salida); END;',
            {
                accion: 'R',
                id,
                cursor: { dir: oracledb.BIND_OUT, type: oracledb.CURSOR },
                id_salida: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER }
            },
            'cursor'
        );
        return evaluaciones.length > 0 ? this.mapEvaluaciones(evaluaciones)[0] : null;
    }

    async findByCita(citaId: number) {
        const evaluaciones = await this.databaseService.executeCursorProcedure(
            'BEGIN SP_GESTIONAR_EVALUACION(p_accion => :accion, p_id_cita => :id_cita, p_cursor => :cursor, p_id_salida => :id_salida); END;',
            {
                accion: 'R',
                id_cita: citaId,
                cursor: { dir: oracledb.BIND_OUT, type: oracledb.CURSOR },
                id_salida: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER }
            },
            'cursor'
        );
        return evaluaciones.length > 0 ? this.mapEvaluaciones(evaluaciones)[0] : null;
    }

    private mapEvaluaciones(rows: any[]) {
        return rows.map(e => ({
            id: e.ID_EVALUACION,
            citaId: e.ID_CITA,
            puntuacion: e.PUNTUACION,
            comentario: e.COMENTARIO,
            clienteNombre: e.CLIENTE_NOMBRE
        }));
    }
}
