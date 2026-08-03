import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { UeService } from './ue.service';
import { CreateUeDto } from './dto/create-ue.dto';
import { UpdateUeDto } from './dto/update-ue.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('ue')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UeController {
  constructor(private ueService: UeService) {}

  @Post()
  @Roles('SUPER_ADMIN', 'ADMIN', 'SECRETARIAT')
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreateUeDto) {
    return this.ueService.create(dto);
  }

  @Get()
  @Roles(
    'SUPER_ADMIN',
    'ADMIN',
    'SECRETARIAT',
    'DIRECTION',
    'ENSEIGNANT',
    'DELEGUE',
    'ETUDIANT',
  )
  async findAll(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    return this.ueService.findAll(
      page ? parseInt(page, 10) : undefined,
      pageSize ? parseInt(pageSize, 10) : undefined,
    );
  }

  @Get('by-level/:levelId')
  @Roles(
    'SUPER_ADMIN',
    'ADMIN',
    'SECRETARIAT',
    'DIRECTION',
    'ENSEIGNANT',
    'DELEGUE',
    'ETUDIANT',
  )
  async findByLevel(@Param('levelId') levelId: string) {
    return this.ueService.findByLevel(levelId);
  }

  @Get('by-semester/:semesterId')
  @Roles(
    'SUPER_ADMIN',
    'ADMIN',
    'SECRETARIAT',
    'DIRECTION',
    'ENSEIGNANT',
    'DELEGUE',
    'ETUDIANT',
  )
  async findBySemester(@Param('semesterId') semesterId: string) {
    return this.ueService.findBySemester(semesterId);
  }

  @Get(':id')
  @Roles(
    'SUPER_ADMIN',
    'ADMIN',
    'SECRETARIAT',
    'DIRECTION',
    'ENSEIGNANT',
    'DELEGUE',
    'ETUDIANT',
  )
  async findOne(@Param('id') id: string) {
    return this.ueService.findOne(id);
  }

  @Patch(':id')
  @Roles('SUPER_ADMIN', 'ADMIN', 'SECRETARIAT')
  async update(@Param('id') id: string, @Body() dto: UpdateUeDto) {
    return this.ueService.update(id, dto);
  }

  @Delete(':id')
  @Roles('SUPER_ADMIN', 'ADMIN')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string) {
    await this.ueService.remove(id);
  }
}
