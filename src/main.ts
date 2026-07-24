// src/main.ts
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Validation automatique des DTO (class-validator) — §7.2 du CDC
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // supprime les champs non déclarés dans le DTO
      forbidNonWhitelisted: true, // rejette la requête si champ inconnu
      transform: true, // convertit automatiquement les types (string -> number, etc.)
    }),
  );

  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(new LoggingInterceptor(), new TransformInterceptor());

  app.enableCors(); // à restreindre en liste blanche en prod (§9.3)

  await app.listen(3000);
}
bootstrap();