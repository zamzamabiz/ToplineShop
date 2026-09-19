import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { AnalyticsFilterDto } from './analytics-filter.dto';

// Server-approved sort columns only — §19.
const SORT_COLUMNS = [
  'tradeDate',
  'createdAt',
  'id',
  'tradeDirection',
  'hsCodeNormalized',
  'foreignPartyCountryCode',
] as const;
export type RecordSortColumn = (typeof SORT_COLUMNS)[number];
export { SORT_COLUMNS };

export class ListRecordsDto extends AnalyticsFilterDto {
  @IsOptional() @IsString() sortBy?: RecordSortColumn;
  @IsOptional() @IsEnum(['asc', 'desc']) sortDir?: 'asc' | 'desc';

  @IsOptional() @Type(() => Number) @IsInt() @Min(0) page?: number;

  // §16 — raw page max 500.
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(500) pageSize?: number;
}
