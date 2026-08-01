// src/courses/courses.controller.ts
//
// RBAC (§5.1 du CDC) : Admin/Secrétariat gèrent tous les cours ;
// l'Enseignant ne gère que les siens (filtré via findByTeacher, pas
// via un guard générique — la restriction "ses cours" dépend de la donnée,
// pas juste du rôle).

import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Request,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CoursesService } from './courses.service';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('courses')
export class CoursesController {
  constructor(private readonly coursesService: CoursesService) {}

  @Post()
  @Roles('ADMIN', 'SUPER_ADMIN', 'SECRETARIAT')
  create(@Body() dto: CreateCourseDto) {
    return this.coursesService.create(dto);
  }

  @Get()
  findAll() {
    return this.coursesService.findAll();
  }

  @Get('my')
  findMine(@Request() req) {
    // req.user vient de JwtStrategy.validate() -> { userId, email, role }
    // Note : userId ici est l'id User, pas l'id Teacher — la jointure
    // User -> Teacher devra être résolue si ce n'est pas déjà fait ailleurs.
    return this.coursesService.findByTeacher(req.user.userId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.coursesService.findOne(id);
  }

  @Patch(':id')
  @Roles('ADMIN', 'SUPER_ADMIN', 'SECRETARIAT')
  update(@Param('id') id: string, @Body() dto: UpdateCourseDto) {
    return this.coursesService.update(id, dto);
  }

  @Delete(':id')
  @Roles('ADMIN', 'SUPER_ADMIN')
  remove(@Param('id') id: string) {
    return this.coursesService.remove(id);
  }
}