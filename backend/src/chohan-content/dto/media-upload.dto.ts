import { IsDateString, IsOptional, IsString, MaxLength } from 'class-validator';

export class MediaUploadDto {
  @IsString() @MaxLength(255) altText!: string;
  @IsOptional() @IsString() @MaxLength(600) caption?: string;
  @IsOptional() @IsString() @MaxLength(600) rightsNote?: string;
  @IsOptional() @IsDateString() expiresAt?: string;
}
