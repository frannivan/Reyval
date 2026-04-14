import { Controller, Get, Post, Put, Delete, Param, Body, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcryptjs';

@Controller('admin')
export class AdminController {
  constructor(private prisma: PrismaService) {}

  @Get('users')
  async getAllUsers() {
    const users = await this.prisma.user.findMany({ include: { role: true } });
    return users.map(u => ({ 
      id: u.id, 
      username: u.username, 
      email: u.email, 
      name: u.name,
      phone: u.phone,
      role: u.role?.name?.replace('ROLE_', '') || 'CLIENTE' 
    }));
  }

  @Post('users')
  async createUser(@Body() body: any) {
    try {
      const roleName = body.role ? `ROLE_${body.role.toUpperCase()}` : 'ROLE_CLIENTE';
      
      // Upsert role to ensure it exists (handling ROLE_CLIENTE and others)
      const role = await this.prisma.role.upsert({
        where: { name: roleName },
        update: {},
        create: { name: roleName }
      });

      const hashedPassword = body.password ? bcrypt.hashSync(body.password, 10) : undefined;
      const userName = body.name || `Nuevo Usuario ${Math.floor(Math.random() * 1000)}`;

      await this.prisma.user.create({
        data: {
          id: `usr-${Date.now()}`,
          username: body.username,
          email: body.email,
          name: userName,
          phone: body.phone,
          password: hashedPassword,
          emailVerified: false,
          roleId: role.id,
        },
      });
      return { message: 'Usuario creado exitosamente' };
    } catch (error) {
      if (error.code === 'P2002') {
        throw new ConflictException('El nombre de usuario o correo ya existe.');
      }
      throw error;
    }
  }

  @Put('users/:id')
  async updateUser(@Param('id') id: string, @Body() body: any) {
    try {
      const data: any = {
        username: body.username,
        email: body.email,
        name: body.name,
        phone: body.phone,
      };

      if (body.password) {
        data.password = bcrypt.hashSync(body.password, 10);
      }

      if (body.role) {
        const roleName = `ROLE_${body.role.toUpperCase()}`;
        const role = await this.prisma.role.upsert({
          where: { name: roleName },
          update: {},
          create: { name: roleName }
        });
        data.roleId = role.id;
      }

      await this.prisma.user.update({
        where: { id },
        data,
      });
      return { message: 'Usuario actualizado exitosamente' };
    } catch (error) {
      if (error.code === 'P2002') {
        throw new ConflictException('El nombre de usuario o correo ya existe.');
      }
      throw error;
    }
  }

  @Delete('users/:id')
  async deleteUser(@Param('id') id: string) {
    await this.prisma.user.delete({ where: { id } });
    return { message: 'Usuario eliminado exitosamente' };
  }
}
