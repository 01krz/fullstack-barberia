import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class DireccionService {
    constructor(private readonly databaseService: DatabaseService) { }

    async obtenerDireccionCompleta() {
        try {
            const query = `
        SELECT 
          d.ID_DIRECCION,
          d.CALLE_NUMERO,
          c.NOMBRE AS CIUDAD,
          r.NOMBRE AS REGION
        FROM LTEB_DIRECCION d
        JOIN LTEB_CIUDAD c ON d.ID_CIUDAD = c.ID_CIUDAD
        JOIN LTEB_REGION r ON c.ID_REGION = r.ID_REGION
        WHERE d.ID_DIRECCION = 1
      `;

            console.log('DEBUG: Ejecutando query de dirección...');
            const result = await this.databaseService.executeQuery(query);
            console.log('DEBUG: Resultado de la query:', result);

            if (!result || result.length === 0) {
                console.log('DEBUG: No se encontraron resultados en la base de datos');
                return {
                    calle: 'Dirección no disponible',
                    ciudad: '',
                    region: '',
                    direccionCompleta: 'Dirección no disponible'
                };
            }

            const direccion = result[0];
            console.log('DEBUG: Dirección encontrada:', direccion);

            return {
                calle: direccion.CALLE_NUMERO || '',
                ciudad: direccion.CIUDAD || '',
                region: direccion.REGION || '',
                direccionCompleta: `${direccion.CALLE_NUMERO || ''}, ${direccion.CIUDAD || ''}, ${direccion.REGION || ''}`
            };
        } catch (error) {
            console.error('ERROR al obtener dirección:', error);
            throw error;
        }
    }
}
