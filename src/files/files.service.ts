import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EntityType } from '@prisma/client';

interface AppwriteFileResponse {
  $id: string;
}

@Injectable()
export class FilesService {
  private readonly endpoint = String(
    process.env.APPWRITE_ENDPOINT || 'https://appwrite.kernelforge.codes/v1',
  ).replace(/\/+$/, '');
  private readonly projectId = process.env.APPWRITE_PROJECT_ID || '6a959096002a64d9d4e6';
  private readonly bucketId = process.env.APPWRITE_STORAGE_BUCKET_ID || 'uniflow_assets';
  private readonly apiKey = process.env.APPWRITE_API_KEY;

  constructor(private readonly prisma: PrismaService) {}

  private ensureStorageConfig() {
    if (!this.apiKey) {
      throw new InternalServerErrorException(
        'APPWRITE_API_KEY est manquante pour utiliser Appwrite Storage.',
      );
    }
  }

  private appwriteHeaders() {
    this.ensureStorageConfig();
    return {
      'X-Appwrite-Project': this.projectId,
      'X-Appwrite-Key': this.apiKey as string,
    };
  }

  async uploadFile(file: any, entityType: EntityType, entityId: string) {
    if (!file?.buffer || !file.originalname) {
      throw new InternalServerErrorException('Fichier uploadé invalide.');
    }

    const form = new FormData();
    form.set('fileId', 'unique()');
    form.set(
      'file',
      new Blob([file.buffer], { type: file.mimetype || 'application/octet-stream' }),
      file.originalname,
    );

    const response = await fetch(
      `${this.endpoint}/storage/buckets/${encodeURIComponent(this.bucketId)}/files`,
      {
        method: 'POST',
        headers: this.appwriteHeaders(),
        body: form,
      },
    );

    const payload = (await response.json().catch(() => ({}))) as AppwriteFileResponse & {
      message?: string;
    };
    if (!response.ok || !payload.$id) {
      throw new InternalServerErrorException(
        `Appwrite Storage upload failed (${response.status}): ${payload.message || 'réponse invalide'}`,
      );
    }

    const url = `${this.endpoint}/storage/buckets/${encodeURIComponent(this.bucketId)}/files/${encodeURIComponent(payload.$id)}/view?project=${encodeURIComponent(this.projectId)}`;
    return (this.prisma as any).attachment.create({
      data: {
        url,
        publicId: payload.$id,
        filename: file.originalname,
        mimeType: file.mimetype || 'application/octet-stream',
        size: Number(file.size || file.buffer.length),
        entityType,
        entityId,
      },
    });
  }

  async deleteFile(id: string) {
    const attachment = await (this.prisma as any).attachment.findUnique({ where: { id } });
    if (!attachment) return;

    const response = await fetch(
      `${this.endpoint}/storage/buckets/${encodeURIComponent(this.bucketId)}/files/${encodeURIComponent(attachment.publicId)}`,
      { method: 'DELETE', headers: this.appwriteHeaders() },
    );
    if (!response.ok && response.status !== 404) {
      const payload = await response.json().catch(() => ({}));
      throw new InternalServerErrorException(
        `Appwrite Storage delete failed (${response.status}): ${payload.message || 'erreur inconnue'}`,
      );
    }

    await (this.prisma as any).attachment.delete({ where: { id } });
  }
}
