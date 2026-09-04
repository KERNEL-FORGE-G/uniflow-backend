import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { AppwriteService, AppwriteDocument } from '../appwrite/appwrite.service';
import { CreateStudentDto } from './dto/create-student.dto';
import { UpdateStudentDto } from './dto/update-student.dto';

@Injectable()
export class StudentsService {
  private readonly useAppwrite = process.env.UNIFLOW_DATA_SOURCE === 'appwrite';

  constructor(
    private readonly prisma: PrismaService,
    private readonly appwrite: AppwriteService,
  ) {}

  async create(dto: CreateStudentDto) {
    if (this.useAppwrite) {
      const existing = await this.appwrite.listDocuments('users', [`equal("email", ["${dto.email}"])`, 'limit(1)']);
      if (existing.total > 0) throw new ConflictException('Un compte existe déjà avec cet email');

      const userId = `user_${Date.now()}`;
      const directory = await this.appwrite.createDocument('academic_directory', userId, {
        userId,
        name: `${dto.firstName} ${dto.lastName}`.trim(),
        role: 'STUDENT',
        university: '',
        program: '',
        level: 'L1',
        matricule: await this.generateAppwriteMatricule(),
        status: dto.status ?? 'ACTIVE',
      });
      return this.toStudent(directory);
    }

    const existingUser = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existingUser) throw new ConflictException('Un compte existe déjà avec cet email');
    const passwordHash = await bcrypt.hash(dto.password, 12);
    const user = await this.prisma.user.create({ data: { email: dto.email, passwordHash, role: 'ETUDIANT' } });
    return this.prisma.student.create({
      data: { userId: user.id, firstName: dto.firstName, lastName: dto.lastName, matricule: await this.generateMatricule(), status: dto.status ?? 'ACTIVE', levelId: dto.levelId, specialtyId: dto.specialtyId },
      include: { user: { select: { email: true, role: true } } },
    });
  }

  async findAll(page = 1, pageSize = 20) {
    if (this.useAppwrite) {
      const result = await this.appwrite.listDocuments('academic_directory', [`equal("role", ["STUDENT"])`, `limit(${pageSize})`, `offset(${Math.max(0, (page - 1) * pageSize)})`, 'orderDesc("$createdAt")']);
      const items = await Promise.all(result.documents.map((document) => this.toStudent(document)));
      return { items, page, pageSize, total: result.total, totalPages: Math.ceil(result.total / pageSize) };
    }

    const skip = (page - 1) * pageSize;
    const [items, total] = await Promise.all([
      this.prisma.student.findMany({ skip, take: pageSize, where: { deletedAt: null }, include: { user: { select: { email: true, role: true } } }, orderBy: { createdAt: 'desc' } }),
      this.prisma.student.count({ where: { deletedAt: null } }),
    ]);
    return { items, page, pageSize, total, totalPages: Math.ceil(total / pageSize) };
  }

  async findOne(id: string) {
    if (this.useAppwrite) {
      const document = await this.appwrite.getDocument('academic_directory', id).catch(() => null);
      if (!document || document.role !== 'STUDENT' || document.status === 'DELETED') throw new NotFoundException('Étudiant introuvable');
      return this.toStudent(document);
    }
    const student = await this.prisma.student.findUnique({ where: { id }, include: { user: { select: { email: true, role: true } } } });
    if (!student || student.deletedAt) throw new NotFoundException('Étudiant introuvable');
    return student;
  }

  async update(id: string, dto: UpdateStudentDto) {
    if (this.useAppwrite) {
      const current = await this.findOne(id);
      const data: Record<string, unknown> = {};
      if (dto.firstName !== undefined || dto.lastName !== undefined) data.name = `${dto.firstName ?? current.firstName} ${dto.lastName ?? current.lastName}`.trim();
      if (dto.status !== undefined) data.status = dto.status;
      if (Object.keys(data).length === 0) return current;
      return this.toStudent(await this.appwrite.updateDocument('academic_directory', id, data));
    }
    await this.findOne(id);
    return this.prisma.student.update({ where: { id }, data: dto, include: { user: { select: { email: true, role: true } } } });
  }

  async remove(id: string) {
    if (this.useAppwrite) {
      await this.findOne(id);
      return this.toStudent(await this.appwrite.updateDocument('academic_directory', id, { status: 'DELETED' }));
    }
    await this.findOne(id);
    return this.prisma.student.update({ where: { id }, data: { deletedAt: new Date() } });
  }

  private toStudent(document: AppwriteDocument) {
    const parts = String(document.name || '').trim().split(/\s+/);
    return {
      id: document.$id,
      userId: document.userId || document.$id,
      firstName: parts.shift() || '',
      lastName: parts.join(' '),
      matricule: document.matricule || '',
      status: document.status || 'ACTIVE',
      level: document.level || 'L1',
      program: document.program || '',
      university: document.university || '',
      user: { email: '', role: 'STUDENT' },
    };
  }

  private async generateAppwriteMatricule() {
    const year = new Date().getFullYear();
    const result = await this.appwrite.listDocuments('academic_directory', ['equal("role", ["STUDENT"])', 'limit(1)']);
    return `UY1-${year}-${String(result.total + 1).padStart(5, '0')}`;
  }

  private async generateMatricule(): Promise<string> {
    const year = new Date().getFullYear();
    const count = await this.prisma.student.count();
    return `UY1-${year}-${String(count + 1).padStart(5, '0')}`;
  }
}
