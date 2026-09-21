import { IsEnum, IsInt, IsOptional, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { BatchStatus, TradeDirection } from '@prisma/client';

export type SourceLifecycleFilter = 'ACTIVE' | 'ARCHIVED' | 'ALL';

export class ListBatchesDto {
  @IsOptional()
  @IsEnum(BatchStatus)
  status?: BatchStatus;

  @IsOptional()
  @IsEnum(TradeDirection)
  tradeDirection?: TradeDirection;

  @IsOptional()
  @IsEnum(['ACTIVE', 'ARCHIVED', 'ALL'])
  lifecycle?: SourceLifecycleFilter;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize?: number = 25;
}
