import { Module } from '@nestjs/common';
import { FinanzasService } from './finanzas.service';

@Module({
  providers: [FinanzasService]
})
export class FinanzasModule {}
