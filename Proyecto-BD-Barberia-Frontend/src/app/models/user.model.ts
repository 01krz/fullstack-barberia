export enum UserRole {
  ADMIN = 'admin',
  BARBERO = 'barbero',
  USUARIO = 'usuario',
  INVITADO = 'invitado'
}

export interface User {
  id: number;
  email: string;
  password?: string; // Opcional porque no siempre se incluye (ej: cuando viene del backend)
  nombre: string;
  rol: UserRole;
  esAdmin?: number | boolean; // Flag de administrador (0/1 o boolean)
  esBarbero?: number | boolean; // Flag de barbero (0/1 o boolean)
  activo?: number | boolean; // Flag de activo (0/1 o boolean)
}

export interface LoginCredentials {
  email: string;
  password: string;
}

