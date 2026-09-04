import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { AppwriteService, AppwriteDocument } from '../appwrite/appwrite.service';
import { CreateTeacherDto } from './dto/create-teacher.dto';
import { UpdateTeacherDto } from './dto/update-teacher.dto';

@Injectable()
export class TeachersService {
  private readonly useAppwrite = process.env.UNIFLOW_DATA_SOURCE === 'appwrite';

  constructor(private readonly prisma: PrismaService, private readonly appwrite: AppwriteService) {}

  async create(dto: CreateTeacherDto) {
    if (this.useAppwrite) {
      const userId = `teacher_${Date.now()}`;
      const document = await this.appwrite.createDocument('academic_directory', userId, {
        userId,
        name: `${dto.firstName} ${dto.lastName}`.trim(),
        role: 'TEACHER',
        university: '',
        program: '',
        level: 'L1',
        matricule: '',
        status: 'ACTIVE',
      });
      return this.toTeacher(document);
    }

    const existingUser = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existingUser) throw new ConflictException('Un compte existe déjà avec cet email');
    const passwordHash = await bcrypt.hash(dto.password, 12);
    const user = await this.prisma.user.create({ data: { email: dto.email, passwordHash, role: 'ENSEIGNANT' } });
    return this.prisma.teacher.create({ data: { userId: user.id, firstName: dto.firstName, lastName: dto.lastName }, include: { user: { select: { email: true, role: true } } } });
  }

  async findAll(page = 1, pageSize = 20) {
    if (this.useAppwrite) {
      const result = await this.appwrite.listDocuments('academic_directory', [`equal("role", ["TEACHER"])`, `limit(${pageSize})`, `offset(${Math.max(0, (page - 1) * pageSize)})`, 'orderDesc("$createdAt")']);
      const items = result.documents.map((document) => this.toTeacher(document));
      return { items, page, pageSize, total: result.total, totalPages: Math.ceil(result.total / pageSize) };
    }

    const skip = (page - 1) * pageSize;
    const [items, total] = await Promise.all([
      this.prisma.teacher.findMany({ skip, take: pageSize, where: { deletedAt: null }, include: { user: { select: { email: true, role: true } } }, orderBy: { createdAt: 'desc' } }),
      this.prisma.teacher.count({ where: { deletedAt: null } }),
    ]);
    return { items, page, pageSize, total, totalPages: Math.ceil(total / pageSize) };
  }

  async findOne(id: string) {
    if (this.useAppwrite) {
      const document = await this.appwrite.getDocument('academic_directory', id).catch(() => null);
      if (!document || document.role !== 'TEACHER' || document.status === 'DELETED') throw new NotFoundException('Enseignant introuvable');
      return this.toTeacher(document);
    }
    const teacher = await this.prisma.teacher.findUnique({ where: { id }, include: { user: { select: { email: true, role: true } } } });
    if (!teacher || teacher.deletedAt) throw new NotFoundException('Enseignant introuvable');
    return teacher;
  }

  async update(id: string, dto: UpdateTeacherDto) {
    if (this.useAppwrite) {
      const current = await this.findOne(id);
      const data: Record<string, unknown> = {};
      if (dto.firstName !== undefined || dto.lastName !== undefined) data.name = `${dto.firstName ?? current.firstName} ${dto.lastName ?? current.lastName}`.trim();
      if (Object.keys(data).length === 0) return current;
      return this.toTeacher(await this.appwrite.updateDocument('academic_directory', id, data));
    }
    await this.findOne(id);
    return this.prisma.teacher.update({ where: { id }, data: dto, include: { user: { select: { email: true, role: true } } } });
  }

  async remove(id: string) {
    if (this.useAppwrite) {
      await this.findOne(id);
      return this.toTeacher(await this.appwrite.updateDocument('academic_directory', id, { status: 'DELETED' }));
    }
    await this.findOne(id);
    return this.prisma.teacher.update({ where: { id }, data: { deletedAt: new Date() } });
  }

  private toTeacher(document: AppwriteDocument) {
    const parts = String(document.name || '').trim().split(/\s+/);
    return { id: document.$id, userId: document.userId || document.$id, firstName: parts.shift() || '', lastName: parts.join(' '), status: document.status || 'ACTIVE', user: { email: '', role: 'TEACHER' } };
  }
}
