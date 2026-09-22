import {
  IsEnum,
  IsInt,
  IsISO8601,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { DEFAULT_EXPORT_ROW_LIMIT, MAX_EXPORT_ROW_LIMIT } from '../../quality/constants/quality.limits';

export class CreateExportDto {
  @IsOptional()
  @IsEnum(['IMPORT', 'EXPORT'])
  tradeDirection?: 'IMPORT' | 'EXPORT';

  @IsOptional()
  @IsUUID()
  batchId?: string;

  @IsOptional()
  @IsISO8601()
  @MaxLength(10)
  dateFrom?: string;

  @IsOptional()
  @IsISO8601()
  @MaxLength(10)
  dateTo?: string;

  @IsOptional()
  @IsString()
  @MaxLength(10)
  hsChapter?: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  hsCode?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2)
  foreignPartyCountryCode?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(MAX_EXPORT_ROW_LIMIT)
  @Type(() => Number)
  rowLimit?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(MAX_EXPORT_ROW_LIMIT)
  @Type(() => Number)
  rowOffset?: number;
}
