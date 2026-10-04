import { IsHexColor, IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

export class SiteConfigDto {
  @IsOptional() @IsIn(['midnight-shell', 'emerald-night', 'mint-executive']) themeKey?: string;
  @IsOptional() @IsHexColor() primaryColor?: string;
  @IsOptional() @IsHexColor() accentColor?: string;
  @IsOptional() @IsHexColor() canvasColor?: string;
  @IsOptional() @IsString() @MaxLength(120) heroEyebrow?: string;
  @IsOptional() @IsString() @MaxLength(180) heroHeading?: string;
  @IsOptional() @IsString() @MaxLength(1200) heroCopy?: string;
  @IsOptional() @IsString() @MaxLength(2000) heroImageUrl?: string;
  @IsOptional() @IsString() @MaxLength(120) aboutHeading?: string;
  @IsOptional() @IsString() @MaxLength(1600) aboutCopy?: string;
  @IsOptional() @IsString() @MaxLength(120) servicesHeading?: string;
  @IsOptional() @IsString() @MaxLength(1600) servicesCopy?: string;
  @IsOptional() @IsString() @MaxLength(120) responsibilityHeading?: string;
  @IsOptional() @IsString() @MaxLength(1600) responsibilityCopy?: string;
  @IsOptional() @IsString() @MaxLength(120) contactHeading?: string;
  @IsOptional() @IsString() @MaxLength(1600) contactCopy?: string;
}
