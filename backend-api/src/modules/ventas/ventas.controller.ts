import { Controller, Get, Post, Param, Body, Req, UseGuards } from '@nestjs/common';
import { VentasService } from './ventas.service';
import { PrismaService } from '../prisma/prisma.service';
import { AmortizationService } from './amortization.service';

@Controller('ventas')
export class VentasController {
  constructor(
    private readonly ventasService: VentasService,
    private readonly prisma: PrismaService,
    private readonly amortizationService: AmortizationService,
  ) {}

  // POST /ventas/cotizar — Simulación de crédito sin guardar
  @Post('cotizar')
  async cotizar(@Body() body: any) {
    const { montoTotal, enganche, plazoMeses, tasaAnual } = body;
    const { Decimal } = await import('decimal.js');
    const montoFinanciar = new Decimal(montoTotal).sub(new Decimal(enganche));
    const tabla = this.amortizationService.calculateAmortization(montoFinanciar, plazoMeses, tasaAnual);
    const mensualidad = tabla[0]?.cuota || 0;
    return {
      mensualidad,
      montoFinanciar: montoFinanciar.toNumber(),
      totalPagos: tabla.length,
      resumen: tabla.slice(0, 3), // Primeras 3 cuotas de ejemplo
    };
  }

  // POST /ventas/contratar — Crear contrato formal
  @Post('contratar')
  async crearContrato(@Body() body: any) {
    const data = {
      ...body,
      fechaContrato: body.fechaContrato || new Date().toISOString(),
    };
    const contrato = await this.ventasService.createContrato(data);
    return { message: 'Contrato creado y lote marcado como vendido.', ...contrato };
  }

  // GET /ventas/contratos — Todos los contratos (admin)
  @Get('contratos')
  async getAllContratos() {
    return this.prisma.contrato.findMany({
      include: {
        cliente: true,
        lote: { include: { fraccionamiento: true } },
        pagos: true,
      },
      orderBy: { id: 'desc' },
    });
  }

  // GET /ventas/mis-contratos — Contratos del usuario (como cliente o vendedor)
  @Get('mis-contratos')
  async getMisContratos(@Req() req: any) {
    const userId = req.user.sub;
    const role = req.user.role;

    if (role === 'ROLE_ADMIN' || role === 'ROLE_RECEPCION') {
      return this.getAllContratos();
    }

    if (role === 'ROLE_VENDEDOR') {
      return this.prisma.contrato.findMany({
        where: { vendedorId: userId },
        include: { cliente: true, lote: { include: { fraccionamiento: true } }, pagos: true },
        orderBy: { id: 'desc' },
      });
    }

    // Por defecto asumimos ROLE_CLIENTE: filtrado por el userId vinculado al Cliente
    return this.prisma.contrato.findMany({
      where: { cliente: { userId: userId } },
      include: { cliente: true, lote: { include: { fraccionamiento: true } }, pagos: true },
      orderBy: { id: 'desc' },
    });
  }

  // GET /ventas/contratos/:id — Detalle de un contrato
  @Get('contratos/:id')
  async getContrato(@Param('id') id: string) {
    return this.ventasService.getContratoById(parseInt(id, 10));
  }
}
