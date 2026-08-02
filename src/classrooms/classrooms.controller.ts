// src/classrooms/classrooms.controller.ts
//
// Endpoints REST pour les salles (§10.2 du CDC : /classrooms, /classrooms/available).
// JwtAuthGuard protège tous les endpoints par défaut (authentification requise) ;
// RolesGuard + @Roles() restreignent l'écriture aux rôles habilités (§5.1 du CDC).

import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { ClassroomsService } from './classrooms.service';
import { CreateClassroomDto } from './dto/create-classroom.dto';
import { UpdateClassroomDto } from './dto/update-classroom.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('classrooms')
export class ClassroomsController {
  constructor(private readonly classroomsService: ClassroomsService) {}

  @Post()
  @Roles('ADMIN', 'SUPER_ADMIN', 'SECRETARIAT')
  create(@Body() dto: CreateClassroomDto) {
    return this.classroomsService.create(dto);
  }

  @Get()
  findAll() {
    // Lecture ouverte à tous les rôles authentifiés (Direction, Enseignant,
    // Délégué, Étudiant peuvent tous consulter les salles — §5.1 du CDC)
    return this.classroomsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.classroomsService.findOne(id);
  }

  @Patch(':id')
  @Roles('ADMIN', 'SUPER_ADMIN', 'SECRETARIAT')
  update(@Param('id') id: string, @Body() dto: UpdateClassroomDto) {
    return this.classroomsService.update(id, dto);
  }

  @Delete(':id')
  @Roles('ADMIN', 'SUPER_ADMIN')
  remove(@Param('id') id: string) {
    return this.classroomsService.remove(id);
  }
}
