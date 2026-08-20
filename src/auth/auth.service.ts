import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshDto } from './dto/refresh.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const university = await this.prisma.university.findUnique({
      where: { code: dto.universityCode },
    });
    if (!university) {
      throw new BadRequestException(`Université inconnue : "${dto.universityCode}"`);
    }

    const existingUser = await this.prisma.user.findUnique({
      where: { email_universityId: { email: dto.email, universityId: university.id } },
    });

    if (existingUser) {
      throw new ConflictException('Un compte existe déjà avec cet email dans cette université');
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        passwordHash,
        role: dto.role,
        universityId: university.id,
      },
    });

    if (dto.role === 'ETUDIANT') {
<<<<<<< Updated upstream
      if (!dto.levelId) {
        throw new BadRequestException('levelId est requis pour un étudiant');
      }
=======
      const levelId = dto.levelId ?? (await this.findOrCreateDefaultLevel(university.id));
>>>>>>> Stashed changes

      await this.prisma.student.create({
        data: {
          userId: user.id,
          firstName: dto.firstName,
          lastName: dto.lastName,
<<<<<<< Updated upstream
          matricule: await this.generateMatricule(),
          levelId: dto.levelId,
=======
          matricule: await this.generateMatricule(university.code),
          levelId,
>>>>>>> Stashed changes
          specialtyId: dto.specialtyId,
        },
      });
    } else if (dto.role === 'ENSEIGNANT') {
      await this.prisma.teacher.create({
        data: {
          userId: user.id,
          firstName: dto.firstName,
          lastName: dto.lastName,
        },
      });
    }

    return this.buildAuthResponse(user.id, user.email, user.role);
  }

  async login(dto: LoginDto) {
    const university = await this.prisma.university.findUnique({
      where: { code: dto.universityCode },
    });
    if (!university) {
      // Message volontairement identique à un échec classique : ne pas révéler
      // si un code université existe ou non (évite l'énumération d'établissements).
      throw new UnauthorizedException('Email ou mot de passe incorrect');
    }

    const user = await this.prisma.user.findUnique({
      where: { email_universityId: { email: dto.email, universityId: university.id } },
    });

    if (!user) {
      throw new UnauthorizedException('Email ou mot de passe incorrect');
    }

    const passwordValid = await bcrypt.compare(dto.password, user.passwordHash);

    if (!passwordValid) {
      throw new UnauthorizedException('Email ou mot de passe incorrect');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Compte désactivé');
    }

    return this.buildAuthResponse(user.id, user.email, user.role);
  }

  async refresh(dto: RefreshDto) {
    let payload: { sub: string; email: string; role: string };

    try {
      payload = this.jwtService.verify(dto.refreshToken);
    } catch {
      throw new UnauthorizedException('Refresh token invalide ou expiré');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
    });

    if (!user || !user.refreshTokenHash) {
      throw new UnauthorizedException('Refresh token invalide');
    }

    const incomingTokenHash = this.hashToken(dto.refreshToken);

    if (incomingTokenHash !== user.refreshTokenHash) {
      throw new UnauthorizedException('Refresh token invalide');
    }

    // Rotation : on génère de nouveaux tokens, l'ancien devient inutilisable
    return this.buildAuthResponse(user.id, user.email, user.role);
  }

  private async buildAuthResponse(userId: string, email: string, role: string) {
    const payload = { sub: userId, email, role };

<<<<<<< Updated upstream
    const accessToken = this.jwtService.sign(payload, {
      expiresIn: '1h',
=======
  async getAcademicOptions(universityCode: string) {
    const university = await this.prisma.university.findUnique({
      where: { code: universityCode },
    });
    if (!university) {
      throw new BadRequestException(`Université inconnue : "${universityCode}"`);
    }

    await this.ensureAcademicDefaults(university.id);

    const levels = await this.prisma.level.findMany({
      where: { program: { department: { faculty: { universityId: university.id } } } },
      select: {
        id: true,
        name: true,
        program: { select: { name: true } },
      },
      orderBy: { name: 'asc' },
    });
    const specialties = await this.prisma.specialty.findMany({
      where: { level: { program: { department: { faculty: { universityId: university.id } } } } },
      select: { id: true, name: true, levelId: true },
      orderBy: { name: 'asc' },
    });
    return {
      levels: levels.map((level) => ({
        id: level.id,
        name: level.name,
        programName: level.program.name,
      })),
      specialties,
    };
  }

  async getSpecialties(universityCode: string, levelId?: string) {
    const university = await this.prisma.university.findUnique({
      where: { code: universityCode },
    });
    if (!university) {
      throw new BadRequestException(`Université inconnue : "${universityCode}"`);
    }

    await this.ensureAcademicDefaults(university.id);

    return this.prisma.specialty.findMany({
      where: {
        ...(levelId ? { levelId } : {}),
        level: { program: { department: { faculty: { universityId: university.id } } } },
      },
      select: { id: true, name: true, levelId: true },
      orderBy: { name: 'asc' },
    });
  }

  private async ensureAcademicDefaults(universityId: string) {
    const existingLevels = await this.prisma.level.count({
      where: { program: { department: { faculty: { universityId } } } },
    });
    if (existingLevels > 0) return;

    const faculty = await this.prisma.faculty.create({
      data: { name: 'Faculté des Sciences', universityId },
>>>>>>> Stashed changes
    });

    const refreshToken = this.jwtService.sign(payload, {
      expiresIn: '7d',
    });

<<<<<<< Updated upstream
    // Hash rapide (SHA-256) adapté à un secret déjà à haute entropie
=======
    const program = await this.prisma.program.create({
      data: {
        name: 'Licence Informatique',
        departmentId: department.id,
      },
    });

    const level1 = await this.prisma.level.create({
      data: { name: 'Licence 1', programId: program.id },
    });
    const level2 = await this.prisma.level.create({
      data: { name: 'Licence 2', programId: program.id },
    });
    const level3 = await this.prisma.level.create({
      data: { name: 'Licence 3', programId: program.id },
    });

    await this.prisma.specialty.createMany({
      data: [
        { name: 'Informatique', levelId: level1.id },
        { name: 'Informatique', levelId: level2.id },
        { name: 'Informatique', levelId: level3.id },
        { name: 'Génie Logiciel', levelId: level2.id },
        { name: 'Réseaux et Télécommunications', levelId: level3.id },
      ],
    });
  }

  private async buildAuthResponse(userId: string) {
    const user = await this.findUserWithProfile(userId);
    if (!user) {
      throw new UnauthorizedException('Utilisateur introuvable');
    }

    const payload = { sub: user.id, email: user.email, role: user.role };

    // Tokens without expiry to allow long-lived sessions (no enforced time limit)
    //const accessToken = this.jwtService.sign(payload)

    // Refresh token also without explicit expiry; rotation still applies via stored hash
    //const refreshToken = this.jwtService.sign(payload)


    // §9.2 du CDC : access token 1h, refresh token 7j
    const accessToken = this.jwtService.sign(payload, { expiresIn: '1h' });
    const refreshToken = this.jwtService.sign(payload, { expiresIn: '7d' });

>>>>>>> Stashed changes
    const refreshTokenHash = this.hashToken(refreshToken);
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshTokenHash },
    });

    return {
      accessToken,
      refreshToken,
      user: { id: userId, email, role },
    };
  }

<<<<<<< Updated upstream
=======
  private async findUserWithProfile(userId: string) {
    return this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        student: {
          include: {
            level: { select: { name: true } },
            specialty: { select: { name: true } },
          },
        },
        teacher: true,
      },
    });
  }

  private buildUserProfile(user: {
    id: string;
    email: string;
    role: string;
    student:
      | {
          id: string;
          firstName: string;
          lastName: string;
          matricule: string;
          level?: { name: string } | null;
          specialty?: { name: string } | null;
        }
      | null;
    teacher: { id: string; firstName: string; lastName: string } | null;
  }) {
    return {
      id: user.id,
      email: user.email,
      role: user.role,
      student: user.student
        ? {
            id: user.student.id,
            firstName: user.student.firstName,
            lastName: user.student.lastName,
            matricule: user.student.matricule,
            level: user.student.level?.name,
            specialty: user.student.specialty?.name,
          }
        : undefined,
      teacher: user.teacher
        ? {
            id: user.teacher.id,
            firstName: user.teacher.firstName,
            lastName: user.teacher.lastName,
          }
        : undefined,
    };
  }

  private async findOrCreateDefaultLevel(universityId: string) {
    let level = await this.prisma.level.findFirst({
      where: { program: { department: { faculty: { universityId } } } },
    });
    if (level) return level.id;

    const faculty = await this.prisma.faculty.create({
      data: { name: 'Faculté des Sciences', universityId },
    });

    const department = await this.prisma.department.create({
      data: {
        name: 'Département d\'Informatique',
        facultyId: faculty.id,
      },
    });

    const program = await this.prisma.program.create({
      data: {
        name: 'Licence Informatique',
        departmentId: department.id,
      },
    });

    level = await this.prisma.level.create({
      data: {
        name: 'Licence 1',
        programId: program.id,
      },
    });

    return level.id;
  }
  
>>>>>>> Stashed changes
  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  private async generateMatricule(universityCode: string): Promise<string> {
    const year = new Date().getFullYear();
    const count = await this.prisma.student.count({
      where: { user: { university: { code: universityCode } } },
    });
    return `${universityCode}-${year}-${String(count + 1).padStart(5, '0')}`;
  }
}
