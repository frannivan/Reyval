import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { LotesService } from './lotes.service';
import { Public } from '../auth/decorators/public.decorator';

@Controller('lotes')
export class LotesController {
  constructor(private readonly lotesService: LotesService) {}

  @Public()
  @Get('public')
  async getPublicLotes(
    @Query('fraccionamientoId') fraccionamientoId?: string,
    @Query('ubicacion') ubicacion?: string,
    @Query('sortDir') sortDir?: string,
  ) {
    return this.lotesService.findAllPublic({
      fraccionamientoId: fraccionamientoId ? parseInt(fraccionamientoId) : undefined,
      ubicacion,
      sortDir: (sortDir as 'asc' | 'desc') || 'asc',
    });
  }

  @Public()
  @Get('public/:id')
  async getLoteById(@Param('id') id: string) {
    return this.lotesService.findOne(parseInt(id));
  }

  @Get('all')
  async getAllLotes() {
    return this.lotesService.findAll();
  }

  @Public()
  @Get('public/by-fraccionamiento/:id')
  async getPublicByFracc(@Param('id') id: string) {
    return this.lotesService.findByFraccionamientoPublic(parseInt(id, 10));
  }

  @Get('adm/by-fraccionamiento/:id')
  async getAdminByFracc(@Param('id') id: string) {
    return this.lotesService.findByFraccionamientoAdmin(parseInt(id, 10));
  }

  @Post('create')
  async createLote(@Body() data: any) {
    return this.lotesService.create(data);
  }

  @Put(':id')
  async updateLote(@Param('id') id: string, @Body() data: any) {
    return this.lotesService.update(parseInt(id, 10), data);
  }

  @Delete(':id')
  async deleteLote(@Param('id') id: string) {
    return this.lotesService.delete(parseInt(id, 10));
  }

  @Put('adm/:id/poligono')
  async updatePoligono(@Param('id') id: string, @Body() rawBody: string) {
    return this.lotesService.updatePoligono(parseInt(id, 10), rawBody);
  }

  @Delete('adm/:id/poligono')
  async deletePoligono(@Param('id') id: string) {
    return this.lotesService.deletePoligono(parseInt(id, 10));
  }
}
