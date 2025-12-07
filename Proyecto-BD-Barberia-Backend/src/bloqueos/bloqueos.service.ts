import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import * as oracledb from 'oracledb';

@Injectable()
export class BloqueosService {
    constructor(private databaseService: DatabaseService) { }

    async create(createBloqueoDto: any) {
        const { barberoId, fecha, hora, motivo } = createBloqueoDto;

        console.log('DEBUG: Creando bloqueo con datos:', { barberoId, fecha, hora, motivo });

        // Usar SP_GESTIONAR_BLOQUEO - el cursor vacío se cierra automáticamente
        const result = await this.databaseService.executeProcedure(
            'BEGIN SP_GESTIONAR_BLOQUEO(p_accion => :accion, p_id_barbero => :barberoId, p_fecha => :fecha, p_hora => :hora, p_motivo => :motivo, p_cursor => :cursor, p_id_salida => :id_salida); END;',
            {
                accion: 'C',
                barberoId,
                fecha,
                hora,
                motivo: motivo || null,
                cursor: { dir: oracledb.BIND_OUT, type: oracledb.CURSOR },
                id_salida: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER }
            }
        );

        // NO cerrar el cursor vacío - Oracle lo maneja automáticamente
        console.log('DEBUG: Bloqueo creado exitosamente, ID:', result.outBinds.id_salida);
        return { id: result.outBinds.id_salida, barberoId, fecha, hora, motivo };
    }

    async findAll() {
        const bloqueos = await this.databaseService.executeCursorProcedure(
            'BEGIN SP_GESTIONAR_BLOQUEO(p_accion => :accion, p_cursor => :cursor, p_id_salida => :id_salida); END;',
            {
                accion: 'R',
                cursor: { dir: oracledb.BIND_OUT, type: oracledb.CURSOR },
                id_salida: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER }
            },
            'cursor'
        );
        return this.mapBloqueos(bloqueos);
    }

    async findByBarbero(barberoId: number) {
        const bloqueos = await this.databaseService.executeCursorProcedure(
            'BEGIN SP_GESTIONAR_BLOQUEO(p_accion => :accion, p_id_barbero => :barberoId, p_cursor => :cursor, p_id_salida => :id_salida); END;',
            {
                accion: 'R',
                barberoId,
                cursor: { dir: oracledb.BIND_OUT, type: oracledb.CURSOR },
                id_salida: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER }
            },
            'cursor'
        );
        return this.mapBloqueos(bloqueos);
    }

    async remove(id: number) {
        await this.databaseService.executeProcedure(
            'BEGIN SP_GESTIONAR_BLOQUEO(p_accion => :accion, p_id_bloqueo => :id, p_cursor => :cursor, p_id_salida => :id_salida); END;',
            {
                accion: 'D',
                id,
                cursor: { dir: oracledb.BIND_OUT, type: oracledb.CURSOR },
                id_salida: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER }
            }
        );

        // NO cerrar cursor - Oracle lo maneja automáticamente
        return { message: 'Bloqueo eliminado' };
    }

    async removeByFechaHora(barberoId: number, fecha: string, hora: string) {
        await this.databaseService.executeProcedure(
            'BEGIN SP_GESTIONAR_BLOQUEO(p_accion => :accion, p_id_barbero => :barberoId, p_fecha => :fecha, p_hora => :hora, p_cursor => :cursor, p_id_salida => :id_salida); END;',
            {
                accion: 'D',
                barberoId,
                fecha,
                hora,
                cursor: { dir: oracledb.BIND_OUT, type: oracledb.CURSOR },
                id_salida: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER }
            }
        );

        // NO cerrar cursor - Oracle lo maneja automáticamente
        return { message: 'Bloqueo liberado' };
    }

    private mapBloqueos(rows: any[]) {
        return rows.map(r => ({
            id: r.ID_BLOQUEO,
            barberoId: r.ID_BARBERO,
            // Convertir fecha de Oracle DATE a string YYYY-MM-DD
            fecha: r.FECHA instanceof Date
                ? r.FECHA.toISOString().split('T')[0]
                : (typeof r.FECHA === 'string' && r.FECHA.includes('T')
                    ? r.FECHA.split('T')[0]
                    : r.FECHA),
            hora: r.HORA,
            motivo: r.MOTIVO,
            fechaCreacion: r.FECHA_CREACION
        }));
    }
}
