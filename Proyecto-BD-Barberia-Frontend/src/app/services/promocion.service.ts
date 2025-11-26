import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Promocion } from '../models/promocion.model';

@Injectable({
  providedIn: 'root'
})
export class PromocionService {
  private promocionesSubject = new BehaviorSubject<Promocion[]>([]);
  public promociones$ = this.promocionesSubject.asObservable();

  // Simulación de base de datos (luego se conectará a una BD real)
  private promociones: Promocion[] = [];

  constructor() {
    this.cargarDesdeLocalStorage();
    this.promocionesSubject.next([...this.promociones]);
  }

  private guardarEnLocalStorage(): void {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem('promociones', JSON.stringify(this.promociones));
      }
    } catch (error) {
      console.warn('Error al guardar promociones en localStorage:', error);
    }
  }

  private cargarDesdeLocalStorage(): void {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const promocionesGuardadas = localStorage.getItem('promociones');
        if (promocionesGuardadas) {
          this.promociones = JSON.parse(promocionesGuardadas);
        }
      }
    } catch (error) {
      console.warn('Error al cargar promociones desde localStorage:', error);
    }
  }

  obtenerPromociones(): Observable<Promocion[]> {
    return this.promociones$;
  }

  obtenerPromocionesActivas(): Promocion[] {
    const ahora = new Date();
    return this.promociones.filter(p => {
      const inicio = new Date(p.fechaInicio);
      const fin = new Date(p.fechaFin);
      return p.activa && ahora >= inicio && ahora <= fin;
    });
  }

  obtenerPromocionPorServicio(servicioId: number): Promocion | undefined {
    const ahora = new Date();
    return this.promociones.find(p => {
      const inicio = new Date(p.fechaInicio);
      const fin = new Date(p.fechaFin);
      return p.servicioId === servicioId && p.activa && ahora >= inicio && ahora <= fin;
    });
  }

  obtenerPromocionPorServicioYProducto(servicioId: number, productoId: number): Promocion | undefined {
    const ahora = new Date();
    return this.promociones.find(p => {
      const inicio = new Date(p.fechaInicio);
      const fin = new Date(p.fechaFin);
      return p.servicioId === servicioId && 
             p.productoId === productoId && 
             p.activa && 
             ahora >= inicio && 
             ahora <= fin;
    });
  }

  obtenerPromocionPorId(id: number): Promocion | undefined {
    return this.promociones.find(p => p.id === id);
  }

  agregarPromocion(promocion: Omit<Promocion, 'id'>): Promocion {
    const nuevoId = this.promociones.length > 0 
      ? Math.max(...this.promociones.map(p => p.id)) + 1 
      : 1;
    
    const nuevaPromocion: Promocion = {
      ...promocion,
      id: nuevoId
    };
    
    this.promociones.push(nuevaPromocion);
    this.promocionesSubject.next([...this.promociones]);
    this.guardarEnLocalStorage();
    
    return nuevaPromocion;
  }

  actualizarPromocion(id: number, promocion: Partial<Promocion>): boolean {
    const index = this.promociones.findIndex(p => p.id === id);
    if (index !== -1) {
      this.promociones[index] = { ...this.promociones[index], ...promocion };
      this.promocionesSubject.next([...this.promociones]);
      this.guardarEnLocalStorage();
      return true;
    }
    return false;
  }

  eliminarPromocion(id: number): boolean {
    const index = this.promociones.findIndex(p => p.id === id);
    if (index !== -1) {
      this.promociones.splice(index, 1);
      this.promocionesSubject.next([...this.promociones]);
      this.guardarEnLocalStorage();
      return true;
    }
    return false;
  }
}


