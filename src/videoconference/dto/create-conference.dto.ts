import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsUUID, Max, Min, ValidateIf } from 'class-validator';
import { ConferenceVisibility } from '@prisma/client';

export class CreateConferenceDto {
  @IsEnum(ConferenceVisibility)
  visibility!: ConferenceVisibility;

  // Obligatoire uniquement si visibility === 'PRIVATE' ; ignoré si 'PUBLIC'.
  @ValidateIf((o) => o.visibility === ConferenceVisibility.PRIVATE)
  @IsUUID()
  courseId?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(200)
  maxParticipants?: number;
}