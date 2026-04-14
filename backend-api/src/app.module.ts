import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { PrismaModule } from './modules/prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { LotesModule } from './modules/lotes/lotes.module';
import { ClientesModule } from './modules/clientes/clientes.module';
import { CrmModule } from './modules/crm/crm.module';
import { VentasModule } from './modules/ventas/ventas.module';
import { PagosModule } from './modules/pagos/pagos.module';
import { PermissionsModule } from './modules/permissions/permissions.module';
import { FraccionamientosModule } from './modules/fraccionamientos/fraccionamientos.module';
import { ReportesModule } from './modules/reportes/reportes.module';
import { FinanzasModule } from './modules/finanzas/finanzas.module';
import { HealthModule } from './modules/health/health.module';
import { AdminModule } from './modules/admin/admin.module';
import { UsersModule } from './modules/users/users.module';
import { TicketsModule } from './modules/tickets/tickets.module';
import { MensajesModule } from './modules/mensajes/mensajes.module';
import { ImagesModule } from './modules/images/images.module';
import { JwtAuthGuard } from './modules/auth/guards/jwt-auth.guard';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    LotesModule,
    ClientesModule,
    CrmModule,
    VentasModule,
    PagosModule,
    PermissionsModule,
    FraccionamientosModule,
    ReportesModule,
    FinanzasModule,
    HealthModule,
    AdminModule,
    UsersModule,
    TicketsModule,
    MensajesModule,
    ImagesModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}
