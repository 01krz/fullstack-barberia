import { IsNumber, IsNotEmpty, IsString, IsBoolean, IsOptional } from 'class-validator';

export class CreatePromocionDto {
  @IsNumber()
  @IsNotEmpty()
  servicioId: number;

  @IsNumber()
  @IsOptional()
  productoId?: number | null;

  @IsNumber()
  @IsNotEmpty()
  porcentajeDescuento: number;

  @IsString()
  @IsNotEmpty()
  fechaInicio: string; // ISO date string

  @IsString()
  @IsNotEmpty()
  fechaFin: string; // ISO date string

  @IsBoolean()
  @IsOptional()
  activa?: boolean;
}

