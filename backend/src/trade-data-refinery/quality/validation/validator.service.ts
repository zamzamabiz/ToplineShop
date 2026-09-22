import { IssueSeverity } from '@prisma/client';
import { MappingConfigV1 } from '../types/mapping-config.types';
import { NormalizationResult } from '../normalization/normalizer.service';
import { RULE_CODE } from '../constants/validation-rule.catalog';

export interface ValidationIssueInput {
  fieldName: string | null;
  ruleCode: string;
  severity: IssueSeverity;
  message: string;
  rawValue: string | null;
}

/**
 * Runs v1 validation on a normalized row.
 * Required-field policy comes from the locked mapping config.
 * Normalization warnings are promoted to ValidationIssues here.
 */
export function validateRowV1(
  normalized: NormalizationResult,
  config: MappingConfigV1,
): ValidationIssueInput[] {
  const issues: ValidationIssueInput[] = [];

  // Promote normalization warnings to validation issues
  for (const w of normalized.warnings) {
    const severity = warningToSeverity(w.ruleCode);
    issues.push({
      fieldName: w.fieldName,
      ruleCode: w.ruleCode,
      severity,
      message: buildWarningMessage(w.ruleCode, w.fieldName, w.rawValue),
      rawValue: bounded(w.rawValue),
    });
  }

  // Required-field checks from mapping config
  for (const cm of config.columnMappings) {
    if (cm.requiredPolicy !== 'REQUIRED') continue;
    const rawValue = getRawValueForCanonical(normalized, cm.canonicalField);
    if (rawValue === null || rawValue === '') {
      issues.push({
        fieldName: cm.canonicalField,
        ruleCode: RULE_CODE.REQUIRED_FIELD_MISSING,
        severity: 'WARNING',
        message: `Required field "${cm.canonicalField}" is missing or blank`,
        rawValue: null,
      });
    }
  }

  // HS code format check (WARNING if present but invalid-looking)
  if (normalized.hsCodeRaw !== null && normalized.hsCodeNormalized !== null) {
    if (!isValidHsCodeFormat(normalized.hsCodeNormalized)) {
      issues.push({
        fieldName: 'hsCodeNormalized',
        ruleCode: RULE_CODE.HS_CODE_INVALID_FORMAT,
        severity: 'WARNING',
        message: `HS code "${normalized.hsCodeNormalized}" does not match expected format`,
        rawValue: bounded(normalized.hsCodeRaw),
      });
    }
  }

  // §9 Conditional validation: quantity supplied without unit
  if (normalized.quantityNormalized !== null && !normalized.quantityUnitRaw) {
    issues.push({
      fieldName: 'quantityUnitRaw',
      ruleCode: RULE_CODE.QUANTITY_WITHOUT_UNIT,
      severity: 'WARNING',
      message: 'quantity is supplied but quantity_unit is missing',
      rawValue: null,
    });
  }

  // §9 Conditional validation: unit_price supplied without currency_code
  if (normalized.unitPriceNormalized !== null && !normalized.currencyRaw) {
    issues.push({
      fieldName: 'currencyRaw',
      ruleCode: RULE_CODE.PRICE_WITHOUT_CURRENCY,
      severity: 'WARNING',
      message: 'unit_price is supplied but currency_code is missing',
      rawValue: null,
    });
  }

  return issues;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function warningToSeverity(ruleCode: string): IssueSeverity {
  switch (ruleCode) {
    case RULE_CODE.TRADE_DATE_INVALID:
      return 'ERROR';
    case RULE_CODE.QUANTITY_NEGATIVE:
    case RULE_CODE.UNIT_PRICE_NEGATIVE:
      return 'WARNING';
    case RULE_CODE.DECIMAL_OVERFLOW:
      return 'ERROR';
    case RULE_CODE.CURRENCY_UNKNOWN:
    case RULE_CODE.UNIT_UNKNOWN:
    case RULE_CODE.COUNTRY_UNKNOWN:
    case RULE_CODE.HS_CODE_INVALID_FORMAT:
      return 'WARNING';
    case RULE_CODE.QUANTITY_INVALID:
    case RULE_CODE.UNIT_PRICE_INVALID:
      return 'ERROR';
    case RULE_CODE.QUANTITY_WITHOUT_UNIT:
    case RULE_CODE.PRICE_WITHOUT_CURRENCY:
      return 'WARNING';
    default:
      return 'WARNING';
  }
}

function buildWarningMessage(ruleCode: string, fieldName: string, rawValue: string | null): string {
  const rv = rawValue ? ` (raw: "${rawValue.slice(0, 50)}")` : '';
  switch (ruleCode) {
    case RULE_CODE.TRADE_DATE_INVALID:
      return `Trade date could not be parsed${rv}`;
    case RULE_CODE.QUANTITY_INVALID:
      return `Quantity is not a valid decimal${rv}`;
    case RULE_CODE.QUANTITY_NEGATIVE:
      return `Quantity is negative${rv}`;
    case RULE_CODE.UNIT_PRICE_INVALID:
      return `Unit price is not a valid decimal${rv}`;
    case RULE_CODE.UNIT_PRICE_NEGATIVE:
      return `Unit price is negative${rv}`;
    case RULE_CODE.CURRENCY_UNKNOWN:
      return `Currency code not recognized${rv}`;
    case RULE_CODE.UNIT_UNKNOWN:
      return `Unit of measure not recognized${rv}`;
    case RULE_CODE.COUNTRY_UNKNOWN:
      return `Country not recognized${rv}`;
    case RULE_CODE.DECIMAL_OVERFLOW:
      return `Decimal value exceeds NUMERIC(24,6) capacity${rv}`;
    case RULE_CODE.QUANTITY_WITHOUT_UNIT:
      return `quantity is supplied but quantity_unit is missing`;
    case RULE_CODE.PRICE_WITHOUT_CURRENCY:
      return `unit_price is supplied but currency_code is missing`;
    default:
      return `Validation warning for ${fieldName}${rv}`;
  }
}

function getRawValueForCanonical(norm: NormalizationResult, field: string): string | null {
  const map: Record<string, string | null | undefined> = {
    // Legacy local/foreign party fields
    tradeDate: norm.tradeDateRaw,
    hsCodeRaw: norm.hsCodeRaw,
    productDescriptionRaw: norm.productDescriptionRaw,
    localPartyTaxIdRaw: norm.localPartyTaxIdRaw,
    localPartyNameRaw: norm.localPartyNameRaw,
    localPartyAddressRaw: norm.localPartyAddressRaw,
    foreignPartyNameRaw: norm.foreignPartyNameRaw,
    foreignPartyAddressRaw: norm.foreignPartyAddressRaw,
    foreignPartyCountryRaw: norm.foreignPartyCountryRaw,
    originPortRaw: norm.originPortRaw,
    // Canonical exporter/importer fields (spec §2)
    exporterIdRaw: norm.exporterIdRaw,
    exporterNameRaw: norm.exporterNameRaw,
    exporterAddressRaw: norm.exporterAddressRaw,
    exporterCountryRaw: norm.exporterCountryRaw,
    importerIdRaw: norm.importerIdRaw,
    importerNameRaw: norm.importerNameRaw,
    importerAddressRaw: norm.importerAddressRaw,
    importerCountryRaw: norm.importerCountryRaw,
    portOfLoadingRaw: norm.portOfLoadingRaw,
    portOfDischargeRaw: norm.portOfDischargeRaw,
    dataSourceRaw: norm.dataSourceRaw,
    // Quantity/price
    quantityRaw: norm.quantityRaw,
    quantityUnitRaw: norm.quantityUnitRaw,
    unitPriceRaw: norm.unitPriceRaw,
    currencyRaw: norm.currencyRaw,
  };
  const v = map[field];
  return v ?? null;
}

function isValidHsCodeFormat(hs: string): boolean {
  // HS codes: 2+ digits, optionally followed by dot and more digits
  return /^\d{2,}(\.\d+)?$/.test(hs);
}

/** Truncate rawValue for DB storage to avoid bloat. */
function bounded(v: string | null, maxLen = 200): string | null {
  if (!v) return null;
  return v.length > maxLen ? v.slice(0, maxLen) + '…' : v;
}
