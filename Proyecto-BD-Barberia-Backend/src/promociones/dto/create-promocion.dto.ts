import { IsNumber, IsNotEmpty, IsString, IsBoolean, IsOptional } from 'class-validator';
import { Type, Transform } from 'class-transformer';

export class CreatePromocionDto {
  @IsNumber()
  @IsNotEmpty()
  @Type(() => Number)
  servicioId: number;

  @IsOptional()
  @Transform(({ value }) => (!value || value === 'null') ? null : Number(value))
  productoId?: number | null;

  @IsNumber()
  @IsNotEmpty()
  @Type(() => Number)
  porcentajeDescuento: number;

  @IsString()
  @IsNotEmpty()
  fechaInicio: string; // ISO date string

  @IsString()
  @IsNotEmpty()
  fechaFin: string; // ISO date string

  @IsBoolean()
  @IsOptional()
  @Transform(({ value }) => value === true || value === 'true' || value === 1 || value === '1')
  activa?: boolean;
}

