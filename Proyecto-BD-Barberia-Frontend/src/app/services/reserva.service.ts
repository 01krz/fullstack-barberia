import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { tap, catchError, map } from 'rxjs/operators';
import { Reserva, HoraBloqueada } from '../models/reserva.model';
import { GoogleCalendarService } from './google-calendar.service';
import { BarberoService } from './barbero.service';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class ReservaService {
  private apiUrl = 'http://127.0.0.1:3000/reservas';
  private reservasSubject = new BehaviorSubject<Reserva[]>([]);
  public reservas$ = this.reservasSubject.asObservable();

  private horasBloqueadasSubject = new BehaviorSubject<HoraBloqueada[]>([]);
  public horasBloqueadas$ = this.horasBloqueadasSubject.asObservable();

  constructor(private http: HttpClient) {
    // Inicializar cargando reservas si es necesario, o dejar que los componentes lo soliciten
  }

  // Métodos para Reservas
  obtenerReservas(): Observable<Reserva[]> {
    return this.http.get<Reserva[]>(this.apiUrl).pipe(
      tap(reservas => this.reservasSubject.next(reservas)),
      catchError(error => {
        console.error('Error al obtener reservas:', error);
        return of([]);
      })
    );
  }

  obtenerReservasPorBarbero(barberoId: number): Observable<Reserva[]> {
    return this.http.get<Reserva[]>(`${this.apiUrl}?barberoId=${barberoId}`);
  }

  obtenerReservasPorCliente(clienteId: number): Observable<Reserva[]> {
    return this.http.get<Reserva[]>(`${this.apiUrl}?clienteId=${clienteId}`);
  }

  obtenerReservaPorFechaHora(fecha: string, hora: string, barberoId: number): Observable<Reserva | undefined> {
    // Esto idealmente debería ser un endpoint en el backend para eficiencia
    // Por ahora filtramos en el cliente para mantener compatibilidad rápida
    return this.obtenerReservasPorBarbero(barberoId).pipe(
      map(reservas => reservas.find(r =>
        r.fecha === fecha &&
        r.hora === hora &&
        r.estado !== 'cancelada' &&
        r.estado !== 'completada'
      ))
    );
  }

  crearReserva(reserva: any): Observable<Reserva> {
    return this.http.post<Reserva>(this.apiUrl, reserva).pipe(
      tap(nuevaReserva => {
        const actuales = this.reservasSubject.value;
        this.reservasSubject.next([...actuales, nuevaReserva]);
      })
    );
  }

  cancelarReserva(id: number): Observable<boolean> {
    return this.http.delete(`${this.apiUrl}/${id}`).pipe(
      map(() => true),
      catchError(error => {
        console.error('Error al cancelar reserva:', error);
        return of(false);
      })
    );
  }

  actualizarEstadoReserva(id: number, estado: string): Observable<boolean> {
    return this.http.patch(`${this.apiUrl}/${id}`, { estado }).pipe(
      map(() => true),
      catchError(error => {
        console.error('Error al actualizar estado:', error);
        return of(false);
      })
    );
  }

  // Métodos para Horas Bloqueadas (Mantenemos local por ahora si no hay backend para esto, 
  // o asumimos que no se usa o se implementará luego. 
  // El usuario solo pidió arreglar el guardado de reservas.
  // Dejaremos la implementación básica para no romper compilación, pero idealmente debería ir al backend también)

  // Métodos para Horas Bloqueadas (Backend)

  obtenerHorasBloqueadas(): Observable<HoraBloqueada[]> {
    return this.horasBloqueadas$;
  }

  esHoraBloqueada(fecha: string, hora: string, barberoId: number): boolean {
    const bloqueos = this.horasBloqueadasSubject.value;
    return bloqueos.some(b =>
      b.fecha === fecha &&
      b.hora === hora &&
      Number(b.barberoId) === Number(barberoId)
    );
  }

  obtenerBloqueos(barberoId: number): Observable<HoraBloqueada[]> {
    return this.http.get<HoraBloqueada[]>(`http://localhost:3000/bloqueos?barberoId=${barberoId}`).pipe(
      tap(bloqueos => {
        // Actualizar el subject local para que los componentes reactivos funcionen
        // Filtramos para no sobrescribir bloqueos de otros barberos si quisiéramos mantener caché global,
        // pero por simplicidad reemplazamos o fusionamos.
        // Mejor estrategia: Mantener el subject como "bloqueos actuales visibles"
        this.horasBloqueadasSubject.next(bloqueos);
      }),
      catchError(error => {
        console.error('Error al obtener bloqueos:', error);
        return of([]);
      })
    );
  }

  bloquearHora(barberoId: number, fecha: string, hora: string, motivo?: string): Observable<HoraBloqueada> {
    return this.http.post<HoraBloqueada>('http://localhost:3000/bloqueos', { barberoId, fecha, hora, motivo }).pipe(
      tap(nuevoBloqueo => {
        const actuales = this.horasBloqueadasSubject.value;
        this.horasBloqueadasSubject.next([...actuales, nuevoBloqueo]);
      })
    );
  }

  liberarHora(id: number): Observable<boolean> {
    return this.http.delete(`http://localhost:3000/bloqueos/${id}`).pipe(
      map(() => {
        const actuales = this.horasBloqueadasSubject.value;
        this.horasBloqueadasSubject.next(actuales.filter(h => h.id !== id));
        return true;
      }),
      catchError(error => {
        console.error('Error al liberar hora:', error);
        return of(false);
      })
    );
  }

  liberarHoraPorFechaHora(fecha: string, hora: string, barberoId: number): Observable<boolean> {
    return this.http.delete(`http://localhost:3000/bloqueos?barberoId=${barberoId}&fecha=${fecha}&hora=${hora}`).pipe(
      map(() => {
        const actuales = this.horasBloqueadasSubject.value;
        this.horasBloqueadasSubject.next(actuales.filter(h => !(h.fecha === fecha && h.hora === hora && h.barberoId === barberoId)));
        return true;
      }),
      catchError(error => {
        console.error('Error al liberar hora por fecha/hora:', error);
        return of(false);
      })
    );
  }

  // Verificar disponibilidad (Ahora asíncrono preferiblemente, pero adaptamos para compatibilidad)
  // OJO: Este método era síncrono. Si lo cambiamos a Observable, romperemos el componente.
  // Para esta iteración, haremos una verificación "optimista" basada en lo que tenemos cargado
  // o refactorizaremos el componente para usar Observables.
  // Dado que vamos a tocar el componente, mejor exponemos un método Observable.

  verificarDisponibilidad(fecha: string, hora: string, barberoId: number): Observable<boolean> {
    return this.obtenerReservasPorBarbero(barberoId).pipe(
      map(reservas => {
        // Verificar si la fecha/hora ya pasó
        if (this.esHoraPasada(fecha, hora)) {
          return false;
        }

        // No disponible si está bloqueada (local)
        if (this.esHoraBloqueada(fecha, hora, barberoId)) {
          return false;
        }

        // No disponible si ya hay una reserva activa
        const ocupado = reservas.some(r =>
          r.fecha === fecha &&
          r.hora === hora &&
          r.estado !== 'cancelada' &&
          r.estado !== 'completada'
        );

        return !ocupado;
      })
    );
  }

  // Mantener método síncrono auxiliar
  esHoraPasada(fecha: string, hora: string): boolean {
    const ahora = new Date();
    const [year, month, day] = fecha.split('-').map(Number);
    const [hour, minute] = hora.split(':').map(Number);

    const fechaHoraReserva = new Date(year, month - 1, day, hour, minute);

    return fechaHoraReserva < ahora;
  }

  // Método síncrono para compatibilidad con componentes que no se han migrado a Observable
  // Nota: Este método no verifica reservas en el backend, solo horas bloqueadas locales y fecha pasada.
  // Usar con precaución.
  esDisponible(fecha: string, hora: string, barberoId: number): boolean {
    if (this.esHoraPasada(fecha, hora)) {
      return false;
    }
    if (this.esHoraBloqueada(fecha, hora, barberoId)) {
      return false;
    }
    return true;
  }
}

