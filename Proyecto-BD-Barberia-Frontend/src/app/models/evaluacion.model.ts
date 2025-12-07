export interface Evaluacion {
    id: number;
    citaId: number;
    puntuacion: number;
    comentario: string;
    clienteNombre?: string; // Optional for display
    barberoNombre?: string; // Optional for display
    fecha?: string; // Optional for display
}
