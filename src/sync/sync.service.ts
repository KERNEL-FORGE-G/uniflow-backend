import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SyncOperationDto, SyncableEntity } from './dto/sync-push.dto';

export interface SyncResult {
  recordId: string;
  entity: SyncableEntity;
  status: 'applied' | 'conflict_resolved' | 'rejected';
  reason?: string;
}

@Injectable()
export class SyncService {
  constructor(private prisma: PrismaService) {}

  /**
   * Retourne le "delegate" Prisma correspondant au nom d'entité envoyé par le client.
   * C'est le point central qui permet de traiter dynamiquement plusieurs tables
   * avec la même logique, plutôt que de dupliquer le code par entité.
   */
  private getModelDelegate(entity: SyncableEntity) {
    switch (entity) {
      case 'student':
        return this.prisma.student;
      case 'teacher':
        return this.prisma.teacher;
      case 'teachingUnit':
        return this.prisma.teachingUnit;
      case 'enrollment':
        return this.prisma.enrollment;
      default:
        throw new BadRequestException(`Entité inconnue : ${entity}`);
    }
  }

  async push(operations: SyncOperationDto[]): Promise<SyncResult[]> {
    const results: SyncResult[] = [];

    for (const op of operations) {
      try {
        const result = await this.applyOperation(op);
        results.push(result);
      } catch (error) {
        results.push({
          recordId: op.recordId,
          entity: op.entity,
          status: 'rejected',
          reason: error instanceof Error ? error.message : 'Erreur inconnue',
        });
      }
    }

    return results;
  }

  private async applyOperation(op: SyncOperationDto): Promise<SyncResult> {
    const model = this.getModelDelegate(op.entity);

    if (op.operation === 'create') {
      await (model as any).create({
        data: { id: op.recordId, ...op.data },
      });
      return { recordId: op.recordId, entity: op.entity, status: 'applied' };
    }

    if (op.operation === 'delete') {
      await (model as any).update({
        where: { id: op.recordId },
        data: { deletedAt: new Date() },
      });
      return { recordId: op.recordId, entity: op.entity, status: 'applied' };
    }

    // operation === 'update' -> résolution de conflit Last-Write-Wins (§6.3 du CDC)
    const existing = await (model as any).findUnique({
      where: { id: op.recordId },
    });

    if (!existing) {
      // L'enregistrement n'existe pas encore côté serveur -> on le crée
      await (model as any).create({
        data: { id: op.recordId, ...op.data },
      });
      return { recordId: op.recordId, entity: op.entity, status: 'applied' };
    }

    const serverUpdatedAt = new Date(existing.updatedAt).getTime();
    const clientUpdatedAt = new Date(op.updatedAt).getTime();

    if (clientUpdatedAt >= serverUpdatedAt) {
      // Le client a la version la plus récente -> elle l'emporte (LWW)
      await (model as any).update({
        where: { id: op.recordId },
        data: op.data,
      });
      return { recordId: op.recordId, entity: op.entity, status: 'applied' };
    }

    // Le serveur a une version plus récente -> le client "perd" le conflit,
    // sa donnée locale sera écrasée au prochain pull.
    return {
      recordId: op.recordId,
      entity: op.entity,
      status: 'conflict_resolved',
      reason: 'Le serveur avait une version plus récente (LWW)',
    };
  }

  async pull(since?: string) {
    const sinceDate = since ? new Date(since) : new Date(0);

    const [students, teachers, teachingUnits, enrollments] = await Promise.all([
      this.prisma.student.findMany({
        where: { updatedAt: { gt: sinceDate } },
      }),
      this.prisma.teacher.findMany({
        where: { updatedAt: { gt: sinceDate } },
      }),
      this.prisma.teachingUnit.findMany({
        where: { updatedAt: { gt: sinceDate } },
      }),
      this.prisma.enrollment.findMany({
        where: { updatedAt: { gt: sinceDate } },
      }),
    ]);

    return {
      serverTime: new Date().toISOString(),
      changes: {
        student: students,
        teacher: teachers,
        teachingUnit: teachingUnits,
        enrollment: enrollments,
      },
    };
  }
}
