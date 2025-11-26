import { IsString, IsOptional } from 'class-validator';

export class UpdateReservaDto {
  @IsString()
  @IsOptional()
  estado?: string;
}

