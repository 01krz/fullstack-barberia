import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = (route, state) => {
  try {
    const authService = inject(AuthService);
    const router = inject(Router);

    if (authService.isAuthenticated()) {
      return true;
    }

    // Permitir acceso temporalmente para que las vistas funcionen
    // TODO: Habilitar cuando se conecte a BD
    // router.navigate(['/login']);
    return true;
  } catch (error) {
    console.warn('Error en authGuard:', error);
    // Permitir acceso en caso de error
    return true;
  }
};

