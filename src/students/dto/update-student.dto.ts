import { IsString, IsEnum, IsOptional } from 'class-validator';
import { StudentStatus } from '@prisma/client';

export class UpdateStudentDto {
  @IsOptional()
  @IsString()
  firstName?: string;

  @IsOptional()
  @IsString()
  lastName?: string;

  @IsOptional()
  @IsEnum(StudentStatus)
  status?: StudentStatus;
}