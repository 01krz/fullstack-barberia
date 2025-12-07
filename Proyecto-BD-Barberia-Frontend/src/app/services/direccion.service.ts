import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Direccion {
    calle: string;
    ciudad: string;
    region: string;
    direccionCompleta: string;
}

@Injectable({
    providedIn: 'root'
})
export class DireccionService {
    private apiUrl = 'http://127.0.0.1:3000/direccion';

    constructor(private http: HttpClient) { }

    obtenerDireccion(): Observable<Direccion> {
        return this.http.get<Direccion>(this.apiUrl);
    }
}
