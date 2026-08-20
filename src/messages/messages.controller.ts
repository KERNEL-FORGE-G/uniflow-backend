import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { MessagesService } from './messages.service';
import { SendMessageDto } from './dto/send-message.dto';

@Controller('messages')
@UseGuards(JwtAuthGuard, RolesGuard)
export class MessagesController {
  constructor(private readonly service: MessagesService) {}

  @Post()
  send(@CurrentUser() user, @Body() dto: SendMessageDto) {
    return this.service.send(user.userId, user.role, dto);
  }

  @Get('inbox')
  inbox(@CurrentUser() user, @Query('page') page?: string, @Query('pageSize') pageSize?: string) {
    return this.service.inbox(
      user.userId,
      page ? parseInt(page, 10) : undefined,
      pageSize ? parseInt(pageSize, 10) : undefined,
    );
  }

  @Get('sent')
  sent(@CurrentUser() user, @Query('page') page?: string, @Query('pageSize') pageSize?: string) {
    return this.service.sent(
      user.userId,
      page ? parseInt(page, 10) : undefined,
      pageSize ? parseInt(pageSize, 10) : undefined,
    );
  }

  @Get('with/:userId')
  conversation(@CurrentUser() user, @Param('userId') otherUserId: string) {
    return this.service.conversationWith(user.userId, otherUserId);
  }

  @Patch(':id/read')
  markAsRead(@CurrentUser() user, @Param('id') id: string) {
    return this.service.markAsRead(id, user.userId);
  }

  @Delete(':id')
  remove(@CurrentUser() user, @Param('id') id: string) {
    return this.service.remove(id, user.userId);
  }
}