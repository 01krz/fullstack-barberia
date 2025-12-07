import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReservaService } from '../services/reserva.service';
import { AuthService } from '../services/auth.service';
import { EvaluacionService } from '../services/evaluacion.service';
import { Reserva } from '../models/reserva.model';

@Component({
    selector: 'app-mis-reservas',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './mis-reservas.component.html',
    styleUrl: './mis-reservas.component.css'
})
export class MisReservasComponent implements OnInit {
    reservas: Reserva[] = [];
    reservasPasadas: Reserva[] = [];
    reservasFuturas: Reserva[] = [];

    mostrarModalCalificar: boolean = false;
    reservaSeleccionada: Reserva | null = null;
    puntuacion: number = 5;
    comentario: string = '';

    constructor(
        private reservaService: ReservaService,
        private authService: AuthService,
        private evaluacionService: EvaluacionService
    ) { }

    ngOnInit(): void {
        this.cargarReservas();
    }

    cargarReservas(): void {
        const usuario = this.authService.getCurrentUser();
        // Solo cargar si hay usuario y NO es invitado (ID > 0)
        if (usuario && usuario.id > 0) {
            this.reservaService.obtenerReservasPorCliente(usuario.id).subscribe({
                next: (reservas) => {
                    this.reservas = reservas;
                    this.clasificarReservas();
                },
                error: (err) => {
                    console.error('Error al cargar reservas:', err);
                }
            });
        }
    }

    clasificarReservas(): void {
        const ahora = new Date();
        this.reservasPasadas = this.reservas.filter(r => {
            const fechaReserva = new Date(`${r.fecha}T${r.hora}`);
            return fechaReserva < ahora || r.estado === 'completada';
        });

        this.reservasFuturas = this.reservas.filter(r => {
            const fechaReserva = new Date(`${r.fecha}T${r.hora}`);
            return fechaReserva >= ahora && r.estado !== 'completada' && r.estado !== 'cancelada';
        });
    }

    abrirModalCalificar(reserva: Reserva): void {
        this.reservaSeleccionada = reserva;
        this.mostrarModalCalificar = true;
        this.puntuacion = 5;
        this.comentario = '';
    }

    cerrarModalCalificar(): void {
        this.mostrarModalCalificar = false;
        this.reservaSeleccionada = null;
    }

    enviarCalificacion(): void {
        if (this.reservaSeleccionada) {
            this.evaluacionService.crearEvaluacion({
                citaId: this.reservaSeleccionada.id,
                puntuacion: this.puntuacion,
                comentario: this.comentario
            }).subscribe({
                next: () => {
                    alert('¡Gracias por tu calificación!');
                    this.cerrarModalCalificar();
                    // Opcional: Marcar localmente que ya fue calificada para ocultar el botón
                },
                error: (err) => {
                    console.error('Error al calificar:', err);
                    alert('Error al enviar la calificación');
                }
            });
        }
    }
}
