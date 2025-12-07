import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Evaluacion } from '../models/evaluacion.model';

@Injectable({
    providedIn: 'root'
})
export class EvaluacionService {
    private apiUrl = 'http://127.0.0.1:3000/evaluaciones';

    constructor(private http: HttpClient) { }

    crearEvaluacion(evaluacion: { citaId: number, puntuacion: number, comentario: string }): Observable<Evaluacion> {
        return this.http.post<Evaluacion>(this.apiUrl, evaluacion);
    }

    obtenerEvaluaciones(): Observable<Evaluacion[]> {
        return this.http.get<Evaluacion[]>(this.apiUrl);
    }

    obtenerEvaluacionPorCita(citaId: number): Observable<Evaluacion> {
        return this.http.get<Evaluacion>(`${this.apiUrl}/cita/${citaId}`);
    }
}
