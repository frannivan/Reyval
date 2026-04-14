import { Controller, Get } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Public } from '../auth/decorators/public.decorator';

@Controller('health')
export class HealthController {
  constructor(private prisma: PrismaService) {}

  @Public()
  @Get()
  async check() {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return { status: 'ok', database: 'connected' };
    } catch (e) {
      return { status: 'error', database: 'disconnected', error: e.message };
    }
  }
}
