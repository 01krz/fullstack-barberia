import { Routes } from '@angular/router';
import { LoginComponent } from './login/login.component';
import { RegistroComponent } from './registro/registro.component';
import { HomeComponent } from './home/home.component';
import { DireccionComponent } from './direccion/direccion.component';
import { GaleriaComponent } from './galeria/galeria.component';
import { ResenasComponent } from './resenas/resenas.component';
import { AcercaDeComponent } from './acerca-de/acerca-de.component';
import { ServiciosComponent } from './servicios/servicios.component';
import { AdminComponent } from './admin/admin.component';
import { BarberoComponent } from './barbero/barbero.component';
import { ReservaComponent } from './reserva/reserva.component';
import { MetricasComponent } from './metricas/metricas.component';
import { MisReservasComponent } from './mis-reservas/mis-reservas.component';
import { authGuard } from './guards/auth.guard';
import { loginGuard } from './guards/login.guard';
import { roleGuard } from './guards/role.guard';
import { UserRole } from './models/user.model';

export const routes: Routes = [
    { path: '', redirectTo: '/home', pathMatch: 'full' },
    { path: 'login', component: LoginComponent },
    { path: 'registro', component: RegistroComponent },
    { path: 'home', component: HomeComponent },
    { path: 'direccion', component: DireccionComponent },
    { path: 'galeria', component: GaleriaComponent },
    { path: 'resenas', component: ResenasComponent },
    { path: 'acerca-de', component: AcercaDeComponent },
    { path: 'servicios', component: ServiciosComponent },
    { path: 'reserva', component: ReservaComponent, canActivate: [authGuard] },
    { path: 'admin', component: AdminComponent, canActivate: [authGuard, roleGuard], data: { roles: [UserRole.ADMIN] } },
    { path: 'metricas', component: MetricasComponent, canActivate: [authGuard, roleGuard], data: { roles: [UserRole.ADMIN] } },
    { path: 'barbero', component: BarberoComponent, canActivate: [authGuard, roleGuard], data: { roles: [UserRole.BARBERO, UserRole.ADMIN] } },
    { path: 'mis-reservas', component: MisReservasComponent, canActivate: [authGuard] },
    { path: '**', redirectTo: '/home' }
];
