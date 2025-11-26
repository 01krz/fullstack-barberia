import { Component, OnInit } from '@angular/core';
import { RouterOutlet, RouterLink, Router, NavigationEnd } from '@angular/router';
import { NgClass, CommonModule, TitleCasePipe } from '@angular/common';
import { AuthService } from './services/auth.service';
import { User, UserRole } from './models/user.model';
import { Observable, filter } from 'rxjs';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, NgClass, CommonModule, TitleCasePipe],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit {
  menuOption: string = '';
  isMenuOpen: boolean = false;
  currentUser$: Observable<User | null>;
  isLoginPage: boolean = false;

  constructor(public authService: AuthService, private router: Router) {
    this.currentUser$ = this.authService.currentUser$;
  }

  ngOnInit(): void {
    // Iniciar como invitado si no hay usuario logueado
    if (!this.authService.isAuthenticated()) {
      this.authService.loginAsGuest();
    }
    
    // Verificar la ruta actual
    this.checkCurrentRoute();
    
    // Suscribirse a los cambios de ruta
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(() => {
        this.checkCurrentRoute();
      });
  }

  checkCurrentRoute(): void {
    this.isLoginPage = this.router.url === '/login' || this.router.url.startsWith('/login');
  }

  onOption(menuOption: string) {
    this.menuOption = menuOption;
  }

  toggleMenu() {
    this.isMenuOpen = !this.isMenuOpen;
  }

  closeMenu() {
    this.isMenuOpen = false;
  }

  logout() {
    this.authService.logout();
    this.closeMenu();
    // Después de logout, iniciar como invitado
    this.authService.loginAsGuest();
    // Navegar a home
    this.router.navigate(['/home']);
  }

  isAdmin(): boolean {
    return this.authService.isAdmin();
  }

  isBarbero(): boolean {
    return this.authService.isBarbero();
  }

  isUsuario(): boolean {
    return this.authService.isUsuario();
  }

  isInvitado(): boolean {
    return this.authService.isInvitado();
  }

  canReserve(): boolean {
    return this.authService.canReserve();
  }

  // Método para verificar si debe mostrar opciones de cliente (usuario o invitado)
  showClientOptions(): boolean {
    return this.isUsuario() || this.isInvitado();
  }
}
