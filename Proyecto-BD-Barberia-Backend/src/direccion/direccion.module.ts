import { Module } from '@nestjs/common';
import { DireccionController } from './direccion.controller';
import { DireccionService } from './direccion.service';
import { DatabaseModule } from '../database/database.module';

@Module({
    imports: [DatabaseModule],
    controllers: [DireccionController],
    providers: [DireccionService],
    exports: [DireccionService]
})
export class DireccionModule { }
