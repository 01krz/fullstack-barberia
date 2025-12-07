import { IsNumber, IsString, IsOptional, Min, Max } from 'class-validator';

export class CreateEvaluacionDto {
    @IsNumber()
    citaId: number;

    @IsNumber()
    @Min(1)
    @Max(5)
    puntuacion: number;

    @IsString()
    @IsOptional()
    comentario?: string;
}
