import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

function resolveDatabaseUrl(): string {
  return process.env.DATABASE_URL
    || process.env.POSTGRES_PRISMA_URL
    || process.env.POSTGRES_URL
    || process.env.DATABASE_URL_UNPOOLED
    || process.env.NEON_DATABASE_URL
    || '';
}

function formatDatabaseUrl(rawUrl: string): string {
  const url = rawUrl.trim();
  if (!url) return '';
  if (/^https?:\/\//i.test(url)) return url.replace(/^https?:\/\//i, 'postgresql://');
  return url;
}

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    const databaseUrl = formatDatabaseUrl(resolveDatabaseUrl());
    super(databaseUrl ? { datasources: { db: { url: databaseUrl } } } : undefined);
  }

  async onModuleInit() {
    try {
      await this.$connect();
      this.logger.log('Database connected successfully');
    } catch (error: any) {
      this.logger.error(`Database connection error: ${error?.message ?? 'unknown error'}`);
      this.logger.warn('Set a valid DATABASE_URL PostgreSQL connection string to enable database-backed routes.');
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
