import { Controller, Get, Post, Put, Delete, Body, Param } from '@nestjs/common';
import { FraccionamientosService } from './fraccionamientos.service';
import { Public } from '../auth/decorators/public.decorator';

@Controller('fraccionamientos')
export class FraccionamientosController {
  constructor(private readonly fraccionamientosService: FraccionamientosService) {}

  @Public()
  @Get('public')
  async getAllPublic() {
    return this.fraccionamientosService.findAllPublic();
  }

  @Public()
  @Get('public/:id')
  async getOnePublic(@Param('id') id: string) {
    return this.fraccionamientosService.findOnePublic(parseInt(id, 10));
  }

  @Post('create')
  async create(@Body() data: any) {
    return this.fraccionamientosService.create(data);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() data: any) {
    return this.fraccionamientosService.update(parseInt(id, 10), data);
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    return this.fraccionamientosService.delete(parseInt(id, 10));
  }

  @Put('adm/:id/poligono')
  async updatePoligono(@Param('id') id: string, @Body() rawBody: string) {
    return this.fraccionamientosService.updatePoligono(parseInt(id, 10), rawBody);
  }

  @Delete('adm/:id/poligono')
  async deletePoligono(@Param('id') id: string) {
    return this.fraccionamientosService.deletePoligono(parseInt(id, 10));
  }
}
