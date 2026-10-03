import { IsDateString, IsOptional, IsString, IsUrl, MaxLength } from 'class-validator';

export class MediaAssetDto {
  @IsUrl({ require_tld: false }) url!: string;
  @IsOptional() @IsString() @MaxLength(255) storageKey?: string;
  @IsString() @MaxLength(100) mimeType!: string;
  @IsString() @MaxLength(255) altText!: string;
  @IsOptional() @IsString() @MaxLength(600) caption?: string;
  @IsOptional() @IsString() @MaxLength(600) rightsNote?: string;
  @IsOptional() @IsDateString() expiresAt?: string;
}
