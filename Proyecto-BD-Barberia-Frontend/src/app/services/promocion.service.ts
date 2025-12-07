import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { Promocion } from '../models/promocion.model';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class PromocionService {
  private apiUrl: string;
  private promocionesSubject = new BehaviorSubject<Promocion[]>([]);
  public promociones$ = this.promocionesSubject.asObservable();

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {
    this.apiUrl = `${this.authService.apiUrl}/promociones`;
  }

  cargarPromociones(): void {
    this.obtenerPromociones().subscribe();
  }

  obtenerPromociones(): Observable<Promocion[]> {
    return this.http.get<Promocion[]>(this.apiUrl).pipe(
      tap(promociones => this.promocionesSubject.next(promociones))
    );
  }

  obtenerPromocionesActivas(): Observable<Promocion[]> {
    return this.http.get<Promocion[]>(`${this.apiUrl}/activas`);
  }

  obtenerPromocionPorServicio(servicioId: number): Observable<Promocion | undefined> {
    return this.http.get<Promocion>(`${this.apiUrl}/servicio/${servicioId}`);
  }

  obtenerPromocionPorId(id: number): Observable<Promocion> {
    return this.http.get<Promocion>(`${this.apiUrl}/${id}`);
  }

  agregarPromocion(promocion: Omit<Promocion, 'id'>): Observable<Promocion> {
    return this.http.post<Promocion>(this.apiUrl, promocion).pipe(
      tap(() => this.cargarPromociones())
    );
  }

  actualizarPromocion(id: number, promocion: Partial<Promocion>): Observable<Promocion> {
    return this.http.patch<Promocion>(`${this.apiUrl}/${id}`, promocion).pipe(
      tap(() => this.cargarPromociones())
    );
  }

  eliminarPromocion(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
      tap(() => this.cargarPromociones())
    );
  }
}


