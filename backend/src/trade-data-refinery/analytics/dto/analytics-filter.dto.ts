import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { Transform } from 'class-transformer';

export enum TrendGranularity {
  DAY = 'DAY',
  MONTH = 'MONTH',
  YEAR = 'YEAR',
}

// Whitelist only — client may not supply arbitrary dimension names.
export enum BreakdownDimension {
  TRADE_DIRECTION = 'tradeDirection',
  HS_CHAPTER = 'hsChapter',
  FOREIGN_COUNTRY = 'foreignPartyCountryCode',
  CURRENCY_CODE = 'currencyCode',
  QUANTITY_UNIT = 'quantityUnitCode',
}

const ALLOWED_DISPOSITIONS = ['ACCEPTED', 'QUARANTINED', 'REJECTED'] as const;
export type RowDispositionFilter = (typeof ALLOWED_DISPOSITIONS)[number];

// §11 — canonical analytics filter contract: 13 fields, no tenantId, no SQL strings.
export class AnalyticsFilterDto {
  @IsOptional() @IsString() dateFrom?: string;
  @IsOptional() @IsString() dateTo?: string;

  @IsOptional() @IsEnum(['IMPORT', 'EXPORT']) tradeDirection?: 'IMPORT' | 'EXPORT';

  @IsOptional() @IsString() @MaxLength(20) hsCodePrefix?: string;
  @IsOptional() @IsString() @MaxLength(2) hsChapter?: string;

  @IsOptional() @IsString() @MaxLength(2) foreignCountryCode?: string;

  @IsOptional() @IsString() @MaxLength(100) localPartyTaxId?: string;

  @IsOptional() @IsString() @MaxLength(36) batchId?: string;

  @IsOptional()
  @IsArray()
  @IsIn(ALLOWED_DISPOSITIONS, { each: true })
  dispositions?: RowDispositionFilter[];

  @IsOptional() @IsString() @MaxLength(3) currencyCode?: string;
  @IsOptional() @IsString() @MaxLength(20) quantityUnitCode?: string;

  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  exportEligible?: boolean;
}
