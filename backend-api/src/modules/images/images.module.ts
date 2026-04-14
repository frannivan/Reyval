import { Module } from '@nestjs/common';
import { ImagesController } from './images.controller';
import { MulterModule } from '@nestjs/platform-express';

@Module({
  imports: [MulterModule.register({ limits: { fileSize: 50 * 1024 * 1024 } })],
  controllers: [ImagesController],
})
export class ImagesModule {}
