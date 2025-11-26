import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Reserva, HoraBloqueada } from '../models/reserva.model';
import { GoogleCalendarService } from './google-calendar.service';
import { BarberoService } from './barbero.service';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class ReservaService {
  private reservasSubject = new BehaviorSubject<Reserva[]>([]);
  public reservas$ = this.reservasSubject.asObservable();

  private horasBloqueadasSubject = new BehaviorSubject<HoraBloqueada[]>([]);
  public horasBloqueadas$ = this.horasBloqueadasSubject.asObservable();

  // Simulación de base de datos
  private reservas: Reserva[] = [
    {
      id: 1,
      clienteId: 3,
      cliente: 'Pedro Usuario',
      barberoId: 2,
      barbero: 'Juan Barbero',
      servicio: 'Corte de Cabello',
      fecha: new Date().toISOString().split('T')[0],
      hora: '10:00',
      estado: 'confirmada',
      fechaCreacion: new Date().toISOString()
    },
    {
      id: 2,
      clienteId: 3,
      cliente: 'Pedro Usuario',
      barberoId: 2,
      barbero: 'Juan Barbero',
      servicio: 'Barba',
      fecha: new Date().toISOString().split('T')[0],
      hora: '14:00',
      estado: 'pendiente',
      fechaCreacion: new Date().toISOString()
    }
  ];

  private horasBloqueadas: HoraBloqueada[] = [];

  constructor() {
    this.cargarDesdeLocalStorage();
    this.reservasSubject.next([...this.reservas]);
    this.horasBloqueadasSubject.next([...this.horasBloqueadas]);
  }

  private guardarEnLocalStorage(): void {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem('reservas', JSON.stringify(this.reservas));
        localStorage.setItem('horasBloqueadas', JSON.stringify(this.horasBloqueadas));
      }
    } catch (error) {
      console.warn('Error al guardar en localStorage:', error);
    }
  }

  private cargarDesdeLocalStorage(): void {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const reservasGuardadas = localStorage.getItem('reservas');
        if (reservasGuardadas) {
          this.reservas = JSON.parse(reservasGuardadas);
        }
        const horasGuardadas = localStorage.getItem('horasBloqueadas');
        if (horasGuardadas) {
          this.horasBloqueadas = JSON.parse(horasGuardadas);
        }
      }
    } catch (error) {
      console.warn('Error al cargar desde localStorage:', error);
    }
  }

  // Métodos para Reservas
  obtenerReservas(): Observable<Reserva[]> {
    return this.reservas$;
  }

  obtenerReservasPorBarbero(barberoId: number): Reserva[] {
    return this.reservas.filter(r => r.barberoId === barberoId);
  }

  obtenerReservaPorFechaHora(fecha: string, hora: string, barberoId: number): Reserva | undefined {
    return this.reservas.find(r => 
      r.fecha === fecha && 
      r.hora === hora && 
      r.barberoId === barberoId &&
      r.estado !== 'cancelada' &&
      r.estado !== 'completada'
    );
  }

  crearReserva(reserva: Omit<Reserva, 'id' | 'fechaCreacion'>): Reserva {
    const nuevoId = this.reservas.length > 0 
      ? Math.max(...this.reservas.map(r => r.id)) + 1 
      : 1;
    
    const nuevaReserva: Reserva = {
      ...reserva,
      id: nuevoId,
      fechaCreacion: new Date().toISOString()
    };
    
    this.reservas.push(nuevaReserva);
    this.reservasSubject.next([...this.reservas]);
    this.guardarEnLocalStorage();
    
    return nuevaReserva;
  }

  cancelarReserva(id: number): boolean {
    const reserva = this.reservas.find(r => r.id === id);
    if (reserva) {
      reserva.estado = 'cancelada';
      this.reservasSubject.next([...this.reservas]);
      this.guardarEnLocalStorage();
      return true;
    }
    return false;
  }

  actualizarEstadoReserva(id: number, estado: Reserva['estado']): boolean {
    const reserva = this.reservas.find(r => r.id === id);
    if (reserva) {
      reserva.estado = estado;
      this.reservasSubject.next([...this.reservas]);
      this.guardarEnLocalStorage();
      return true;
    }
    return false;
  }

  // Métodos para Horas Bloqueadas
  obtenerHorasBloqueadas(): Observable<HoraBloqueada[]> {
    return this.horasBloqueadas$;
  }

  obtenerHorasBloqueadasPorBarbero(barberoId: number): HoraBloqueada[] {
    return this.horasBloqueadas.filter(h => h.barberoId === barberoId);
  }

  esHoraBloqueada(fecha: string, hora: string, barberoId: number): boolean {
    return this.horasBloqueadas.some(h => 
      h.fecha === fecha && 
      h.hora === hora && 
      h.barberoId === barberoId
    );
  }

  bloquearHora(barberoId: number, fecha: string, hora: string, motivo?: string): HoraBloqueada {
    // Verificar si ya está bloqueada
    const yaBloqueada = this.esHoraBloqueada(fecha, hora, barberoId);
    if (yaBloqueada) {
      throw new Error('Esta hora ya está bloqueada');
    }

    const nuevoId = this.horasBloqueadas.length > 0 
      ? Math.max(...this.horasBloqueadas.map(h => h.id)) + 1 
      : 1;
    
    const horaBloqueada: HoraBloqueada = {
      id: nuevoId,
      barberoId,
      fecha,
      hora,
      motivo,
      fechaCreacion: new Date().toISOString()
    };
    
    this.horasBloqueadas.push(horaBloqueada);
    this.horasBloqueadasSubject.next([...this.horasBloqueadas]);
    this.guardarEnLocalStorage();
    
    return horaBloqueada;
  }

  liberarHora(id: number): boolean {
    const index = this.horasBloqueadas.findIndex(h => h.id === id);
    if (index !== -1) {
      this.horasBloqueadas.splice(index, 1);
      this.horasBloqueadasSubject.next([...this.horasBloqueadas]);
      this.guardarEnLocalStorage();
      return true;
    }
    return false;
  }

  liberarHoraPorFechaHora(fecha: string, hora: string, barberoId: number): boolean {
    const index = this.horasBloqueadas.findIndex(h => 
      h.fecha === fecha && 
      h.hora === hora && 
      h.barberoId === barberoId
    );
    if (index !== -1) {
      this.horasBloqueadas.splice(index, 1);
      this.horasBloqueadasSubject.next([...this.horasBloqueadas]);
      this.guardarEnLocalStorage();
      return true;
    }
    return false;
  }

  // Verificar disponibilidad
  esDisponible(fecha: string, hora: string, barberoId: number): boolean {
    // Verificar si la fecha/hora ya pasó
    if (this.esHoraPasada(fecha, hora)) {
      return false;
    }
    
    // No disponible si está bloqueada
    if (this.esHoraBloqueada(fecha, hora, barberoId)) {
      return false;
    }
    
    // No disponible si ya hay una reserva activa
    const reserva = this.obtenerReservaPorFechaHora(fecha, hora, barberoId);
    if (reserva) {
      return false;
    }
    
    return true;
  }

  // Verificar si una hora ya pasó
  esHoraPasada(fecha: string, hora: string): boolean {
    const ahora = new Date();
    const [year, month, day] = fecha.split('-').map(Number);
    const [hour, minute] = hora.split(':').map(Number);
    
    const fechaHoraReserva = new Date(year, month - 1, day, hour, minute);
    
    return fechaHoraReserva < ahora;
  }
}

