import { Injectable } from '@angular/core';
// Force rebuild
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class ReportesService {
    private apiUrl = 'http://127.0.0.1:3000/reportes';

    constructor(private http: HttpClient) { }

    getCitasPorMes(anio?: number): Observable<any[]> {
        let params = new HttpParams();
        if (anio) params = params.set('anio', anio.toString());
        return this.http.get<any[]>(`${this.apiUrl}/citas-mes`, { params });
    }

    getIngresosPorBarbero(mes?: number, anio?: number): Observable<any[]> {
        let params = new HttpParams();
        if (mes) params = params.set('mes', mes.toString());
        if (anio) params = params.set('anio', anio.toString());
        return this.http.get<any[]>(`${this.apiUrl}/ingresos`, { params });
    }

    getRankingBarberos(): Observable<any[]> {
        return this.http.get<any[]>(`${this.apiUrl}/ranking`);
    }

    getServiciosPopulares(): Observable<any[]> {
        return this.http.get<any[]>(`${this.apiUrl}/servicios-populares`);
    }

    getClientesFrecuentes(): Observable<any[]> {
        return this.http.get<any[]>(`${this.apiUrl}/clientes-frecuentes`);
    }

    getProductosVendidos(): Observable<any[]> {
        return this.http.get<any[]>(`${this.apiUrl}/productos-vendidos`);
    }
}
