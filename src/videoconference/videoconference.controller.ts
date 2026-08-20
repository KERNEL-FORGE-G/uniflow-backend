import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { TeacherHasUeGuard } from '../common/guards/teacher-has-ue.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Public } from '../common/decorators/public.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { VideoconferenceService } from './videoconference.service';
import { CreateConferenceDto } from './dto/create-conference.dto';
import { InviteParticipantDto } from './dto/invite-participant.dto';
import { SetLocalUrlDto } from './dto/set-local-url.dto';
import { UpdateNetworkDto } from './dto/update-network.dto';

@Controller('conferences')
@UseGuards(JwtAuthGuard, RolesGuard)
export class VideoconferenceController {
  constructor(private readonly service: VideoconferenceService) {}

  @Post()
  @Roles('ENSEIGNANT', 'ETUDIANT')
  @UseGuards(TeacherHasUeGuard) // ne bloque que les ENSEIGNANT sans UE ; sans effet sur ETUDIANT
  create(@CurrentUser() user, @Body() dto: CreateConferenceDto) {
    return this.service.create(user.userId, user.role, dto);
  }

  @Post(':id/invite')
  @Roles('ETUDIANT', 'ENSEIGNANT', 'ADMIN', 'SUPER_ADMIN')
  invite(@CurrentUser() user, @Param('id') id: string, @Body() dto: InviteParticipantDto) {
    return this.service.invite(id, user.userId, dto.userId);
  }

  @Get(':id/join')
  join(@CurrentUser() user, @Param('id') id: string) {
    return this.service.join(id, user.userId);
  }

  @Patch(':id/local-url')
  @Roles('ENSEIGNANT', 'ETUDIANT')
  setLocalUrl(@CurrentUser() user, @Param('id') id: string, @Body() dto: SetLocalUrlDto) {
    return this.service.setLocalUrl(id, user.userId, dto.localUrl);
  }

  @Patch(':id/network')
  @Roles('ENSEIGNANT', 'ETUDIANT')
  enableInternet(@CurrentUser() user, @Param('id') id: string, @Body() dto: UpdateNetworkDto) {
    return this.service.enableInternetMode(id, user.userId, dto.publicUrl);
  }

  @Post(':id/end')
  @Roles('ENSEIGNANT', 'ETUDIANT')
  end(@CurrentUser() user, @Param('id') id: string) {
    return this.service.end(id, user.userId);
  }

  @Post('webhook')
  @Public()
  handleWebhook(@Body() body: any) {
    return this.service.handleWebhook(body);
  }
}