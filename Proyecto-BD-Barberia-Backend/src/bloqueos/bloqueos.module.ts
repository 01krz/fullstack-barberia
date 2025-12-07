import { Module } from '@nestjs/common';
import { BloqueosService } from './bloqueos.service';
import { BloqueosController } from './bloqueos.controller';
import { DatabaseModule } from '../database/database.module';

@Module({
    imports: [DatabaseModule],
    controllers: [BloqueosController],
    providers: [BloqueosService],
    exports: [BloqueosService]
})
export class BloqueosModule { }
