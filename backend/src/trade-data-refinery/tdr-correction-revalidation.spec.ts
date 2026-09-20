/**
 * TDR-CORRECTION-REVALIDATION-CORRECTION-001
 *
 * Verifies the two revalidation defects are fixed:
 *   Defect A: REQUIRED_FIELD_MISSING suppressed for raw fields whose normalized
 *             counterpart has been human-corrected (filterCorrectedRequiredIssues)
 *   Defect B: Date objects in TdrRecord are formatted back to a parseable source
 *             string using UTC accessors + transformationRule (revalidationDateString)
 *
 * All tests are pure unit tests — no Prisma, no HTTP.
 */

import 'reflect-metadata';

import {
  revalidationDateString,
  buildRevalidationRow,
  filterCorrectedRequiredIssues,
  RAW_TO_NORMALIZED_COUNTERPART,
} from './quality/correction/correction.service';
import { normalizeRowV1 } from './quality/normalization/normalizer.service';
import { validateRowV1, ValidationIssueInput } from './quality/validation/validator.service';
import { RULE_CODE } from './quality/constants/validation-rule.catalog';
import { MappingConfigV1 } from './quality/types/mapping-config.types';

// ── §1 revalidationDateString ─────────────────────────────────────────────────

describe('revalidationDateString', () => {
  const utcDate = (y: number, mo: number, d: number) =>
    new Date(Date.UTC(y, mo - 1, d));

  it('formats DATE_PARSE_DMY as DD-MM-YYYY', () => {
    expect(revalidationDateString(utcDate(2025, 1, 13), 'DATE_PARSE_DMY')).toBe('13-01-2025');
  });

  it('formats DATE_PARSE_MDY as MM-DD-YYYY', () => {
    expect(revalidationDateString(utcDate(2025, 3, 7), 'DATE_PARSE_MDY')).toBe('03-07-2025');
  });

  it('falls back to YYYY-MM-DD when no rule provided', () => {
    expect(revalidationDateString(utcDate(2025, 6, 30))).toBe('2025-06-30');
  });

  it('zero-pads single-digit month and day', () => {
    expect(revalidationDateString(utcDate(2025, 1, 1), 'DATE_PARSE_DMY')).toBe('01-01-2025');
  });

  it('produces correct date regardless of local timezone offset', () => {
    // Simulate a date at UTC midnight — must not drift to previous day
    const d = new Date('2025-01-13T00:00:00.000Z');
    expect(revalidationDateString(d, 'DATE_PARSE_DMY')).toBe('13-01-2025');
  });
});

// ── §2 buildRevalidationRow ───────────────────────────────────────────────────

describe('buildRevalidationRow', () => {
  const config: MappingConfigV1 = {
    version: 'v1',
    columnMappings: [
      { sourceColumnName: 'DATE', canonicalField: 'tradeDate', sourceDatatype: 'DATE', transformationRule: 'DATE_PARSE_DMY', requiredPolicy: 'REQUIRED', validationRules: [] },
      { sourceColumnName: 'QTY', canonicalField: 'quantityRaw', sourceDatatype: 'DECIMAL', requiredPolicy: 'REQUIRED', validationRules: [] },
      { sourceColumnName: 'DESC', canonicalField: 'productDescriptionRaw', sourceDatatype: 'TEXT', requiredPolicy: 'OPTIONAL', validationRules: [] },
    ],
  };

  it('converts Date objects to source-parseable strings using transformationRule', () => {
    const record: Record<string, unknown> = {
      tradeDate: new Date(Date.UTC(2025, 0, 13)),
      quantityRaw: '50',
      productDescriptionRaw: 'Test item',
    };
    const row = buildRevalidationRow(record, config);
    expect(row['DATE']).toBe('13-01-2025');
  });

  it('passes non-Date string values through String() unchanged', () => {
    const record: Record<string, unknown> = {
      tradeDate: null,
      quantityRaw: '100.5',
      productDescriptionRaw: 'Widget',
    };
    const row = buildRevalidationRow(record, config);
    expect(row['QTY']).toBe('100.5');
    expect(row['DESC']).toBe('Widget');
  });

  it('produces empty string for null/undefined canonical field values', () => {
    const record: Record<string, unknown> = {
      tradeDate: new Date(Date.UTC(2025, 0, 13)),
      quantityRaw: null,
      productDescriptionRaw: undefined,
    };
    const row = buildRevalidationRow(record, config);
    expect(row['QTY']).toBe('');
    expect(row['DESC']).toBe('');
  });

  it('covers all mapped source columns in the output', () => {
    const record: Record<string, unknown> = {
      tradeDate: new Date(Date.UTC(2025, 0, 13)),
      quantityRaw: '10',
      productDescriptionRaw: 'x',
    };
    const row = buildRevalidationRow(record, config);
    expect(Object.keys(row)).toEqual(['DATE', 'QTY', 'DESC']);
  });
});

// ── §3 filterCorrectedRequiredIssues ─────────────────────────────────────────

describe('filterCorrectedRequiredIssues', () => {
  const makeIssue = (ruleCode: string, fieldName: string): ValidationIssueInput => ({
    ruleCode,
    fieldName,
    severity: 'ERROR',
    message: `Issue: ${ruleCode} on ${fieldName}`,
    rawValue: null,
  });

  it('passes through non-REQUIRED_FIELD_MISSING issues unchanged', () => {
    const issues = [makeIssue(RULE_CODE.TRADE_DATE_INVALID, 'tradeDate')];
    const meta = { quantityNormalized: 'CORRECTED' };
    const record = { quantityNormalized: '100' };
    const result = filterCorrectedRequiredIssues(issues, meta, record);
    expect(result).toHaveLength(1);
    expect(result[0].ruleCode).toBe(RULE_CODE.TRADE_DATE_INVALID);
  });

  it('suppresses REQUIRED_FIELD_MISSING when normalized counterpart is CORRECTED with a valid value', () => {
    const issues = [makeIssue(RULE_CODE.REQUIRED_FIELD_MISSING, 'quantityRaw')];
    const meta = { quantityNormalized: 'CORRECTED' };
    const record = { quantityNormalized: '100' };
    const result = filterCorrectedRequiredIssues(issues, meta, record);
    expect(result).toHaveLength(0);
  });

  it('does NOT suppress when the meta does not mark the normalized field as CORRECTED', () => {
    const issues = [makeIssue(RULE_CODE.REQUIRED_FIELD_MISSING, 'quantityRaw')];
    const meta = { quantityNormalized: 'NORMALIZED' };
    const record = { quantityNormalized: '100' };
    const result = filterCorrectedRequiredIssues(issues, meta, record);
    expect(result).toHaveLength(1);
  });

  it('does NOT suppress when the corrected value is empty string', () => {
    const issues = [makeIssue(RULE_CODE.REQUIRED_FIELD_MISSING, 'quantityRaw')];
    const meta = { quantityNormalized: 'CORRECTED' };
    const record = { quantityNormalized: '' };
    const result = filterCorrectedRequiredIssues(issues, meta, record);
    expect(result).toHaveLength(1);
  });

  it('does NOT suppress when the corrected value is null', () => {
    const issues = [makeIssue(RULE_CODE.REQUIRED_FIELD_MISSING, 'quantityRaw')];
    const meta = { quantityNormalized: 'CORRECTED' };
    const record = { quantityNormalized: null };
    const result = filterCorrectedRequiredIssues(issues, meta, record);
    expect(result).toHaveLength(1);
  });

  it('does NOT suppress REQUIRED_FIELD_MISSING for unknown/unmapped raw fields', () => {
    const issues = [makeIssue(RULE_CODE.REQUIRED_FIELD_MISSING, 'someUnmappedRaw')];
    const meta = { someUnmappedRaw: 'CORRECTED' };
    const record = { someUnmappedRaw: 'value' };
    const result = filterCorrectedRequiredIssues(issues, meta, record);
    expect(result).toHaveLength(1);
  });

  it('suppresses only the matching corrected issue when multiple issues exist', () => {
    const issues = [
      makeIssue(RULE_CODE.REQUIRED_FIELD_MISSING, 'quantityRaw'),
      makeIssue(RULE_CODE.TRADE_DATE_INVALID, 'tradeDate'),
      makeIssue(RULE_CODE.REQUIRED_FIELD_MISSING, 'hsCodeRaw'),
    ];
    const meta = { quantityNormalized: 'CORRECTED' };
    const record = { quantityNormalized: '100', hsCodeNormalized: null };
    const result = filterCorrectedRequiredIssues(issues, meta, record);
    // quantityRaw suppressed; TRADE_DATE_INVALID kept; hsCodeRaw kept (meta not CORRECTED)
    expect(result).toHaveLength(2);
    expect(result.some((i) => i.fieldName === 'tradeDate')).toBe(true);
    expect(result.some((i) => i.fieldName === 'hsCodeRaw')).toBe(true);
    expect(result.every((i) => i.fieldName !== 'quantityRaw')).toBe(true);
  });
});

// ── §4 RAW_TO_NORMALIZED_COUNTERPART map ──────────────────────────────────────

describe('RAW_TO_NORMALIZED_COUNTERPART', () => {
  it('maps quantityRaw to quantityNormalized', () => {
    expect(RAW_TO_NORMALIZED_COUNTERPART['quantityRaw']).toBe('quantityNormalized');
  });

  it('maps unitPriceRaw to unitPriceNormalized', () => {
    expect(RAW_TO_NORMALIZED_COUNTERPART['unitPriceRaw']).toBe('unitPriceNormalized');
  });

  it('returns undefined for fields not in the map', () => {
    expect(RAW_TO_NORMALIZED_COUNTERPART['nonExistentField']).toBeUndefined();
  });
});

// ── §5 End-to-end revalidation pipeline integration ──────────────────────────

describe('revalidation pipeline integration — Pakistan Customs DMY date', () => {
  // Mimics the Imp_Pak_Jan_2025 mapping for the two fields under test
  const config: MappingConfigV1 = {
    version: 'v1',
    columnMappings: [
      {
        sourceColumnName: 'DATE',
        canonicalField: 'tradeDate',
        sourceDatatype: 'DATE',
        transformationRule: 'DATE_PARSE_DMY',
        requiredPolicy: 'REQUIRED',
        validationRules: [],
      },
      {
        sourceColumnName: 'Quantity',
        canonicalField: 'quantityRaw',
        sourceDatatype: 'DECIMAL',
        requiredPolicy: 'REQUIRED',
        validationRules: [],
      },
      {
        sourceColumnName: 'HS Code',
        canonicalField: 'hsCodeRaw',
        sourceDatatype: 'TEXT',
        requiredPolicy: 'OPTIONAL',
        validationRules: [],
      },
    ],
  };

  it('no TRADE_DATE_INVALID when DB Date is reformatted as DMY before revalidation', () => {
    const record: Record<string, unknown> = {
      tradeDate: new Date(Date.UTC(2025, 0, 13)), // 2025-01-13 UTC midnight
      quantityRaw: '',                             // blank — was the original defect
      quantityNormalized: '100',
      hsCodeRaw: '2202.10',
      valueTreatmentMeta: { quantityNormalized: 'CORRECTED' },
    };

    const revalidationRow = buildRevalidationRow(record, config);
    const normalized = normalizeRowV1(revalidationRow, config);
    const rawIssues = validateRowV1(normalized, config);
    const meta = record.valueTreatmentMeta as Record<string, string>;
    const filtered = filterCorrectedRequiredIssues(rawIssues, meta, record);

    const tradeDateIssue = filtered.find((i) => i.ruleCode === RULE_CODE.TRADE_DATE_INVALID);
    expect(tradeDateIssue).toBeUndefined();
  });

  it('no REQUIRED_FIELD_MISSING for quantityRaw when quantityNormalized is CORRECTED with 100', () => {
    const record: Record<string, unknown> = {
      tradeDate: new Date(Date.UTC(2025, 0, 13)),
      quantityRaw: '',
      quantityNormalized: '100',
      hsCodeRaw: '2202.10',
      valueTreatmentMeta: { quantityNormalized: 'CORRECTED' },
    };

    const revalidationRow = buildRevalidationRow(record, config);
    const normalized = normalizeRowV1(revalidationRow, config);
    const rawIssues = validateRowV1(normalized, config);
    const meta = record.valueTreatmentMeta as Record<string, string>;
    const filtered = filterCorrectedRequiredIssues(rawIssues, meta, record);

    const qtyMissingIssue = filtered.find(
      (i) => i.ruleCode === RULE_CODE.REQUIRED_FIELD_MISSING && i.fieldName === 'quantityRaw',
    );
    expect(qtyMissingIssue).toBeUndefined();
  });

  it('produces zero validation issues for a fully-corrected Pakistan Customs import record', () => {
    const record: Record<string, unknown> = {
      tradeDate: new Date(Date.UTC(2025, 0, 13)),
      quantityRaw: '',
      quantityNormalized: '100',
      hsCodeRaw: '2202.10',
      valueTreatmentMeta: { quantityNormalized: 'CORRECTED' },
    };

    const revalidationRow = buildRevalidationRow(record, config);
    const normalized = normalizeRowV1(revalidationRow, config);
    const rawIssues = validateRowV1(normalized, config);
    const meta = record.valueTreatmentMeta as Record<string, string>;
    const filtered = filterCorrectedRequiredIssues(rawIssues, meta, record);

    expect(filtered).toHaveLength(0);
  });
});
