import { Controller, Get, Post, Put, Param, Body } from '@nestjs/common';
import { ClientesService } from './clientes.service';

@Controller('clientes')
export class ClientesController {
  constructor(private readonly clientesService: ClientesService) {}

  @Get('all')
  findAll() {
    return this.clientesService.findAll();
  }

  @Get(':id')
  findById(@Param('id') id: string) {
    return this.clientesService.findById(parseInt(id));
  }

  @Get(':id/contratos')
  getContratos(@Param('id') id: string) {
    return this.clientesService.getContratos(parseInt(id));
  }

  @Post('create')
  create(@Body() body: any) {
    return this.clientesService.create(body);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() body: any) {
    return this.clientesService.update(parseInt(id), body);
  }

  @Post('public/lead')
  registerLead(@Body() body: any) {
    return this.clientesService.registerLead(body);
  }
}
