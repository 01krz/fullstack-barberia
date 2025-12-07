import { IsString, IsOptional } from 'class-validator';

export class UpdateReservaDto {
  @IsString()
  @IsOptional()
  @IsString()
  @IsOptional()
  estado?: string;

  @IsString()
  @IsOptional()
  notas?: string;
}

