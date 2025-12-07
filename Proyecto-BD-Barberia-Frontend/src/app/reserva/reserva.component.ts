import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormArray } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { ProductoService } from '../services/producto.service';
import { ReservaService } from '../services/reserva.service';
import { BarberoService } from '../services/barbero.service';
import { ServicioService } from '../services/servicio.service';
import { PromocionService } from '../services/promocion.service';
import { GoogleCalendarService } from '../services/google-calendar.service';
import { User, UserRole } from '../models/user.model';
import { Producto } from '../models/producto.model';
import { Barbero } from '../models/barbero.model';
import { Servicio } from '../models/servicio.model';
import { Promocion } from '../models/promocion.model';
import { Reserva } from '../models/reserva.model';

interface DiaSemana {
  fecha: Date;
  diaNombre: string;
  diaNumero: number;
  mes: string;
  fechaISO: string;
}

interface SlotHora {
  hora: string;
  disponible: boolean;
  fechaCompleta: string; // fecha + hora en formato ISO
}

@Component({
  selector: 'app-reserva',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './reserva.component.html',
  styleUrl: './reserva.component.css'
})
export class ReservaComponent implements OnInit {
  reservaForm!: FormGroup;
  barberos: Barbero[] = [];
  servicios: Servicio[] = [];
  productos: Producto[] = [];
  productosSeleccionados: Map<number, boolean> = new Map();
  servicioSeleccionado: string = '';
  promocionAplicable: Promocion | null = null;
  promocionPreseleccionada: boolean = false; // Indica si la promoción fue preseleccionada desde servicios
  reservasBarbero: Reserva[] = []; // Cache de reservas del barbero seleccionado
  promocionesActivas: Promocion[] = []; // Cache de promociones activas

  // Calendario semanal
  semanaActual: DiaSemana[] = [];
  horarios: string[] = [];
  disponibilidad: Map<string, boolean> = new Map(); // clave: "YYYY-MM-DD HH:mm"
  fechaSeleccionada: string = '';
  horaSeleccionada: string = '';
  semanaInicio: Date = new Date();

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private authService: AuthService,
    private productoService: ProductoService,
    private reservaService: ReservaService,
    private barberoService: BarberoService,
    private servicioService: ServicioService,
    private promocionService: PromocionService,
    private googleCalendarService: GoogleCalendarService
  ) {
    this.inicializarFormulario();
    this.generarHorarios();
    this.inicializarSemana();
  }

  ngOnInit(): void {
    // Cargar lista de barberos
    this.cargarBarberos();

    // Cargar servicios
    this.cargarServicios();

    // Cargar productos
    this.cargarProductos();

    // Cargar promociones activas
    this.promocionService.obtenerPromocionesActivas().subscribe(promociones => {
      this.promocionesActivas = promociones;
    });

    // Obtener parámetros de ruta después de cargar los datos
    this.route.queryParams.subscribe(params => {
      if (params['servicio']) {
        this.servicioSeleccionado = params['servicio'];
        this.reservaForm.patchValue({ servicio: params['servicio'] });
      }

      // Si hay una promoción, cargarla y preseleccionar servicio y producto
      if (params['promocionId']) {
        const promocionId = parseInt(params['promocionId'], 10);
        this.promocionPreseleccionada = true;
        this.cargarPromocionYPreseleccionar(promocionId);
      }
    });

    // Cargar disponibilidad
    this.cargarDisponibilidad();

    // Suscribirse a cambios en servicio y productos para verificar promociones
    this.reservaForm.get('servicio')?.valueChanges.subscribe(() => {
      this.verificarPromocion();
    });

    this.reservaForm.get('productos')?.valueChanges.subscribe(() => {
      this.verificarPromocion();
    });
  }

  cargarPromocionYPreseleccionar(promocionId: number): void {
    // Esperar a que los servicios y productos estén cargados
    setTimeout(() => {
      this.promocionService.obtenerPromocionPorId(promocionId).subscribe(promocion => {
        if (!promocion) {
          console.warn('Promoción no encontrada');
          return;
        }

        // Preseleccionar el servicio
        const servicio = this.servicios.find(s => s.id === promocion.servicioId);
        if (servicio) {
          this.servicioSeleccionado = servicio.nombre;
          this.reservaForm.patchValue({ servicio: servicio.nombre });
        }

        // Si la promoción incluye un producto, agregarlo automáticamente
        if (promocion.productoId) {
          const producto = this.productos.find(p => p.id === promocion.productoId && p.activo);
          if (producto) {
            // Verificar si el producto ya está en el FormArray
            const productosArray = this.reservaForm.get('productos') as FormArray;
            const productoYaAgregado = productosArray.controls.some(
              control => control.get('id')?.value === producto.id
            );

            if (!productoYaAgregado) {
              // Agregar el producto al FormArray (usando la misma estructura que toggleProducto)
              productosArray.push(this.fb.group({
                id: [producto.id],
                nombre: [producto.nombre],
                precio: [producto.precio]
              }));

              // Marcar el producto como seleccionado en el Map
              this.productosSeleccionados.set(producto.id, true);
            }
          }
        }

        // Establecer la promoción aplicable
        this.promocionAplicable = promocion;

        // Verificar promoción después de un pequeño delay para asegurar que todo esté cargado
        setTimeout(() => {
          this.verificarPromocion();
        }, 100);
      });
    }, 200);
  }

  inicializarFormulario(): void {
    this.reservaForm = this.fb.group({
      servicio: ['', Validators.required],
      barbero: ['', Validators.required],
      fecha: ['', Validators.required],
      hora: ['', Validators.required],
      productos: this.fb.array([]),
      notas: ['']
    });
  }

  cargarBarberos(): void {
    // Obtener barberos activos del servicio
    this.barberoService.obtenerBarberos().subscribe(barberos => {
      this.barberos = barberos.filter(b => b.activo);
    });
  }

  cargarServicios(): void {
    // Obtener servicios activos del servicio
    this.servicioService.obtenerServicios().subscribe(servicios => {
      this.servicios = servicios.filter(s => s.activo);
    });
  }

  cargarProductos(): void {
    this.productoService.obtenerProductos().subscribe(productos => {
      this.productos = productos.filter(p => p.activo && p.stock > 0);
      this.productos.forEach(producto => {
        if (!this.productosSeleccionados.has(producto.id)) {
          this.productosSeleccionados.set(producto.id, false);
        }
      });
    });
  }

  toggleProducto(productoId: number): void {
    const actual = this.productosSeleccionados.get(productoId) || false;
    this.productosSeleccionados.set(productoId, !actual);

    const productosArray = this.reservaForm.get('productos') as FormArray;
    if (!actual) {
      // Agregar producto
      const producto = this.productos.find(p => p.id === productoId);
      if (producto) {
        productosArray.push(this.fb.group({
          id: [producto.id],
          nombre: [producto.nombre],
          precio: [producto.precio]
        }));
      }
    } else {
      // Remover producto
      const index = productosArray.controls.findIndex(control => control.get('id')?.value === productoId);
      if (index !== -1) {
        productosArray.removeAt(index);
      }
    }
  }

  estaProductoSeleccionado(productoId: number): boolean {
    return this.productosSeleccionados.get(productoId) || false;
  }

  calcularTotalProductos(): number {
    const productosArray = this.reservaForm.get('productos') as FormArray;
    return productosArray.controls.reduce((total, control) => {
      return total + (control.get('precio')?.value || 0);
    }, 0);
  }

  obtenerPrecioServicio(): number {
    const nombreServicio = this.reservaForm.get('servicio')?.value;
    if (!nombreServicio) {
      return 0;
    }
    const servicio = this.servicios.find(s => s.nombre === nombreServicio);
    return servicio?.precio || 0;
  }

  verificarPromocion(): void {
    this.promocionAplicable = null;

    const nombreServicio = this.reservaForm.get('servicio')?.value;
    if (!nombreServicio) {
      return;
    }

    const servicio = this.servicios.find(s => s.nombre === nombreServicio);
    if (!servicio) {
      return;
    }

    const ahora = new Date();

    // Verificar si hay promoción solo para el servicio
    let promocion = this.promocionesActivas.find(p =>
      p.servicioId === servicio.id &&
      !p.productoId &&
      new Date(p.fechaInicio) <= ahora &&
      new Date(p.fechaFin) >= ahora
    );

    // Si hay productos seleccionados, verificar si hay promoción para servicio + producto
    const productosArray = this.reservaForm.get('productos') as FormArray;
    if (productosArray.length > 0) {
      // Buscar promoción que coincida con algún producto seleccionado
      productosArray.controls.forEach(control => {
        const productoId = control.get('id')?.value; // Usar 'id' en lugar de 'productoId'
        if (productoId) {
          const promocionCombo = this.promocionesActivas.find(p =>
            p.servicioId === servicio.id &&
            p.productoId === productoId &&
            new Date(p.fechaInicio) <= ahora &&
            new Date(p.fechaFin) >= ahora
          );

          if (promocionCombo) {
            promocion = promocionCombo;
          }
        }
      });
    }

    this.promocionAplicable = promocion || null;
  }

  calcularDescuento(): number {
    if (!this.promocionAplicable) {
      return 0;
    }

    const precioServicio = this.obtenerPrecioServicio();
    let totalSinDescuento = precioServicio;

    // Si la promoción requiere un producto específico, verificar si está seleccionado
    if (this.promocionAplicable.productoId) {
      const productosArray = this.reservaForm.get('productos') as FormArray;
      const productoSeleccionado = productosArray.controls.find(
        control => control.get('id')?.value === this.promocionAplicable!.productoId
      );

      if (!productoSeleccionado) {
        // Si la promoción requiere un producto específico pero no está seleccionado, no aplicar descuento
        return 0;
      }

      // Si el producto está seleccionado, aplicar descuento al total (servicio + producto)
      const precioProducto = productoSeleccionado.get('precio')?.value || 0;
      totalSinDescuento = precioServicio + precioProducto;
    } else {
      // Si la promoción es solo para el servicio, aplicar descuento solo al servicio
      totalSinDescuento = precioServicio;
    }

    return totalSinDescuento * (this.promocionAplicable.porcentajeDescuento / 100);
  }

  calcularTotal(): number {
    const precioServicio = this.obtenerPrecioServicio();
    const totalProductos = this.calcularTotalProductos();
    const totalSinDescuento = precioServicio + totalProductos;
    const descuento = this.calcularDescuento();
    return totalSinDescuento - descuento;
  }

  generarHorarios(): void {
    // Generar horarios de 9:00 AM a 8:00 PM cada hora
    const horas: string[] = [];
    for (let hora = 9; hora <= 20; hora++) {
      horas.push(`${hora.toString().padStart(2, '0')}:00`);
    }
    this.horarios = horas;
  }

  inicializarSemana(): void {
    // Obtener el lunes de la semana actual
    const hoy = new Date();
    const dia = hoy.getDay();
    const diff = hoy.getDate() - dia + (dia === 0 ? -6 : 1); // Ajustar para que lunes sea 1
    this.semanaInicio = new Date(hoy.setDate(diff));
    this.semanaInicio.setHours(0, 0, 0, 0);
    this.generarSemana();
  }

  generarSemana(): void {
    const dias: DiaSemana[] = [];
    const nombresDias = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    const nombresMeses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

    // Generar 7 días empezando desde el lunes
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
    this.cargarDisponibilidad();
  }

  cargarDisponibilidad(): void {
    this.disponibilidad.clear();

    const barberoSeleccionado = this.reservaForm.get('barbero')?.value;
    if (!barberoSeleccionado) {
      // Si no hay barbero seleccionado, marcar todo como no disponible
      this.semanaActual.forEach(dia => {
        this.horarios.forEach(hora => {
          const clave = `${dia.fechaISO} ${hora}`;
          this.disponibilidad.set(clave, false);
        });
      });
      return;
    }

    // Obtener el ID del barbero seleccionado
    const barbero = this.barberos.find(b => b.nombre === barberoSeleccionado);
    if (!barbero) {
      return;
    }

    // Cargar reservas del barbero desde el backend
    this.reservaService.obtenerReservasPorBarbero(barbero.id).subscribe({
      next: (reservas) => {
        console.log('DEBUG: Reservas cargadas para barbero', barbero.nombre, ':', reservas);
        this.reservasBarbero = reservas;
        this.calcularDisponibilidadSlots(barbero.id);
      },
      error: (err) => {
        console.error('Error al cargar reservas:', err);
        // En caso de error, asumimos sin reservas (o podríamos bloquear todo)
        this.reservasBarbero = [];
        this.calcularDisponibilidadSlots(barbero.id);
      }
    });
  }

  calcularDisponibilidadSlots(barberoId: number): void {
    const ahora = new Date();
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    this.semanaActual.forEach(dia => {
      const esHoy = dia.fechaISO === ahora.toISOString().split('T')[0];

      this.horarios.forEach(hora => {
        const clave = `${dia.fechaISO} ${hora}`;


        // Si es hoy, verificar si la hora ya pasó
        if (esHoy) {
          const [hour, minute] = hora.split(':').map(Number);
          const horaReserva = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate(), hour, minute);

          if (horaReserva < ahora) {
            // Hora ya pasó, no disponible
            this.disponibilidad.set(clave, false);
            return;
          }
        }

        // No permitir fechas pasadas
        if (dia.fecha < hoy) {
          this.disponibilidad.set(clave, false);
          return;
        }

        // Verificar disponibilidad contra las reservas cargadas
        const ocupado = this.reservasBarbero.some(r => {
          const match = r.fecha === dia.fechaISO &&
            r.hora.substring(0, 5) === hora &&
            r.estado !== 'cancelada' &&
            r.estado !== 'completada';

          if (match) {
            console.log('DEBUG: Slot ocupado encontrado:', {
              fecha: dia.fechaISO,
              hora: hora,
              reserva: r
            });
          }

          return match;
        });

        // También verificar horas bloqueadas (si el servicio las maneja)
        // Por ahora asumimos que el servicio maneja horas bloqueadas localmente o no las maneja
        // Si queremos usar esHoraBloqueada del servicio, debemos asegurarnos que funcione
        const bloqueado = this.reservaService.esHoraBloqueada(dia.fechaISO, hora, barberoId);

        this.disponibilidad.set(clave, !ocupado && !bloqueado);
      });
    });
  }

  esDisponible(fechaISO: string, hora: string): boolean {
    const clave = `${fechaISO} ${hora}`;
    return this.disponibilidad.get(clave) ?? false;
  }

  seleccionarSlot(fechaISO: string, hora: string): void {
    if (!this.esDisponible(fechaISO, hora)) {
      return;
    }

    // Verificar que servicio y barbero estén seleccionados
    if (!this.reservaForm.get('servicio')?.value || !this.reservaForm.get('barbero')?.value) {
      alert('Por favor seleccione primero el servicio y el barbero');
      return;
    }

    this.fechaSeleccionada = fechaISO;
    this.horaSeleccionada = hora;

    // Actualizar el formulario
    this.reservaForm.patchValue({
      fecha: fechaISO,
      hora: hora
    });
  }

  onBarberoChange(): void {
    // Recargar disponibilidad cuando cambia el barbero
    this.cargarDisponibilidad();
  }

  estaSeleccionado(fechaISO: string, hora: string): boolean {
    return this.fechaSeleccionada === fechaISO && this.horaSeleccionada === hora;
  }

  semanaAnterior(): void {
    this.semanaInicio = new Date(this.semanaInicio);
    this.semanaInicio.setDate(this.semanaInicio.getDate() - 7);
    this.generarSemana();
    this.limpiarSeleccion();
  }

  semanaSiguiente(): void {
    this.semanaInicio = new Date(this.semanaInicio);
    this.semanaInicio.setDate(this.semanaInicio.getDate() + 7);
    this.generarSemana();
    this.limpiarSeleccion();
  }

  limpiarSeleccion(): void {
    this.fechaSeleccionada = '';
    this.horaSeleccionada = '';
    this.reservaForm.patchValue({
      fecha: '',
      hora: ''
    });
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

  formatearFechaSeleccionada(): string {
    if (!this.fechaSeleccionada) {
      return '';
    }
    const fecha = new Date(this.fechaSeleccionada);
    return fecha.toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  onSubmit(): void {
    if (this.reservaForm.valid) {
      const datosReserva = this.reservaForm.value;
      const usuario = this.authService.getCurrentUser();

      // Bloquear reservas para invitados
      if (usuario && usuario.rol === 'invitado') {
        alert('Para hacer una reserva debes registrarte o iniciar sesión.\n\nLos invitados pueden ver la disponibilidad pero no pueden reservar.');
        this.router.navigate(['/login']);
        return;
      }

      const barbero = this.barberos.find(b => b.nombre === datosReserva.barbero);

      if (!usuario || !barbero) {
        console.error('DEBUG: Error - Usuario o Barbero no encontrado', { usuario, barbero, nombreBarbero: datosReserva.barbero });
        alert('Error: No se pudo obtener la información del usuario o barbero');
        return;
      }

      console.log('DEBUG: Barbero seleccionado:', barbero);

      // Obtener información del servicio para el precio y duración
      const servicioSeleccionado = this.servicios.find(s => s.nombre === datosReserva.servicio);
      const precioServicio = servicioSeleccionado?.precio || 0;
      const duracionServicio = servicioSeleccionado?.duracion || 30;
      const totalProductos = this.calcularTotalProductos();
      const total = precioServicio + totalProductos;

      // Crear la reserva usando el servicio
      const nuevaReserva = {
        clienteId: usuario.id,
        barberoId: barbero.id,
        servicioId: servicioSeleccionado?.id,
        fecha: datosReserva.fecha,
        hora: datosReserva.hora,
        notas: datosReserva.notas || '',
        productos: datosReserva.productos ? datosReserva.productos.map((p: any) => p.id) : []
      };

      this.reservaService.crearReserva(nuevaReserva).subscribe({
        next: (reserva) => {
          // Recargar productos para actualizar el stock en la UI
          this.cargarProductos();

          // Crear eventos en Google Calendar
          this.crearEventosGoogleCalendar(
            datosReserva.servicio,
            usuario.nombre,
            usuario.email,
            barbero.nombre,
            barbero.googleCalendarEmail || barbero.email,
            datosReserva.fecha,
            datosReserva.hora,
            duracionServicio
          );

          // Mostrar confirmación
          const fechaFormateada = new Date(datosReserva.fecha).toLocaleDateString('es-ES', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          });

          let mensaje = `Reserva confirmada!\n\nServicio: ${datosReserva.servicio}`;
          if (precioServicio > 0) {
            mensaje += ` - $${precioServicio.toLocaleString()}`;
          }
          mensaje += `\nBarbero: ${datosReserva.barbero}\nFecha: ${fechaFormateada}\nHora: ${datosReserva.hora}`;

          if (datosReserva.productos && datosReserva.productos.length > 0) {
            mensaje += `\n\nProductos seleccionados:`;
            datosReserva.productos.forEach((p: any) => {
              mensaje += `\n- ${p.nombre}: $${p.precio.toLocaleString()}`;
            });
            mensaje += `\n\nSubtotal productos: $${totalProductos.toLocaleString()}`;
          }

          mensaje += `\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;
          mensaje += `\nTOTAL: $${total.toLocaleString()}`;
          mensaje += `\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;

          alert(mensaje);

          // Mostrar opción para agregar a Google Calendar
          this.mostrarOpcionGoogleCalendar(
            datosReserva.servicio,
            usuario.nombre,
            usuario.email,
            barbero.nombre,
            barbero.googleCalendarEmail || barbero.email,
            datosReserva.fecha,
            datosReserva.hora,
            duracionServicio
          );

          // Redirigir a servicios o home
          this.router.navigate(['/servicios']);
        },
        error: (error) => {
          console.error('Error al crear reserva:', error);
          alert('Hubo un error al procesar su reserva. Por favor intente nuevamente.');
        }
      });
    } else {
      // Marcar todos los campos como tocados para mostrar errores
      Object.keys(this.reservaForm.controls).forEach(key => {
        this.reservaForm.get(key)?.markAsTouched();
      });
    }
  }

  cancelar(): void {
    this.router.navigate(['/servicios']);
  }

  get servicio() {
    return this.reservaForm.get('servicio');
  }

  get barbero() {
    return this.reservaForm.get('barbero');
  }

  get fecha() {
    return this.reservaForm.get('fecha');
  }

  get hora() {
    return this.reservaForm.get('hora');
  }

  crearEventosGoogleCalendar(
    servicio: string,
    nombreCliente: string,
    emailCliente: string,
    nombreBarbero: string,
    emailBarbero: string,
    fecha: string,
    hora: string,
    duracionMinutos: number
  ): void {
    // Crear evento para el cliente
    const eventoCliente = this.googleCalendarService.crearEventoParaCliente(
      servicio,
      nombreBarbero,
      fecha,
      hora,
      duracionMinutos,
      emailCliente
    );

    // Crear evento para el barbero
    const eventoBarbero = this.googleCalendarService.crearEventoParaBarbero(
      servicio,
      nombreCliente,
      fecha,
      hora,
      duracionMinutos,
      emailBarbero
    );

    // Guardar enlaces en localStorage para acceso posterior
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const eventos = JSON.parse(localStorage.getItem('googleCalendarEventos') || '[]');
        eventos.push({
          servicio: servicio,
          cliente: { enlace: eventoCliente.enlace, email: emailCliente, nombre: nombreCliente },
          barbero: { enlace: eventoBarbero.enlace, email: emailBarbero, nombre: nombreBarbero },
          fecha: fecha,
          hora: hora,
          fechaCreacion: new Date().toISOString()
        });
        localStorage.setItem('googleCalendarEventos', JSON.stringify(eventos));
      }
    } catch (error) {
      console.warn('Error al guardar eventos de Google Calendar:', error);
    }
  }

  mostrarOpcionGoogleCalendar(
    servicio: string,
    nombreCliente: string,
    emailCliente: string,
    nombreBarbero: string,
    emailBarbero: string,
    fecha: string,
    hora: string,
    duracionMinutos: number
  ): void {
    const eventoCliente = this.googleCalendarService.crearEventoParaCliente(
      servicio,
      nombreBarbero,
      fecha,
      hora,
      duracionMinutos,
      emailCliente
    );

    const eventoBarbero = this.googleCalendarService.crearEventoParaBarbero(
      servicio,
      nombreCliente,
      fecha,
      hora,
      duracionMinutos,
      emailBarbero
    );

    const mensaje = `📅 ¿Deseas agregar esta cita a tu calendario de Google?\n\n` +
      `Se abrirá Google Calendar donde podrás confirmar y agregar la cita a tu calendario.\n\n` +
      `La cita también se ha preparado para el barbero ${nombreBarbero}.\n\n` +
      `¿Abrir Google Calendar ahora?`;

    if (confirm(mensaje)) {
      this.googleCalendarService.abrirEnlaceCalendario(eventoCliente.enlace);
    }
  }
}
