import { IsString, IsEmail, IsEnum, IsOptional, MinLength } from 'class-validator';
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

  @IsOptional()
  @IsEnum(StudentStatus)
  status?: StudentStatus;
}