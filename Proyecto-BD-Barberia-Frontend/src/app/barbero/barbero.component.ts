import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../services/auth.service';
import { ReservaService } from '../services/reserva.service';
import { GoogleCalendarService } from '../services/google-calendar.service';
import { Reserva, HoraBloqueada } from '../models/reserva.model';

interface DiaSemana {
  fecha: Date;
  diaNombre: string;
  diaNumero: number;
  mes: string;
  fechaISO: string;
}

interface SlotInfo {
  fecha: string;
  hora: string;
  reserva?: Reserva;
  bloqueada?: HoraBloqueada;
  disponible: boolean;
}

@Component({
  selector: 'app-barbero',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './barbero.component.html',
  styleUrl: './barbero.component.css'
})
export class BarberoComponent implements OnInit {
  reservas: Reserva[] = [];
  horasBloqueadas: HoraBloqueada[] = [];
  semanaActual: DiaSemana[] = [];
  horarios: string[] = [];
  semanaInicio: Date = new Date();
  slotsInfo: Map<string, SlotInfo> = new Map();
  barberoId: number = 0;
  modoVista: 'calendario' | 'lista' = 'calendario';
  slotSeleccionado: SlotInfo | null = null;
  mostrarModalBloquear: boolean = false;
  motivoBloqueo: string = '';

  constructor(
    public authService: AuthService,
    private reservaService: ReservaService,
    private googleCalendarService: GoogleCalendarService
  ) {
    this.generarHorarios();
    this.inicializarSemana();
  }

  ngOnInit(): void {
    const usuario = this.authService.getCurrentUser();
    if (usuario) {
      this.barberoId = usuario.id;
    }

    // Suscribirse a cambios en reservas y horas bloqueadas
    this.reservaService.obtenerReservas().subscribe(reservas => {
      this.reservas = reservas.filter(r => r.barberoId === this.barberoId);
      this.actualizarSlots();
    });

    this.reservaService.obtenerHorasBloqueadas().subscribe(horas => {
      this.horasBloqueadas = horas.filter(h => h.barberoId === this.barberoId);
      this.actualizarSlots();
    });

    this.actualizarSlots();
  }

  generarHorarios(): void {
    const horas: string[] = [];
    for (let hora = 9; hora < 20; hora++) {
      horas.push(`${hora.toString().padStart(2, '0')}:00`);
    }
    this.horarios = horas;
  }

  inicializarSemana(): void {
    const hoy = new Date();
    const dia = hoy.getDay();
    const diff = hoy.getDate() - dia + (dia === 0 ? -6 : 1);
    this.semanaInicio = new Date(hoy.setDate(diff));
    this.semanaInicio.setHours(0, 0, 0, 0);
    this.generarSemana();
  }

  generarSemana(): void {
    const dias: DiaSemana[] = [];
    const nombresDias = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    const nombresMeses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    
    for (let i = 0; i < 7; i++) {
      const fecha = new Date(this.semanaInicio);
      fecha.setDate(this.semanaInicio.getDate() + i);
      
      const diaSemana: DiaSemana = {
        fecha: fecha,
        diaNombre: nombresDias[fecha.getDay()],
        diaNumero: fecha.getDate(),
        mes: nombresMeses[fecha.getMonth()],
        fechaISO: fecha.toISOString().split('T')[0]
      };
      dias.push(diaSemana);
    }
    
    this.semanaActual = dias;
    this.actualizarSlots();
  }

  actualizarSlots(): void {
    this.slotsInfo.clear();
    
    const ahora = new Date();
    
    this.semanaActual.forEach(dia => {
      const esHoy = dia.fechaISO === ahora.toISOString().split('T')[0];
      
      this.horarios.forEach(hora => {
        const clave = `${dia.fechaISO}_${hora}`;
        
        // Si es hoy, verificar si la hora ya pasó
        let esHoraPasada = false;
        if (esHoy) {
          const [hour, minute] = hora.split(':').map(Number);
          const horaReserva = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate(), hour, minute);
          esHoraPasada = horaReserva < ahora;
        }
        
        // Buscar reserva
        const reserva = this.reservas.find(r => 
          r.fecha === dia.fechaISO && 
          r.hora === hora &&
          r.estado !== 'cancelada' &&
          r.estado !== 'completada'
        );
        
        // Buscar hora bloqueada
        const bloqueada = this.horasBloqueadas.find(h => 
          h.fecha === dia.fechaISO && 
          h.hora === hora
        );
        
        // Si es hora pasada y no hay reserva, crear bloqueo virtual
        let bloqueadaFinal = bloqueada;
        if (esHoraPasada && !reserva && !bloqueada) {
          bloqueadaFinal = {
            id: 0,
            barberoId: this.barberoId,
            fecha: dia.fechaISO,
            hora: hora,
            motivo: 'Hora pasada',
            fechaCreacion: new Date().toISOString()
          };
        }
        
        // No disponible si es hora pasada, tiene reserva o está bloqueada
        const disponible = !esHoraPasada && !reserva && !bloqueada;
        
        this.slotsInfo.set(clave, {
          fecha: dia.fechaISO,
          hora: hora,
          reserva: reserva,
          bloqueada: bloqueadaFinal,
          disponible: disponible
        });
      });
    });
  }

  obtenerSlotInfo(fechaISO: string, hora: string): SlotInfo | undefined {
    const clave = `${fechaISO}_${hora}`;
    return this.slotsInfo.get(clave);
  }

  seleccionarSlot(slot: SlotInfo): void {
    this.slotSeleccionado = slot;
  }

  cancelarReserva(reservaId: number): void {
    if (confirm('¿Está seguro de cancelar esta reserva?')) {
      this.reservaService.cancelarReserva(reservaId);
      this.slotSeleccionado = null;
      alert('Reserva cancelada correctamente');
    }
  }

  bloquearHora(fecha: string, hora: string): void {
    if (this.motivoBloqueo.trim() || confirm('¿Desea bloquear esta hora sin motivo?')) {
      try {
        this.reservaService.bloquearHora(this.barberoId, fecha, hora, this.motivoBloqueo);
        this.mostrarModalBloquear = false;
        this.motivoBloqueo = '';
        this.slotSeleccionado = null;
        alert('Hora bloqueada correctamente');
      } catch (error: any) {
        alert(error.message || 'Error al bloquear la hora');
      }
    }
  }

  liberarHora(fecha: string, hora: string): void {
    // Verificar si la hora ya pasó
    const ahora = new Date();
    const [year, month, day] = fecha.split('-').map(Number);
    const [hour, minute] = hora.split(':').map(Number);
    const fechaHoraReserva = new Date(year, month - 1, day, hour, minute);
    
    if (fechaHoraReserva < ahora) {
      alert('No se puede liberar una hora que ya pasó');
      return;
    }
    
    if (confirm('¿Desea liberar esta hora bloqueada?')) {
      this.reservaService.liberarHoraPorFechaHora(fecha, hora, this.barberoId);
      this.slotSeleccionado = null;
      alert('Hora liberada correctamente');
    }
  }

  abrirModalBloquear(slot: SlotInfo): void {
    this.slotSeleccionado = slot;
    this.mostrarModalBloquear = true;
    this.motivoBloqueo = '';
  }

  cerrarModalBloquear(): void {
    this.mostrarModalBloquear = false;
    this.motivoBloqueo = '';
    this.slotSeleccionado = null;
  }

  semanaAnterior(): void {
    this.semanaInicio = new Date(this.semanaInicio);
    this.semanaInicio.setDate(this.semanaInicio.getDate() - 7);
    this.generarSemana();
  }

  semanaSiguiente(): void {
    this.semanaInicio = new Date(this.semanaInicio);
    this.semanaInicio.setDate(this.semanaInicio.getDate() + 7);
    this.generarSemana();
  }

  puedeNavegarAtras(): boolean {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const lunesSemana = new Date(this.semanaInicio);
    return lunesSemana > hoy;
  }

  obtenerRangoSemana(): string {
    if (this.semanaActual.length === 0) {
      return '';
    }
    const inicio = this.semanaActual[0];
    const fin = this.semanaActual[6];
    if (!inicio || !fin) {
      return '';
    }
    return `${inicio.mes} ${inicio.diaNumero} - ${fin.mes} ${fin.diaNumero}, ${inicio.fecha.getFullYear()}`;
  }

  cambiarVista(): void {
    this.modoVista = this.modoVista === 'calendario' ? 'lista' : 'calendario';
  }

  cambiarEstado(reservaId: number, nuevoEstado: Reserva['estado']): void {
    this.reservaService.actualizarEstadoReserva(reservaId, nuevoEstado);
  }

  getEstadoClass(estado: string): string {
    const estados: { [key: string]: string } = {
      'pendiente': 'estado-pendiente',
      'confirmada': 'estado-confirmada',
      'completada': 'estado-completada',
      'cancelada': 'estado-cancelada'
    };
    return estados[estado] || '';
  }

  obtenerEnlaceGoogleCalendar(reserva: Reserva): string | null {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const eventos = JSON.parse(localStorage.getItem('googleCalendarEventos') || '[]');
        const evento = eventos.find((e: any) => 
          e.barbero.email === reserva.barbero && 
          e.fecha === reserva.fecha && 
          e.hora === reserva.hora
        );
        return evento ? evento.barbero.enlace : null;
      }
    } catch (error) {
      console.warn('Error al obtener enlace de Google Calendar:', error);
    }
    return null;
  }

  abrirGoogleCalendar(reserva: Reserva): void {
    const enlace = this.obtenerEnlaceGoogleCalendar(reserva);
    if (enlace) {
      this.googleCalendarService.abrirEnlaceCalendario(enlace);
    } else {
      // Generar enlace si no existe
      const evento = this.googleCalendarService.crearEventoParaBarbero(
        reserva.servicio,
        reserva.cliente,
        reserva.fecha,
        reserva.hora,
        30, // Duración por defecto
        reserva.barbero
      );
      this.googleCalendarService.abrirEnlaceCalendario(evento.enlace);
    }
  }
}
