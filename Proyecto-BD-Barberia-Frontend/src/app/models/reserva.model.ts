export interface Reserva {
  id: number;
  clienteId: number;
  cliente: string;
  barberoId: number;
  barbero: string;
  servicio: string;
  fecha: string; // YYYY-MM-DD
  hora: string; // HH:mm
  estado: 'pendiente' | 'confirmada' | 'completada' | 'cancelada';
  productos?: Array<{
    id: number;
    nombre: string;
    precio: number;
  }>;
  notas?: string;
  fechaCreacion: string;
}

export interface HoraBloqueada {
  id: number;
  barberoId: number;
  fecha: string; // YYYY-MM-DD
  hora: string; // HH:mm
  motivo?: string;
  fechaCreacion: string;
}

