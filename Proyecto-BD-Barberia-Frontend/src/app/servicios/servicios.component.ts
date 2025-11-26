import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { combineLatest } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { ServicioService } from '../services/servicio.service';
import { PromocionService } from '../services/promocion.service';
import { ProductoService } from '../services/producto.service';
import { Servicio } from '../models/servicio.model';
import { Promocion } from '../models/promocion.model';
import { Producto } from '../models/producto.model';

@Component({
  selector: 'app-servicios',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './servicios.component.html',
  styleUrl: './servicios.component.css'
})
export class ServiciosComponent implements OnInit {
  servicios: Servicio[] = [];
  promociones: Promocion[] = [];
  productos: Producto[] = [];

  constructor(
    public authService: AuthService, 
    private router: Router,
    private servicioService: ServicioService,
    private promocionService: PromocionService,
    private productoService: ProductoService
  ) {}

  ngOnInit(): void {
    // Cargar todos los datos en paralelo para asegurar que estén disponibles
    combineLatest([
      this.servicioService.obtenerServicios(),
      this.promocionService.obtenerPromociones(),
      this.productoService.obtenerProductos()
    ]).subscribe(([servicios, promociones, productos]) => {
      // Solo mostrar servicios activos
      this.servicios = servicios.filter(s => s.activo);
      
      // Cargar productos
      this.productos = productos;
      
      // Cargar promociones activas solo después de que servicios y productos estén cargados
      this.promociones = this.promocionService.obtenerPromocionesActivas();
    });
  }

  obtenerPromocionPorServicio(servicioId: number): Promocion | undefined {
    return this.promociones.find(p => p.servicioId === servicioId);
  }

  obtenerNombreServicio(servicioId: number): string {
    const servicio = this.servicios.find(s => s.id === servicioId);
    return servicio ? servicio.nombre : 'Servicio no encontrado';
  }

  obtenerNombreProducto(productoId: number | null): string {
    if (!productoId) return '';
    const producto = this.productos.find(p => p.id === productoId);
    return producto ? producto.nombre : '';
  }

  obtenerServicioPorPromocion(promocion: Promocion): Servicio | undefined {
    return this.servicios.find(s => s.id === promocion.servicioId);
  }

  obtenerProductoPorPromocion(promocion: Promocion): Producto | undefined {
    if (!promocion.productoId) return undefined;
    return this.productos.find(p => p.id === promocion.productoId);
  }

  calcularPrecioConDescuento(servicio: Servicio): number {
    const promocion = this.obtenerPromocionPorServicio(servicio.id);
    if (promocion) {
      return servicio.precio * (1 - promocion.porcentajeDescuento / 100);
    }
    return servicio.precio;
  }

  tienePromocion(servicio: Servicio): boolean {
    return !!this.obtenerPromocionPorServicio(servicio.id);
  }

  canReserve(): boolean {
    return this.authService.canReserve();
  }

  isInvitado(): boolean {
    return this.authService.isInvitado();
  }

  reservar(servicio?: string, promocionId?: number): void {
    // Verificar si el usuario puede reservar (solo usuarios autenticados pueden)
    if (!this.canReserve()) {
      // Mostrar mensaje y redirigir al login
      alert('Para reservar una hora necesitas estar logueado');
      this.router.navigate(['/login']);
      return;
    }

    // Redirigir a la página de reserva con el servicio y promoción como parámetros opcionales
    const queryParams: any = {};
    if (servicio) {
      queryParams.servicio = servicio;
    }
    if (promocionId) {
      queryParams.promocionId = promocionId;
    }
    
    this.router.navigate(['/reserva'], { queryParams });
  }

  reservarConPromocion(promocion: Promocion): void {
    // Ya no redirige directamente, solo muestra el aviso
    // El usuario debe ir a reservar y seleccionar servicio + producto para obtener el descuento
    this.router.navigate(['/reserva']);
  }
}
