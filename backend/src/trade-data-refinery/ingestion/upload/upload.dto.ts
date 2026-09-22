import { IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { TradeDirection } from '@prisma/client';

export class UploadBatchDto {
  @IsEnum(TradeDirection)
  tradeDirection: TradeDirection;

  @IsString()
  @IsNotEmpty()
  mappingProfileId: string;

  /** If omitted, the latest active version for the profile is used. */
  @IsOptional()
  @IsString()
  mappingVersion?: string;

  /** Calendar year of the data period (e.g. 2025). */
  @Type(() => Number)
  @IsInt()
  @Min(1900)
  @Max(2100)
  dataPeriodYear: number;

  /** Calendar month of the data period (1–12). Omit for full-year uploads. */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(12)
  dataPeriodMonth?: number;
}
