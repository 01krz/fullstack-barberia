import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { catchError, tap, map } from 'rxjs/operators';
import { Servicio } from '../models/servicio.model';

@Injectable({
  providedIn: 'root'
})
export class ServicioService {
  private apiUrl = 'http://localhost:3000';
  private serviciosSubject = new BehaviorSubject<Servicio[]>([]);
  public servicios$ = this.serviciosSubject.asObservable();

  constructor(private http: HttpClient) {
    this.cargarServicios();
  }

  private cargarServicios(): void {
    this.http.get<Servicio[]>(`${this.apiUrl}/servicios/activos`)
      .pipe(
        catchError(() => {
          // Fallback a servicios simulados si el backend no está disponible
          return of(this.servicios);
        }),
        tap(servicios => {
          this.serviciosSubject.next(servicios);
        })
      )
      .subscribe();
  }

  // Servicios simulados como fallback
  private servicios: Servicio[] = [
    {
      id: 1,
      nombre: 'Corte de Cabello',
      descripcion: 'Corte moderno y estilizado',
      precio: 15000,
      duracion: 30,
      activo: true
    },
    {
      id: 2,
      nombre: 'Barba',
      descripcion: 'Arreglo y diseño de barba',
      precio: 10000,
      duracion: 20,
      activo: true
    }
  ];



  obtenerServicios(): Observable<Servicio[]> {
    this.http.get<Servicio[]>(`${this.apiUrl}/servicios`)
      .pipe(
        catchError(() => of(this.servicios)),
        tap(servicios => this.serviciosSubject.next(servicios))
      )
      .subscribe();
    return this.servicios$;
  }

  obtenerServiciosActivos(): Servicio[] {
    return this.serviciosSubject.value.filter(s => s.activo !== false);
  }

  obtenerServicioPorId(id: number): Observable<Servicio | undefined> {
    return this.http.get<Servicio>(`${this.apiUrl}/servicios/${id}`)
      .pipe(
        catchError(() => {
          const servicio = this.servicios.find(s => s.id === id);
          return of(servicio);
        })
      );
  }

  agregarServicio(servicio: Omit<Servicio, 'id'>): Observable<Servicio> {
    return this.http.post<Servicio>(`${this.apiUrl}/servicios`, servicio)
      .pipe(
        tap(nuevoServicio => {
          const servicios = [...this.serviciosSubject.value, nuevoServicio];
          this.serviciosSubject.next(servicios);
        }),
        catchError(() => {
          // Fallback local
          const nuevoId = this.servicios.length > 0 
            ? Math.max(...this.servicios.map(s => s.id)) + 1 
            : 1;
          const nuevoServicio: Servicio = { ...servicio, id: nuevoId };
          this.servicios.push(nuevoServicio);
          this.serviciosSubject.next([...this.servicios]);
          return of(nuevoServicio);
        })
      );
  }

  actualizarServicio(id: number, servicio: Partial<Servicio>): Observable<boolean> {
    return this.http.patch<Servicio>(`${this.apiUrl}/servicios/${id}`, servicio)
      .pipe(
        tap(servicioActualizado => {
          const servicios = this.serviciosSubject.value.map(s => 
            s.id === id ? servicioActualizado : s
          );
          this.serviciosSubject.next(servicios);
        }),
        map(() => true),
        catchError(() => of(false))
      );
  }

  eliminarServicio(id: number): Observable<boolean> {
    return this.http.delete(`${this.apiUrl}/servicios/${id}`)
      .pipe(
        tap(() => {
          const servicios = this.serviciosSubject.value.filter(s => s.id !== id);
          this.serviciosSubject.next(servicios);
        }),
        map(() => true),
        catchError(() => of(false))
      );
  }
}

