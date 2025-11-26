import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-registro',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './registro.component.html',
  styleUrl: './registro.component.css'
})
export class RegistroComponent {
  nombre: string = '';
  email: string = '';
  password: string = '';
  confirmPassword: string = '';
  errorMessage: string = '';
  successMessage: string = '';
  isLoading: boolean = false;
  emailEnUso: boolean = false;
  verificandoEmail: boolean = false;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  // Requerimientos de contraseña
  get passwordRequisitos() {
    return {
      longitud: this.password.length >= 8,
      mayuscula: /[A-Z]/.test(this.password),
      minuscula: /[a-z]/.test(this.password),
      numero: /[0-9]/.test(this.password),
      especial: /[!@#$%^&*(),.?":{}|<>]/.test(this.password)
    };
  }

  get passwordValida(): boolean {
    const req = this.passwordRequisitos;
    return req.longitud && req.mayuscula && req.minuscula && req.numero && req.especial;
  }

  get passwordsCoinciden(): boolean {
    return this.password === this.confirmPassword && this.confirmPassword.length > 0;
  }

  verificarEmail(): void {
    if (!this.email.trim()) {
      this.emailEnUso = false;
      return;
    }

    // Validar formato de email primero
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(this.email)) {
      this.emailEnUso = false;
      return;
    }

    this.verificandoEmail = true;
    // Simular verificación (en una app real, esto sería una llamada al servidor)
    setTimeout(() => {
      this.authService.verificarEmailDisponible(this.email).subscribe({
        next: (disponible) => {
          this.emailEnUso = !disponible;
          this.verificandoEmail = false;
        },
        error: () => {
          this.verificandoEmail = false;
        }
      });
    }, 500);
  }

  onSubmit(): void {
    this.errorMessage = '';
    this.successMessage = '';
    
    // Validaciones
    if (!this.nombre.trim()) {
      this.errorMessage = 'Por favor ingrese su nombre';
      return;
    }

    if (!this.email.trim()) {
      this.errorMessage = 'Por favor ingrese su email';
      return;
    }

    if (!this.password) {
      this.errorMessage = 'Por favor ingrese una contraseña';
      return;
    }

    // Validar contraseña segura
    if (!this.passwordValida) {
      this.errorMessage = 'La contraseña no cumple con todos los requisitos de seguridad';
      return;
    }

    if (!this.passwordsCoinciden) {
      this.errorMessage = 'Las contraseñas no coinciden';
      return;
    }

    // Verificar si el email está en uso
    if (this.emailEnUso) {
      this.errorMessage = 'Este correo electrónico ya está en uso. Por favor, use otro o inicie sesión.';
      return;
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(this.email)) {
      this.errorMessage = 'Por favor ingrese un email válido';
      return;
    }

    this.isLoading = true;

    this.authService.registrarUsuario(this.nombre, this.email, this.password).subscribe({
      next: (result) => {
        this.isLoading = false;
        if (result.success) {
          this.successMessage = result.message;
          // Redirigir al login después de 2 segundos
          setTimeout(() => {
            this.router.navigate(['/login']);
          }, 2000);
        } else {
          this.errorMessage = result.message;
        }
      },
      error: () => {
        this.isLoading = false;
        this.errorMessage = 'Error al crear la cuenta. Intente nuevamente.';
      }
    });
  }

  irALogin(): void {
    this.router.navigate(['/login']);
  }
}
