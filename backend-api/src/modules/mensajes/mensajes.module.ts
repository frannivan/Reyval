import { Module } from '@nestjs/common';
import { MensajesController } from './mensajes.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({ imports: [PrismaModule], controllers: [MensajesController] })
export class MensajesModule {}
