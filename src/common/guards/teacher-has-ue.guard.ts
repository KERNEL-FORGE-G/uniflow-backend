import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class TeacherHasUeGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user; // rempli par JwtAuthGuard, exécuté avant ce guard

    // Cette restriction ne concerne QUE les enseignants — les autres rôles passent.
    if (!user || user.role !== 'ENSEIGNANT') {
      return true;
    }

    const teacher = await this.prisma.teacher.findUnique({
      where: { userId: user.userId },
    });

    if (!teacher) {
      // Ne devrait jamais arriver si le compte a été créé correctement,
      // mais on refuse par prudence plutôt que de planter plus loin.
      throw new ForbiddenException('Profil enseignant introuvable');
    }

    const assignmentCount = await this.prisma.teacherUeAssignment.count({
      where: { teacherId: teacher.id },
    });

    if (assignmentCount === 0) {
      throw new ForbiddenException(
        "Votre compte n'a encore aucune UE assignée — contactez l'administration pour accéder à cette fonctionnalité",
      );
    }

    return true;
  }
}