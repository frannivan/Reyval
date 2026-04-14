import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AmortizationService } from './amortization.service';
import { Decimal } from 'decimal.js';

@Injectable()
export class VentasService {
  constructor(
    private prisma: PrismaService,
    private amortizationService: AmortizationService,
  ) {}

  async createContrato(data: any) {
    const { clienteId, loteId, montoTotal, enganche, plazoMeses, tasaAnual, fechaContrato } = data;

    // VALIDACIÓN: Verificar disponibilidad del lote
    const lote = await this.prisma.lote.findUnique({ where: { id: Number(loteId) } });
    if (!lote) throw new NotFoundException('El lote seleccionado no existe.');
    if (lote.estatus !== 'DISPONIBLE') {
      throw new Error('Lo sentimos, este lote ya no está disponible (ya fue vendido o contratado).');
    }

    const montoFinanciar = new Decimal(montoTotal).sub(new Decimal(enganche));
    
    // Calcular mensualidad usando el motor de amortización
    const tabla = this.amortizationService.calculateAmortization(montoFinanciar, plazoMeses, tasaAnual);
    const mensualidad = tabla[0]?.cuota || 0;

    const contrato = await this.prisma.contrato.create({
      data: {
        clienteId,
        loteId,
        vendedorId: data.vendedorId?.toString() || null, // Mantener compatibilidad con IDs de CasaVida
        montoTotal,
        enganche,
        plazoMeses,
        tasaInteresAnual: tasaAnual,
        mensualidad,
        fechaContrato: new Date(fechaContrato),
        estatus: 'ACTIVO',
      },
    });

    // GENERAR PLAN DE PAGOS PERSISTENTE
    const planRecords = tabla.map(row => ({
      contratoId: contrato.id,
      numeroPago: row.numeroPago,
      fechaVencimiento: row.fechaPago,
      monto: new Decimal(row.cuota),
      estatus: 'PENDIENTE',
    }));

    await this.prisma.planPago.createMany({
      data: planRecords,
    });

    // Cambiar estatus de lote a VENDIDO
    await this.prisma.lote.update({
      where: { id: loteId },
      data: { estatus: 'VENDIDO' },
    });

    return contrato;
  }

  async getContratoById(id: number) {
    const contrato = await this.prisma.contrato.findUnique({
      where: { id },
      include: {
        cliente: true,
        lote: true,
        pagos: true,
      },
    });
    if (!contrato) throw new NotFoundException('Contrato no encontrado');
    return contrato;
  }
}
