import { Module } from '@nestjs/common';
import { ReportesController } from './reportes.controller';
import { PdfService } from './pdf.service';
import { ExcelService } from './excel.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ReportesController],
  providers: [PdfService, ExcelService],
})
export class ReportesModule {}
