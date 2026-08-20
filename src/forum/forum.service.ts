import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateForumEntryDto } from './dto/create-forum-entry.dto';

@Injectable()
export class ForumService {
  constructor(private readonly prisma: PrismaService) {}

  create(dto: CreateForumEntryDto) {
    return this.prisma.forum.create({ data: dto });
  }

  async findAll(page = 1, pageSize = 20) {
    const skip = (page - 1) * pageSize;
    const [items, total] = await Promise.all([
      this.prisma.forum.findMany({
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.forum.count(),
    ]);
    return { items, page, pageSize, total, totalPages: Math.ceil(total / pageSize) };
  }

  async findOne(id: string) {
    const entry = await this.prisma.forum.findUnique({ where: { id } });
    if (!entry) throw new NotFoundException('Entrée introuvable');
    return entry;
  }

  async like(id: string) {
    await this.findOne(id); // 404 si absent
    return this.prisma.forum.update({
      where: { id },
      data: { likes: { increment: 1 } },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    // Pas de soft delete ici : le Forum n'a pas deletedAt dans le schéma (§8.3 ne s'applique
    // qu'aux tables métier internes) — suppression définitive assumée pour la modération.
    await this.prisma.forum.delete({ where: { id } });
  }
}