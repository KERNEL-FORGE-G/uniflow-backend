import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { AdminToolService } from './admin-tool.service';
import { DevOnlyGuard } from '../common/guards/dev-only.guard';

@Controller('admin-tool')
//@UseGuards(JwtAuthGuard, RolesGuard, DevOnlyGuard)
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'SUPER_ADMIN')
export class AdminToolController {
  constructor(private readonly service: AdminToolService) {}

  @Get('tables')
  listTables() {
    return this.service.listTables();
  }

  @Get('tables/:table/schema')
  getSchema(@Param('table') table: string) {
    return this.service.getFormSchema(table);
  }

  @Post('tables/:table')
  insert(@Param('table') table: string, @Body() body: Record<string, any>) {
    return this.service.insert(table, body);
  }
}
