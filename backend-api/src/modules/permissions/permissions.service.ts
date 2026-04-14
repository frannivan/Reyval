import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PermissionsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Obtiene todos los permisos configurados en la base de datos.
   * El frontend filtra estos permisos según el rol del usuario logueado.
   */
  async findAll() {
    return this.prisma.permission.findMany({
      orderBy: { permissionKey: 'asc' },
    });
  }

  /**
   * Inicializa un set de permisos por defecto si la tabla está vacía.
   * Esto asegura que el Administrador siempre pueda ver los menús tras la migración.
   */
  async ensureDefaultPermissions() {
    const count = await this.prisma.permission.count();
    if (count === 0) {
      const adminMenus = [
        'home', 'admin_dashboard', 'leads', 'opportunities', 'clientes',
        'fraccionamientos', 'lotes', 'cotizaciones', 'contratos', 'section:pagos',
        'payments_view', 'contracts_view', 'users', 'permissions', 'reportes',
        'carga_datos', 'documentacion'
      ];

      const permissionsData = adminMenus.map(menu => ({
        roleName: 'ROLE_ADMIN',
        permissionKey: `menu:${menu}`,
        enabled: true,
      }));

      await this.prisma.permission.createMany({
        data: permissionsData,
      });
    }
  }
}
