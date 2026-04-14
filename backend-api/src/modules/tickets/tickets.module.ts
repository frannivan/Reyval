import { Module } from '@nestjs/common';
import { TicketsController } from './tickets.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({ imports: [PrismaModule], controllers: [TicketsController] })
export class TicketsModule {}
