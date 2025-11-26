import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Producto } from '../models/producto.model';

@Injectable({
  providedIn: 'root'
})
export class ProductoService {
  private productosSubject = new BehaviorSubject<Producto[]>([]);
  public productos$ = this.productosSubject.asObservable();

  // Simulación de base de datos (luego se conectará a una BD real)
  private productos: Producto[] = [
    {
      id: 1,
      nombre: 'Pomada para Cabello',
      descripcion: 'Pomada de alta fijación para peinados modernos',
      precio: 8000,
      stock: 50,
      activo: true
    },
    {
      id: 2,
      nombre: 'Aceite para Barba',
      descripcion: 'Aceite nutritivo para el cuidado de la barba',
      precio: 12000,
      stock: 30,
      activo: true
    },
    {
      id: 3,
      nombre: 'Champú Profesional',
      descripcion: 'Champú para cabello y cuero cabelludo',
      precio: 10000,
      stock: 40,
      activo: true
    }
  ];

  constructor() {
    // Cargar productos desde localStorage si existen
    this.cargarDesdeLocalStorage();
    this.productosSubject.next([...this.productos]);
  }

  private guardarEnLocalStorage(): void {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem('productos', JSON.stringify(this.productos));
      }
    } catch (error) {
      console.warn('Error al guardar productos en localStorage:', error);
    }
  }

  private cargarDesdeLocalStorage(): void {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const productosGuardados = localStorage.getItem('productos');
        if (productosGuardados) {
          this.productos = JSON.parse(productosGuardados);
        }
      }
    } catch (error) {
      console.warn('Error al cargar productos desde localStorage:', error);
    }
  }

  obtenerProductos(): Observable<Producto[]> {
    return this.productos$;
  }

  obtenerProductosActivos(): Producto[] {
    return this.productos.filter(p => p.activo && p.stock > 0);
  }

  obtenerProductoPorId(id: number): Producto | undefined {
    return this.productos.find(p => p.id === id);
  }

  agregarProducto(producto: Omit<Producto, 'id'>): Producto {
    const nuevoId = this.productos.length > 0 
      ? Math.max(...this.productos.map(p => p.id)) + 1 
      : 1;
    
    const nuevoProducto: Producto = {
      ...producto,
      id: nuevoId
    };
    
    this.productos.push(nuevoProducto);
    this.productosSubject.next([...this.productos]);
    this.guardarEnLocalStorage();
    
    return nuevoProducto;
  }

  actualizarProducto(id: number, producto: Partial<Producto>): boolean {
    const index = this.productos.findIndex(p => p.id === id);
    if (index !== -1) {
      this.productos[index] = { ...this.productos[index], ...producto };
      this.productosSubject.next([...this.productos]);
      this.guardarEnLocalStorage();
      return true;
    }
    return false;
  }

  eliminarProducto(id: number): boolean {
    const index = this.productos.findIndex(p => p.id === id);
    if (index !== -1) {
      this.productos.splice(index, 1);
      this.productosSubject.next([...this.productos]);
      this.guardarEnLocalStorage();
      return true;
    }
    return false;
  }
}

