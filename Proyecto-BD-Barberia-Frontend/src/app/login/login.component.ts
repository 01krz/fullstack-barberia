import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { LoginCredentials } from '../models/user.model';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
  credentials: LoginCredentials = {
    email: '',
    password: ''
  };
  errorMessage: string = '';
  isLoading: boolean = false;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  onSubmit(): void {
    this.errorMessage = '';
    this.isLoading = true;

    this.authService.login(this.credentials).subscribe({
      next: (success) => {
        this.isLoading = false;
        if (success) {
          setTimeout(() => {
            this.router.navigate(['/home']);
          }, 100);
        } else {
          this.errorMessage = 'Email o contraseña incorrectos. ¿No tienes una cuenta?';
        }
      },
      error: () => {
        this.isLoading = false;
        this.errorMessage = 'Error al iniciar sesión. Intente nuevamente.';
      }
    });
  }

  irARegistro(): void {
    this.router.navigate(['/registro']);
  }

  loginAsGuest(): void {
    this.authService.loginAsGuest();
    setTimeout(() => {
      this.router.navigate(['/home']);
    }, 100);
  }
}
