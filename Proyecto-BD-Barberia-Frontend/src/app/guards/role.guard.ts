import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { UserRole } from '../models/user.model';

export const roleGuard = (allowedRoles: UserRole[]): CanActivateFn => {
  return (route, state) => {
    try {
      const authService = inject(AuthService);
      const router = inject(Router);

      const user = authService.getCurrentUser();
      
      if (user && allowedRoles.includes(user.rol)) {
        return true;
      }

      // Permitir acceso temporalmente para que las vistas funcionen
      // TODO: Habilitar cuando se conecte a BD
      // router.navigate(['/home']);
      return true;
    } catch (error) {
      console.warn('Error en roleGuard:', error);
      return true;
    }
  };
};

