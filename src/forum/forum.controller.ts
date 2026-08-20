import { Body, Controller, Delete, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Public } from '../common/decorators/public.decorator';
import { ForumService } from './forum.service';
import { CreateForumEntryDto } from './dto/create-forum-entry.dto';

@Controller('forum')
export class ForumController {
  constructor(private readonly service: ForumService) {}

  @Post()
  @Public()
  @Throttle({ long: { limit: 5, ttl: 60_000 } }) // 5 publications/min/IP — anti-spam sur route publique
  create(@Body() dto: CreateForumEntryDto) {
    return this.service.create(dto);
  }

  @Get()
  @Public()
  findAll(@Query('page') page?: string, @Query('pageSize') pageSize?: string) {
    return this.service.findAll(
      page ? parseInt(page, 10) : undefined,
      pageSize ? parseInt(pageSize, 10) : undefined,
    );
  }

  @Get(':id')
  @Public()
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post(':id/like')
  @Public()
  @Throttle({ long: { limit: 10, ttl: 60_000 } }) // 10 likes/min/IP
  like(@Param('id') id: string) {
    return this.service.like(id);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}