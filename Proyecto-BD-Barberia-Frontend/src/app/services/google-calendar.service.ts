import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

export interface GoogleCalendarEvent {
  summary: string;
  description: string;
  start: {
    dateTime: string;
    timeZone: string;
  };
  end: {
    dateTime: string;
    timeZone: string;
  };
  attendees?: Array<{
    email: string;
  }>;
}

@Injectable({
  providedIn: 'root'
})
export class GoogleCalendarService {
  private readonly CALENDAR_API_BASE = 'https://www.googleapis.com/calendar/v3';
  private readonly CLIENT_ID = 'YOUR_GOOGLE_CLIENT_ID'; // Reemplazar con tu Client ID
  private readonly API_KEY = 'YOUR_GOOGLE_API_KEY'; // Reemplazar con tu API Key

  constructor() {}

  /**
   * Genera un enlace para agregar evento a Google Calendar (método simple)
   */
  generarEnlaceCalendario(
    titulo: string,
    descripcion: string,
    fecha: string, // YYYY-MM-DD
    hora: string, // HH:mm
    duracionMinutos: number = 30,
    ubicacion?: string
  ): string {
    // Convertir fecha y hora a formato ISO
    // Asegurar que la fecha esté en formato correcto
    const [year, month, day] = fecha.split('-');
    const [hour, minute] = hora.split(':');
    
    const fechaHora = new Date(
      parseInt(year),
      parseInt(month) - 1,
      parseInt(day),
      parseInt(hour),
      parseInt(minute)
    );
    
    const fechaFin = new Date(fechaHora.getTime() + duracionMinutos * 60000);

    // Formato requerido por Google Calendar: YYYYMMDDTHHmmssZ
    const fechaInicioISO = fechaHora.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    const fechaFinISO = fechaFin.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

    const params = new URLSearchParams({
      action: 'TEMPLATE',
      text: titulo,
      details: descripcion,
      dates: `${fechaInicioISO}/${fechaFinISO}`,
      ...(ubicacion && { location: ubicacion })
    });

    return `https://calendar.google.com/calendar/render?${params.toString()}`;
  }

  /**
   * Crea un evento en Google Calendar usando la API
   * Requiere autenticación OAuth2
   */
  crearEventoEnCalendario(
    accessToken: string,
    evento: GoogleCalendarEvent,
    calendarId: string = 'primary'
  ): Observable<any> {
    return new Observable(observer => {
      const url = `${this.CALENDAR_API_BASE}/calendars/${calendarId}/events`;

      fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(evento)
      })
      .then(response => response.json())
      .then(data => {
        if (data.error) {
          observer.error(data.error);
        } else {
          observer.next(data);
        }
        observer.complete();
      })
      .catch(error => {
        observer.error(error);
        observer.complete();
      });
    });
  }

  /**
   * Inicia el flujo de OAuth2 para Google Calendar
   */
  iniciarOAuth2(): void {
    const redirectUri = encodeURIComponent(window.location.origin + '/oauth2callback');
    const scope = encodeURIComponent('https://www.googleapis.com/auth/calendar');
    const responseType = 'code';
    
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${this.CLIENT_ID}&` +
      `redirect_uri=${redirectUri}&` +
      `response_type=${responseType}&` +
      `scope=${scope}&` +
      `access_type=offline&` +
      `prompt=consent`;

    window.location.href = authUrl;
  }

  /**
   * Crea un evento para el cliente (método simple con enlace)
   */
  crearEventoParaCliente(
    servicio: string,
    barbero: string,
    fecha: string,
    hora: string,
    duracionMinutos: number,
    emailCliente: string
  ): { enlace: string; mensaje: string } {
    const descripcion = `Servicio: ${servicio}\nBarbero: ${barbero}\nCliente: ${emailCliente}`;
    const enlace = this.generarEnlaceCalendario(
      `Cita Barbería - ${servicio}`,
      descripcion,
      fecha,
      hora,
      duracionMinutos
    );

    return {
      enlace,
      mensaje: 'Se ha generado un enlace para agregar la cita a tu calendario de Google'
    };
  }

  /**
   * Crea un evento para el barbero (método simple con enlace)
   */
  crearEventoParaBarbero(
    servicio: string,
    cliente: string,
    fecha: string,
    hora: string,
    duracionMinutos: number,
    emailBarbero: string
  ): { enlace: string; mensaje: string } {
    const descripcion = `Servicio: ${servicio}\nCliente: ${cliente}`;
    const enlace = this.generarEnlaceCalendario(
      `Cita con ${cliente} - ${servicio}`,
      descripcion,
      fecha,
      hora,
      duracionMinutos
    );

    return {
      enlace,
      mensaje: 'Se ha generado un enlace para agregar la cita al calendario del barbero'
    };
  }

  /**
   * Abre el enlace de Google Calendar en una nueva ventana
   */
  abrirEnlaceCalendario(enlace: string): void {
    window.open(enlace, '_blank');
  }
}

