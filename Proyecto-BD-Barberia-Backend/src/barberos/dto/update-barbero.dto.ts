import { IsString, IsEmail, IsOptional } from 'class-validator';

export class UpdateBarberoDto {
  @IsString()
  @IsOptional()
  nombre?: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  telefono?: string;

  @IsString()
  @IsOptional()
  googleCalendarEmail?: string;
}

