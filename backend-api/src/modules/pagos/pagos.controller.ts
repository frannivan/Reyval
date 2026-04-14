import { Controller, Get, Post, Body, Param, Req } from '@nestjs/common';
import { PagosService } from './pagos.service';
import { PrismaService } from '../prisma/prisma.service';

@Controller('pagos')
export class PagosController {
  constructor(
    private readonly pagosService: PagosService,
    private readonly prisma: PrismaService
  ) {}

  @Post('registrar')
  async registrarPago(@Body() body: any) {
    return this.pagosService.registrarPago(body);
  }

  @Get('all')
  async getAllPagos() {
    return this.pagosService.getAllPagos();
  }

  @Get('contrato/:id')
  async getPagosByContrato(@Param('id') id: string) {
    return this.pagosService.getPagosByContrato(Number(id));
  }

  @Post(':id/validate')
  async validatePago(@Param('id') id: string, @Body() body: { status: string }, @Req() req: any) {
    const validadoPor = req.user?.username || 'sistema';
    return this.pagosService.validatePago(Number(id), body.status, validadoPor);
  }

  @Get('pendientes')
  async getPagosPendientes() {
    return this.pagosService.getPagosPendientes();
  }

  @Get('mis-pagos')
  async getMisPagos(@Req() req: any) {
    // Standard extraction of user identity from JWT
    const userId = req.user.userId || req.user.sub || req.user.id;
    const role = req.user.role;

    // Admin/Reception see everything
    if (role === 'ROLE_ADMIN' || role === 'ROLE_RECEPCION') {
      return this.pagosService.getAllPagos();
    }

    // For clients, we fetch their specific client record first to ensure data integrity
    if (!userId) return [];
    
    const cliente = await this.prisma.cliente.findFirst({
      where: { user: { id: String(userId) } }
    });

    if (!cliente) {
      return []; // No client record linked yet
    }

    // Return payments filtered by the client's contract ID
    return this.prisma.pago.findMany({
      where: { 
        contrato: { 
          clienteId: cliente.id 
        } 
      },
      include: { 
        contrato: { 
          include: { 
            lote: true 
          } 
        } 
      },
      orderBy: { fechaPago: 'desc' },
    });
  }
}
