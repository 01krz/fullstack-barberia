import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { combineLatest } from 'rxjs';
import { ServicioService } from '../services/servicio.service';
import { PromocionService } from '../services/promocion.service';
import { ProductoService } from '../services/producto.service';
import { Servicio } from '../models/servicio.model';
import { Promocion } from '../models/promocion.model';
import { Producto } from '../models/producto.model';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent implements OnInit {
  serviciosDestacados: Servicio[] = [];
  promociones: Promocion[] = [];
  servicios: Servicio[] = [];
  productos: Producto[] = [];

  constructor(
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
      this.servicios = servicios.filter(s => s.activo);
      // Mostrar solo los primeros 3 servicios activos como destacados
      this.serviciosDestacados = this.servicios.slice(0, 3);
      
      this.productos = productos;
      
      // Cargar promociones activas solo después de que servicios y productos estén cargados
      this.promociones = this.promocionService.obtenerPromocionesActivas().slice(0, 3);
    });
  }

  obtenerNombreServicio(servicioId: number): string {
    const servicio = this.servicios.find(s => s.id === servicioId);
    return servicio ? servicio.nombre : 'Cargando...';
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
}
