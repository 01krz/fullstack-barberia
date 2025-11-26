export interface Barbero {
  id: number;
  nombre: string;
  email: string;
  telefono: string;
  activo: boolean;
  googleCalendarEmail?: string; // Email de Google Calendar del barbero
}

