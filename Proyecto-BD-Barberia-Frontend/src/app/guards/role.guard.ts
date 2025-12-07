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

      // Redirigir si no tiene permisos
      console.warn(`Acceso denegado. Rol usuario: ${user?.rol}, Roles permitidos: ${allowedRoles}`);
      router.navigate(['/home']);
      return false;
    } catch (error) {
      console.warn('Error en roleGuard:', error);
      return true;
    }
  };
};

