import { IsNumber, IsOptional } from 'class-validator';

export class ConvertirBarberoDto {
  @IsNumber()
  @IsOptional()
  telefono?: number;

  @IsNumber()
  @IsOptional()
  idDireccion?: number;

  @IsNumber()
  @IsOptional()
  idSucursal?: number;
}

