import { IsString, IsNotEmpty, IsIn, IsOptional, IsInt, Min, MaxLength, MinLength, Matches } from 'class-validator';

export const CATEGORY_STATUSES = ['ACTIVE', 'HIDDEN'] as const;

export type CategoryStatusInput = (typeof CATEGORY_STATUSES)[number];

export class CreateCategoryDto {
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

  @IsIn(CATEGORY_STATUSES, { message: 'status must be one of: ACTIVE, HIDDEN' })
  status!: CategoryStatusInput;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  icon?: string;

  @IsOptional()
  @IsString()
  parentId?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;
}
