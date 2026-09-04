import { Injectable, InternalServerErrorException } from '@nestjs/common';

export interface AppwriteDocument {
  $id: string;
  $createdAt?: string;
  $updatedAt?: string;
  [key: string]: unknown;
}

@Injectable()
export class AppwriteService {
  private readonly endpoint = String(
    process.env.APPWRITE_ENDPOINT || 'https://appwrite.kernelforge.codes/v1',
  ).replace(/\/+$/, '');
  private readonly projectId = process.env.APPWRITE_PROJECT_ID || '6a959096002a64d9d4e6';
  private readonly databaseId = process.env.APPWRITE_DATABASE_ID || 'uniflow';
  private readonly bucketId = process.env.APPWRITE_STORAGE_BUCKET_ID || 'uniflow_assets';
  private readonly apiKey = process.env.APPWRITE_API_KEY;

  private headers() {
    if (!this.apiKey) {
      throw new InternalServerErrorException('APPWRITE_API_KEY est manquante.');
    }
    return {
      'X-Appwrite-Project': this.projectId,
      'X-Appwrite-Key': this.apiKey,
      'Content-Type': 'application/json',
    };
  }

  private async request<T>(path: string, init: RequestInit = {}): Promise<T> {
    const response = await fetch(`${this.endpoint}${path}`, {
      ...init,
      headers: { ...this.headers(), ...(init.headers || {}) },
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new InternalServerErrorException(
        `Appwrite API ${response.status}: ${payload?.message || 'erreur inconnue'}`,
      );
    }
    return payload as T;
  }

  async listDocuments(collectionId: string, queries: string[] = []) {
    const query = queries.map((value) => `queries[]=${encodeURIComponent(value)}`).join('&');
    return this.request<{ total: number; documents: AppwriteDocument[] }>(
      `/databases/${encodeURIComponent(this.databaseId)}/collections/${encodeURIComponent(collectionId)}/documents${query ? `?${query}` : ''}`,
      { method: 'GET' },
    );
  }

  async getDocument(collectionId: string, documentId: string) {
    return this.request<AppwriteDocument>(
      `/databases/${encodeURIComponent(this.databaseId)}/collections/${encodeURIComponent(collectionId)}/documents/${encodeURIComponent(documentId)}`,
      { method: 'GET' },
    );
  }

  async createDocument(collectionId: string, documentId: string, data: Record<string, unknown>) {
    return this.request<AppwriteDocument>(
      `/databases/${encodeURIComponent(this.databaseId)}/collections/${encodeURIComponent(collectionId)}/documents`,
      { method: 'POST', body: JSON.stringify({ documentId, data }) },
    );
  }

  async updateDocument(collectionId: string, documentId: string, data: Record<string, unknown>) {
    return this.request<AppwriteDocument>(
      `/databases/${encodeURIComponent(this.databaseId)}/collections/${encodeURIComponent(collectionId)}/documents/${encodeURIComponent(documentId)}`,
      { method: 'PATCH', body: JSON.stringify({ data }) },
    );
  }

  async deleteDocument(collectionId: string, documentId: string) {
    await this.request<void>(
      `/databases/${encodeURIComponent(this.databaseId)}/collections/${encodeURIComponent(collectionId)}/documents/${encodeURIComponent(documentId)}`,
      { method: 'DELETE' },
    );
  }

  get storageBucketId() {
    return this.bucketId;
  }
}
