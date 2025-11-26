import { IsNumber, IsNotEmpty, IsString, IsOptional, IsArray } from 'class-validator';

export class CreateReservaDto {
  @IsNumber()
  @IsNotEmpty()
  clienteId: number;

  @IsNumber()
  @IsNotEmpty()
  barberoId: number;

  @IsNumber()
  @IsNotEmpty()
  servicioId: number;

  @IsString()
  @IsNotEmpty()
  fecha: string; // YYYY-MM-DD

  @IsString()
  @IsNotEmpty()
  hora: string; // HH:mm

  @IsString()
  @IsOptional()
  estado?: string;

  @IsString()
  @IsOptional()
  notas?: string;

  @IsArray()
  @IsOptional()
  productos?: number[];
}

