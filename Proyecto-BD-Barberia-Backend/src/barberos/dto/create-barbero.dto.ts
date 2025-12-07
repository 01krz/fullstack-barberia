import { IsString, IsNotEmpty, IsEmail, IsBoolean, IsOptional, IsNumber } from 'class-validator';

export class CreateBarberoDto {
  @IsNumber()
  @IsOptional()
  clienteId?: number; // ID del cliente a convertir en barbero

  @IsString()
  @IsOptional()
  nombre?: string; // Solo si no se proporciona clienteId

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsOptional()
  telefono?: string;

  @IsNumber()
  @IsOptional()
  idDireccion?: number;

  @IsNumber()
  @IsOptional()
  idSucursal?: number;
}

