export interface Promocion {
  id: number;
  servicioId: number;
  productoId: number | null; // null si solo es servicio
  porcentajeDescuento: number; // Porcentaje de descuento (0-100)
  fechaInicio: string; // ISO date string
  fechaFin: string; // ISO date string
  activa: boolean;
}


