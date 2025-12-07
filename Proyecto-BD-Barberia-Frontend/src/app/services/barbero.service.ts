import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { catchError, tap, map } from 'rxjs/operators';
import { Barbero } from '../models/barbero.model';

@Injectable({
  providedIn: 'root'
})
export class BarberoService {
  private apiUrl = 'http://127.0.0.1:3000';
  private barberosSubject = new BehaviorSubject<Barbero[]>([]);
  public barberos$ = this.barberosSubject.asObservable();

  // Simulación de base de datos (fallback)
  private barberos: Barbero[] = [];

  constructor(private http: HttpClient) {
    this.cargarBarberos();
  }

  private getHeaders(): any {
    const token = typeof window !== 'undefined' && window.localStorage
      ? localStorage.getItem('access_token')
      : null;

    const headers: any = {
      'Content-Type': 'application/json'
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    return headers;
  }

  private cargarBarberos(): void {
    this.http.get<Barbero[]>(`${this.apiUrl}/barberos`, { headers: this.getHeaders() })
      .pipe(
        tap(barberos => {
          this.barberos = barberos;
          this.barberosSubject.next(barberos);
        }),
        catchError((error) => {
          console.error('Error al cargar barberos:', error);
          return of([]);
        })
      )
      .subscribe();
  }



  obtenerBarberos(): Observable<Barbero[]> {
    return this.barberos$;
  }

  obtenerBarberosActivos(): Barbero[] {
    return this.barberos.filter(b => b.activo);
  }

  obtenerBarberoPorId(id: number): Barbero | undefined {
    return this.barberos.find(b => b.id === id);
  }

  agregarBarbero(barbero: Omit<Barbero, 'id'>): Observable<Barbero> {
    // Enviar al backend con el email para buscar el cliente
    return this.http.post<Barbero>(`${this.apiUrl}/barberos`, {
      email: barbero.email,
      telefono: barbero.telefono,
      idDireccion: null,
      idSucursal: null
    }, { headers: this.getHeaders() }).pipe(
      tap(nuevoBarbero => {
        // Actualizar lista local
        this.barberos.push(nuevoBarbero);
        this.barberosSubject.next([...this.barberos]);
      })
    );
  }

  actualizarBarbero(id: number, barbero: Partial<Barbero>): boolean {
    const index = this.barberos.findIndex(b => b.id === id);
    if (index !== -1) {
      this.barberos[index] = { ...this.barberos[index], ...barbero };
      this.barberosSubject.next([...this.barberos]);
      this.barberosSubject.next([...this.barberos]);
      return true;
    }
    return false;
  }

  eliminarBarbero(id: number): Observable<boolean> {
    return this.http.delete(`${this.apiUrl}/barberos/${id}`, { headers: this.getHeaders() }).pipe(
      tap(() => {
        const index = this.barberos.findIndex(b => b.id === id);
        if (index !== -1) {
          this.barberos.splice(index, 1);
          this.barberosSubject.next([...this.barberos]);
        }
      }),
      map(() => true),
      catchError((error) => {
        console.error('Error al eliminar barbero:', error);
        return of(false);
      })
    );
  }
}

