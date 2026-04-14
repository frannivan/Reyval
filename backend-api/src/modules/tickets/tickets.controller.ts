import { Controller, Get, Post, Put, Param, Body, UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { PrismaService } from '../prisma/prisma.service';
import * as path from 'path';
import * as fs from 'fs';
import { v4 as uuid } from 'uuid';

const UPLOAD_DIR = path.join(process.cwd(), 'uploads');

@Controller('tickets')
export class TicketsController {
  constructor(private prisma: PrismaService) {}

  @Get()
  async getAll() {
    return this.prisma.ticket.findMany({ 
      include: { 
        user: { 
          include: { 
            role: true 
          } 
        }, 
        mensajes: true 
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  @Post()
  @UseInterceptors(FileInterceptor('file'))
  async create(@Body() body: any, @UploadedFile() file: any) {
    let evidenciaUrl = null;

    if (file) {
      if (!fs.existsSync(UPLOAD_DIR)) {
        fs.mkdirSync(UPLOAD_DIR, { recursive: true });
      }
      const ext = path.extname(file.originalname);
      const filename = `${uuid()}${ext}`;
      const dest = path.join(UPLOAD_DIR, filename);
      fs.writeFileSync(dest, file.buffer);
      evidenciaUrl = `/api/images/${filename}`;
    }

    return this.prisma.ticket.create({
      data: {
        titulo: body.titulo,
        descripcion: body.descripcion,
        prioridad: body.prioridad || 'MEDIA',
        tipo: body.tipo || 'INCIDENCIA',
        evidenciaUrl: evidenciaUrl,
        rolesDestino: body.rolesDestino || null,
        pasosReplicacion: body.pasosReplicacion || null,
        registroAfectado: body.registroAfectado || null,
        estatus: 'ABIERTO',
        userId: body.userId,
      },
    });
  }

  @Put(':id/status')
  async updateStatus(@Param('id') id: string, @Body() body: { status: string }) {
    await this.prisma.ticket.update({
      where: { id: parseInt(id) },
      data: { estatus: body.status },
    });
    return { message: `Estatus actualizado a ${body.status}` };
  }

  @Post(':id/comentario')
  async addComment(@Param('id') id: string, @Body() body: { comment: string; userId: string }) {
    return this.prisma.mensaje.create({
      data: {
        ticketId: parseInt(id),
        userId: body.userId,
        contenido: body.comment,
      },
    });
  }
}
