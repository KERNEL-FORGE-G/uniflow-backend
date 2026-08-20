import { IsEnum, IsString, IsUUID } from 'class-validator';
import { EntityType } from '@prisma/client';

export class UploadFileDto {
  @IsEnum(EntityType)
  entityType!: EntityType;

  @IsString()
  @IsUUID() // Assure que l'ID est un UUID valide (ou @IsString() si ce n'est pas un UUID)
  entityId!: string;
}