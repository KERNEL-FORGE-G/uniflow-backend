import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
  NotFoundException,
} from '@nestjs/common';
import { AuditLogsService } from './audit-logs.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('audit-logs')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AuditLogsController {
  constructor(private readonly auditLogsService: AuditLogsService) {}

  @Get()
  @Roles('SUPER_ADMIN', 'ADMIN')
  async findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('resource') resource?: string,
    @Query('userId') userId?: string,
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 50;
    return this.auditLogsService.findAll(pageNum, limitNum, resource, userId);
  }

  @Get(':id')
  @Roles('SUPER_ADMIN', 'ADMIN')
  async findOne(@Param('id') id: string) {
    const log = await this.auditLogsService.findOne(id);
    if (!log) {
      throw new NotFoundException(`Audit log #${id} not found`);
    }
    return log;
  }
}
