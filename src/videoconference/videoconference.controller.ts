// src/videoconference/videoconference.controller.ts
import { Body, Controller, Get, HttpCode, HttpStatus, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Public } from '../common/decorators/public.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { VideoconferenceService } from './videoconference.service';
import { CreateConferenceDto } from './dto/create-conference.dto';
import { SetLocalUrlDto } from './dto/set-local-url.dto';
import { UpdateNetworkDto } from './dto/update-network.dto';

@Controller('conferences')
@UseGuards(JwtAuthGuard, RolesGuard)
export class VideoconferenceController {
  constructor(private readonly service: VideoconferenceService) {}

  @Post()
  @Roles('ENSEIGNANT', 'ADMIN', 'SUPER_ADMIN')
  create(@CurrentUser() user, @Body() dto?: CreateConferenceDto) {
    return this.service.create(user.userId, dto?.courseId, dto?.maxParticipants);
  }

  @Get(':id/join')
  join(@CurrentUser() user, @Param('id') id: string) {
    return this.service.join(id, user.userId);
  }

  @Patch(':id/local-url')
  @Roles('ENSEIGNANT', 'ADMIN', 'SUPER_ADMIN')
  setLocalUrl(@CurrentUser() user, @Param('id') id: string, @Body() dto: SetLocalUrlDto) {
    return this.service.setLocalUrl(id, user.userId, dto.localUrl);
  }

  @Patch(':id/network')
  @Roles('ENSEIGNANT', 'ADMIN', 'SUPER_ADMIN')
  enableInternet(@CurrentUser() user, @Param('id') id: string, @Body() dto: UpdateNetworkDto) {
    return this.service.enableInternetMode(id, user.userId, dto.publicUrl);
  }

  @Post(':id/end')
  @HttpCode(HttpStatus.OK)
  @Roles('ENSEIGNANT', 'ADMIN', 'SUPER_ADMIN')
  end(@CurrentUser() user, @Param('id') id: string) {
    return this.service.end(id, user.userId);
  }

  @Post('webhook')
  @Public()
  @HttpCode(HttpStatus.OK)
  handleWebhook(@Body() body: any) {
    return this.service.handleWebhook(body);
  }
}