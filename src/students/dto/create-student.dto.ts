import {
  IsString,
  IsEmail,
  IsEnum,
  IsOptional,
  IsUUID,
  MinLength,
} from 'class-validator';
import { StudentStatus } from '@prisma/client';

export class CreateStudentDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(8)
  password!: string;

  @IsString()
  firstName!: string;

  @IsString()
  lastName!: string;

<<<<<<< Updated upstream
=======
  @ApiProperty({ description: 'Code de l\'université (ex: "UY1")', example: 'UY1' })
  @IsString()
  universityCode!: string;

  @ApiPropertyOptional({ enum: StudentStatus, description: 'Statut de l\'étudiant' })
>>>>>>> Stashed changes
  @IsOptional()
  @IsEnum(StudentStatus)
  status?: StudentStatus;

  @IsUUID()
  levelId!: string;

  @IsOptional()
  @IsUUID()
  specialtyId?: string;
}
