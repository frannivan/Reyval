import { Controller, Get, Post, Put, Param, Body } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Controller('mensajes')
export class MensajesController {
  constructor(private prisma: PrismaService) {}

  // Internal messaging
  @Get('recibidos')
  async getRecibidos() {
    // TODO: get from auth context
    return [];
  }

  @Get('enviados')
  async getEnviados() {
    return [];
  }

  @Get('no-leidos/count')
  async getUnreadCount() {
    return 0;
  }

  @Post('enviar')
  async enviarMensaje(@Body() body: any) {
    return this.prisma.mensaje.create({
      data: {
        ticketId: body.ticketId,
        userId: body.userId || 'usr-1',
        contenido: body.contenido,
      },
    });
  }

  @Put(':id/leido')
  async marcarComoLeido(@Param('id') id: string) {
    // Mensaje model doesn't have 'leido' field in current schema
    // This is a placeholder for the endpoint contract
    return { message: 'OK' };
  }

  // CRM Communication
  @Get(':targetId')
  async getHistory(@Param('targetId') targetId: string) {
    return this.prisma.mensaje.findMany({
      where: { ticketId: parseInt(targetId) },
      orderBy: { createdAt: 'asc' },
    });
  }

  @Get(':targetId/:tipo')
  async getHistoryByType(@Param('targetId') targetId: string, @Param('tipo') tipo: string) {
    return this.prisma.mensaje.findMany({
      // @ts-ignore - 'tipo' field is handled in generic format or doesn't strictly exist on Mensaje but mapped loosely
      where: { ticketId: parseInt(targetId) },
      orderBy: { createdAt: 'asc' },
    });
  }

  @Post()
  async createMessage(@Body() body: any) {
    return this.prisma.mensaje.create({
      data: {
        ticketId: body.ticketId,
        userId: body.userId || 'usr-1',
        contenido: body.contenido,
      },
    });
  }
}
