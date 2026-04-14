import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ClientesService {
  constructor(private prisma: PrismaService) {}

  // Normaliza los campos del cliente para compatibilidad con el frontend
  private normalize(c: any) {
    if (!c) return c;
    return {
      ...c,
      // Alias para compatibilidad con el frontend
      apellidos: c.apellidoPaterno || '',
      ine: c.rfc || '',
      direccion: c.domicilio || '',
    };
  }

  async findAll() {
    const clientes = await this.prisma.cliente.findMany({ include: { contratos: true } });
    return clientes.map(c => this.normalize(c));
  }

  async findById(id: number) {
    const cliente = await this.prisma.cliente.findUnique({
      where: { id },
      include: { contratos: { include: { lote: true, pagos: true } } },
    });
    if (!cliente) throw new NotFoundException('Cliente no encontrado');
    return this.normalize(cliente);
  }

  async getContratos(clienteId: number) {
    return this.prisma.contrato.findMany({
      where: { clienteId },
      include: { lote: true, pagos: true },
    });
  }

  async create(data: any) {
    if (data.email) {
      const existe = await this.prisma.cliente.findFirst({ where: { email: data.email } });
      if (existe) throw new ConflictException('Error: El email ya está registrado en otro cliente.');
    }

    // 1. Create User automatically (username & password = email)
    const bcrypt = require('bcryptjs');
    const hashedPassword = bcrypt.hashSync(data.email, 10);
    const roleCliente = await this.prisma.role.findUnique({ where: { name: 'ROLE_CLIENTE' } });
    
    const newUser = await this.prisma.user.create({
      data: {
        id: `u-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        username: data.email,
        email: data.email,
        password: hashedPassword,
        roleId: roleCliente?.id || 8, // Fallback to ID 8 (ROLE_CLIENTE)
        name: data.nombre,
        emailVerified: true
      }
    });

    // 2. Create Cliente linked to User
    const prismaData: any = {
      nombre: data.nombre,
      apellidoPaterno: data.apellidos || data.apellidoPaterno || '',
      email: data.email,
      telefono: data.telefono,
      domicilio: data.direccion || data.domicilio || '',
      rfc: data.ine || data.rfc || '',
      fechaRegistro: new Date(),
      userId: newUser.id
    };
    const cliente = await this.prisma.cliente.create({ data: prismaData });
    return this.normalize(cliente);
  }

  async update(id: number, data: any) {
    const cliente = await this.prisma.cliente.findUnique({ where: { id } });
    if (!cliente) throw new NotFoundException('Cliente no encontrado');
    return this.prisma.cliente.update({ where: { id }, data });
  }

  // Registro de lead público (desde formulario web)
  async registerLead(data: any) {
    if (data.email) {
      const existe = await this.prisma.cliente.findFirst({ where: { email: data.email } });
      if (existe) return { message: 'Gracias. Ya tenemos tus datos, un asesor te contactará pronto.' };
    }
    const cliente = await this.prisma.cliente.create({
      data: { ...data, apellidoPaterno: data.apellidoPaterno || '-' },
    });
    return { message: 'Solicitud recibida. Un asesor te contactará pronto.', id: cliente.id };
  }

  async getDashboardData(email: string) {
    const cliente = await this.prisma.cliente.findFirst({
      where: { email },
      include: {
        contratos: {
          include: {
            lote: { include: { fraccionamiento: true } },
            pagos: true,
          },
        },
      },
    });

    if (!cliente) throw new NotFoundException('No se encontró información de cliente asociada a este correo.');

    const contratosSummary = cliente.contratos.map(contrato => {
      const totalPagado = contrato.pagos.reduce((sum, pago) => sum + Number(pago.monto || 0), 0);
      const montoTotal = Number(contrato.montoTotal || 0);
      const progresoPagos = montoTotal > 0 ? (totalPagado / montoTotal) * 100 : 0;

      return {
        id: contrato.id,
        loteNumero: contrato.lote?.numeroLote || 'N/A',
        fraccionamiento: contrato.lote?.fraccionamiento?.nombre || 'Desconocido',
        fechaContrato: contrato.fechaContrato ? contrato.fechaContrato.toISOString().split('T')[0] : 'N/A',
        estatus: contrato.estatus || 'ACTIVO',
        totalPagado,
        montoTotal,
        progresoPagos,
      };
    });

    return {
      clienteNombre: `${cliente.nombre} ${cliente.apellidoPaterno}`,
      clienteEmail: cliente.email,
      contratos: contratosSummary,
    };
  }
}
