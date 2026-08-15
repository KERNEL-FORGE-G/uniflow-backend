import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('health')
  getHealth() {
    const databaseUrl = process.env.DATABASE_URL
      || process.env.POSTGRES_PRISMA_URL
      || process.env.POSTGRES_URL
      || process.env.DATABASE_URL_UNPOOLED
      || process.env.NEON_DATABASE_URL
      || '';
    return {
      success: true,
      data: {
        status: 'ok',
        runtime: process.env.VERCEL ? 'vercel' : 'unknown',
        databaseConfigured: /^postgres(?:ql)?:\/\//i.test(databaseUrl.trim()),
      },
    };
  }
}
