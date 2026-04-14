import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

import * as express from 'express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Set global prefix to match Angular's expectations
  app.setGlobalPrefix('api');
  
  // Enable CORS for Angular frontend
  app.enableCors();
  
  // Enable JSON parsing and plain-text body parsing for Polygon Editor
  app.use(express.json());
  app.use(express.text());
  
  // Use validation pipes for DTOs
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));

  const port = process.env.PORT || 3001;
  await app.listen(port);
  console.log(`--- REYVAL BACKEND (NestJS) IS RUNNING ON PORT ${port} ---`);
}
bootstrap();
