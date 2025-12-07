import { IsString, IsNumber, IsOptional, IsBoolean } from 'class-validator';
import { Type, Transform } from 'class-transformer';

export class UpdateProductoDto {
  @IsString()
  @IsOptional()
  nombre?: string;

  @IsString()
  @IsOptional()
  descripcion?: string;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  precio?: number;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  stock?: number;

  @IsBoolean()
  @IsOptional()
  @Transform(({ value }) => value === true || value === 'true' || value === 1 || value === '1')
  activo?: boolean;
}

