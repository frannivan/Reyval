import { Module } from '@nestjs/common';
import { LotesService } from './lotes.service';
import { LotesController } from './lotes.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [LotesService],
  controllers: [LotesController],
})
export class LotesModule {}
