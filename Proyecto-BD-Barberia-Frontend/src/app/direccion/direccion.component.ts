// direccion.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { DireccionService, Direccion } from '../services/direccion.service';

@Component({
  selector: 'app-direccion',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './direccion.component.html',
  styleUrls: ['./direccion.component.css']
})
export class DireccionComponent implements OnInit {
  direccion: Direccion | null = null;
  loading = true;

  // Coordenadas exactas de la barbería en San Javier
  // Pasaje Ramiro Castro 949, Villa Don Oscar, San Javier
  latitud = -35.58894427546597;
  longitud = -71.72960803034255;

  // URL directa de Google Maps (link proporcionado por el usuario)
  mapsUrl = 'https://maps.app.goo.gl/8DzTRpM6sLurybDF6';

  // URL del iframe embed para la ubicación exacta
  embedUrl: SafeResourceUrl;

  constructor(
    private direccionService: DireccionService,
    private sanitizer: DomSanitizer
  ) {
    // Sanitizar la URL del iframe para Google Maps
    // Usando la dirección completa para mejor precisión
    const direccionCompleta = encodeURIComponent('Pasaje Constructor Ramiro Castro 949, 3460000 San Javier de Loncomilla, Maule, Chile');
    const rawUrl = `https://www.google.com/maps/embed/v1/place?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8&q=${direccionCompleta}&zoom=17`;

    // Alternativa: usar coordenadas directamente
    const rawUrlCoords = `https://www.google.com/maps?q=${this.latitud},${this.longitud}&hl=es&z=17&output=embed`;

    this.embedUrl = this.sanitizer.bypassSecurityTrustResourceUrl(rawUrlCoords);
  }

  ngOnInit(): void {
    this.cargarDireccion();
  }

  cargarDireccion(): void {
    this.direccionService.obtenerDireccion().subscribe({
      next: (data) => {
        this.direccion = data;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error al cargar dirección:', err);
        this.loading = false;
        // Dirección por defecto en caso de error
        this.direccion = {
          calle: 'Villa Don Oscar, Pasaje Ramiro Castro #949',
          ciudad: 'San Javier',
          region: 'Maule',
          direccionCompleta: 'Villa Don Oscar, Pasaje Ramiro Castro #949, San Javier, Maule'
        };
      }
    });
  }

  openMaps() {
    window.open(this.mapsUrl, '_blank');
  }
}
