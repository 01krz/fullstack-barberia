import { IsString, IsNumber, IsOptional } from 'class-validator';

export class UpdateServicioDto {
  @IsString()
  @IsOptional()
  nombre?: string;

  @IsNumber()
  @IsOptional()
  precio?: number;
}

