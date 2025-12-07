import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../services/auth.service';
import { ProductoService } from '../services/producto.service';
import { ServicioService } from '../services/servicio.service';
import { BarberoService } from '../services/barbero.service';
import { PromocionService } from '../services/promocion.service';
import { Producto } from '../models/producto.model';
import { Servicio } from '../models/servicio.model';
import { Barbero } from '../models/barbero.model';
import { Promocion } from '../models/promocion.model';
import { User, UserRole } from '../models/user.model';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin.component.html',
  styleUrl: './admin.component.css'
})
export class AdminComponent implements OnInit {
  activeTab: 'servicios' | 'barberos' | 'productos' | 'promociones' = 'servicios';

  servicios: Servicio[] = [];
  barberos: Barbero[] = [];
  promociones: Promocion[] = [];
  usuariosDisponibles: User[] = [];

  nuevoServicio: Omit<Servicio, 'id'> = {
    nombre: '',
    descripcion: '',
    precio: 0,
    duracion: 30, // Duración fija para todos los servicios
    activo: true
  };

  nuevoBarbero: Omit<Barbero, 'id'> = {
    nombre: '',
    email: '',
    telefono: '',
    activo: true,
    googleCalendarEmail: ''
  };

  emailBusquedaBarbero: string = '';
  usuarioEncontrado: User | null = null;
  mensajeBusquedaBarbero: string = '';

  productos: Producto[] = [];
  productoEnEdicion: Producto | null = null;
  nuevoProducto: Omit<Producto, 'id'> = {
    nombre: '',
    descripcion: '',
    precio: 0,
    stock: 0,
    activo: true
  };

  nuevaPromocion: Omit<Promocion, 'id'> = {
    servicioId: 0,
    productoId: null,
    porcentajeDescuento: 0,
    fechaInicio: new Date().toISOString().split('T')[0],
    fechaFin: new Date().toISOString().split('T')[0],
    activa: true
  };

  constructor(
    public authService: AuthService,
    private productoService: ProductoService,
    private servicioService: ServicioService,
    private barberoService: BarberoService,
    private promocionService: PromocionService
  ) { }

  cargarBarberos(): void {
    this.barberoService.obtenerBarberos().subscribe(barberos => {
      this.barberos = barberos;
    });
  }

  ngOnInit(): void {
    this.productoService.cargarProductos(); // Recargar productos al entrar al admin
    this.productoService.obtenerProductos().subscribe(productos => {
      this.productos = productos;
    });

    this.servicioService.obtenerServicios().subscribe(servicios => {
      this.servicios = servicios;
    });

    this.barberoService.obtenerBarberos().subscribe(barberos => {
      this.barberos = barberos;
    });

    this.promocionService.cargarPromociones(); // Cargar inicial
    this.promocionService.promociones$.subscribe(promociones => {
      this.promociones = promociones;
    });

    // Cargar usuarios disponibles (solo clientes)
    this.usuariosDisponibles = this.authService.obtenerUsuariosPorRol(UserRole.USUARIO);
  }

  setActiveTab(tab: 'servicios' | 'barberos' | 'productos' | 'promociones'): void {
    this.activeTab = tab;
  }

  agregarServicio(): void {
    if (this.nuevoServicio.nombre && this.nuevoServicio.descripcion) {
      // Duración fija de 30 minutos para todos los servicios
      this.servicioService.agregarServicio({
        ...this.nuevoServicio,
        duracion: 30
      }).subscribe({
        next: (servicio) => {
          console.log('✅ Servicio agregado:', servicio);
          this.nuevoServicio = {
            nombre: '',
            descripcion: '',
            precio: 0,
            duracion: 30,
            activo: true
          };
          alert('Servicio agregado correctamente');
        },
        error: (error) => {
          console.error('❌ Error al agregar servicio:', error);
          alert('Error al agregar el servicio');
        }
      });
    }
  }

  eliminarServicio(id: number): void {
    if (confirm('¿Está seguro de eliminar este servicio?')) {
      this.servicioService.eliminarServicio(id).subscribe({
        next: () => {
          alert('Servicio eliminado correctamente');
        },
        error: (error) => {
          console.error('Error al eliminar servicio:', error);
          alert('Error al eliminar el servicio');
        }
      });
    }
  }

  toggleServicioActivo(servicio: Servicio): void {
    this.servicioService.actualizarServicio(servicio.id, { activo: !servicio.activo }).subscribe({
      next: () => {
        servicio.activo = !servicio.activo;
        console.log(`Servicio ${servicio.id} actualizado. Nuevo estado: ${servicio.activo}`);
      },
      error: (error) => {
        console.error('Error al actualizar estado del servicio:', error);
        alert('Error al actualizar el estado del servicio');
      }
    });
  }

  buscarUsuarioParaBarbero(): void {
    if (!this.emailBusquedaBarbero) {
      this.mensajeBusquedaBarbero = 'Por favor ingrese un email';
      this.usuarioEncontrado = null;
      return;
    }

    this.mensajeBusquedaBarbero = 'Buscando usuario...';

    this.authService.obtenerUsuarioPorEmail(this.emailBusquedaBarbero).subscribe({
      next: (usuario) => {
        console.log('Usuario recibido en componente:', usuario);
        console.log('🔍 Validación de rol:', {
          rolRecibido: usuario?.rol,
          tipoRol: typeof usuario?.rol,
          UserRoleUSUARIO: UserRole.USUARIO,
          UserRoleBARBERO: UserRole.BARBERO,
          esIgualAUSUARIO: usuario?.rol === UserRole.USUARIO,
          esIgualAUSUARIOString: String(usuario?.rol) === String(UserRole.USUARIO),
          esAdmin: usuario?.esAdmin,
          esBarbero: usuario?.esBarbero
        });

        if (!usuario) {
          this.mensajeBusquedaBarbero = 'No se encontró ningún usuario con ese email. El usuario debe registrarse primero.';
          this.usuarioEncontrado = null;
          return;
        }

        // Normalizar el rol para comparación (por si viene con espacios o mayúsculas)
        const rolNormalizado = String(usuario.rol || '').trim().toLowerCase();

        // Verificar flags directamente (Oracle puede devolver 0/1 como número o string)
        // Convertir a número para comparación segura
        const esAdminNum = Number(usuario.esAdmin) || 0;
        const esBarberoNum = Number(usuario.esBarbero) || 0;
        const esAdminFlag = esAdminNum === 1 || usuario.esAdmin === true;
        const esBarberoFlag = esBarberoNum === 1 || usuario.esBarbero === true;

        // Determinar si es barbero (por rol o por flag)
        const esBarbero = rolNormalizado === 'barbero' ||
          usuario.rol === UserRole.BARBERO ||
          esBarberoFlag;

        // Determinar si es usuario/cliente normal (no admin ni barbero)
        const esUsuario = !esAdminFlag && !esBarberoFlag &&
          (rolNormalizado === 'usuario' ||
            usuario.rol === UserRole.USUARIO ||
            rolNormalizado === '');

        if (esBarbero) {
          this.mensajeBusquedaBarbero = 'Este usuario ya es un barbero.';
          this.usuarioEncontrado = null;
          return;
        }

        if (!esUsuario) {
          console.warn('⚠️ Usuario no es cliente normal. Rol:', rolNormalizado, 'EsAdmin:', usuario.esAdmin, 'EsBarbero:', usuario.esBarbero);
          this.mensajeBusquedaBarbero = 'Solo se pueden convertir usuarios (clientes) en barberos.';
          this.usuarioEncontrado = null;
          return;
        }

        // Verificar si ya existe como barbero
        const barberoExistente = this.barberos.find(b => b.email.toLowerCase() === usuario.email?.toLowerCase());
        if (barberoExistente) {
          this.mensajeBusquedaBarbero = 'Este usuario ya está registrado como barbero.';
          this.usuarioEncontrado = null;
          return;
        }

        // Verificar que el usuario tenga email antes de asignarlo
        if (!usuario.email || String(usuario.email).trim().length === 0) {
          console.error('❌ Usuario encontrado pero sin email:', usuario);
          this.mensajeBusquedaBarbero = 'Error: El usuario encontrado no tiene un email válido.';
          this.usuarioEncontrado = null;
          return;
        }

        this.usuarioEncontrado = usuario;
        console.log('✅ Usuario asignado correctamente:', {
          id: this.usuarioEncontrado.id,
          nombre: this.usuarioEncontrado.nombre,
          email: this.usuarioEncontrado.email,
          rol: this.usuarioEncontrado.rol
        });
        // No necesitamos asignar nombre y email a nuevoBarbero ya que los campos fueron eliminados
        // Se usarán directamente desde usuarioEncontrado al agregar el barbero
        this.mensajeBusquedaBarbero = 'Usuario encontrado. Complete los datos adicionales.';
      },
      error: (error) => {
        console.error('❌ Error al buscar usuario en componente:', error);
        console.error('Detalles del error:', {
          status: error.status,
          statusText: error.statusText,
          message: error.message,
          error: error.error
        });

        if (error.status === 401) {
          this.mensajeBusquedaBarbero = 'Error: No estás autenticado. Por favor, inicia sesión nuevamente.';
        } else if (error.status === 403) {
          this.mensajeBusquedaBarbero = 'Error: No tienes permisos para realizar esta acción.';
        } else {
          this.mensajeBusquedaBarbero = `Error al buscar usuario: ${error.message || 'Error desconocido'}. Revisa la consola para más detalles.`;
        }
        this.usuarioEncontrado = null;
      }
    });
  }

  agregarBarbero(form?: any): void {
    if (!this.usuarioEncontrado) {
      alert('Debe buscar un usuario primero');
      return;
    }

    // Validar formulario si está disponible
    if (form) {
      // Marcar todos los campos como touched para mostrar errores visuales
      Object.keys(form.controls).forEach(key => {
        const control = form.controls[key];
        if (control.invalid) {
          control.markAsTouched();
        }
      });

      if (!form.valid) {
        const camposInvalidos = Object.keys(form.controls)
          .filter(key => form.controls[key].invalid && form.controls[key].touched)
          .map(key => {
            // Mapear nombres técnicos a nombres amigables
            const nombres: { [key: string]: string } = {
              'telefonoBarbero': 'Teléfono'
            };
            return nombres[key] || key;
          });

        if (camposInvalidos.length > 0) {
          alert(`Por favor complete correctamente: ${camposInvalidos.join(', ')}`);
        } else {
          alert('Por favor complete todos los campos requeridos');
        }
        return;
      }
    }

    // Validación adicional manual (por si no hay formulario o como respaldo)
    const telefonoValido = this.nuevoBarbero.telefono &&
      String(this.nuevoBarbero.telefono).trim().length > 0;

    if (!telefonoValido) {
      alert('Por favor ingrese un teléfono válido');
      return;
    }

    // Validar email del usuario encontrado con más detalle
    const emailValido = this.usuarioEncontrado.email &&
      String(this.usuarioEncontrado.email).trim().length > 0;

    if (!emailValido) {
      console.error('❌ Email inválido al agregar barbero:', {
        usuarioEncontrado: this.usuarioEncontrado,
        email: this.usuarioEncontrado?.email,
        tipoEmail: typeof this.usuarioEncontrado?.email
      });
      alert('Error: No se encontró el email del usuario. Por favor busque el usuario nuevamente.');
      return;
    }

    // Preparar datos del barbero usando el usuario encontrado
    const datosBarbero = {
      nombre: this.usuarioEncontrado.nombre || '',
      email: this.usuarioEncontrado.email || '',
      telefono: this.nuevoBarbero.telefono,
      activo: this.nuevoBarbero.activo ?? true,
      googleCalendarEmail: this.nuevoBarbero.googleCalendarEmail || ''
    };

    // Agregar barbero al backend
    this.barberoService.agregarBarbero(datosBarbero).subscribe({
      next: (nuevoBarbero) => {
        // Actualizar lista de barberos
        this.cargarBarberos();

        // Limpiar formulario
        this.nuevoBarbero = {
          nombre: '',
          email: '',
          telefono: '',
          activo: true,
          googleCalendarEmail: ''
        };
        this.emailBusquedaBarbero = '';
        this.usuarioEncontrado = null;
        this.mensajeBusquedaBarbero = '';

        alert('Barbero agregado correctamente. El usuario ahora tiene rol de barbero.');
      },
      error: (error) => {
        console.error('Error al agregar barbero:', error);
        const mensaje = error.error?.message || 'Error al agregar el barbero. Intente nuevamente.';
        alert(mensaje);
      }
    });
  }

  eliminarBarbero(id: number): void {
    if (confirm('¿Está seguro de eliminar este barbero?')) {
      this.barberoService.eliminarBarbero(id).subscribe({
        next: () => {
          this.cargarBarberos();
          alert('Barbero eliminado correctamente');
        },
        error: (error) => {
          console.error('Error al eliminar barbero:', error);
          alert('Error al eliminar el barbero. Intente nuevamente.');
        }
      });
    }
  }

  toggleBarberoActivo(barbero: Barbero): void {
    this.barberoService.actualizarBarbero(barbero.id, { activo: !barbero.activo });
  }

  guardarProducto(): void {
    if (this.nuevoProducto.nombre && this.nuevoProducto.descripcion) {
      if (this.productoEnEdicion) {
        // Editar existente
        this.productoService.actualizarProducto(this.productoEnEdicion.id, this.nuevoProducto).subscribe({
          next: () => {
            this.cancelarEdicionProducto();
            alert('Producto actualizado correctamente');
          },
          error: (error) => {
            console.error('Error al actualizar producto:', error);
            alert('Error al actualizar el producto');
          }
        });
      } else {
        // Crear nuevo
        this.productoService.agregarProducto(this.nuevoProducto).subscribe({
          next: () => {
            this.cancelarEdicionProducto(); // Limpia el formulario
            alert('Producto agregado correctamente');
          },
          error: (error) => {
            console.error('Error al agregar producto:', error);
            alert('Error al agregar el producto');
          }
        });
      }
    }
  }

  iniciarEdicionProducto(producto: Producto): void {
    this.productoEnEdicion = producto;
    this.nuevoProducto = {
      nombre: producto.nombre,
      descripcion: producto.descripcion,
      precio: producto.precio,
      stock: producto.stock,
      activo: producto.activo
    };
  }

  cancelarEdicionProducto(): void {
    this.productoEnEdicion = null;
    this.nuevoProducto = {
      nombre: '',
      descripcion: '',
      precio: 0,
      stock: 0,
      activo: true
    };
  }

  eliminarProducto(id: number): void {
    if (confirm('¿Está seguro de eliminar este producto?')) {
      this.productoService.eliminarProducto(id).subscribe({
        next: () => {
          alert('Producto eliminado correctamente');
        },
        error: (error) => {
          console.error('Error al eliminar producto:', error);
          alert('Error al eliminar el producto');
        }
      });
    }
  }

  toggleProductoActivo(producto: Producto): void {
    this.productoService.actualizarProducto(producto.id, { activo: !producto.activo }).subscribe({
      next: () => {
        // El estado se actualiza en el servicio y se emite el nuevo valor
      },
      error: (error) => {
        console.error('Error al actualizar producto:', error);
        alert('Error al actualizar el producto');
      }
    });
  }

  agregarPromocion(): void {
    if (this.nuevaPromocion.servicioId && this.nuevaPromocion.porcentajeDescuento > 0 &&
      this.nuevaPromocion.porcentajeDescuento <= 100) {
      const fechaInicio = new Date(this.nuevaPromocion.fechaInicio);
      const fechaFin = new Date(this.nuevaPromocion.fechaFin);

      if (fechaFin < fechaInicio) {
        alert('La fecha de fin debe ser posterior a la fecha de inicio');
        return;
      }

      this.promocionService.agregarPromocion({
        ...this.nuevaPromocion,
        fechaInicio: fechaInicio.toISOString(),
        fechaFin: fechaFin.toISOString()
      }).subscribe({
        next: () => {
          this.nuevaPromocion = {
            servicioId: 0,
            productoId: null,
            porcentajeDescuento: 0,
            fechaInicio: new Date().toISOString().split('T')[0],
            fechaFin: new Date().toISOString().split('T')[0],
            activa: true
          };
          alert('Promoción agregada correctamente');
        },
        error: (error) => {
          console.error('Error al agregar promoción:', error);
          alert('Error al agregar la promoción');
        }
      });
    }
  }

  eliminarPromocion(id: number): void {
    if (confirm('¿Está seguro de eliminar esta promoción?')) {
      this.promocionService.eliminarPromocion(id).subscribe({
        next: () => {
          alert('Promoción eliminada correctamente');
        },
        error: (error) => {
          console.error('Error al eliminar promoción:', error);
          alert('Error al eliminar la promoción');
        }
      });
    }
  }

  togglePromocionActiva(promocion: Promocion): void {
    this.promocionService.actualizarPromocion(promocion.id, { activa: !promocion.activa }).subscribe({
      next: () => {
        // El estado se actualiza en el servicio y se emite el nuevo valor
      },
      error: (error) => {
        console.error('Error al actualizar estado de promoción:', error);
        alert('Error al actualizar el estado de la promoción');
      }
    });
  }

  obtenerNombreServicio(servicioId: number): string {
    const servicio = this.servicios.find(s => s.id === servicioId);
    return servicio ? servicio.nombre : 'Servicio no encontrado';
  }

  obtenerNombreProducto(productoId: number | null): string {
    if (!productoId) return 'Solo servicio';
    const producto = this.productos.find(p => p.id === productoId);
    return producto ? producto.nombre : 'Producto no encontrado';
  }
}
