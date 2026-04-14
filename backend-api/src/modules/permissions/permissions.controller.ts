import { Controller, Get, Post, UseGuards } from '@nestjs/common';
import { PermissionsService } from './permissions.service';

@Controller('permissions')
export class PermissionsController {
  constructor(private readonly permissionsService: PermissionsService) {}

  @Get()
  async getPermissions() {
    // Si no hay permisos, intentamos cargar los por defecto (ROLE_ADMIN)
    await this.permissionsService.ensureDefaultPermissions();
    return this.permissionsService.findAll();
  }

  @Post('reset')
  async resetPermissions() {
    // Podríamos implementar un reset total aquí si fuera necesario
    return this.permissionsService.ensureDefaultPermissions();
  }
}
