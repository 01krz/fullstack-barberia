import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { BarberosService } from './barberos.service';
import { CreateBarberoDto } from './dto/create-barbero.dto';
import { UpdateBarberoDto } from './dto/update-barbero.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('barberos')
export class BarberosController {
  constructor(private readonly barberosService: BarberosService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  create(@Body() createBarberoDto: CreateBarberoDto) {
    return this.barberosService.create(createBarberoDto);
  }

  @Get()
  findAll() {
    return this.barberosService.findAll();
  }

  @Get('activos')
  findActive() {
    return this.barberosService.findActive();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.barberosService.findOne(+id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  update(@Param('id') id: string, @Body() updateBarberoDto: UpdateBarberoDto) {
    return this.barberosService.update(+id, updateBarberoDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  remove(@Param('id') id: string) {
    return this.barberosService.remove(+id);
  }
}

