import { IsEmail, IsInt, IsString, Max, Min, MinLength } from 'class-validator';

export class CreateForumEntryDto {
  @IsString()
  @MinLength(1)
  nom!: string;

  @IsEmail()
  email!: string;

  @IsInt()
  @Min(1)
  @Max(5)
  etoiles!: number;

  @IsString()
  @MinLength(1)
  commentaire!: string;
}