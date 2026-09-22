# WDR: TDR-STANDARDIZED-FILENAME-001
## Automatic TDR_V1 Source-File Naming

**Date:** 2026-09-23
**Branch:** codex/trade-data-refinery
**Status:** PASS — PENDING OWNER VERIFICATION (browser upload)
**Commit (implementation):** 0c3280a
**Commit (governance):** c1fe5e9
**Commit (STD-001 resolution):** f844bbe
**Commit (policy corrections):** 0e2c592

---

## §1 — Task Summary

Implement automatic standardized filename generation for TDR uploads.

Format: `TDR_V1_<TYPE>_<YYYY>[_<MM>]_<SEQ>.<ext>`

| Segment | Rule |
|---------|------|
| `TDR_V1` | Fixed schema-version prefix |
| `IMP` / `EXP` | From upload `tradeDirection` |
| `YYYY` | `dataPeriodYear` (required, 1900–2100) |
| `_MM` | `dataPeriodMonth` (optional 01–12); omitted for full-year uploads |
| `SEQ` | 3-digit zero-padded, atomically allocated per `(tenant, type, year, month)` |
| `.ext` | Preserved from the original uploaded file |

User's original filename is preserved separately as `original_filename`.
Mapping profile ID is `TDR_V1` (auto-set by frontend; not derived from filename).

---

## §2 — Acceptance Criteria Verification

| # | Criterion | Result |
|---|-----------|--------|
| AC-1 | Format `TDR_V1_<TYPE>_<YYYY>_<MM>_<SEQ>.<ext>` generated at upload | PASS |
| AC-2 | Full-year upload (no month) produces `TDR_V1_<TYPE>_<YYYY>_<SEQ>.<ext>` | PASS |
| AC-3 | `SEQ` is zero-padded 3 digits (`001`, `042`, `1234` for >999) | PASS |
| AC-4 | Sequence is concurrent-safe — PostgreSQL `ON CONFLICT DO UPDATE RETURNING` | PASS |
| AC-5 | Original filename preserved as `original_filename` on `TdrSourceFile` | PASS — unchanged from existing field |
| AC-6 | Generated name stored as `standardized_filename` on `TdrSourceFile` | PASS |
| AC-7 | `dataPeriodYear` required (1900–2100); `dataPeriodMonth` optional (1–12) | PASS — DTO validation |
| AC-8 | Multipart form strings coerced to number via `@Type(() => Number)` | PASS — test confirmed |
| AC-9 | Frontend shows year/month dropdowns and live filename preview | PASS |
| AC-10 | Frontend auto-sets `mappingProfileId = TDR_V1`; not derived from filename | PASS |
| AC-11 | Batch list shows standardized name (falls back to original if absent) | PASS |
| AC-12 | Batch detail shows both names in a detail card | PASS |
| AC-13 | `getBatch` endpoint now includes `sourceFile` fields (fixes pre-existing gap) | PASS |
| AC-14 | 836/837 backend tests pass (1 intentional skip) | PASS |
| AC-15 | 159/159 frontend tests pass | PASS |
| AC-16 | `TDR_V1` IMPORT + EXPORT profiles active (seeded + verified in DB) | PASS — seeded commit f844bbe |
| AC-17 | Mapping policies match approved protocol (8 field corrections) | PASS — commit 0e2c592 |
| AC-18 | Blank REQUIRED fields → `data_quality_status=INCOMPLETE`, `rowDisposition=ACCEPTED` | PASS — WARNING severity fix |
| AC-19 | EXPORT browser upload succeeds: batch created, standardized name shown | PENDING OWNER |
| AC-20 | IMPORT browser upload succeeds: batch created, standardized name shown | PENDING OWNER |

---

## §3 — Files Changed

### Commits

| Hash | Description |
|------|-------------|
| `0c3280a` | Standardized filename — 12 files, 317 insertions |
| `c1fe5e9` | Governance record |
| `9f60c32` | WDR hash fill |
| `f844bbe` | STD-001 — TDR_V1 profiles + unique constraint with tradeDirection |
| `baceafa` | Governance close (first pass) |
| `0e2c592` | Policy corrections + REQUIRED_FIELD_MISSING severity fix |

### New Files (0e2c592)
- `docs/test-data/tdr-v1/TDR_V1_EXP_2025_01_TEST.csv` — 10-row EXPORT test file
- `docs/test-data/tdr-v1/TDR_V1_IMP_2025_01_TEST.csv` — 10-row IMPORT test file

### Modified Files (0e2c592)
- `backend/prisma/seed-tdr-v1.js` — 8 requiredPolicy corrections (product_description, exporter_country, importer_country, data_source → REQUIRED; quantity, quantity_unit, unit_price, currency_code → OPTIONAL)
- `backend/src/trade-data-refinery/quality/validation/validator.service.ts` — REQUIRED_FIELD_MISSING severity ERROR → WARNING
- `backend/src/trade-data-refinery/tdr-mega4-unit.spec.ts` — +2 new tests (REQUIRED_FIELD_MISSING → ACCEPTED; REQUIRED_FIELD_MISSING + ERROR → still QUARANTINED)
- `backend/src/trade-data-refinery/tdr-pakistan-customs-mapping.spec.ts` — severity assertion updated to WARNING

---

## §4 — TDR_V1 Mapping Policy

### REQUIRED fields (header must be present; blank value → INCOMPLETE, row ACCEPTED)

| Source Column | Canonical Field | Note |
|--------------|-----------------|------|
| `trade_date` | `tradeDate` | `DATE_PARSE_YMD` |
| `hs_code` | `hsCodeRaw` | `hs_chapter` derived from first 2 digits |
| `product_description` | `productDescriptionRaw` | |
| `exporter_name` | `exporterNameRaw` | |
| `exporter_country` | `exporterCountryRaw` | Resolved to ISO-2 |
| `importer_name` | `importerNameRaw` | |
| `importer_country` | `importerCountryRaw` | Resolved to ISO-2 |
| `data_source` | `dataSourceRaw` | Normalized via DATA_SOURCE_ALIASES |

### OPTIONAL fields (blank → no missing-field issue)

| Source Column | Canonical Field |
|--------------|-----------------|
| `exporter_id` | `exporterIdRaw` |
| `exporter_address` | `exporterAddressRaw` |
| `port_of_loading` | `portOfLoadingRaw` |
| `importer_id` | `importerIdRaw` |
| `importer_address` | `importerAddressRaw` |
| `port_of_discharge` | `portOfDischargeRaw` |
| `quantity` | `quantityRaw` |
| `quantity_unit` | `quantityUnitRaw` |
| `unit_price` | `unitPriceRaw` |
| `currency_code` | `currencyRaw` |

### hs_chapter note

`hs_chapter` is derived by the normalizer from the first two digits of `hs_code`. The TDR_V1 mapping does not include `hs_chapter` as a source column because the normalizer has no `hsChapterRaw` canonicalField. If a supplied file contains an `hs_chapter` column, it is ignored. The normalizer always derives `hsChapter` from `hsCodeRaw`.

### Conditional warnings (non-blocking, WARNING severity)

- `quantity` supplied without `quantity_unit` → `QUANTITY_WITHOUT_UNIT`
- `unit_price` supplied without `currency_code` → `PRICE_WITHOUT_CURRENCY`

### Blank REQUIRED field behavior

```
REQUIRED_FIELD_MISSING.severity = WARNING
→ determineDisposition: no ERROR → rowDisposition = ACCEPTED
→ computeDataQualityStatus: REQUIRED_FIELD_MISSING special-case → INCOMPLETE
→ upload not blocked; row visible in batch; flagged for review
```

---

## §5 — Architecture Notes

### Sequence Table
`tdr_filename_sequences (tenant_id, trade_type, period_year, period_month) → next_seq`

- Composite primary key prevents duplicate entries.
- `ON CONFLICT DO UPDATE SET next_seq = next_seq + 1 RETURNING next_seq` runs inside the same transaction as `TdrSourceFile.create`.
- `period_month = 0` sentinel for "no month" uploads.

### Schema Mapping Unique Constraint (migration 20260923010000)
`@@unique([scopeKey, profileId, version, tradeDirection])` — extended from original 3-field constraint to allow `TDR_V1` profileId to have separate IMPORT and EXPORT rows.

---

## §6 — Test Evidence

```
Backend (Jest):  836/837 passing, 1 intentional skip (TDR_1M_PROOF-gated)
Frontend (Vitest): 159/159 passing
New tests (0e2c592): +2 disposition tests for REQUIRED_FIELD_MISSING behavior
Total new tests across all commits: +18
```

---

## §7 — Verification Checklist (Owner Action Required)

Backend and frontend are running at `:4000` and `:3000`.

**Test files:** `docs/test-data/tdr-v1/`

### EXPORT verification
1. Log in at `http://localhost:3000`
2. Navigate to **TDR → Upload**
3. Select file `TDR_V1_EXP_2025_01_TEST.csv`
4. Year: 2025, Month: January, Direction: EXPORT
5. Upload
6. Verify:
   - No "No active mapping found" error
   - Batch created
   - Standardized filename: `TDR_V1_EXP_2025_01_001.csv` (or next seq)
   - Original filename preserved
   - Row count: 10 rows
   - Row 3 (currency `840`) → resolved to USD
   - Row 5 (blank unit_price) → `QUANTITY_WITHOUT_UNIT` warning, ACCEPTED
   - All rows in batch detail

### IMPORT verification
1. Navigate to **TDR → Upload**
2. Select file `TDR_V1_IMP_2025_01_TEST.csv`
3. Year: 2025, Month: January, Direction: IMPORT
4. Upload
5. Verify:
   - No "No active mapping found" error
   - Batch created
   - Standardized filename: `TDR_V1_IMP_2025_01_001.csv` (or next seq)
   - Row count: 10 rows
   - Row 8 (blank quantity/unit) → OPTIONAL fields, no INCOMPLETE flagging
   - Row 10 (blank currency_code) → `PRICE_WITHOUT_CURRENCY` warning, ACCEPTED
   - Batch details show both filenames

---

## §8 — Open Items

| ID | Severity | Description |
|----|----------|-------------|
| STD-001 | CLOSED | TDR_V1 IMPORT + EXPORT profiles seeded. Unique constraint corrected. |
| STD-002 | P3 | Sequence resets to 001 per `(tenant, type, year, month)` — by design. |
| UI-VERIFY | OWNER | Browser upload verification (AC-19, AC-20) pending owner action. WDR closes to PASS — CLOSED after owner confirms both uploads succeed. |

---

## §9 — Governance

**#123 Protocol:** DISCUSS → DECIDE → EXECUTE → VERIFY → CLOSE → NEXT

- **DISCUSS:** Format `TDR_V1_<TYPE>_<YYYY>[_<MM>]_<SEQ>.<ext>`; approved mapping policies; blank REQUIRED = INCOMPLETE not QUARANTINED
- **DECIDE:** Sequence table with PG upsert; `period_month=0` sentinel; REQUIRED_FIELD_MISSING severity=WARNING; 8 REQUIRED + 10 OPTIONAL fields
- **EXECUTE:** 16 files across 6 commits; 836/837 backend + 159/159 frontend
- **VERIFY:** All non-gated tests PASS; profiles seeded and active in toplineshop_dev; browser upload PENDING OWNER
- **CLOSE:** After owner confirms AC-19 + AC-20
- **NEXT:** PM authorization required for next task
