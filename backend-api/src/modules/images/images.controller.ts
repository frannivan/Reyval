import { Controller, Get, Post, Param, Res, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuid } from 'uuid';
import { Public } from '../auth/decorators/public.decorator';

const UPLOAD_DIR = path.join(process.cwd(), 'uploads');

@Controller('images')
export class ImagesController {
  constructor() {
    if (!fs.existsSync(UPLOAD_DIR)) {
      fs.mkdirSync(UPLOAD_DIR, { recursive: true });
    }
  }

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  upload(@UploadedFile() file: any) {
    if (!file) {
      throw new Error('Archivo no proporcionado');
    }
    console.log('--- BACKEND UPLOAD: Received file:', file.originalname, 'Size:', file.size);
    const ext = path.extname(file.originalname);
    const filename = `${uuid()}${ext}`;
    const dest = path.join(UPLOAD_DIR, filename);
    fs.writeFileSync(dest, file.buffer);
    const fileUrl = `/api/images/${filename}`;
    console.log('--- BACKEND UPLOAD: Saved to:', dest, 'URL:', fileUrl);
    return { url: fileUrl, message: fileUrl };
  }

  @Public()
  @Get(':filename')
  getFile(@Param('filename') filename: string, @Res() res: Response) {
    const filePath = path.join(UPLOAD_DIR, filename);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: 'Archivo no encontrado' });
    }
    return res.sendFile(filePath);
  }
}
