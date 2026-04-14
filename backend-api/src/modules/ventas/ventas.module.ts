import { Module } from '@nestjs/common';
import { VentasService } from './ventas.service';
import { VentasController } from './ventas.controller';
import { AmortizationService } from './amortization.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [VentasController],
  providers: [VentasService, AmortizationService],
  exports: [VentasService, AmortizationService],
})
export class VentasModule {}

