import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const loginGuard: CanActivateFn = (route, state) => {
  try {
    const authService = inject(AuthService);
    const router = inject(Router);

    if (authService.isAuthenticated()) {
      // router.navigate(['/home']);
      // return false;
      // Permitir acceso temporalmente
      return true;
    }

    return true;
  } catch (error) {
    console.warn('Error en loginGuard:', error);
    return true;
  }
};

