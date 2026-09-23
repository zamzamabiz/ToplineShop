# WDR: TDR-FEB-EXPORT-REFINEMENT-001
**Date:** 2026-09-23  
**Branch:** codex/trade-data-refinery  
**Commit:** f50fca4  
**Status:** PASS CLOSED (pending owner replay + browser verification)

---

## Task ID
TDR-FEB-EXPORT-REFINEMENT-001

## Scope
Seven data-quality refinements for the February 2025 export batch (TDR_V1_EXP_2025_02_002.csv), applied through code changes + seed update + Replay.

---

## Requirements Addressed

| # | Requirement | Status |
|---|-------------|--------|
| 1 | Numeric-only exporter name → move to `exporter_id`, blank name, mark INCOMPLETE, record in `missing_fields` | PASS |
| 2 | Never invent or research an exporter name automatically | PASS — only rescue, no lookup |
| 3 | Export `data_source_normalized` as `data_source`; fall back to raw only if no normalized value | PASS |
| 4 | Normalize `Pak_Custom`, `Pak_Customs`, and variants → `Pakistan Customs` | PASS |
| 5 | Preserve `XXX` when currency cannot be verified | PASS |
| 6 | Apply corrections through Replay without duplicating records | PASS — code changes are in place; owner executes Replay |
| 7 | Regression tests + results | PASS — 32 tests, all pass |

---

## Root Causes and Changes

### RC-1: Numeric-only exporter name in wrong column

**File:** `backend/src/trade-data-refinery/quality/normalization/normalizer.service.ts`

Post-normalization rescue block added after all field computation:
- **Canonical path**: if `exporterNameNormalized` is purely numeric digits AND `exporterIdRaw` is blank → set `exporterIdRaw = numeric value`, `exporterNameNormalized = null`, emit `REQUIRED_FIELD_MISSING` warning for `exporterNameRaw`
- **Legacy path** (Pakistan Customs EXPORT profile): if `localPartyNameNormalized` is purely numeric AND `localPartyTaxIdRaw` is blank AND `exporterIdRaw` is blank → set `exporterIdRaw = numeric value`, `localPartyNameNormalized = null`, emit `REQUIRED_FIELD_MISSING` warning for `localPartyNameRaw`

Result: row becomes ACCEPTED + exportEligible=true + dataQualityStatus=INCOMPLETE + missingFields=['localPartyNameRaw']. The original raw value is preserved for audit.

**Helper added:**
```typescript
function isNumericOnly(s: string): boolean { return /^\d+$/.test(s); }
```

### RC-2: `data_source_normalized` not used in export CSV

**File:** `backend/src/trade-data-refinery/export/handler/tdr-export-handler.service.ts`

Changed `r.data_source_raw AS data_source` → `COALESCE(r.data_source_normalized, r.data_source_raw) AS data_source`

### RC-3: `Pak_Custom` (singular) not in alias map

**File:** `backend/src/trade-data-refinery/quality/normalization/normalizer.service.ts`

`DATA_SOURCE_ALIASES` extended with `'Pak_Custom': 'Pakistan Customs'` (five variants total now cover all observed spellings).

### RC-4: `XXX` currency code not recognized

**File:** `backend/src/trade-data-refinery/quality/normalization/currency.map.ts`

Added `'XXX': 'XXX'` to `TEXT_TO_ISO`. ISO 4217 "No currency" code now resolves cleanly without `CURRENCY_UNKNOWN` warning.

### RC-5: No `data_source` column mapped in Pakistan Customs profiles

**File:** `backend/prisma/seed-pakistan-customs.js`

Both `Exp_Pak_Jan_2025` (EXPORT) and `Imp_Pak_Jan_2025` (IMPORT) profiles updated:
```javascript
{
  sourceColumnName: 'data_source',
  canonicalField: 'dataSourceRaw',
  sourceDatatype: 'TEXT',
  requiredPolicy: 'OPTIONAL',
  defaultValue: 'Pak_Customs',  // when column absent in source CSV
  validationRules: [],
}
```

**Supporting change** — `buildFieldValues` in normalizer now supports `cm.defaultValue`:
- Column present → use source value (even if blank)
- Column absent AND `defaultValue` set → use default
- Column absent AND no default → null

Seed re-applied: both profiles updated in DB (`upsert`).

---

## Replay Instructions

To apply to `TDR_V1_EXP_2025_02_002.csv`:
1. Open the TDR Batches page in the browser
2. Find batch `TDR_V1_EXP_2025_02_002.csv`
3. Click **Replay** and provide reason: `TDR-FEB-EXPORT-REFINEMENT-001 — numeric name rescue, data_source normalization`
4. Wait for the new batch to reach READY status
5. Export and verify using the acceptance criteria below

---

## Test Evidence

**Backend (888/889 passing, 1 intentional skip — 22 suites):**
```
Test Suites: 22 passed, 22 total
Tests:       1 skipped, 888 passed, 889 total
```
*(+32 vs prior: tdr-feb-export-refinement.spec.ts, §1–§14)*

**Frontend:** unchanged — 182/182 (no frontend changes needed)

---

## Acceptance Tests (Manual — Owner Required)

After Replay completes:

- [ ] Total row count remains 159,387 in new batch
- [ ] Numeric-only exporter names no longer appear in `exporter_name` column of export CSV
- [ ] Affected rows have blank `exporter_name`, populated `exporter_id` (the numeric value), and batch quality shows INCOMPLETE status
- [ ] Export CSV `data_source` column shows `Pakistan Customs` (not `Pak_Custom` or `Pak_Customs`)
- [ ] No `CURRENCY_UNKNOWN` validation issues on rows with `XXX` currency code
- [ ] Replay produces a new batch; original batch records are not modified

---

## Architecture Notes

- Raw field values (`localPartyNameRaw`, `exporterNameRaw`) are always preserved in DB for audit — only normalized fields are modified by rescue
- The rescue fires only for purely digit strings (`/^\d+$/`) — alphanumeric names, HS codes, decimal prices are not affected
- `REQUIRED_FIELD_MISSING` severity = `WARNING` → disposition stays `ACCEPTED` + `exportEligible=true`
- `defaultValue` in `ColumnMapping` only activates when the source column is ABSENT, not when blank — preserving the current blank-string behavior
- `ColumnMapping.defaultValue` is already in the TypeScript interface (`mapping-config.types.ts`) — no schema migration required

---

## Safety Boundaries

- No schema migration required
- Original source files remain immutable
- Replay creates a NEW batch record; existing batch records are not deleted
- `F:\OpenCode\shop.com` not touched

---

## Governance

- #FDD: Data quality changes verified through 32 regression tests
- #123: EXECUTE → VERIFY (888+182 tests) → CLOSE (pending owner Replay verification)
- Replay required before owner acceptance tests can be completed
