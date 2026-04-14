import { Module } from '@nestjs/common';
import { FraccionamientosController } from './fraccionamientos.controller';
import { FraccionamientosService } from './fraccionamientos.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [FraccionamientosController],
  providers: [FraccionamientosService],
})
export class FraccionamientosModule {}
