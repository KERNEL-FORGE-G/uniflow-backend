import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Protection des en-têtes HTTP (§9.3 du CDC)
  app.use(helmet());

  // Validation automatique des DTO (class-validator) — §7.2 du CDC
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(
    new LoggingInterceptor(),
    new TransformInterceptor(),
  );

  // Configuration CORS sécurisée (§9.3)
  const allowedOrigins = process.env.CORS_ALLOWED_ORIGINS
    ? process.env.CORS_ALLOWED_ORIGINS.split(',')
    : ['http://localhost:3000', 'http://localhost:5173'];

  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
  });

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap().catch((err) => {
  console.error("Erreur au démarrage de l'application:", err);
  process.exit(1);
});
