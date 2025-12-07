import { Module } from '@nestjs/common';
import { EvaluacionesService } from './evaluaciones.service';
import { EvaluacionesController } from './evaluaciones.controller';
import { DatabaseModule } from '../database/database.module';

@Module({
    imports: [DatabaseModule],
    controllers: [EvaluacionesController],
    providers: [EvaluacionesService],
    exports: [EvaluacionesService]
})
export class EvaluacionesModule { }
