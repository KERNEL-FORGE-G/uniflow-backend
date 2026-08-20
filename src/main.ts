import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

<<<<<<< Updated upstream
=======
  //app.setGlobalPrefix('api/v1');
  // Protection des en-têtes HTTP (§9.3 du CDC)
  // Assouplissement temporaire de la CSP pour permettre Swagger et les outils Vercel/Translate
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com", "https://*.vercel.live"],
          styleSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com", "https://translate.googleapis.com", "https://www.gstatic.com"],
          imgSrc: ["'self'", "data:", "https://validator.swagger.io", "https://*.googleapis.com", "https://*.gstatic.com"],
          connectSrc: ["'self'", "https://*.vercel.live"],
        },
      },
    }),
  );

>>>>>>> Stashed changes
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

  app.enableCors(); // à restreindre en liste blanche en prod (§9.3)

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap().catch((err) => {
  console.error("Erreur au démarrage de l'application:", err);
  process.exit(1);
});
