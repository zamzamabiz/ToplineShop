import { IsString, IsNotEmpty, IsIn, MaxLength, MinLength, Matches } from 'class-validator';

export const TENANT_TYPES = ['PLATFORM', 'VENDOR'] as const;
export const TENANT_STATUSES = ['ACTIVE', 'SUSPENDED'] as const;

export type TenantType = (typeof TENANT_TYPES)[number];
export type TenantStatus = (typeof TENANT_STATUSES)[number];

export class CreateTenantDto {
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

  @IsIn(TENANT_TYPES, { message: 'type must be one of: PLATFORM, VENDOR' })
  type!: TenantType;

  @IsIn(TENANT_STATUSES, { message: 'status must be one of: ACTIVE, SUSPENDED' })
  status!: TenantStatus;
}
