import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class LotesService {
  constructor(private prisma: PrismaService) {}

  async findAllPublic(filters: { fraccionamientoId?: number; ubicacion?: string; sortDir: 'asc' | 'desc' }) {
    const { fraccionamientoId, ubicacion, sortDir } = filters;
    
    return this.prisma.lote.findMany({
      where: {
        estatus: { in: ['DISPONIBLE', 'APARTADO'] },
        fraccionamientoId: fraccionamientoId || undefined,
        fraccionamiento: ubicacion ? { ubicacion: { contains: ubicacion } } : undefined,
      },
      include: {
        fraccionamiento: true,
        imagenes: true,
      },
      orderBy: {
        precioTotal: sortDir,
      },
    });
  }

  async findOne(id: number) {
    const lote = await this.prisma.lote.findUnique({
      where: { id },
      include: {
        fraccionamiento: true,
        imagenes: true,
      },
    });
    if (!lote) throw new NotFoundException('Lote no encontrado');

    // Parse galeriaImagenes if it exists
    if (lote.galeriaImagenes) {
      try {
        (lote as any).galeriaImagenes = JSON.parse(lote.galeriaImagenes);
      } catch (e) {
        (lote as any).galeriaImagenes = [];
      }
    } else {
      (lote as any).galeriaImagenes = [];
    }

    return lote;
  }

  async findAll() {
    return this.prisma.lote.findMany({
      include: {
        fraccionamiento: true,
      },
    });
  }

  async findByFraccionamientoPublic(fraccionamientoId: number) {
    return this.prisma.lote.findMany({
      where: {
        fraccionamientoId,
        estatus: { in: ['DISPONIBLE', 'APARTADO', 'VENDIDO'] },
      },
      include: { imagenes: true },
    });
  }

  async findByFraccionamientoAdmin(fraccionamientoId: number) {
    return this.prisma.lote.findMany({
      where: { fraccionamientoId },
      include: { imagenes: true },
    });
  }

  async create(data: any) {
    return this.prisma.lote.create({ data });
  }

  async update(id: number, data: any) {
    const lote = await this.prisma.lote.findUnique({ where: { id } });
    if (!lote) throw new NotFoundException('Lote no encontrado');

    // Clean relations and non-persistent fields
    const { fraccionamiento, imagenes, contratoes, Opportunity, ...cleanData } = data;

    // Handle galeriaImagenes if it's an array
    if (Array.isArray(cleanData.galeriaImagenes)) {
      cleanData.galeriaImagenes = JSON.stringify(cleanData.galeriaImagenes);
    }
    
    // Convert status to string if it somehow isn't
    if (cleanData.estatus) {
      cleanData.estatus = String(cleanData.estatus);
    }

    return this.prisma.lote.update({
      where: { id },
      data: cleanData,
    });
  }

  async delete(id: number) {
    const lote = await this.prisma.lote.findUnique({ where: { id } });
    if (!lote) throw new NotFoundException('Lote no encontrado');
    return this.prisma.lote.delete({ where: { id } });
  }

  async updatePoligono(id: number, polygonData: string) {
    const lote = await this.prisma.lote.findUnique({ where: { id } });
    if (!lote) throw new NotFoundException('Lote no encontrado');
    return this.prisma.lote.update({
      where: { id },
      data: { planoCoordinates: polygonData },
    });
  }

  async deletePoligono(id: number) {
    const lote = await this.prisma.lote.findUnique({ where: { id } });
    if (!lote) throw new NotFoundException('Lote no encontrado');
    return this.prisma.lote.update({
      where: { id },
      data: { planoCoordinates: null },
    });
  }
}
