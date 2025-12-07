import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './auth/auth.module';
import { UsuariosModule } from './usuarios/usuarios.module';
import { ServiciosModule } from './servicios/servicios.module';
import { BarberosModule } from './barberos/barberos.module';
import { ReservasModule } from './reservas/reservas.module';
import { ProductosModule } from './productos/productos.module';
import { PromocionesModule } from './promociones/promociones.module';
import { BloqueosModule } from './bloqueos/bloqueos.module';
import { ReportesModule } from './reportes/reportes.module';
import { EvaluacionesModule } from './evaluaciones/evaluaciones.module';
import { DireccionModule } from './direccion/direccion.module';
import { AppController } from './app.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    DatabaseModule,
    AuthModule,
    UsuariosModule,
    ServiciosModule,
    BarberosModule,
    ReservasModule,
    ProductosModule,
    PromocionesModule,
    BloqueosModule,
    ReportesModule,
    EvaluacionesModule,
    DireccionModule,
  ],
  controllers: [AppController],
})
export class AppModule { }

