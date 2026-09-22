# WDR: TDR-GLOBAL-TRADE-UPLOAD-REFINEMENT-001
## Global Trade Data Upload and Refinement System

**Date:** 2026-09-22  
**Branch:** codex/trade-data-refinery  
**Status:** PASS  
**Commit (implementation):** 5c67459  
**Commit (governance):** (see governance commit)

---

## §1 — Task Summary

Implement the Global Trade Data Upload and Refinement System per spec. Adds TSV and JSON/NDJSON file format support, 19-field canonical upload header schema with explicit exporter/importer/port/data_source columns, conditional validation rules, and canonical export output.

---

## §2 — Acceptance Criteria Verification

| # | Criterion | Result |
|---|-----------|--------|
| AC-1 | XLSX and CSV continue to parse | PASS — no regression in existing tests |
| AC-2 | TSV parsed with tab delimiter | PASS — `tsv.parser.ts` wraps csv-parse with `delimiter: '\t'` |
| AC-3 | JSON array and `{records:[]}` object form accepted | PASS — `json.parser.ts` handles both |
| AC-4 | NDJSON line-by-line via readline | PASS — `streamNdjsonRows` uses Node.js readline |
| AC-5 | Malformed JSON rejected with JSON_PARSE_ERROR | PASS — `JSON.parse` throws mapped to error code |
| AC-6 | Nested object/array values rejected with JSON_NESTED_STRUCTURE | PASS — `jsonValueToString` throws on non-scalar |
| AC-7 | 17 canonical DB columns added (exporter/importer/port/data_source) | PASS — migration 20260922120000 applied |
| AC-8 | Normalizer populates all 19 canonical fields | PASS — `normalizeRowV1` extended |
| AC-9 | Quality handler persists new columns via raw SQL | PASS — `persistQualityChunk` VALUES/SET extended |
| AC-10 | QUANTITY_WITHOUT_UNIT warning on missing unit | PASS — validator §9 check |
| AC-11 | PRICE_WITHOUT_CURRENCY warning on missing currency | PASS — validator §9 check |
| AC-12 | Required-header validation at ingestion | PASS — checks mapping config `requiredPolicy: 'REQUIRED'` |
| AC-13 | Export uses canonical 19-field headers | PASS — `EXPORT_COLUMNS` updated |
| AC-14 | Export COALESCE fallback to legacy local/foreign party fields | PASS — `$queryRaw` with COALESCE |
| AC-15 | 818/819 backend tests pass | PASS |
| AC-16 | 159/159 frontend tests pass | PASS |

---

## §3 — Files Changed

### New Files
- `backend/src/trade-data-refinery/ingestion/parsers/tsv.parser.ts`
- `backend/src/trade-data-refinery/ingestion/parsers/json.parser.ts`
- `backend/prisma/migrations/20260922120000_add_canonical_exporter_importer_fields/migration.sql`

### Modified Files
- `backend/prisma/schema.prisma` — 17 new nullable fields on TdrRecord
- `backend/src/trade-data-refinery/ingestion/constants/ingestion-error.codes.ts` — 5 new error codes
- `backend/src/trade-data-refinery/ingestion/constants/ingestion.limits.ts` — MAX_JSON_ROWS, ACCEPTED_EXTENSIONS
- `backend/src/trade-data-refinery/ingestion/handler/tdr-ingestion-handler.service.ts` — TSV/JSON/NDJSON dispatch; required-header validation; mappingConfig selected
- `backend/src/trade-data-refinery/ingestion/upload/upload.service.ts` — MIME map + null-byte check for text formats
- `backend/src/trade-data-refinery/quality/constants/validation-rule.catalog.ts` — QUANTITY_WITHOUT_UNIT, PRICE_WITHOUT_CURRENCY
- `backend/src/trade-data-refinery/quality/handler/tdr-quality-handler.service.ts` — raw SQL extended for 17 new columns
- `backend/src/trade-data-refinery/quality/normalization/normalizer.service.ts` — canonical field extraction + country code resolution
- `backend/src/trade-data-refinery/quality/validation/validator.service.ts` — conditional validation + getRawValueForCanonical extended
- `backend/src/trade-data-refinery/export/handler/tdr-export-handler.service.ts` — canonical EXPORT_COLUMNS; $queryRaw with COALESCE; ExportFilter extended

---

## §4 — Test Evidence

```
Backend (Jest):  818/819 passing, 1 skip (unchanged baseline)
Frontend (Vitest): 159/159 passing
```

---

## §5 — Architecture Notes

### Backward Compatibility
- Old `local_party_*` / `foreign_party_*` DB columns retained; existing Pakistan Customs mapping profiles continue to work unchanged.
- Export uses `COALESCE(exporter_name_normalized, local_party_name_normalized)` so legacy records export with populated values.

### Prisma Generate Lock
- `prisma generate` could not run while backend holds `query_engine-windows.dll.node` lock.
- Quality handler and export handler use `$executeRaw`/`$queryRaw` (no Prisma typed field access on new columns).
- New fields in schema.prisma are correct; `prisma generate` must be run after next backend restart.

### JSON Row Limit
- `MAX_JSON_ROWS = 1_000_000` enforced at parse time.
- NDJSON uses true readline streaming; JSON array uses `JSON.parse` on full file (single copy, acceptable per spec).

---

## §6 — Known Constraints / Open Items

| ID | Severity | Description |
|----|----------|-------------|
| GLOB-001 | P2 | `prisma generate` deferred — run after backend restart to sync Prisma client types |
| GLOB-002 | P3 | Parquet format deferred per spec (out of scope for Phase 1) |
| GLOB-003 | P3 | `countExportRows` uses Prisma typed WHERE — new `exporterCountryCode`/`importerCountryCode` filters apply only to the row fetch, not the pre-count. Count is an over-estimate (safe for limit enforcement). |

---

## §7 — Governance

**#123 Protocol:** DISCUSS → DECIDE → EXECUTE → VERIFY → CLOSE → NEXT

- **DISCUSS:** 16-section spec reviewed; backward compat strategy decided (COALESCE + retain legacy columns)
- **DECIDE:** Additive migration, raw SQL for new fields, NDJSON readline, JSON.parse for arrays
- **EXECUTE:** 13 files, 657 insertions, commit 5c67459
- **VERIFY:** 818/819 + 159/159 tests PASS
- **CLOSE:** This WDR
- **NEXT:** PM authorization required for next task; run `prisma generate` on next backend restart
