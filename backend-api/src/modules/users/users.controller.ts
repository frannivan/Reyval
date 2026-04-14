import { Controller, Get, Post, Param, Body } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Controller('users')
export class UsersController {
  constructor(private prisma: PrismaService) {}

  @Post('change-password')
  async changePassword(@Body() body: { currentPassword: string; newPassword: string }) {
    // TODO: integrate with real auth context to get current user
    return { message: 'Contraseña actualizada exitosamente!' };
  }

  @Get('vendedores')
  async getVendedores() {
    const users = await this.prisma.user.findMany({
      where: { role: { name: 'ROLE_VENDEDOR' } },
      include: { role: true },
    });
    return users.map(u => ({ id: u.id, username: u.username, email: u.email }));
  }
}
