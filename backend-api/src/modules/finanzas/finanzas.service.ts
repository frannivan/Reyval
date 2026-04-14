import { Injectable, OnApplicationBootstrap, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Decimal } from 'decimal.js';

@Injectable()
export class FinanzasService implements OnApplicationBootstrap {
  private readonly logger = new Logger(FinanzasService.name);

  constructor(private prisma: PrismaService) {}

  async onApplicationBootstrap() {
    this.logger.log('--- Iniciando revisión automática de morosidad ---');
    await this.revisarMorosidad();
  }

  /**
   * REGLA: Si la fecha de vencimiento es menor a HOY y el estatus es PENDIENTE,
   * se marca como VENCIDO y se calcula un 5% de interés moratorio mensual.
   */
  async revisarMorosidad() {
    const hoy = new Date();
    
    // 1. Buscar parcialidades vencidas
    const parcialidadesVencidas = await this.prisma.planPago.findMany({
      where: {
        fechaVencimiento: { lt: hoy },
        estatus: 'PENDIENTE',
      },
      include: { contrato: true },
    });

    if (parcialidadesVencidas.length === 0) {
      this.logger.log('No se encontraron nuevas parcialidades vencidas.');
      return;
    }

    this.logger.log(`Procesando ${parcialidadesVencidas.length} parcialidades vencidas...`);

    for (const cuota of parcialidadesVencidas) {
      // Calcular 5% de interés sobre el monto de la cuota
      const interesTasa = 0.05;
      const interesCalculado = new Decimal(cuota.monto).mul(interesTasa);

      await this.prisma.planPago.update({
        where: { id: cuota.id },
        data: {
          estatus: 'VENCIDO',
          interesMoratorio: interesCalculado,
        },
      });

      // Actualizar el status del contrato a MORA
      await this.prisma.contrato.update({
        where: { id: cuota.contratoId },
        data: { estatus: 'MORA' },
      });
    }

    this.logger.log('Sincronización de morosidad completada.');
  }

  async getEstadoCuenta(contratoId: number) {
    return this.prisma.contrato.findUnique({
      where: { id: contratoId },
      include: {
        cliente: true,
        lote: { include: { fraccionamiento: true } },
        planPagos: { orderBy: { numeroPago: 'asc' } },
        pagos: { orderBy: { fechaPago: 'desc' } },
      },
    });
  }
}
