import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap, map, catchError, of } from 'rxjs';
import { User, UserRole, LoginCredentials } from '../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  public apiUrl = 'http://127.0.0.1:3000';
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  // Mantener usuarios simulados como fallback (opcional)
  private users: User[] = [
    {
      id: 1,
      email: 'adminbarberia.com',
      password: 'admin123',
      nombre: 'Administrador',
      rol: UserRole.ADMIN
    },
    {
      id: 2,
      email: 'barberobarberia.com',
      password: 'barbero123',
      nombre: 'Juan Barbero',
      rol: UserRole.BARBERO
    },
    {
      id: 3,
      email: 'usuariobarberia.com',
      password: 'usuario123',
      nombre: 'Pedro Usuario',
      rol: UserRole.USUARIO
    }
  ];

  constructor(private http: HttpClient) {
    // Cargar usuario desde token si existe (solo en el navegador)
    if (typeof window !== 'undefined' && window.localStorage) {
      const token = localStorage.getItem('access_token');
      const userStr = localStorage.getItem('currentUser');

      // Si hay usuario pero NO hay token, limpiar todo (sesión inválida)
      if (userStr && !token) {
        console.warn('⚠️ Usuario encontrado pero sin token. Limpiando sesión inválida.');
        localStorage.removeItem('currentUser');
        this.currentUserSubject.next(null);
      }
      // Si hay token y usuario, cargar ambos
      else if (token && userStr) {
        try {
          const user = JSON.parse(userStr);
          this.currentUserSubject.next(user);
          console.log('✅ Sesión restaurada:', { email: user.email, rol: user.rol });
        } catch (error) {
          console.error('❌ Error al parsear usuario guardado:', error);
          localStorage.removeItem('currentUser');
          localStorage.removeItem('access_token');
        }
      }
    }
  }

  login(credentials: LoginCredentials): Observable<boolean> {
    return new Observable(observer => {
      this.http.post<{ access_token: string; user: any }>(`${this.apiUrl}/auth/login`, credentials)
        .pipe(
          tap(response => {
            console.log('✅ Login exitoso, respuesta recibida:', {
              hasToken: !!response.access_token,
              tokenLength: response.access_token?.length,
              user: response.user
            });

            // Guardar token y usuario (solo en el navegador)
            if (typeof window !== 'undefined' && window.localStorage) {
              if (response.access_token) {
                localStorage.setItem('access_token', response.access_token);
                console.log('✅ Token guardado en localStorage');
              } else {
                console.error('❌ No se recibió access_token en la respuesta');
              }

              if (response.user) {
                localStorage.setItem('currentUser', JSON.stringify(response.user));
                console.log('✅ Usuario guardado en localStorage');
              } else {
                console.error('❌ No se recibió user en la respuesta');
              }
            }

            this.currentUserSubject.next(response.user as User);
            observer.next(true);
            observer.complete();
          })
        )
        .subscribe({
          error: (error) => {
            console.error('❌ Error en login con backend:', error);
            console.error('⚠️ NO se usará fallback de usuarios simulados porque no tienen token JWT');

            // NO usar fallback porque no tiene token JWT válido
            // El usuario debe autenticarse correctamente con el backend
            observer.next(false);
            observer.complete();
          }
        });
    });
  }

  loginAsGuest(): void {
    const guestUser: User = {
      id: 0,
      email: 'invitado@barberia.com',
      password: '',
      nombre: 'Invitado',
      rol: UserRole.INVITADO
    };
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem('currentUser', JSON.stringify(guestUser));
      }
      this.currentUserSubject.next(guestUser);
    } catch (error) {
      console.error('Error al guardar invitado:', error);
    }
  }

  logout(): void {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.removeItem('currentUser');
        localStorage.removeItem('access_token');
      }
      this.currentUserSubject.next(null);
    } catch (error) {
      console.error('Error en logout:', error);
      this.currentUserSubject.next(null);
    }
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  isAuthenticated(): boolean {
    const user = this.currentUserSubject.value;
    const token = typeof window !== 'undefined' && window.localStorage
      ? localStorage.getItem('access_token')
      : null;

    // Verificar que tanto el usuario como el token existan
    const isAuth = user !== null && token !== null;

    if (!isAuth && user) {
      // console.warn('⚠️ Usuario existe pero no hay token. Puede necesitar re-autenticarse.');
    }

    return isAuth;
  }

  // Método para obtener el token de autenticación
  getAuthToken(): string | null {
    if (typeof window !== 'undefined' && window.localStorage) {
      return localStorage.getItem('access_token');
    }
    return null;
  }

  hasRole(role: UserRole): boolean {
    const user = this.currentUserSubject.value;
    return user?.rol === role;
  }

  isAdmin(): boolean {
    return this.hasRole(UserRole.ADMIN);
  }

  isBarbero(): boolean {
    return this.hasRole(UserRole.BARBERO);
  }

  isUsuario(): boolean {
    return this.hasRole(UserRole.USUARIO);
  }

  isInvitado(): boolean {
    return this.hasRole(UserRole.INVITADO);
  }

  canReserve(): boolean {
    const user = this.currentUserSubject.value;
    return user?.rol === UserRole.USUARIO;
  }

  // Método para registrar nuevos usuarios (solo clientes)
  registrarUsuario(nombre: string, email: string, password: string): Observable<{ success: boolean; message: string }> {
    return new Observable(observer => {
      this.http.post<{ access_token: string; user: any }>(`${this.apiUrl}/auth/registro`, {
        nombre,
        email,
        password
      }).subscribe({
        next: (response) => {
          // Guardar token y usuario (solo en el navegador)
          if (typeof window !== 'undefined' && window.localStorage) {
            localStorage.setItem('access_token', response.access_token);
            localStorage.setItem('currentUser', JSON.stringify(response.user));
          }
          this.currentUserSubject.next(response.user as User);
          observer.next({
            success: true,
            message: 'Cuenta creada exitosamente. Ya puedes iniciar sesión.'
          });
          observer.complete();
        },
        error: (error) => {
          console.error('Error al registrar usuario:', error);
          const message = error.error?.message || 'Error al crear la cuenta. Intente nuevamente.';
          observer.next({
            success: false,
            message: message
          });
          observer.complete();
        }
      });
    });
  }

  private guardarUsuariosEnLocalStorage(): void {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem('users', JSON.stringify(this.users));
      }
    } catch (error) {
      console.warn('Error al guardar usuarios en localStorage:', error);
    }
  }

  private cargarUsuariosDesdeLocalStorage(): void {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const usuariosGuardados = localStorage.getItem('users');
        if (usuariosGuardados) {
          this.users = JSON.parse(usuariosGuardados);
        }
      }
    } catch (error) {
      console.warn('Error al cargar usuarios desde localStorage:', error);
    }
  }

  // Verificar si un email está disponible
  verificarEmailDisponible(email: string): Observable<boolean> {
    return new Observable(observer => {
      try {
        const usuarioExistente = this.users.find(u => u.email.toLowerCase() === email.toLowerCase());
        observer.next(!usuarioExistente);
        observer.complete();
      } catch (error) {
        console.error('Error al verificar email:', error);
        observer.next(false);
        observer.complete();
      }
    });
  }

  // Obtener usuario por email (desde el backend)
  obtenerUsuarioPorEmail(email: string): Observable<User | null> {
    const token = typeof window !== 'undefined' && window.localStorage
      ? localStorage.getItem('access_token')
      : null;

    const headers: any = {
      'Content-Type': 'application/json'
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    } else {
      console.error('❌ No hay token de autenticación. El usuario debe iniciar sesión nuevamente.');
    }

    // Normalizar el email antes de enviarlo (trim y luego codificar para URL)
    const emailLimpio = email.trim();
    const emailNormalizado = encodeURIComponent(emailLimpio);

    console.log('🔍 Buscando usuario por email:', {
      emailOriginal: email,
      emailLimpio: emailLimpio,
      emailCodificado: emailNormalizado,
      url: `${this.apiUrl}/usuarios/email/${emailNormalizado}`
    });

    // Usar el endpoint específico para buscar por email
    return this.http.get<User>(`${this.apiUrl}/usuarios/email/${emailNormalizado}`, { headers }).pipe(
      map(usuario => {
        if (usuario) {
          console.log('✅ Usuario encontrado:', {
            id: usuario.id,
            email: usuario.email,
            nombre: usuario.nombre,
            rol: usuario.rol
          });
          return usuario;
        }
        return null;
      }),
      catchError((error) => {
        console.error('❌ Error al buscar usuario:', error);

        // Si es 404, el usuario no existe (esto es normal)
        if (error.status === 404) {
          console.log('ℹ️ Usuario no encontrado en la base de datos');
          return of(null);
        }

        // Si es error 401 (no autorizado), el token puede estar expirado
        if (error.status === 401) {
          console.error('⚠️ Error 401: Token inválido o expirado. El usuario debe iniciar sesión nuevamente.');
        }

        // Para otros errores, retornar null
        return of(null);
      })
    );
  }

  // Método síncrono para compatibilidad (deprecated, usar obtenerUsuarioPorEmail)
  obtenerUsuarioPorEmailSync(email: string): User | undefined {
    return this.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  }

  // Obtener usuarios por rol
  obtenerUsuariosPorRol(rol: UserRole): User[] {
    return this.users.filter(u => u.rol === rol);
  }

  // Cambiar rol de un usuario (método local, para compatibilidad)
  cambiarRolUsuario(email: string, nuevoRol: UserRole): boolean {
    const usuario = this.obtenerUsuarioPorEmailSync(email);
    if (usuario) {
      usuario.rol = nuevoRol;
      this.guardarUsuariosEnLocalStorage();
      return true;
    }
    return false;
  }
}

