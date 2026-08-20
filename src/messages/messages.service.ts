import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SendMessageDto } from './dto/send-message.dto';
import { canSendMessage } from './messaging-rules';

@Injectable()
export class MessagesService {
  constructor(private readonly prisma: PrismaService) {}

  async send(senderId: string, senderRole: string, dto: SendMessageDto) {
    if (dto.receiverId === senderId) {
      throw new BadRequestException('Vous ne pouvez pas vous envoyer un message à vous-même');
    }

    const receiver = await this.prisma.user.findUnique({ where: { id: dto.receiverId } });
    if (!receiver) {
      throw new NotFoundException('Destinataire introuvable');
    }

    const sender = await this.prisma.user.findUnique({ where: { id: senderId } });
    if (!sender) {
      throw new NotFoundException('Expéditeur introuvable');
    }

    if (sender.universityId !== receiver.universityId) {
      throw new ForbiddenException("Vous ne pouvez envoyer des messages qu'au sein de votre université");
    }

    if (!canSendMessage(senderRole as any, receiver.role)) {
      throw new ForbiddenException(
        `Votre rôle (${senderRole}) ne permet pas d'envoyer un message à un ${receiver.role}`,
      );
    }

    return this.prisma.message.create({
      data: { senderId, receiverId: dto.receiverId, content: dto.content },
    });
  }

  async inbox(userId: string, page = 1, pageSize = 20) {
    const skip = (page - 1) * pageSize;
    const [items, total] = await Promise.all([
      this.prisma.message.findMany({
        where: { receiverId: userId, deletedAt: null },
        include: { sender: { select: { id: true, email: true, role: true } } },
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
      }),
      this.prisma.message.count({ where: { receiverId: userId, deletedAt: null } }),
    ]);
    return { items, page, pageSize, total, totalPages: Math.ceil(total / pageSize) };
  }

  async sent(userId: string, page = 1, pageSize = 20) {
    const skip = (page - 1) * pageSize;
    const [items, total] = await Promise.all([
      this.prisma.message.findMany({
        where: { senderId: userId, deletedAt: null },
        include: { receiver: { select: { id: true, email: true, role: true } } },
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
      }),
      this.prisma.message.count({ where: { senderId: userId, deletedAt: null } }),
    ]);
    return { items, page, pageSize, total, totalPages: Math.ceil(total / pageSize) };
  }

  async conversationWith(userId: string, otherUserId: string) {
    return this.prisma.message.findMany({
      where: {
        deletedAt: null,
        OR: [
          { senderId: userId, receiverId: otherUserId },
          { senderId: otherUserId, receiverId: userId },
        ],
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async markAsRead(messageId: string, userId: string) {
    const message = await this.prisma.message.findUnique({ where: { id: messageId } });
    if (!message || message.deletedAt) {
      throw new NotFoundException('Message introuvable');
    }
    if (message.receiverId !== userId) {
      throw new ForbiddenException('Seul le destinataire peut marquer ce message comme lu');
    }
    return this.prisma.message.update({
      where: { id: messageId },
      data: { status: 'READ', readAt: new Date() },
    });
  }

  async remove(messageId: string, userId: string) {
    const message = await this.prisma.message.findUnique({ where: { id: messageId } });
    if (!message || message.deletedAt) {
      throw new NotFoundException('Message introuvable');
    }
    if (message.senderId !== userId && message.receiverId !== userId) {
      throw new ForbiddenException("Vous n'êtes pas partie prenante de ce message");
    }
    return this.prisma.message.update({
      where: { id: messageId },
      data: { deletedAt: new Date() },
    });
  }
}