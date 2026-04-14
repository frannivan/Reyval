import { Controller, Get, Param, Res, Query } from '@nestjs/common';
import { PdfService } from './pdf.service';
import { ExcelService } from './excel.service';
import { PrismaService } from '../prisma/prisma.service';
import { Response } from 'express';

@Controller('reportes')
export class ReportesController {
  constructor(
    private readonly pdfService: PdfService,
    private readonly excelService: ExcelService,
    private readonly prisma: PrismaService
  ) {}

  @Get('dashboard')
  async getDashboardStats() {
    const [totalLotes, lotesDisponibles, totalClientes, totalContratos, totalLeads, totalOpportunities, pagos] =
      await Promise.all([
        this.prisma.lote.count(),
        this.prisma.lote.count({ where: { estatus: 'DISPONIBLE' } }),
        this.prisma.cliente.count(),
        this.prisma.contrato.count(),
        this.prisma.lead.count(),
        this.prisma.opportunity.count(),
        this.prisma.pago.findMany({ where: { estatus: { not: 'CANCELADO' } } }),
      ]);

    const ingresosTotales = pagos.reduce((sum, p) => sum + Number(p.monto), 0);
    const contratos = await this.prisma.contrato.findMany({
      include: { cliente: true, lote: true, pagos: true },
      orderBy: { id: 'desc' },
      take: 5,
    });

    return {
      totalLotes,
      lotesDisponibles,
      lotesVendidos: totalLotes - lotesDisponibles,
      totalClientes,
      totalContratos,
      totalLeads,
      totalOpportunities,
      ingresosTotales,
      saldoPendienteTotal: 0,
      ventasRecientes: contratos,
    };
  }

  @Get('usuarios')
  async getReporteUsuarios(@Query('format') format: string, @Res() res: Response) {
    try {
      const usuarios = await this.prisma.user.findMany({
        select: {
          id: true,
          username: true,
          email: true,
          role: true,
          createdAt: true,
        },
      });

      if (format === 'excel') {
        await this.excelService.generateUsuariosReport(usuarios, res);
      } else if (format === 'pdf') {
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'inline; filename=reporte_usuarios.pdf');
        await this.pdfService.generateReporteUsuarios(usuarios, res);
      } else {
        res.json(usuarios);
      }
    } catch (error) {
      if (!res.headersSent) res.status(500).json({ error: error.message });
    }
  }

  @Get('pagos')
  async getReportePagos(@Query('format') format: string, @Res() res: Response) {
    try {
      const pagos = await this.prisma.pago.findMany({
        include: {
          contrato: {
            include: {
              cliente: true,
              lote: true,
            },
          },
        },
        orderBy: { fechaPago: 'desc' },
      });

      if (format === 'excel') {
        await this.excelService.generatePagosReport(pagos, res);
      } else if (format === 'pdf') {
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'inline; filename=reporte_pagos.pdf');
        await this.pdfService.generateReportePagos(pagos, res);
      } else {
        res.json(pagos);
      }
    } catch (error) {
      if (!res.headersSent) res.status(500).json({ error: error.message });
    }
  }

  @Get('inventario')
  async getReporteInventario(@Query('format') format: string, @Res() res: Response) {
    try {
      const lotes = await this.prisma.lote.findMany({
        include: { fraccionamiento: true },
      });
      
      if (format === 'excel') {
        await this.excelService.generateInventarioReport(lotes, res);
      } else if (format === 'pdf') {
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'inline; filename=reporte_inventario.pdf');
        await this.pdfService.generateReporteInventario(lotes, res);
      } else {
        res.json(lotes);
      }
    } catch (error) {
      if (!res.headersSent) res.status(500).json({ error: error.message });
    }
  }

  @Get('estado-cuenta/:id')
  async getEstadoCuenta(
    @Param('id') id: string,
    @Res() res: Response
  ) {
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=estado_cuenta_${id}.pdf`);
    
    await this.pdfService.generateEstadoCuenta(parseInt(id, 10), res);
  }
}
