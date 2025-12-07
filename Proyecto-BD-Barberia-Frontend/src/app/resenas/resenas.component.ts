import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EvaluacionService } from '../services/evaluacion.service';
import { Evaluacion } from '../models/evaluacion.model';

@Component({
  selector: 'app-resenas',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './resenas.component.html',
  styleUrl: './resenas.component.css'
})
export class ResenasComponent implements OnInit {
  resenas: Evaluacion[] = [];

  constructor(private evaluacionService: EvaluacionService) { }

  ngOnInit(): void {
    this.evaluacionService.obtenerEvaluaciones().subscribe(resenas => {
      this.resenas = resenas;
    });
  }

  getEstrellas(puntuacion: number | string): number[] {
    const count = Number(puntuacion) || 0;
    return Array(count).fill(0);
  }
}
