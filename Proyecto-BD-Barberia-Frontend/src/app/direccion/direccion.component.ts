// direccion.component.ts
import { Component } from '@angular/core';

@Component({
  selector: 'app-direccion',
  standalone: true,
  templateUrl: './direccion.component.html',
  styleUrls: ['./direccion.component.css']
})
export class DireccionComponent {

  // URL a Google Maps (cuando hagan click se abrirá esta)
  mapsUrl = 'https://www.google.com/maps/search/?api=1&query=-35.43534920306236, -71.62168387724824';
  // también puede ser por coordenadas: ...query=-35.4269,-71.6550

  openMaps() {
    window.open(this.mapsUrl, '_blank');
  }
}
