import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PagosService {
  constructor(private prisma: PrismaService) {}

  async registrarPago(data: any) {
    const { contratoId, monto, fechaPago, referencia, concepto, comprobanteUrl } = data;

    const contrato = await this.prisma.contrato.findUnique({
      where: { id: Number(contratoId) },
      include: { pagos: true },
    });

    if (!contrato) {
      throw new NotFoundException(`Contrato con ID ${contratoId} no encontrado`);
    }

    const ultimaParcialidad = contrato.pagos.reduce((max, p) => Math.max(max, p.numeroParcialidad), 0);
    const montoNum = Number(monto);

    // Payment starts as PENDIENTE — awaiting validation by Contabilidad/Recepcion
    const pago = await this.prisma.pago.create({
      data: {
        contratoId: Number(contratoId),
        monto: montoNum,
        fechaPago: fechaPago ? new Date(fechaPago) : new Date(),
        referencia: referencia || '',
        concepto: concepto || '',
        comprobanteUrl: comprobanteUrl || '',
        numeroParcialidad: ultimaParcialidad + 1,
        estatus: 'PENDIENTE',
      },
    });

    return pago;
  }

  async getAllPagos() {
    return this.prisma.pago.findMany({
      include: {
        contrato: {
          include: {
            cliente: true,
            lote: { include: { fraccionamiento: true } },
          },
        },
      },
      orderBy: { fechaPago: 'desc' },
    });
  }

  async getPagosByContrato(contratoId: number) {
    return this.prisma.pago.findMany({
      where: { contratoId },
      orderBy: { fechaPago: 'asc' },
    });
  }

  async getPagosPendientes() {
    return this.prisma.pago.findMany({
      where: { estatus: 'PENDIENTE' },
      include: {
        contrato: {
          include: {
            cliente: true,
            lote: { include: { fraccionamiento: true } },
          },
        },
      },
      orderBy: { fechaPago: 'desc' },
    });
  }

  async validatePago(id: number, status: string, validadoPor?: string) {
    const pago = await this.prisma.pago.findUnique({
      where: { id },
      include: {
        contrato: {
          include: {
            pagos: true,
            planPagos: {
              where: { estatus: { in: ['PENDIENTE', 'VENCIDO'] } },
              orderBy: { numeroPago: 'asc' },
              take: 1
            }
          }
        }
      }
    });
    if (!pago) throw new NotFoundException('Pago no encontrado');

    const nuevoEstatus = status || 'VALIDADO';

    const pagoActualizado = await this.prisma.pago.update({
      where: { id },
      data: { 
        estatus: nuevoEstatus,
        ...(validadoPor ? { validadoPor } : {})
      },
    });

    // Only update the payment plan when payment is officially VALIDATED
    if (nuevoEstatus === 'VALIDADO') {
      const contrato = pago.contrato;
      const cuotaActual = contrato.planPagos[0];

      if (cuotaActual) {
        await this.prisma.planPago.update({
          where: { id: cuotaActual.id },
          data: { estatus: 'PAGADO', montoPagado: Number(pago.monto) }
        });

        const cuotasVencidasRestantes = await this.prisma.planPago.count({
          where: { contratoId: contrato.id, estatus: 'VENCIDO' }
        });

        if (cuotasVencidasRestantes === 0 && contrato.estatus === 'MORA') {
          await this.prisma.contrato.update({
            where: { id: contrato.id },
            data: { estatus: 'ACTIVO' }
          });
        }
      }
    }

    return pagoActualizado;
  }
}
