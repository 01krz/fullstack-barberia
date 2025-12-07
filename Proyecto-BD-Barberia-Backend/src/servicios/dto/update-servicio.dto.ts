import { IsString, IsNumber, IsOptional } from 'class-validator';

export class UpdateServicioDto {
  @IsString()
  @IsOptional()
  nombre?: string;

  @IsString()
  @IsOptional()
  descripcion?: string;

  @IsNumber()
  @IsOptional()
  precio?: number;

  @IsOptional()
  activo?: boolean;
}

