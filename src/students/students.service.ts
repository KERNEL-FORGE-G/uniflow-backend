import {
  Injectable,
  ConflictException,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { CreateStudentDto } from './dto/create-student.dto';
import { UpdateStudentDto } from './dto/update-student.dto';

@Injectable()
export class StudentsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateStudentDto) {
    const university = await this.prisma.university.findUnique({
      where: { code: dto.universityCode },
    });
    if (!university) {
      throw new ConflictException(`Université inconnue : "${dto.universityCode}"`);
    }

    const existingUser = await this.prisma.user.findUnique({
      where: { email_universityId: { email: dto.email, universityId: university.id } },
    });

    if (existingUser) {
      throw new ConflictException('Un compte existe déjà avec cet email dans cette université');
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        passwordHash,
        role: 'ETUDIANT',
        universityId: university.id,
      },
    });

    const student = await this.prisma.student.create({
      data: {
        userId: user.id,
        firstName: dto.firstName,
        lastName: dto.lastName,
        matricule: await this.generateMatricule(university.code),
        status: dto.status ?? 'ACTIVE',
        levelId: dto.levelId,
        specialtyId: dto.specialtyId,
      },
      include: { user: { select: { email: true, role: true } } },
    });

    return student;
  }

  async findAll(page = 1, pageSize = 20) {
    const skip = (page - 1) * pageSize;

    const [items, total] = await Promise.all([
      this.prisma.student.findMany({
        skip,
        take: pageSize,
        where: { deletedAt: null },
        include: { user: { select: { email: true, role: true } } },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.student.count({ where: { deletedAt: null } }),
    ]);

    return {
      items,
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  async findOne(id: string) {
    const student = await this.prisma.student.findUnique({
      where: { id },
      include: { user: { select: { email: true, role: true } } },
    });

    if (!student || student.deletedAt) {
      throw new NotFoundException('Étudiant introuvable');
    }

    return student;
  }

  async update(id: string, dto: UpdateStudentDto) {
    await this.findOne(id); // vérifie l'existence, lève 404 sinon

    return this.prisma.student.update({
      where: { id },
      data: dto,
      include: { user: { select: { email: true, role: true } } },
    });
  }

  async remove(id: string) {
    await this.findOne(id);

    // Suppression douce (soft delete) - §8.3 du CDC
    return this.prisma.student.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async promoteToDelegue(id: string, promotedById: string, promotedByRole: string) {
    if (!['ENSEIGNANT', 'ADMIN', 'SUPER_ADMIN'].includes(promotedByRole)) {
      throw new ForbiddenException(
        'Seul un enseignant ou un administrateur peut promouvoir un étudiant délégué',
      );
    }

    const student = await this.prisma.student.findUnique({
      where: { id },
      include: { user: { include: { university: true } } },
    });

    if (!student || student.deletedAt) {
      throw new NotFoundException('Étudiant introuvable');
    }

    if (student.user.role !== 'ETUDIANT') {
      throw new BadRequestException(
        student.user.role === 'DELEGUE'
          ? 'Cet étudiant est déjà délégué'
          : "Seul un compte au rôle ETUDIANT peut être promu délégué",
      );
    }

    // Scoping multi-université : le promoteur doit appartenir à la même université que la cible.
    const promoter = await this.prisma.user.findUnique({ where: { id: promotedById } });
    if (!promoter || promoter.universityId !== student.user.universityId) {
      throw new ForbiddenException(
        "Vous ne pouvez promouvoir que des étudiants de votre propre université",
      );
    }

    const updatedUser = await this.prisma.user.update({
      where: { id: student.userId },
      data: {
        role: 'DELEGUE',
        // Force une reconnexion immédiate : l'ancien refresh token devient inutilisable,
        // le prochain /auth/login émettra un token avec le rôle DELEGUE à jour.
        refreshTokenHash: null,
      },
    });

    return {
      studentId: student.id,
      userId: updatedUser.id,
      firstName: student.firstName,
      lastName: student.lastName,
      newRole: updatedUser.role,
      message: 'Étudiant promu délégué avec succès. Une reconnexion sera nécessaire pour que le nouveau rôle prenne effet.',
    };
  }

  private async generateMatricule(universityCode: string): Promise<string> {
    const year = new Date().getFullYear();
    const count = await this.prisma.student.count({
      where: { user: { university: { code: universityCode } } },
    });
    return `${universityCode}-${year}-${String(count + 1).padStart(5, '0')}`;
  }
}
