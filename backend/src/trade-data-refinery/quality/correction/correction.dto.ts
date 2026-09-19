import { IsIn, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

/**
 * Canonical normalized fields that are user-correctable.
 * Raw source fields and system lineage fields are never in this list.
 */
export const CORRECTABLE_FIELDS = [
  'tradeDate',
  'hsCodeNormalized',
  'productDescriptionNormalized',
  'localPartyTaxIdNormalized',
  'localPartyNameNormalized',
  'foreignPartyNameNormalized',
  'foreignPartyCountryCode',
  'originPortNormalized',
  'quantityNormalized',
  'quantityUnitCode',
  'unitPriceNormalized',
  'currencyCode',
] as const;

export type CorrectableField = (typeof CORRECTABLE_FIELDS)[number];

export class CorrectionDto {
  @IsString()
  @IsNotEmpty()
  @IsIn(CORRECTABLE_FIELDS as unknown as string[])
  fieldName!: CorrectableField;

  @IsString()
  @MaxLength(500)
  correctedValue!: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  note?: string;
}
