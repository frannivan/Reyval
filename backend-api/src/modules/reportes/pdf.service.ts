import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import PDFDocument from 'pdfkit-table';
import { Response } from 'express';

@Injectable()
export class PdfService {
  constructor(private prisma: PrismaService) {}

  async generateEstadoCuenta(contratoId: number, res: Response) {
    const contrato = await this.prisma.contrato.findUnique({
      where: { id: contratoId },
      include: {
        cliente: true,
        lote: { include: { fraccionamiento: true } }
      }
    });

    if (!contrato) {
      throw new NotFoundException('Contrato no encontrado');
    }

    const pagos = await this.prisma.pago.findMany({
      where: { contratoId },
      orderBy: { fechaPago: 'asc' }
    });

    const doc = new PDFDocument({ margin: 50 });
    doc.pipe(res);

    // Headers
    doc.fontSize(20).font('Helvetica-Bold').text('Reyval Inmobiliaria', { align: 'center' });
    doc.fontSize(14).text('Estado de Cuenta', { align: 'center' });
    doc.moveDown(2);

    // Info Cliente
    doc.fontSize(12).font('Helvetica');
    doc.text(`Cliente: ${contrato.cliente.nombre} ${contrato.cliente.apellidoPaterno} ${contrato.cliente.apellidoMaterno || ''}`);
    const fraccName = contrato.lote?.fraccionamiento?.nombre || 'Independiente';
    doc.text(`Lote/Propiedad: Lote ${contrato.lote?.numeroLote} - ${fraccName}`);
    doc.text(`Contrato No: ${contrato.id}`);
    doc.text(`Fecha Emisión: ${new Date().toLocaleDateString()}`);
    doc.moveDown(2);

    // Info Financiera
    const formatter = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' });
    doc.font('Helvetica-Bold').text('Resumen Financiero:');
    doc.font('Helvetica').text(`Precio Total: ${formatter.format(Number(contrato.montoTotal))}`);
    doc.text(`Enganche Pagado: ${formatter.format(Number(contrato.enganche))}`);
    doc.text(`Mensualidad: ${formatter.format(Number(contrato.mensualidad))}`);
    doc.moveDown();

    // Tabla Pagos
    let totalAbonado = 0;
    const tableRows = pagos.filter(p => p.estatus !== 'CANCELADO').map(p => {
      totalAbonado += Number(p.monto);
      return [
        p.fechaPago.toLocaleDateString(),
        `Parcialidad #${p.numeroParcialidad}`,
        p.referencia || 'N/A',
        formatter.format(Number(p.monto))
      ];
    });

    const tableData = {
      title: 'Historial de Pagos',
      headers: ['Fecha', 'Concepto', 'Referencia', 'Monto'],
      rows: tableRows.length > 0 ? tableRows : [['-', 'Sin pagos', '-', '-']],
    };

    await doc.table(tableData, {
      width: 500,
    });

    doc.moveDown();
    doc.font('Helvetica-Bold').text(`Total Abonado: ${formatter.format(totalAbonado)}`, { align: 'right' });
    const saldoPendiente = Math.max(0, Number(contrato.montoTotal) - totalAbonado - Number(contrato.enganche));
    doc.text(`Saldo Restante: ${formatter.format(saldoPendiente)}`, { align: 'right' });

    doc.end();
  }

  async generateReportePagos(pagos: any[], res: Response) {
    const doc = new PDFDocument({ margin: 30, size: 'A4', layout: 'landscape' });
    doc.pipe(res);

    doc.fontSize(18).font('Helvetica-Bold').text('Reporte de Pagos Generales', { align: 'center' });
    doc.moveDown(2);

    const formatter = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' });
    const tableRows = pagos.map(p => {
      const clienteStr = p.contrato?.cliente ? `${p.contrato.cliente.nombre} ${p.contrato.cliente.apellidoPaterno}` : 'N/A';
      const loteStr = p.contrato?.lote ? `Lote ${p.contrato.lote.numeroLote}` : 'N/A';
      return [
        p.id.toString(),
        clienteStr,
        loteStr,
        p.fechaPago ? new Date(p.fechaPago).toLocaleDateString() : 'N/A',
        formatter.format(Number(p.monto)),
        p.estatus || ''
      ];
    });

    const tableData = {
      title: 'Detalle de Pagos',
      headers: ['ID', 'Cliente', 'Lote', 'Fecha', 'Monto', 'Estatus'],
      rows: tableRows.length > 0 ? tableRows : [['-', '-', '-', '-', '-', '-']],
    };

    await doc.table(tableData, { width: 750 });
    doc.end();
  }

  async generateReporteUsuarios(usuarios: any[], res: Response) {
    const doc = new PDFDocument({ margin: 30, size: 'A4' });
    doc.pipe(res);

    doc.fontSize(18).font('Helvetica-Bold').text('Reporte de Usuarios Registrados', { align: 'center' });
    doc.moveDown(2);

    const tableRows = usuarios.map(u => [
      u.id.toString().substring(0, 8) + '...',
      u.username,
      u.email,
      u.role?.name || 'N/A'
    ]);

    const tableData = {
      title: 'Directorio',
      headers: ['ID', 'Username', 'Email', 'Rol'],
      rows: tableRows.length > 0 ? tableRows : [['-', '-', '-', '-']],
    };

    await doc.table(tableData, { width: 500 });
    doc.end();
  }

  async generateReporteInventario(lotes: any[], res: Response) {
    const doc = new PDFDocument({ margin: 30, size: 'A4', layout: 'landscape' });
    doc.pipe(res);

    doc.fontSize(18).font('Helvetica-Bold').text('Reporte de Inventario', { align: 'center' });
    doc.moveDown(2);

    const formatter = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' });
    const tableRows = lotes.map(l => [
      l.numeroLote || '-',
      l.manzana || '-',
      l.fraccionamiento?.nombre || '-',
      l.areaMetrosCuadrados ? `${l.areaMetrosCuadrados} m2` : '-',
      formatter.format(Number(l.precioTotal)),
      l.estatus
    ]);

    const tableData = {
      title: 'Estado de Lotes',
      headers: ['Lote', 'Manzana', 'Fraccionamiento', 'Área', 'Precio', 'Estatus'],
      rows: tableRows.length > 0 ? tableRows : [['-', '-', '-', '-', '-', '-']],
    };

    await doc.table(tableData, { width: 750 });
    doc.end();
  }
}
