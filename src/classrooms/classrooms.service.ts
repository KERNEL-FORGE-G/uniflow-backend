// src/classrooms/classrooms.service.ts
//
// Logique métier des salles. Le soft delete (deletedAt) signifie qu'on ne
// supprime jamais physiquement une ligne — on la marque comme supprimée,
// et toutes les lectures filtrent automatiquement deletedAt: null.
// C'est important pour l'historique (une salle "supprimée" peut encore
// être référencée par d'anciens cours/emplois du temps).

import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateClassroomDto } from './dto/create-classroom.dto';
import { UpdateClassroomDto } from './dto/update-classroom.dto';

@Injectable()
export class ClassroomsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateClassroomDto) {
    const university = await this.prisma.university.findUnique({
      where: { code: dto.universityCode },
    });
    if (!university) {
      throw new BadRequestException(`Université inconnue : "${dto.universityCode}"`);
    }

    const { universityCode, ...classroomData } = dto;
    void universityCode; // déjà résolu ci-dessus, on ne le passe pas tel quel à Prisma

    return this.prisma.classroom.create({
      data: { ...classroomData, universityId: university.id },
    });
  }

  findAll() {
    return this.prisma.classroom.findMany({
      where: { deletedAt: null },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string) {
    const classroom = await this.prisma.classroom.findFirst({
      where: { id, deletedAt: null },
    });
    if (!classroom) {
      throw new NotFoundException(`Salle ${id} introuvable`);
    }
    return classroom;
  }

  async update(id: string, dto: UpdateClassroomDto) {
    await this.findOne(id); // vérifie l'existence, lève 404 sinon
    return this.prisma.classroom.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    // Soft delete : on ne fait jamais de vraie suppression SQL sur cette table
    return this.prisma.classroom.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  // Utilisée plus tard par le module `schedules` pour vérifier la disponibilité
  // d'une salle sur un créneau donné (§4.3 du CDC — "disponibilité en temps réel").
  // Squelette pour l'instant ; on la complètera à l'étape `schedules`.
  async findAvailable(dayOfWeek: string, startTime: Date, endTime: Date) {
    // TODO : implémenter une fois le modèle Schedule branché —
    // exclure les salles ayant un Schedule qui chevauche ce créneau ce jour-là.
    void dayOfWeek;
    void startTime;
    void endTime;
    return this.prisma.classroom.findMany({ where: { deletedAt: null } });
  }
}
