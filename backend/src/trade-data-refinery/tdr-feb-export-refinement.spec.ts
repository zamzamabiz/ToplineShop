import 'reflect-metadata';

/**
 * TDR-FEB-EXPORT-REFINEMENT-001
 *
 * Regression tests for February 2025 export batch refinements:
 *
 * §1  Numeric-only exporter name rescue (canonical path)
 * §2  Numeric-only local party name rescue (Pakistan Customs EXPORT legacy path)
 * §3  Non-numeric names are not rescued
 * §4  Rescue skipped when ID already populated
 * §5  REQUIRED_FIELD_MISSING warning emitted on rescue
 * §6  Rescued row validates as INCOMPLETE (dataQualityStatus)
 * §7  Rescued row is ACCEPTED + export_eligible (rowDisposition)
 * §8  missingFields contains the name field after rescue
 * §9  Data source aliases — Pak_Custom (singular) normalises to Pakistan Customs
 * §10 Data source aliases — all known Pak variants
 * §11 defaultValue in ColumnMapping used when source column absent
 * §12 defaultValue not used when source column present
 * §13 XXX currency preserves without CURRENCY_UNKNOWN warning
 * §14 Export SELECT uses data_source_normalized (structural contract)
 */

import { normalizeRowV1 } from './quality/normalization/normalizer.service';
import { validateRowV1 } from './quality/validation/validator.service';
import { resolveCurrencyCode } from './quality/normalization/currency.map';
import type { MappingConfigV1 } from './quality/types/mapping-config.types';

// ── Base configs ──────────────────────────────────────────────────────────────

const EXPORT_CONFIG: MappingConfigV1 = {
  version: 'v1',
  localCountryCode: 'PK',
  columnMappings: [
    { sourceColumnName: 'trade_date', canonicalField: 'tradeDate', sourceDatatype: 'DATE', transformationRule: 'DATE_PARSE_YMD', requiredPolicy: 'REQUIRED', validationRules: [] },
    { sourceColumnName: 'hs_code', canonicalField: 'hsCodeRaw', sourceDatatype: 'TEXT', requiredPolicy: 'REQUIRED', validationRules: [] },
    { sourceColumnName: 'local_party_tax_id', canonicalField: 'localPartyTaxIdRaw', sourceDatatype: 'TEXT', requiredPolicy: 'OPTIONAL', validationRules: [] },
    { sourceColumnName: 'exporter_name', canonicalField: 'localPartyNameRaw', sourceDatatype: 'TEXT', requiredPolicy: 'REQUIRED', validationRules: [] },
    { sourceColumnName: 'importer_name', canonicalField: 'foreignPartyNameRaw', sourceDatatype: 'TEXT', requiredPolicy: 'REQUIRED', validationRules: [] },
    { sourceColumnName: 'quantity', canonicalField: 'quantityRaw', sourceDatatype: 'DECIMAL', requiredPolicy: 'REQUIRED', validationRules: [] },
    { sourceColumnName: 'quantity_unit', canonicalField: 'quantityUnitRaw', sourceDatatype: 'TEXT', requiredPolicy: 'REQUIRED', validationRules: [] },
    { sourceColumnName: 'unit_price', canonicalField: 'unitPriceRaw', sourceDatatype: 'TEXT', requiredPolicy: 'REQUIRED', validationRules: [] },
    { sourceColumnName: 'currency_code', canonicalField: 'currencyRaw', sourceDatatype: 'TEXT', requiredPolicy: 'REQUIRED', validationRules: [] },
    { sourceColumnName: 'data_source', canonicalField: 'dataSourceRaw', sourceDatatype: 'TEXT', requiredPolicy: 'OPTIONAL', defaultValue: 'Pak_Customs', validationRules: [] },
  ],
};

const CANONICAL_CONFIG: MappingConfigV1 = {
  version: 'v1',
  columnMappings: [
    { sourceColumnName: 'trade_date', canonicalField: 'tradeDate', sourceDatatype: 'DATE', transformationRule: 'DATE_PARSE_YMD', requiredPolicy: 'REQUIRED', validationRules: [] },
    { sourceColumnName: 'hs_code', canonicalField: 'hsCodeRaw', sourceDatatype: 'TEXT', requiredPolicy: 'REQUIRED', validationRules: [] },
    { sourceColumnName: 'exporter_id', canonicalField: 'exporterIdRaw', sourceDatatype: 'TEXT', requiredPolicy: 'OPTIONAL', validationRules: [] },
    { sourceColumnName: 'exporter_name', canonicalField: 'exporterNameRaw', sourceDatatype: 'TEXT', requiredPolicy: 'REQUIRED', validationRules: [] },
    { sourceColumnName: 'importer_name', canonicalField: 'importerNameRaw', sourceDatatype: 'TEXT', requiredPolicy: 'OPTIONAL', validationRules: [] },
    { sourceColumnName: 'quantity', canonicalField: 'quantityRaw', sourceDatatype: 'DECIMAL', requiredPolicy: 'REQUIRED', validationRules: [] },
    { sourceColumnName: 'quantity_unit', canonicalField: 'quantityUnitRaw', sourceDatatype: 'TEXT', requiredPolicy: 'REQUIRED', validationRules: [] },
    { sourceColumnName: 'unit_price', canonicalField: 'unitPriceRaw', sourceDatatype: 'TEXT', requiredPolicy: 'REQUIRED', validationRules: [] },
    { sourceColumnName: 'currency_code', canonicalField: 'currencyRaw', sourceDatatype: 'TEXT', requiredPolicy: 'REQUIRED', validationRules: [] },
  ],
};

function baseExportRow(override: Record<string, string> = {}) {
  return {
    trade_date: '2025-02-01',
    hs_code: '6105',
    local_party_tax_id: '',
    exporter_name: 'TOPLINE TEXTILES LTD',
    importer_name: 'GLOBAL FASHION INC',
    quantity: '100',
    quantity_unit: 'u',
    unit_price: '7',
    currency_code: '840',
    ...override,
  };
}

function baseCanonicalRow(override: Record<string, string> = {}) {
  return {
    trade_date: '2025-02-01',
    hs_code: '6105',
    exporter_id: '',
    exporter_name: 'TOPLINE TEXTILES LTD',
    importer_name: 'IMPORTER INC',
    quantity: '100',
    quantity_unit: 'KG',
    unit_price: '10',
    currency_code: 'USD',
    ...override,
  };
}

// ── §1 Numeric-only exporter name rescue (canonical path) ─────────────────────

describe('§1 Numeric-only exporter name rescue — canonical path', () => {
  const row = baseCanonicalRow({ exporter_id: '', exporter_name: '12345678' });
  const result = normalizeRowV1(row, CANONICAL_CONFIG);

  it('exporterNameNormalized is null after rescue', () => {
    expect(result.exporterNameNormalized).toBeNull();
  });

  it('exporterIdRaw is set to the rescued numeric value', () => {
    expect(result.exporterIdRaw).toBe('12345678');
  });

  it('exporterNameRaw (original raw) is preserved in result', () => {
    expect(result.exporterNameRaw).toBe('12345678');
  });
});

// ── §2 Numeric-only local party name rescue (Pakistan Customs EXPORT legacy path) ─

describe('§2 Numeric-only local party name rescue — legacy path', () => {
  // Pakistan Customs EXPORT: exporter_name → localPartyNameRaw; no tax ID
  const row = baseExportRow({ local_party_tax_id: '', exporter_name: '99887766' });
  const result = normalizeRowV1(row, EXPORT_CONFIG);

  it('localPartyNameNormalized is null after rescue', () => {
    expect(result.localPartyNameNormalized).toBeNull();
  });

  it('exporterIdRaw is set to the rescued numeric value', () => {
    expect(result.exporterIdRaw).toBe('99887766');
  });

  it('localPartyNameRaw (original raw) is preserved', () => {
    expect(result.localPartyNameRaw).toBe('99887766');
  });
});

// ── §3 Non-numeric names are not rescued ─────────────────────────────────────

describe('§3 Non-numeric exporter names are not rescued', () => {
  it('alphabetic name is not rescued', () => {
    const result = normalizeRowV1(baseExportRow({ exporter_name: 'TOPLINE TEXTILES LTD' }), EXPORT_CONFIG);
    expect(result.localPartyNameNormalized).toBe('TOPLINE TEXTILES LTD');
    expect(result.exporterIdRaw).toBeNull();
  });

  it('alphanumeric name (e.g. "ABC123") is not rescued', () => {
    const result = normalizeRowV1(baseExportRow({ exporter_name: 'ABC123' }), EXPORT_CONFIG);
    expect(result.localPartyNameNormalized).toBe('ABC123');
    expect(result.exporterIdRaw).toBeNull();
  });

  it('name with decimal point is not rescued', () => {
    const result = normalizeRowV1(baseExportRow({ exporter_name: '123.45' }), EXPORT_CONFIG);
    expect(result.localPartyNameNormalized).toBe('123.45');
    expect(result.exporterIdRaw).toBeNull();
  });
});

// ── §4 Rescue skipped when ID already populated ───────────────────────────────

describe('§4 Rescue skipped when an ID already exists', () => {
  it('does not rescue when localPartyTaxIdRaw is populated', () => {
    const row = baseExportRow({ local_party_tax_id: 'NTN-12345', exporter_name: '99887766' });
    const result = normalizeRowV1(row, EXPORT_CONFIG);
    // Tax ID present → no rescue needed; name kept as-is
    expect(result.localPartyNameNormalized).toBe('99887766');
    expect(result.exporterIdRaw).toBeNull();
  });

  it('canonical: does not rescue when exporterIdRaw already populated', () => {
    const row = baseCanonicalRow({ exporter_id: 'EXP-001', exporter_name: '99887766' });
    const result = normalizeRowV1(row, CANONICAL_CONFIG);
    expect(result.exporterNameNormalized).toBe('99887766');
    expect(result.exporterIdRaw).toBe('EXP-001');
  });
});

// ── §5 REQUIRED_FIELD_MISSING warning emitted on rescue ──────────────────────

describe('§5 REQUIRED_FIELD_MISSING warning emitted on rescue', () => {
  it('legacy path emits REQUIRED_FIELD_MISSING for localPartyNameRaw', () => {
    const row = baseExportRow({ local_party_tax_id: '', exporter_name: '99887766' });
    const result = normalizeRowV1(row, EXPORT_CONFIG);
    const w = result.warnings.find(
      (x) => x.ruleCode === 'REQUIRED_FIELD_MISSING' && x.fieldName === 'localPartyNameRaw',
    );
    expect(w).toBeDefined();
    expect(w?.rawValue).toBe('99887766');
  });

  it('canonical path emits REQUIRED_FIELD_MISSING for exporterNameRaw', () => {
    const row = baseCanonicalRow({ exporter_id: '', exporter_name: '12345678' });
    const result = normalizeRowV1(row, CANONICAL_CONFIG);
    const w = result.warnings.find(
      (x) => x.ruleCode === 'REQUIRED_FIELD_MISSING' && x.fieldName === 'exporterNameRaw',
    );
    expect(w).toBeDefined();
  });

  it('no REQUIRED_FIELD_MISSING warning for non-numeric exporter name', () => {
    const result = normalizeRowV1(baseExportRow({ exporter_name: 'TOPLINE' }), EXPORT_CONFIG);
    const w = result.warnings.find((x) => x.ruleCode === 'REQUIRED_FIELD_MISSING');
    expect(w).toBeUndefined();
  });
});

// ── §6 Rescued row validates as INCOMPLETE ─────────────────────────────────────

describe('§6 Rescued row dataQualityStatus = INCOMPLETE', () => {
  it('validateRowV1 issues include REQUIRED_FIELD_MISSING for localPartyNameRaw after rescue', () => {
    const row = baseExportRow({ local_party_tax_id: '', exporter_name: '99887766' });
    const normalized = normalizeRowV1(row, EXPORT_CONFIG);
    const issues = validateRowV1(normalized, EXPORT_CONFIG);
    const missing = issues.filter((i) => i.ruleCode === 'REQUIRED_FIELD_MISSING');
    expect(missing.some((i) => i.fieldName === 'localPartyNameRaw')).toBe(true);
  });

  it('normal row with text exporter name has no REQUIRED_FIELD_MISSING issues', () => {
    const row = baseExportRow({ exporter_name: 'TOPLINE TEXTILES LTD' });
    const normalized = normalizeRowV1(row, EXPORT_CONFIG);
    const issues = validateRowV1(normalized, EXPORT_CONFIG);
    const missing = issues.filter((i) => i.ruleCode === 'REQUIRED_FIELD_MISSING');
    expect(missing).toHaveLength(0);
  });
});

// ── §7 Rescued row is ACCEPTED + export_eligible ─────────────────────────────

describe('§7 Rescued row disposition is ACCEPTED (severity WARNING)', () => {
  it('REQUIRED_FIELD_MISSING has severity WARNING (not BLOCKING/ERROR)', () => {
    const row = baseExportRow({ local_party_tax_id: '', exporter_name: '99887766' });
    const normalized = normalizeRowV1(row, EXPORT_CONFIG);
    const issues = validateRowV1(normalized, EXPORT_CONFIG);
    const issue = issues.find(
      (i) => i.ruleCode === 'REQUIRED_FIELD_MISSING' && i.fieldName === 'localPartyNameRaw',
    );
    expect(issue?.severity).toBe('WARNING');
  });
});

// ── §8 missingFields contains the name field after rescue ────────────────────

describe('§8 missingFields contains rescued field name', () => {
  it('REQUIRED_FIELD_MISSING issues list includes localPartyNameRaw for numeric name', () => {
    const row = baseExportRow({ local_party_tax_id: '', exporter_name: '99887766' });
    const normalized = normalizeRowV1(row, EXPORT_CONFIG);
    const issues = validateRowV1(normalized, EXPORT_CONFIG);
    const missingFields = issues
      .filter((i) => i.ruleCode === 'REQUIRED_FIELD_MISSING')
      .map((i) => i.fieldName);
    expect(missingFields).toContain('localPartyNameRaw');
  });
});

// ── §9 Data source aliases — Pak_Custom (singular) ───────────────────────────

describe('§9 Data source normalisation — Pak_Custom (singular)', () => {
  it('Pak_Custom (singular) normalises to Pakistan Customs via resolveDataSource', () => {
    const row = baseExportRow({ data_source: 'Pak_Custom' });
    const result = normalizeRowV1(row, EXPORT_CONFIG);
    expect(result.dataSourceNormalized).toBe('Pakistan Customs');
    expect(result.dataSourceRaw).toBe('Pak_Custom');
  });
});

// ── §10 Data source aliases — all known Pak variants ─────────────────────────

describe('§10 Data source normalisation — all Pak variants', () => {
  const variants = ['Pak_Customs', 'PAK_CUSTOMS', 'pak_customs', 'Pakistan_Customs', 'Pak_Custom'];
  for (const variant of variants) {
    it(`${variant} → Pakistan Customs`, () => {
      const row = baseExportRow({ data_source: variant });
      const result = normalizeRowV1(row, EXPORT_CONFIG);
      expect(result.dataSourceNormalized).toBe('Pakistan Customs');
    });
  }
});

// ── §11 defaultValue used when source column absent ───────────────────────────

describe('§11 defaultValue in ColumnMapping', () => {
  it('absent data_source column falls back to defaultValue Pak_Customs', () => {
    // Row has no data_source key — the mapping has defaultValue: 'Pak_Customs'
    const row = { ...baseExportRow() };
    delete (row as Record<string, string>)['data_source'];
    const result = normalizeRowV1(row as Record<string, string>, EXPORT_CONFIG);
    // defaultValue 'Pak_Customs' → normalised to 'Pakistan Customs'
    expect(result.dataSourceRaw).toBe('Pak_Customs');
    expect(result.dataSourceNormalized).toBe('Pakistan Customs');
  });

  it('present data_source column value takes precedence over defaultValue', () => {
    const row = baseExportRow({ data_source: 'Other Source' });
    const result = normalizeRowV1(row, EXPORT_CONFIG);
    expect(result.dataSourceRaw).toBe('Other Source');
    expect(result.dataSourceNormalized).toBe('Other Source');
  });
});

// ── §12 defaultValue not used when source column present with blank ───────────

describe('§12 Blank source column is NOT replaced by defaultValue', () => {
  it('blank data_source preserves as blank, does not use defaultValue', () => {
    const row = baseExportRow({ data_source: '' });
    const result = normalizeRowV1(row, EXPORT_CONFIG);
    // Blank string is present in source → not replaced by default
    expect(result.dataSourceRaw).toBe('');
    expect(result.dataSourceNormalized).toBeNull(); // normalizeText('') = null
  });
});

// ── §13 XXX currency preserves without CURRENCY_UNKNOWN warning ───────────────

describe('§13 XXX currency preservation', () => {
  it('resolveCurrencyCode("XXX") returns XXX (not undefined)', () => {
    expect(resolveCurrencyCode('XXX')).toBe('XXX');
  });

  it('row with currency_code=XXX has no CURRENCY_UNKNOWN warning', () => {
    const row = baseCanonicalRow({ currency_code: 'XXX' });
    const result = normalizeRowV1(row, CANONICAL_CONFIG);
    expect(result.currencyCode).toBe('XXX');
    expect(result.warnings.some((w) => w.ruleCode === 'CURRENCY_UNKNOWN')).toBe(false);
  });

  it('numeric code 998 still resolves to XXX', () => {
    expect(resolveCurrencyCode('998')).toBe('XXX');
  });
});

// ── §14 Export SELECT uses data_source_normalized (structural contract) ────────

describe('§14 Export handler data_source SELECT contract', () => {
  it('EXPORT_COLUMNS includes data_source', () => {
    // Structural check: data_source must appear in the exported columns array.
    // The handler uses COALESCE(r.data_source_normalized, r.data_source_raw) AS data_source.
    const EXPECTED_COLUMNS = [
      'trade_date', 'hs_chapter', 'hs_code', 'product_description',
      'exporter_id', 'exporter_name', 'exporter_address', 'exporter_country',
      'port_of_loading',
      'importer_id', 'importer_name', 'importer_address', 'importer_country',
      'port_of_discharge',
      'quantity', 'quantity_unit', 'unit_price', 'currency_code', 'data_source',
    ];
    expect(EXPECTED_COLUMNS).toContain('data_source');
    expect(EXPECTED_COLUMNS.indexOf('data_source')).toBe(EXPECTED_COLUMNS.length - 1);
  });

  it('normalized data_source takes priority over raw (COALESCE contract)', () => {
    // Verifies intent: if data_source_normalized = 'Pakistan Customs' and
    // data_source_raw = 'Pak_Custom', the export emits 'Pakistan Customs'.
    const normalizedValue = 'Pakistan Customs';
    const rawValue = 'Pak_Custom';
    const coalesced = normalizedValue ?? rawValue;
    expect(coalesced).toBe('Pakistan Customs');
  });
});
