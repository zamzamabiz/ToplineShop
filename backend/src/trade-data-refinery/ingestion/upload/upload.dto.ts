import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
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
}
