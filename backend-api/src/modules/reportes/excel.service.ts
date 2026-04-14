import { Injectable } from '@nestjs/common';
import * as ExcelJS from 'exceljs';
import { Response } from 'express';

@Injectable()
export class ExcelService {
  async generatePagosReport(pagos: any[], res: Response) {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Reporte de Pagos');

    worksheet.columns = [
      { header: 'ID Pago', key: 'id', width: 10 },
      { header: 'Contrato ID', key: 'contratoId', width: 15 },
      { header: 'Cliente', key: 'cliente', width: 30 },
      { header: 'Lote', key: 'lote', width: 15 },
      { header: 'Monto', key: 'monto', width: 15 },
      { header: 'Fecha de Pago', key: 'fechaPago', width: 20 },
      { header: 'Estatus', key: 'estatus', width: 15 },
    ];

    pagos.forEach(pago => {
      worksheet.addRow({
        id: pago.id,
        contratoId: pago.contrato?.id,
        cliente: pago.contrato?.cliente?.nombre + ' ' + (pago.contrato?.cliente?.apellidoPaterno || ''),
        lote: pago.contrato?.lote?.numeroLote,
        monto: Number(pago.monto),
        fechaPago: pago.fechaPago ? new Date(pago.fechaPago).toLocaleDateString() : '',
        estatus: pago.estatus,
      });
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=reporte_pagos.xlsx');
    await workbook.xlsx.write(res);
    res.end();
  }

  async generateUsuariosReport(usuarios: any[], res: Response) {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Reporte de Usuarios');

    worksheet.columns = [
      { header: 'ID', key: 'id', width: 25 },
      { header: 'Username', key: 'username', width: 20 },
      { header: 'Email', key: 'email', width: 30 },
      { header: 'Rol', key: 'role', width: 15 },
      { header: 'Fecha Creación', key: 'createdAt', width: 20 },
    ];

    usuarios.forEach(u => {
      worksheet.addRow({
        id: u.id,
        username: u.username,
        email: u.email,
        role: u.role?.name || 'N/A',
        createdAt: u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '',
      });
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=reporte_usuarios.xlsx');
    await workbook.xlsx.write(res);
    res.end();
  }

  async generateInventarioReport(lotes: any[], res: Response) {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Inventario Lotes');

    worksheet.columns = [
      { header: 'ID Lote', key: 'id', width: 10 },
      { header: 'Número', key: 'numeroLote', width: 15 },
      { header: 'Manzana', key: 'manzana', width: 15 },
      { header: 'Fraccionamiento', key: 'fraccionamiento', width: 25 },
      { header: 'Área (m2)', key: 'area', width: 15 },
      { header: 'Precio Total', key: 'precio', width: 15 },
      { header: 'Estatus', key: 'estatus', width: 15 },
    ];

    lotes.forEach(lote => {
      worksheet.addRow({
        id: lote.id,
        numeroLote: lote.numeroLote,
        manzana: lote.manzana,
        fraccionamiento: lote.fraccionamiento?.nombre,
        area: lote.areaMetrosCuadrados,
        precio: Number(lote.precioTotal),
        estatus: lote.estatus,
      });
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=reporte_inventario.xlsx');
    await workbook.xlsx.write(res);
    res.end();
  }
}
