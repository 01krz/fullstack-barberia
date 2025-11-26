import { Module } from '@nestjs/common';
import { BarberosService } from './barberos.service';
import { BarberosController } from './barberos.controller';

@Module({
  controllers: [BarberosController],
  providers: [BarberosService],
  exports: [BarberosService],
})
export class BarberosModule {}

