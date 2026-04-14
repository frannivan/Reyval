import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class FraccionamientosService {
  constructor(private prisma: PrismaService) {}

  async findAllPublic() {
    return this.prisma.fraccionamiento.findMany();
  }

  async findOnePublic(id: number) {
    const fracc = await this.prisma.fraccionamiento.findUnique({
      where: { id },
    });
    if (!fracc) throw new NotFoundException('Fraccionamiento no encontrado');

    // Parse galeriaImagenes if it exists
    if (fracc.galeriaImagenes) {
      try {
        (fracc as any).galeriaImagenes = JSON.parse(fracc.galeriaImagenes);
      } catch (e) {
        (fracc as any).galeriaImagenes = [];
      }
    } else {
      (fracc as any).galeriaImagenes = [];
    }

    return fracc;
  }

  async create(data: any) {
    return this.prisma.fraccionamiento.create({ data });
  }

  async update(id: number, data: any) {
    const fracc = await this.prisma.fraccionamiento.findUnique({ where: { id } });
    if (!fracc) throw new NotFoundException('Fraccionamiento no encontrado');

    // Clean relations and non-persistent fields
    const { lotes, imagenes, ...cleanData } = data;

    // Handle galeriaImagenes if it's an array
    if (Array.isArray(cleanData.galeriaImagenes)) {
      cleanData.galeriaImagenes = JSON.stringify(cleanData.galeriaImagenes);
    }

    return this.prisma.fraccionamiento.update({
      where: { id },
      data: cleanData,
    });
  }

  async delete(id: number) {
    const fracc = await this.prisma.fraccionamiento.findUnique({ where: { id } });
    if (!fracc) throw new NotFoundException('Fraccionamiento no encontrado');
    return this.prisma.fraccionamiento.delete({ where: { id } });
  }

  async updatePoligono(id: number, polygonData: string) {
    const fracc = await this.prisma.fraccionamiento.findUnique({ where: { id } });
    if (!fracc) throw new NotFoundException('Fraccionamiento no encontrado');
    return this.prisma.fraccionamiento.update({
      where: { id },
      data: { poligonoDelimitador: polygonData },
    });
  }

  async deletePoligono(id: number) {
    const fracc = await this.prisma.fraccionamiento.findUnique({ where: { id } });
    if (!fracc) throw new NotFoundException('Fraccionamiento no encontrado');
    return this.prisma.fraccionamiento.update({
      where: { id },
      data: { poligonoDelimitador: null },
    });
  }
}
