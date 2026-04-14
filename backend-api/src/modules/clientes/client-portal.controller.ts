import { Controller, Get, Req, UnauthorizedException } from '@nestjs/common';
import { ClientesService } from './clientes.service';

@Controller('client')
export class ClientPortalController {
  constructor(private readonly clientesService: ClientesService) {}

  @Get('dashboard')
  async getDashboard(@Req() req: any) {
    const user = req.user;
    if (!user || (!user.email && !user.username)) {
      throw new UnauthorizedException('No se pudo identificar al usuario.');
    }

    // Usamos el email del JWT para encontrar al cliente vinculado
    const email = user.email || user.username; // Fallback if email is username
    return this.clientesService.getDashboardData(email);
  }
}
