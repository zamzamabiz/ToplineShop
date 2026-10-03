import { IsInt, IsOptional, IsString, IsUrl, MaxLength, Min } from 'class-validator';

export class GalleryItemDto {
  @IsString() @MaxLength(255) title!: string;
  @IsUrl({ require_tld: false }) imageUrl!: string;
  @IsString() @MaxLength(255) altText!: string;
  @IsOptional() @IsString() @MaxLength(600) caption?: string;
  @IsOptional() @IsInt() @Min(0) sortOrder?: number;
}
