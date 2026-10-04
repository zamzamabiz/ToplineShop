import { IsDateString, IsOptional, IsString, IsUrl, MaxLength } from 'class-validator';

export class CompanyEventDto {
  @IsString() @MaxLength(255) title!: string;
  @IsString() @MaxLength(1200) summary!: string;
  @IsString() @MaxLength(255) location!: string;
  @IsDateString() startsAt!: string;
  @IsOptional() @IsUrl({ require_tld: false }) imageUrl?: string;
}
