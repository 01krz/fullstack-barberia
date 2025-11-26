import { IsNumber, IsString, IsBoolean, IsOptional } from 'class-validator';

export class UpdatePromocionDto {
  @IsNumber()
  @IsOptional()
  porcentajeDescuento?: number;

  @IsString()
  @IsOptional()
  fechaInicio?: string;

  @IsString()
  @IsOptional()
  fechaFin?: string;

  @IsBoolean()
  @IsOptional()
  activa?: boolean;
}

