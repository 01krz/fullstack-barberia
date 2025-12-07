import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap, map, catchError, of } from 'rxjs';
import { Producto } from '../models/producto.model';

@Injectable({
  providedIn: 'root'
})
export class ProductoService {
  private apiUrl = 'http://127.0.0.1:3000/productos';
  private productosSubject = new BehaviorSubject<Producto[]>([]);
  public productos$ = this.productosSubject.asObservable();

  constructor(private http: HttpClient) {
    this.cargarProductos();
  }

  cargarProductos(): void {
    this.http.get<Producto[]>(this.apiUrl).subscribe({
      next: (productos) => {
        this.productosSubject.next(productos);
      },
      error: (error) => {
        console.error('Error al cargar productos:', error);
      }
    });
  }

  obtenerProductos(): Observable<Producto[]> {
    return this.productos$;
  }

  obtenerProductosActivos(): Producto[] {
    // Idealmente esto debería ser un endpoint filtrado en el backend
    // Por ahora filtramos localmente lo que ya tenemos cargado
    return this.productosSubject.value.filter(p => p.stock > 0);
    // Nota: El backend tiene /activos, podríamos usar eso también:
    // return this.http.get<Producto[]>(`${this.apiUrl}/activos`);
    // Pero para mantener la compatibilidad con el componente que espera un array síncrono (si lo hay),
    // o si el componente usa Observables, mejor devolver Observable.
    // Revisando el uso en reserva.component.ts:
    // this.productoService.obtenerProductosActivos().forEach(...)
    // El componente espera un array síncrono.
    // Para no romper el componente AHORA, devolvemos lo que tenemos en memoria.
  }

  // Método asíncrono para obtener activos (recomendado para refactorizar después)
  obtenerProductosActivosAsync(): Observable<Producto[]> {
    return this.http.get<Producto[]>(`${this.apiUrl}/activos`);
  }

  obtenerProductoPorId(id: number): Producto | undefined {
    return this.productosSubject.value.find(p => p.id === id);
  }

  agregarProducto(producto: Omit<Producto, 'id'>): Observable<Producto> {
    return this.http.post<Producto>(this.apiUrl, producto).pipe(
      tap(nuevoProducto => {
        const actuales = this.productosSubject.value;
        this.productosSubject.next([...actuales, nuevoProducto]);
      })
    );
  }

  actualizarProducto(id: number, producto: Partial<Producto>): Observable<Producto> {
    return this.http.patch<Producto>(`${this.apiUrl}/${id}`, producto).pipe(
      tap(productoActualizado => {
        const actuales = this.productosSubject.value;
        const index = actuales.findIndex(p => p.id === id);
        if (index !== -1) {
          actuales[index] = { ...actuales[index], ...productoActualizado }; // Merge simple
          // O mejor, reemplazar con lo que devuelve el backend si devuelve el objeto completo
          if (productoActualizado && productoActualizado.id) {
            actuales[index] = productoActualizado;
          }
          this.productosSubject.next([...actuales]);
        }
      })
    );
  }

  eliminarProducto(id: number): Observable<boolean> {
    return this.http.delete(`${this.apiUrl}/${id}`).pipe(
      map(() => {
        const actuales = this.productosSubject.value;
        const filtrados = actuales.filter(p => p.id !== id);
        this.productosSubject.next(filtrados);
        return true;
      }),
      catchError(error => {
        console.error('Error al eliminar producto:', error);
        return of(false);
      })
    );
  }
}

