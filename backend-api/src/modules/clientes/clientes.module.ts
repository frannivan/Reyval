import { Module } from '@nestjs/common';
import { ClientesService } from './clientes.service';
import { ClientesController } from './clientes.controller';
import { ClientPortalController } from './client-portal.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [ClientesService],
  controllers: [ClientesController, ClientPortalController],
  exports: [ClientesService],
})
export class ClientesModule {}
