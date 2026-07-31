import { Controller, Post, Get, Body, Query, UseGuards } from '@nestjs/common';
import { SyncService } from './sync.service';
import { SyncPushDto } from './dto/sync-push.dto';
import { SyncPullDto } from './dto/sync-pull.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('sync')
@UseGuards(JwtAuthGuard)
export class SyncController {
  constructor(private syncService: SyncService) {}

  @Post('push')
  async push(@Body() dto: SyncPushDto) {
    return this.syncService.push(dto.operations);
  }

  @Get('pull')
  async pull(@Query() query: SyncPullDto) {
    return this.syncService.pull(query.since);
  }
}
