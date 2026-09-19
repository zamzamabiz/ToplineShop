import { Decimal } from '@prisma/client/runtime/library';
import { MappingConfigV1, ValueTreatment } from '../types/mapping-config.types';
import { resolveCurrencyCode } from './currency.map';
import { resolveUnitCode } from './unit.map';
import { resolveCountryCode } from './country.map';

/** Maximum scale for NUMERIC(24,6) — reject if more integer digits would overflow. */
const DECIMAL_MAX_INTEGER_DIGITS = 18;
const DECIMAL_MAX_SCALE = 6;

export interface NormalizationResult {
  tradeDate: Date | null;
  tradeDateRaw: string | null;

  hsCodeRaw: string | null;
  hsCodeNormalized: string | null;
  hsChapter: string | null;

  productDescriptionRaw: string | null;
  productDescriptionNormalized: string | null;

  localPartyTaxIdRaw: string | null;
  localPartyTaxIdNormalized: string | null;
  localPartyNameRaw: string | null;
  localPartyNameNormalized: string | null;
  localPartyAddressRaw: string | null;
  localPartyCountryCode: string | null;

  foreignPartyNameRaw: string | null;
  foreignPartyNameNormalized: string | null;
  foreignPartyAddressRaw: string | null;
  foreignPartyCountryRaw: string | null;
  foreignPartyCountryCode: string | null;

  originPortRaw: string | null;
  originPortNormalized: string | null;

  quantityRaw: string | null;
  quantityNormalized: Decimal | null;
  quantityUnitRaw: string | null;
  quantityUnitCode: string | null;

  unitPriceRaw: string | null;
  unitPriceNormalized: Decimal | null;
  currencyRaw: string | null;
  currencyCode: string | null;

  valueTreatmentMeta: Record<string, ValueTreatment>;

  // Normalization warnings (not errors) — caller adds them as ValidationIssue
  warnings: NormWarning[];
}

export interface NormWarning {
  fieldName: string;
  ruleCode: string;
  rawValue: string | null;
}

/**
 * Applies v1 normalization rules to a flat source row.
 * Uses the locked mapping config to map source column names to canonical fields.
 * Never modifies raw values; all raw fields are immutable after this point.
 */
export function normalizeRowV1(
  sourceRow: Record<string, string>,
  config: MappingConfigV1,
): NormalizationResult {
  const meta: Record<string, ValueTreatment> = {};
  const warnings: NormWarning[] = [];

  // Build a quick lookup: canonicalField → { rawValue, rule }
  const fieldValues = buildFieldValues(sourceRow, config);

  const tradeDateRaw = fieldValues['tradeDate'] ?? null;
  const { date: tradeDate, warn: tradeDateWarn } = parseDate(
    tradeDateRaw,
    getDateFormats(config, 'tradeDate'),
  );
  if (tradeDateRaw !== null) meta['tradeDate'] = tradeDateWarn ? 'SOURCE' : 'NORMALIZED';
  if (tradeDateWarn) warnings.push({ fieldName: 'tradeDate', ruleCode: 'TRADE_DATE_INVALID', rawValue: tradeDateRaw });

  const hsCodeRaw = fieldValues['hsCodeRaw'] ?? null;
  const hsCodeNormalized = normalizeHsCode(hsCodeRaw);
  const hsChapter = deriveHsChapter(hsCodeNormalized);
  if (hsCodeRaw !== null) meta['hsCodeNormalized'] = 'NORMALIZED';

  const productDescriptionRaw = fieldValues['productDescriptionRaw'] ?? null;
  const productDescriptionNormalized = normalizeText(productDescriptionRaw);
  if (productDescriptionRaw !== null) meta['productDescriptionNormalized'] = 'NORMALIZED';

  const localPartyTaxIdRaw = fieldValues['localPartyTaxIdRaw'] ?? null;
  const localPartyTaxIdNormalized = normalizeTaxId(localPartyTaxIdRaw);
  if (localPartyTaxIdRaw !== null) meta['localPartyTaxIdNormalized'] = 'NORMALIZED';

  const localPartyNameRaw = fieldValues['localPartyNameRaw'] ?? null;
  const localPartyNameNormalized = normalizeText(localPartyNameRaw);
  if (localPartyNameRaw !== null) meta['localPartyNameNormalized'] = 'NORMALIZED';

  const localPartyAddressRaw = fieldValues['localPartyAddressRaw'] ?? null;
  const localPartyCountryCode = config.localCountryCode ?? null;
  if (config.localCountryCode) meta['localPartyCountryCode'] = 'DEFAULTED';

  const foreignPartyNameRaw = fieldValues['foreignPartyNameRaw'] ?? null;
  const foreignPartyNameNormalized = normalizeText(foreignPartyNameRaw);

  const foreignPartyAddressRaw = fieldValues['foreignPartyAddressRaw'] ?? null;
  const foreignPartyCountryRaw = fieldValues['foreignPartyCountryRaw'] ?? null;
  const foreignPartyCountryCode = foreignPartyCountryRaw !== null
    ? (resolveCountryCode(foreignPartyCountryRaw) ?? null)
    : null;
  if (foreignPartyCountryRaw !== null && foreignPartyCountryCode === null) {
    warnings.push({ fieldName: 'foreignPartyCountryCode', ruleCode: 'COUNTRY_UNKNOWN', rawValue: foreignPartyCountryRaw });
  }
  if (foreignPartyCountryCode !== null) meta['foreignPartyCountryCode'] = 'NORMALIZED';

  const originPortRaw = fieldValues['originPortRaw'] ?? null;
  const originPortNormalized = normalizeText(originPortRaw);

  const quantityRaw = fieldValues['quantityRaw'] ?? null;
  const { value: quantityNormalized, warn: quantityWarn } = parseDecimal(quantityRaw);
  if (quantityRaw !== null) meta['quantityNormalized'] = quantityWarn ? 'SOURCE' : 'NORMALIZED';
  if (quantityWarn) warnings.push({ fieldName: 'quantityNormalized', ruleCode: quantityWarn, rawValue: quantityRaw });
  if (quantityNormalized !== null && quantityNormalized.isNegative()) {
    warnings.push({ fieldName: 'quantityNormalized', ruleCode: 'QUANTITY_NEGATIVE', rawValue: quantityRaw });
  }

  const quantityUnitRaw = fieldValues['quantityUnitRaw'] ?? null;
  const quantityUnitCode = quantityUnitRaw !== null ? (resolveUnitCode(quantityUnitRaw) ?? null) : null;
  if (quantityUnitRaw !== null && quantityUnitCode === null) {
    warnings.push({ fieldName: 'quantityUnitCode', ruleCode: 'UNIT_UNKNOWN', rawValue: quantityUnitRaw });
  }
  if (quantityUnitCode !== null) meta['quantityUnitCode'] = 'NORMALIZED';

  const unitPriceRaw = fieldValues['unitPriceRaw'] ?? null;
  const { value: unitPriceNormalized, warn: priceWarn } = parseDecimal(unitPriceRaw);
  if (unitPriceRaw !== null) meta['unitPriceNormalized'] = priceWarn ? 'SOURCE' : 'NORMALIZED';
  if (priceWarn) warnings.push({ fieldName: 'unitPriceNormalized', ruleCode: priceWarn, rawValue: unitPriceRaw });
  if (unitPriceNormalized !== null && unitPriceNormalized.isNegative()) {
    warnings.push({ fieldName: 'unitPriceNormalized', ruleCode: 'UNIT_PRICE_NEGATIVE', rawValue: unitPriceRaw });
  }

  const currencyRaw = fieldValues['currencyRaw'] ?? null;
  const currencyCode = currencyRaw !== null ? (resolveCurrencyCode(currencyRaw) ?? null) : null;
  if (currencyRaw !== null && currencyCode === null) {
    warnings.push({ fieldName: 'currencyCode', ruleCode: 'CURRENCY_UNKNOWN', rawValue: currencyRaw });
  }
  if (currencyCode !== null) meta['currencyCode'] = 'NORMALIZED';

  return {
    tradeDate,
    tradeDateRaw,
    hsCodeRaw,
    hsCodeNormalized,
    hsChapter,
    productDescriptionRaw,
    productDescriptionNormalized,
    localPartyTaxIdRaw,
    localPartyTaxIdNormalized,
    localPartyNameRaw,
    localPartyNameNormalized,
    localPartyAddressRaw,
    localPartyCountryCode,
    foreignPartyNameRaw,
    foreignPartyNameNormalized,
    foreignPartyAddressRaw,
    foreignPartyCountryRaw,
    foreignPartyCountryCode,
    originPortRaw,
    originPortNormalized,
    quantityRaw,
    quantityNormalized,
    quantityUnitRaw,
    quantityUnitCode,
    unitPriceRaw,
    unitPriceNormalized,
    currencyRaw,
    currencyCode,
    valueTreatmentMeta: meta,
    warnings,
  };
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function buildFieldValues(
  sourceRow: Record<string, string>,
  config: MappingConfigV1,
): Record<string, string | null> {
  const result: Record<string, string | null> = {};
  for (const cm of config.columnMappings) {
    const raw = sourceRow[cm.sourceColumnName];
    // Blank string treated as absent for optional fields; preserved as empty for required
    result[cm.canonicalField] = raw !== undefined ? raw : null;
  }
  return result;
}

function getDateFormats(config: MappingConfigV1, _field: string): string[] {
  // Look for DATE column mapping with transformationRule hint
  const cm = config.columnMappings.find((c) => c.canonicalField === 'tradeDate');
  if (cm?.transformationRule === 'DATE_PARSE_DMY') return ['DD-MM-YYYY', 'DD/MM/YYYY'];
  if (cm?.transformationRule === 'DATE_PARSE_MDY') return ['MM-DD-YYYY', 'MM/DD/YYYY'];
  if (cm?.transformationRule === 'DATE_PARSE_YMD') return ['YYYY-MM-DD', 'YYYY/MM/DD'];
  // Fallback: try common formats
  return ['DD-MM-YYYY', 'DD/MM/YYYY', 'YYYY-MM-DD', 'MM/DD/YYYY'];
}

/**
 * Parses a date string against allowed formats.
 * Returns null date + warn=true for invalid/ambiguous inputs.
 * Never uses new Date(ambiguousString) for business parsing.
 */
function parseDate(raw: string | null, formats: string[]): { date: Date | null; warn: boolean } {
  if (!raw || !raw.trim()) return { date: null, warn: false };
  const trimmed = raw.trim();

  for (const fmt of formats) {
    const d = parseDateByFormat(trimmed, fmt);
    if (d !== null) return { date: d, warn: false };
  }

  return { date: null, warn: true };
}

function parseDateByFormat(s: string, fmt: string): Date | null {
  try {
    const sep = fmt.includes('-') ? '-' : '/';
    const parts = s.split(sep);
    const fmtParts = fmt.split(sep);
    if (parts.length !== 3 || fmtParts.length !== 3) return null;

    const get = (f: string) => parseInt(parts[fmtParts.indexOf(f)], 10);
    const year = get('YYYY');
    const month = get('MM');
    const day = get('DD');

    if (isNaN(year) || isNaN(month) || isNaN(day)) return null;
    if (year < 1900 || year > 2100) return null;
    if (month < 1 || month > 12) return null;
    if (day < 1 || day > 31) return null;

    const d = new Date(Date.UTC(year, month - 1, day));
    // Verify date is not impossible (e.g. Feb 30)
    if (d.getUTCFullYear() !== year || d.getUTCMonth() !== month - 1 || d.getUTCDate() !== day) return null;
    return d;
  } catch {
    return null;
  }
}

/**
 * Normalizes HS/PCT codes.
 * - Always TEXT, never numeric
 * - Strips trailing ".0" artifact (e.g. "6105.0" → "6105") when safe
 * - Preserves leading zeros
 * - Does NOT invent digits or pad
 */
export function normalizeHsCode(raw: string | null): string | null {
  if (raw === null || raw.trim() === '') return null;
  let v = raw.trim();

  // Strip a trailing ".0" that is a float-serialization artifact only when the
  // remaining part contains only digits (e.g. "6105.0" → "6105").
  // "6105.20" is kept as-is because it has a meaningful decimal component.
  if (/^\d+\.0$/.test(v)) {
    v = v.slice(0, v.lastIndexOf('.0'));
  }

  return v || null;
}

function deriveHsChapter(normalized: string | null): string | null {
  if (!normalized) return null;
  // First two digit characters only
  const digits = normalized.replace(/\D/g, '');
  return digits.length >= 2 ? digits.slice(0, 2) : null;
}

function normalizeText(raw: string | null): string | null {
  if (raw === null) return null;
  // Trim + collapse internal whitespace
  const v = raw.trim().replace(/\s+/g, ' ');
  return v || null;
}

function normalizeTaxId(raw: string | null): string | null {
  if (raw === null) return null;
  const v = raw.trim();
  if (!v) return null;
  // Keep digits, dashes, slashes — strip surrounding whitespace only
  return v.replace(/\s+/g, '') || null;
}

/**
 * Parses a decimal string to a Prisma Decimal.
 * Returns null for blank; warn code for malformed or overflow.
 * Never converts to JavaScript Number — uses string-based Decimal constructor.
 */
export function parseDecimal(raw: string | null): { value: Decimal | null; warn: string | null } {
  if (raw === null || raw.trim() === '') return { value: null, warn: null };
  const trimmed = raw.trim().replace(/,/g, ''); // remove thousands separators

  // Must match a valid numeric pattern
  if (!/^-?\d+(\.\d+)?$/.test(trimmed)) {
    return { value: null, warn: 'QUANTITY_INVALID' };
  }

  try {
    const d = new Decimal(trimmed);
    // Overflow check: NUMERIC(24,6) allows up to 18 integer digits
    const intPart = trimmed.replace('-', '').split('.')[0];
    if (intPart.length > DECIMAL_MAX_INTEGER_DIGITS) {
      return { value: null, warn: 'DECIMAL_OVERFLOW' };
    }
    const fracPart = trimmed.split('.')[1] ?? '';
    if (fracPart.length > DECIMAL_MAX_SCALE) {
      // Truncate to 6 decimal places (not round — conservative)
      const truncated = trimmed.slice(0, trimmed.indexOf('.') + DECIMAL_MAX_SCALE + 1);
      return { value: new Decimal(truncated), warn: null };
    }
    return { value: d, warn: null };
  } catch {
    return { value: null, warn: 'QUANTITY_INVALID' };
  }
}
