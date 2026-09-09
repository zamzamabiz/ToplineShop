import {
  IsString,
  IsNotEmpty,
  IsIn,
  IsOptional,
  IsNumber,
  IsBoolean,
  Min,
  MaxLength,
  MinLength,
  Matches,
} from 'class-validator';

export const PRODUCT_STATUSES = ['DRAFT', 'ACTIVE', 'ARCHIVED'] as const;

export type ProductStatusInput = (typeof PRODUCT_STATUSES)[number];

export const PRODUCT_CURRENCY_REGEX = /^[A-Z]{3}$/;

export class CreateProductDto {
  @IsString()
  @IsNotEmpty()
  tenantId!: string;

  @IsString()
  @IsNotEmpty()
  vendorId!: string;

  @IsString()
  @IsNotEmpty()
  categoryId!: string;

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

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @IsNumber({ allowNaN: false, allowInfinity: false })
  @Min(0)
  basePrice!: number;

  @IsOptional()
  @IsString()
  @Matches(PRODUCT_CURRENCY_REGEX, {
    message: 'currency must be a 3-letter uppercase ISO 4217 code',
  })
  currency?: string;

  @IsIn(PRODUCT_STATUSES, { message: 'status must be one of: DRAFT, ACTIVE, ARCHIVED' })
  status!: ProductStatusInput;

  @IsOptional()
  @IsBoolean()
  inStock?: boolean;
}
