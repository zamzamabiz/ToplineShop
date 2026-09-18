import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class ReplayBatchDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  reason: string;
}
