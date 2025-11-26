import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { catchError, tap, map } from 'rxjs/operators';
import { Barbero } from '../models/barbero.model';

@Injectable({
  providedIn: 'root'
})
export class BarberoService {
  private apiUrl = 'http://localhost:3000';
  private barberosSubject = new BehaviorSubject<Barbero[]>([]);
  public barberos$ = this.barberosSubject.asObservable();

  // Simulación de base de datos (fallback)
  private barberos: Barbero[] = [
    {
      id: 2,
      nombre: 'Juan Barbero',
      email: 'barberobarberia.com',
      telefono: '+56912345678',
      activo: true,
      googleCalendarEmail: ''
    },
    {
      id: 4,
      nombre: 'Carlos Barbero',
      email: 'carlos@barberia.com',
      telefono: '+56987654321',
      activo: true,
      googleCalendarEmail: ''
    },
    {
      id: 5,
      nombre: 'Miguel Barbero',
      email: 'miguel@barberia.com',
      telefono: '+56911223344',
      activo: true,
      googleCalendarEmail: ''
    }
  ];

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
        catchError(() => {
          return of(this.barberos); // Fallback a barberos simulados
        }),
        tap(barberos => {
          this.barberos = barberos;
          this.barberosSubject.next(barberos);
        })
      )
      .subscribe();
  }

  private guardarEnLocalStorage(): void {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem('barberos', JSON.stringify(this.barberos));
      }
    } catch (error) {
      console.warn('Error al guardar barberos en localStorage:', error);
    }
  }

  private cargarDesdeLocalStorage(): void {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const barberosGuardados = localStorage.getItem('barberos');
        if (barberosGuardados) {
          this.barberos = JSON.parse(barberosGuardados);
        }
      }
    } catch (error) {
      console.warn('Error al cargar barberos desde localStorage:', error);
    }
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
      rut: null, // Se puede agregar después
      idDireccion: null,
      idSucursal: null
    }, { headers: this.getHeaders() }).pipe(
      tap(nuevoBarbero => {
        // Actualizar lista local
        this.barberos.push(nuevoBarbero);
        this.barberosSubject.next([...this.barberos]);
        this.guardarEnLocalStorage();
      }),
      catchError((error) => {
        console.error('Error al agregar barbero:', error);
        // Fallback local si falla el backend
        const nuevoId = this.barberos.length > 0 
          ? Math.max(...this.barberos.map(b => b.id)) + 1 
          : 1;
        const nuevoBarbero: Barbero = {
          ...barbero,
          id: nuevoId
        };
        this.barberos.push(nuevoBarbero);
        this.barberosSubject.next([...this.barberos]);
        this.guardarEnLocalStorage();
        return of(nuevoBarbero);
      })
    );
  }

  actualizarBarbero(id: number, barbero: Partial<Barbero>): boolean {
    const index = this.barberos.findIndex(b => b.id === id);
    if (index !== -1) {
      this.barberos[index] = { ...this.barberos[index], ...barbero };
      this.barberosSubject.next([...this.barberos]);
      this.guardarEnLocalStorage();
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
          this.guardarEnLocalStorage();
        }
      }),
      map(() => true),
      catchError(() => {
        // Fallback local
        const index = this.barberos.findIndex(b => b.id === id);
        if (index !== -1) {
          this.barberos.splice(index, 1);
          this.barberosSubject.next([...this.barberos]);
          this.guardarEnLocalStorage();
          return of(true);
        }
        return of(false);
      })
    );
  }
}

