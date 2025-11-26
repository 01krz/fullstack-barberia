import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-metricas',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './metricas.component.html',
  styleUrl: './metricas.component.css'
})
export class MetricasComponent implements OnInit {

  constructor() { }

  ngOnInit(): void {
    // Aquí se cargarán los datos de la base de datos en el futuro
    this.loadMetrics();
  }

  loadMetrics(): void {
    // Placeholder para futuras consultas a la base de datos
    // Ejemplo: this.metricsService.getMetrics().subscribe(data => { ... });
  }

}
