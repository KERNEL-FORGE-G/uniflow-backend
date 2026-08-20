import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AccessToken } from 'livekit-server-sdk';
import { ConferenceVisibility } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { decrypt, encrypt } from '../common/utils/encryption.util';
import { generateLiveKitCredentials } from '../common/utils/livekit-credentials.util';
import { CreateConferenceDto } from './dto/create-conference.dto';
import { LiveKitWebhookPayload } from './types/livekit-webhook.type';

@Injectable()
export class VideoconferenceService {
  constructor(private readonly prisma: PrismaService) {}

  // ---------- Création ----------

  async create(hostId: string, hostRole: string, dto: CreateConferenceDto) {
    if (dto.visibility === ConferenceVisibility.PRIVATE) {
      return this.createPrivate(hostId, hostRole, dto);
    }
    return this.createPublic(hostId, hostRole, dto);
  }

  private async createPrivate(hostId: string, hostRole: string, dto: CreateConferenceDto) {
    // §2.1 du document : seul un enseignant peut créer une visioconférence privée.
    if (hostRole !== 'ENSEIGNANT') {
      throw new ForbiddenException('Seul un enseignant peut créer une visioconférence privée');
    }

    const teacher = await this.prisma.teacher.findUnique({ where: { userId: hostId } });
    if (!teacher) {
      throw new ForbiddenException('Profil enseignant introuvable');
    }

    const course = await this.prisma.course.findUnique({ where: { id: dto.courseId } });
    if (!course) {
      throw new BadRequestException('Cours introuvable');
    }
    if (course.teacherId !== teacher.id) {
      throw new ForbiddenException(
        'Vous ne pouvez créer une visioconférence privée que pour vos propres cours',
      );
    }

    return this.createConference(hostId, ConferenceVisibility.PRIVATE, course.id, dto.maxParticipants);
  }

  private async createPublic(hostId: string, hostRole: string, dto: CreateConferenceDto) {
    // §2.2 du document : un étudiant peut créer une visioconférence publique.
    if (hostRole !== 'ETUDIANT') {
      throw new ForbiddenException('Seul un étudiant peut créer une visioconférence publique');
    }

    return this.createConference(hostId, ConferenceVisibility.PUBLIC, undefined, dto.maxParticipants);
  }

  private async createConference(
    hostId: string,
    visibility: ConferenceVisibility,
    courseId: string | undefined,
    maxParticipants: number | undefined,
  ) {
    const { apiKey, apiSecret } = generateLiveKitCredentials();

    const conference = await this.prisma.videoConference.create({
      data: {
        hostId,
        courseId,
        visibility,
        apiKey,
        apiSecretEncrypted: encrypt(apiSecret),
        maxParticipants,
        mode: 'LAN',
        status: 'ACTIVE',
      },
    });

    const hostToken = await this.mintToken(conference.id, apiKey, apiSecret, hostId, true);

    return {
      conferenceId: conference.id,
      visibility: conference.visibility,
      apiKey,
      apiSecret,
      hostToken,
    };
  }

  // ---------- Invitations (uniquement mode public — §2.2) ----------

  async invite(conferenceId: string, hostId: string, invitedUserId: string) {
    const conference = await this.getOwnedConference(conferenceId, hostId);

    if (conference.visibility !== ConferenceVisibility.PUBLIC) {
      throw new BadRequestException(
        "Les invitations n'existent que pour les visioconférences publiques — une visioconférence privée est automatiquement accessible aux étudiants inscrits à l'UE",
      );
    }

    const invitedUser = await this.prisma.user.findUnique({ where: { id: invitedUserId } });
    if (!invitedUser) {
      throw new BadRequestException('Utilisateur introuvable');
    }

    return this.prisma.conferenceInvite.upsert({
      where: { conferenceId_invitedUserId: { conferenceId, invitedUserId } },
      update: {},
      create: { conferenceId, invitedUserId },
    });
  }

  // ---------- Rejoindre ----------

  async join(conferenceId: string, userId: string) {
    const conference = await this.prisma.videoConference.findUnique({
      where: { id: conferenceId },
      include: { course: { select: { teachingUnitId: true } } },
    });
    if (!conference) throw new NotFoundException('Réunion introuvable');
    if (conference.status === 'ENDED') {
      throw new BadRequestException('Cette réunion est terminée, le lien a expiré');
    }
    if (!conference.localUrl && !conference.publicUrl) {
      throw new BadRequestException("La réunion n'est pas encore prête côté hôte");
    }

    const isHost = conference.hostId === userId;
    if (!isHost) {
      await this.checkJoinAccess(conference, userId);
    }

    const apiSecret = decrypt(conference.apiSecretEncrypted);
    const token = await this.mintToken(conference.id, conference.apiKey, apiSecret, userId, isHost);

    await this.prisma.conferenceParticipant.create({
      data: { conferenceId: conference.id, userId },
    });

    const serverUrl =
      conference.mode === 'INTERNET' && conference.publicUrl
        ? conference.publicUrl
        : conference.localUrl;

    return { token, serverUrl, mode: conference.mode, visibility: conference.visibility };
  }

  private async checkJoinAccess(
    conference: {
      id: string;
      visibility: ConferenceVisibility;
      course: { teachingUnitId: string } | null;
    },
    userId: string,
  ) {
    if (conference.visibility === ConferenceVisibility.PRIVATE) {
      if (!conference.course) {
        throw new ForbiddenException('Visioconférence privée mal configurée (aucun cours associé)');
      }

      const student = await this.prisma.student.findUnique({ where: { userId } });
      if (!student) {
        throw new ForbiddenException(
          "Cette visioconférence privée est réservée aux étudiants inscrits à l'UE concernée",
        );
      }

      const enrollment = await this.prisma.enrollment.findUnique({
        where: {
          studentId_teachingUnitId: {
            studentId: student.id,
            teachingUnitId: conference.course.teachingUnitId,
          },
        },
      });
      if (!enrollment) {
        throw new ForbiddenException("Vous n'êtes pas inscrit à l'UE concernée par cette visioconférence");
      }
      return;
    }

    // PUBLIC — accès uniquement sur invitation explicite
    const invite = await this.prisma.conferenceInvite.findUnique({
      where: { conferenceId_invitedUserId: { conferenceId: conference.id, invitedUserId: userId } },
    });
    if (!invite) {
      throw new ForbiddenException("Vous n'avez pas été invité à cette visioconférence");
    }
  }

  // ---------- Réseau ----------

  async setLocalUrl(conferenceId: string, hostId: string, localUrl: string) {
    const conference = await this.getOwnedConference(conferenceId, hostId);
    return this.prisma.videoConference.update({
      where: { id: conference.id },
      data: { localUrl },
    });
  }

  async enableInternetMode(conferenceId: string, hostId: string, publicUrl: string) {
    const conference = await this.getOwnedConference(conferenceId, hostId);
    return this.prisma.videoConference.update({
      where: { id: conference.id },
      data: { mode: 'INTERNET', publicUrl },
    });
  }

  async end(conferenceId: string, hostId: string) {
    const conference = await this.getOwnedConference(conferenceId, hostId);
    await this.prisma.conferenceParticipant.updateMany({
      where: { conferenceId: conference.id, leftAt: null },
      data: { leftAt: new Date() },
    });
    return this.prisma.videoConference.update({
      where: { id: conference.id },
      data: { status: 'ENDED', endedAt: new Date() },
    });
  }

  // ⚠️ REMETS ICI TON VRAI handleWebhook() — je n'ai jamais reçu son contenu,
  // ce placeholder est volontairement minimal pour ne pas écraser ta logique.
  async handleWebhook(body: LiveKitWebhookPayload) {
    if (body.event === 'room_finished' && body.room?.name) {
      const conferenceId = body.room.name;
      const conference = await this.prisma.videoConference.findUnique({
        where: { id: conferenceId },
      });
      if (conference && conference.status === 'ACTIVE') {
        await this.prisma.conferenceParticipant.updateMany({
          where: { conferenceId: conference.id, leftAt: null },
          data: { leftAt: new Date() },
        });
        return this.prisma.videoConference.update({
          where: { id: conference.id },
          data: { status: 'ENDED', endedAt: new Date() },
        });
      }
    }
    return { status: 'ignored' };
  }

  // ---------- Utilitaires privés ----------

  private async getOwnedConference(conferenceId: string, hostId: string) {
    const conference = await this.prisma.videoConference.findUnique({
      where: { id: conferenceId },
    });
    if (!conference) throw new NotFoundException('Réunion introuvable');
    if (conference.hostId !== hostId) {
      throw new ForbiddenException("Seul l'hôte peut gérer cette réunion");
    }
    return conference;
  }

  private async mintToken(
    roomName: string,
    apiKey: string,
    apiSecret: string,
    identity: string,
    isHost: boolean,
  ): Promise<string> {
    const at = new AccessToken(apiKey, apiSecret, { identity, ttl: '4h' });
    at.addGrant({
      room: roomName,
      roomJoin: true,
      canPublish: true,
      canSubscribe: true,
      roomAdmin: isHost,
    });
    return at.toJwt();
  }
}