import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AppwriteService, AppwriteDocument } from '../appwrite/appwrite.service';
import { CreateUeDto } from './dto/create-ue.dto';
import { UpdateUeDto } from './dto/update-ue.dto';

@Injectable()
export class UeService {
  private readonly useAppwrite = process.env.UNIFLOW_DATA_SOURCE === 'appwrite';

  constructor(private readonly prisma: PrismaService, private readonly appwrite: AppwriteService) {}

  async create(dto: CreateUeDto) {
    if (this.useAppwrite) {
      const existing = await this.appwrite.listDocuments('academic_courses', [`equal("code", ["${dto.code}"])`, 'limit(1)']);
      if (existing.total > 0) throw new ConflictException('Une UE avec ce code existe déjà');
      const { specialtyIds: _specialtyIds, ...data } = dto as any;
      return this.toUe(await this.appwrite.createDocument('academic_courses', String(dto.code), { ...data, name: data.name || data.title || dto.code, university: data.university || '', program: data.program || '', level: data.level || 'L1', credits: data.credits || 0, hours: data.hours || 0, type: data.type || 'CM' }));
    }

    const existingUe = await this.prisma.teachingUnit.findUnique({ where: { code: dto.code } });
    if (existingUe) throw new ConflictException('Une UE avec ce code existe déjà');
    const { specialtyIds, ...ueData } = dto;
    return this.prisma.teachingUnit.create({ data: { ...ueData, specialties: specialtyIds ? { create: specialtyIds.map((specialtyId) => ({ specialty: { connect: { id: specialtyId } } })) } : undefined }, include: { level: true, semester: true, specialties: { include: { specialty: true } } } });
  }

  async findAll(page = 1, pageSize = 20) {
    if (this.useAppwrite) {
      const result = await this.appwrite.listDocuments('academic_courses', [`limit(${pageSize})`, `offset(${Math.max(0, (page - 1) * pageSize)})`, 'orderDesc("$createdAt")']);
      const items = result.documents.map((document) => this.toUe(document));
      return { items, page, pageSize, total: result.total, totalPages: Math.ceil(result.total / pageSize) };
    }
    const skip = (page - 1) * pageSize;
    const [items, total] = await Promise.all([
      this.prisma.teachingUnit.findMany({ skip, take: pageSize, where: { deletedAt: null }, include: { level: true, semester: true, specialties: { include: { specialty: true } } }, orderBy: { createdAt: 'desc' } }),
      this.prisma.teachingUnit.count({ where: { deletedAt: null } }),
    ]);
    return { items, page, pageSize, total, totalPages: Math.ceil(total / pageSize) };
  }

  async findOne(id: string) {
    if (this.useAppwrite) {
      const document = await this.appwrite.getDocument('academic_courses', id).catch(() => null);
      if (!document) throw new NotFoundException('UE introuvable');
      return this.toUe(document);
    }
    const ue = await this.prisma.teachingUnit.findUnique({ where: { id }, include: { level: true, semester: true, specialties: { include: { specialty: true } } } });
    if (!ue || ue.deletedAt) throw new NotFoundException('UE introuvable');
    return ue;
  }

  async findByLevel(levelId: string) {
    if (this.useAppwrite) {
      const result = await this.appwrite.listDocuments('academic_courses', [`equal("level", ["${levelId}"])`]);
      return result.documents.map((document) => this.toUe(document));
    }
    return this.prisma.teachingUnit.findMany({ where: { levelId, deletedAt: null }, include: { semester: true } });
  }

  async findBySemester(semesterId: string) {
    if (this.useAppwrite) {
      const result = await this.appwrite.listDocuments('academic_courses', [`equal("semesterId", ["${semesterId}"])`]);
      return result.documents.map((document) => this.toUe(document));
    }
    return this.prisma.teachingUnit.findMany({ where: { semesterId, deletedAt: null }, include: { level: true } });
  }

  async update(id: string, dto: UpdateUeDto) {
    if (this.useAppwrite) {
      await this.findOne(id);
      const { specialtyIds: _specialtyIds, ...data } = dto as any;
      return this.toUe(await this.appwrite.updateDocument('academic_courses', id, data));
    }
    await this.findOne(id);
    const { specialtyIds, ...ueData } = dto;
    if (specialtyIds) await this.prisma.ueSpecialty.deleteMany({ where: { teachingUnitId: id } });
    return this.prisma.teachingUnit.update({ where: { id }, data: { ...ueData, specialties: specialtyIds ? { create: specialtyIds.map((specialtyId) => ({ specialty: { connect: { id: specialtyId } } })) } : undefined }, include: { level: true, semester: true, specialties: { include: { specialty: true } } } });
  }

  async remove(id: string) {
    if (this.useAppwrite) {
      await this.findOne(id);
      return this.toUe(await this.appwrite.updateDocument('academic_courses', id, { status: 'DELETED' }));
    }
    await this.findOne(id);
    return this.prisma.teachingUnit.update({ where: { id }, data: { deletedAt: new Date() } });
  }

  private toUe(document: AppwriteDocument) {
    return { id: document.$id, code: document.code || document.$id, name: document.name || '', title: document.name || '', description: document.description || '', credits: document.credits || 0, hours: document.hours || 0, type: document.type || 'CM', teacherId: document.teacherId || '', teacherName: document.teacherName || '', university: document.university || '', program: document.program || '', level: document.level || 'L1', status: document.status || 'ACTIVE' };
  }
}
