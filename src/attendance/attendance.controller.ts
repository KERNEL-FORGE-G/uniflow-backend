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
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { Request as ExpressRequest } from 'express';
import { AttendanceService } from './attendance.service';
import { CreateSessionDto } from './dto/create-session.dto';
import { MarkAttendanceDto } from './dto/mark-attendance.dto';
import { ScanQrDto } from './dto/scan-qr.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

interface AuthenticatedRequest extends ExpressRequest {
  user: {
    userId: string;
    email: string;
    role: string;
  };
}

@Controller('attendance')
@UseGuards(JwtAuthGuard)
export class AttendanceController {
  constructor(private attendanceService: AttendanceService) {}

  @Post('sessions')
  @UseGuards(RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN', 'SECRETARIAT', 'ENSEIGNANT')
  @HttpCode(HttpStatus.CREATED)
  async createSession(@Body() dto: CreateSessionDto) {
    return this.attendanceService.createSession(dto);
  }

  @Get('sessions/:id')
  async findOne(@Param('id') id: string) {
    return this.attendanceService.findOne(id);
  }

  @Get('sessions/by-course/:courseId')
  async findByCourse(@Param('courseId') courseId: string) {
    return this.attendanceService.findByCourse(courseId);
  }

  @Patch('sessions/:sessionId/mark')
  @UseGuards(RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN', 'SECRETARIAT', 'ENSEIGNANT', 'DELEGUE')
  async markAttendance(
    @Param('sessionId') sessionId: string,
    @Body() dto: MarkAttendanceDto,
  ) {
    return this.attendanceService.markAttendance(sessionId, dto);
  }

  @Post('scan')
  @UseGuards(RolesGuard)
  @Roles('ETUDIANT')
  async scanQr(@Body() dto: ScanQrDto, @Request() req: AuthenticatedRequest) {
    const student = await this.attendanceService.getStudentByUserId(
      req.user.userId,
    );
    return this.attendanceService.scanQr(dto, student.id);
  }

  @Delete('sessions/:id')
  @UseGuards(RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN', 'ENSEIGNANT')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string) {
    await this.attendanceService.remove(id);
  }
}
