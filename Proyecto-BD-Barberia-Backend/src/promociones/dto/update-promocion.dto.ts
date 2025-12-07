import { IsNumber, IsString, IsBoolean, IsOptional } from 'class-validator';
import { Type, Transform } from 'class-transformer';

export class UpdatePromocionDto {
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  porcentajeDescuento?: number;

  @IsString()
  @IsOptional()
  fechaInicio?: string;

  @IsString()
  @IsOptional()
  fechaFin?: string;

  @IsBoolean()
  @IsOptional()
  @Transform(({ value }) => value === true || value === 'true' || value === 1 || value === '1')
  activa?: boolean;
}

