import { IsString, IsNotEmpty, IsIn, IsOptional, MaxLength, MinLength, Matches } from 'class-validator';

export const VENDOR_STATUSES = ['DRAFT', 'ACTIVE', 'SUSPENDED'] as const;

export type VendorStatusInput = (typeof VENDOR_STATUSES)[number];

export class CreateVendorDto {
  @IsString()
  @IsNotEmpty()
  tenantId!: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(255)
  name!: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(255)
  @Matches(/^[a-z0-9-]+$/, {
    message: 'slug must contain only lowercase letters, numbers, and hyphens',
  })
  slug!: string;

  @IsIn(VENDOR_STATUSES, { message: 'status must be one of: DRAFT, ACTIVE, SUSPENDED' })
  status!: VendorStatusInput;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2048)
  logo?: string;
}
