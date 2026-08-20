import {
  IsEmail,
  IsString,
  MinLength,
  IsIn,
  IsOptional,
  IsUUID,
} from 'class-validator';

export class RegisterDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(8)
  password!: string;

  // Restreint volontairement aux deux seuls rôles auto-inscriptibles (§4 du document).
  // ADMIN/SUPER_ADMIN/DIRECTION/SECRETARIAT/DELEGUE ne peuvent JAMAIS être obtenus via
  // cette route publique — DELEGUE s'attribue uniquement via promotion.
  @IsIn(['ETUDIANT', 'ENSEIGNANT'])
  role!: 'ETUDIANT' | 'ENSEIGNANT';

  @IsString()
  universityCode!: string;

  @IsString()
  firstName!: string;

  @IsString()
  lastName!: string;

  @IsOptional()
  @IsUUID()
  levelId?: string;

  @IsOptional()
  @IsUUID()
  specialtyId?: string;
}