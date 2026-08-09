import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { encrypt } from '../common/utils/encryption.util';
import { TABLE_CONFIG, TableConfig } from './table-config';

interface PrismaDelegate {
  findMany(args?: {
    where?: Record<string, unknown>;
    take?: number;
    orderBy?: Record<string, unknown>;
  }): Promise<Record<string, unknown>[]>;
  create(args: {
    data: Record<string, unknown>;
  }): Promise<Record<string, unknown>>;
}

@Injectable()
export class AdminToolService {
  constructor(private readonly prisma: PrismaService) {}

  listTables() {
    return Object.entries(TABLE_CONFIG).map(([key, cfg]) => ({
      key,
      label: cfg.label,
      group: cfg.group,
    }));
  }

  async getFormSchema(tableKey: string) {
    const config = this.getConfig(tableKey);

    const fields = await Promise.all(
      config.fields.map(async (field) => {
        if (field.type === 'foreignKey' && field.foreignKey) {
          const options = await this.getOptions(field.foreignKey.table);
          return { ...field, options };
        }
        return field;
      }),
    );

    return { key: tableKey, label: config.label, fields };
  }

  private async getOptions(
    tableKey: string,
  ): Promise<{ value: unknown; label: string }[]> {
    const config = this.getConfig(tableKey);
    const delegate = this.getDelegate(config.model);
    const records = await delegate.findMany({
      where: { deletedAt: null },
      take: 500,
      orderBy: { createdAt: 'desc' },
    });
    return records.map((r) => ({
      value: r['id'],
      label: config.getLabel(r),
    }));
  }

  async insert(tableKey: string, rawData: Record<string, unknown>) {
    const config = this.getConfig(tableKey);
    const delegate = this.getDelegate(config.model);
    const payload: Record<string, unknown> = { ...rawData };

    // Nettoyage : retire les champs vides/non fournis pour laisser les defaults Prisma s'appliquer
    Object.keys(payload).forEach((key) => {
      if (
        payload[key] === '' ||
        payload[key] === undefined ||
        payload[key] === null
      ) {
        delete payload[key];
      }
    });

    // Conversion de types (tout arrive en string depuis le formulaire HTML)
    for (const field of config.fields) {
      if (payload[field.name] === undefined) continue;
      const val = payload[field.name];
      if (field.type === 'int') {
        payload[field.name] =
          typeof val === 'number' ? val : parseInt(val as string, 10);
      }
      if (field.type === 'boolean') {
        payload[field.name] = val === true || val === 'true';
      }
      if (field.type === 'date' || field.type === 'datetime') {
        payload[field.name] = new Date(val as string | number | Date);
      }
    }

    // Cas spéciaux : jamais de mot de passe ni de secret en clair en base
    if (config.specialHandling === 'hashPassword') {
      if (typeof payload.password !== 'string' || !payload.password) {
        throw new BadRequestException('Le mot de passe est requis');
      }
      payload.passwordHash = await bcrypt.hash(payload.password, 12);
      delete payload.password;
    }
    if (config.specialHandling === 'encryptSecret') {
      if (typeof payload.apiSecret !== 'string' || !payload.apiSecret) {
        throw new BadRequestException('Le secret API est requis');
      }
      payload.apiSecretEncrypted = encrypt(payload.apiSecret);
      delete payload.apiSecret;
    }

    try {
      const record = await delegate.create({ data: payload });
      return { success: true, record };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      throw new BadRequestException(`Échec de l'insertion : ${message}`);
    }
  }

  private getConfig(tableKey: string): TableConfig {
    const config = TABLE_CONFIG[tableKey];
    if (!config) throw new NotFoundException(`Table "${tableKey}" inconnue`);
    return config;
  }

  private getDelegate(modelName: string): PrismaDelegate {
    return (this.prisma as unknown as Record<string, PrismaDelegate>)[
      modelName
    ];
  }
}
