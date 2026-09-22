# WDR: TDR-STANDARDIZED-FILENAME-001
## Automatic TDR_V1 Source-File Naming

**Date:** 2026-09-23
**Branch:** codex/trade-data-refinery
**Status:** PASS
**Commit (implementation):** 0c3280a
**Commit (governance):** c1fe5e9

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
| AC-14 | 834/835 backend tests pass (1 intentional skip) | PASS |
| AC-15 | 159/159 frontend tests pass | PASS |

---

## §3 — Files Changed

### New Files
- `backend/prisma/migrations/20260923000000_add_standardized_filename/migration.sql`
- `backend/src/trade-data-refinery/ingestion/upload/filename.util.ts`

### Modified Files
- `backend/prisma/schema.prisma` — 3 new fields on `TdrSourceFile`; new `TdrFilenameSequence` model
- `backend/src/trade-data-refinery/ingestion/upload/upload.dto.ts` — `dataPeriodYear`, `dataPeriodMonth`
- `backend/src/trade-data-refinery/ingestion/upload/upload.service.ts` — sequence allocation, `standardizedFilename` stored; `UploadResult` extended
- `backend/src/trade-data-refinery/services/tdr.service.ts` — `standardizedFilename` in `listBatches`; `getBatch` now includes `sourceFile` select
- `backend/src/trade-data-refinery/tdr-mega3-unit.spec.ts` — updated DTO tests; +16 new tests
- `src/types/tdr.ts` — `standardizedFilename` added to `TdrBatch`
- `src/lib/tdr-api.ts` — `uploadFile` accepts `dataPeriodYear`, `dataPeriodMonth`
- `src/app/tdr/upload/page.tsx` — year/month inputs, preview, auto `TDR_V1`, all 5 formats
- `src/app/tdr/batches/[id]/page.tsx` — standardized name as heading; dual-filename detail card
- `src/app/tdr/batches/page.tsx` — standardized name with fallback in list

---

## §4 — Architecture Notes

### Sequence Table
`tdr_filename_sequences (tenant_id, trade_type, period_year, period_month) → next_seq`

- Composite primary key prevents duplicate entries.
- `ON CONFLICT DO UPDATE SET next_seq = next_seq + 1 RETURNING next_seq` runs inside the same transaction as `TdrSourceFile.create`, so the sequence and the record are written atomically.
- PostgreSQL row-level lock on the upsert serializes concurrent uploads with identical `(tenant, type, year, month)` — no application-level locking needed.
- `period_month = 0` is the sentinel for "no month specified" in the sequence table; the filename omits the `_MM` segment in this case.

### Filename Utility
`filename.util.ts` contains pure functions with no dependencies — `buildStandardizedFilename` and `tradeTypeCode` are independently unit-testable without DB or NestJS context.

### Backward Compatibility
- Existing `TdrSourceFile` rows have `standardized_filename = NULL` (migration uses `ADD COLUMN` with no DEFAULT).
- `listBatches` and the batch list UI fall back to `originalFilename` when `standardizedFilename` is null.
- `getBatch` now returns `sourceFile` fields; previously it returned only the raw `TdrBatch` record (pre-existing gap fixed).

---

## §5 — Test Evidence

```
Backend (Jest):  834/835 passing, 1 intentional skip (TDR_1M_PROOF-gated)
Frontend (Vitest): 159/159 passing
New tests: +16 (UploadBatchDto year/month validation + buildStandardizedFilename suite)
```

### New test coverage
- `UploadBatchDto`: year required, out-of-range year/month rejected, optional month accepted, string coercion from multipart form
- `buildStandardizedFilename`: IMP/EXP with month, without month, month padding, sequence padding, sequence >999, extension preservation, GLB fallback
- `tradeTypeCode`: IMPORT → IMP, EXPORT → EXP, unknown → GLB

---

## §6 — Open Items

| ID | Severity | Description |
|----|----------|-------------|
| STD-001 | P3 | `TDR_V1` mapping profile must exist in DB for uploads to resolve — no seed migration provided for the canonical default profile. Pakistan Customs profiles (Exp_Pak_Jan_2025, Imp_Pak_Jan_2025) continue to work unchanged. |
| STD-002 | P3 | Sequence resets to 001 per `(tenant, type, year, month)` — sequences are not global across years/months, by design. |

---

## §7 — Governance

**#123 Protocol:** DISCUSS → DECIDE → EXECUTE → VERIFY → CLOSE → NEXT

- **DISCUSS:** Format `TDR_V1_<TYPE>_<YYYY>[_<MM>]_<SEQ>.<ext>`; concurrent-safe via DB upsert; original filename immutable; mapping profile not derived from filename
- **DECIDE:** Sequence table with PG upsert; `period_month=0` sentinel; pure utility function for testability; frontend preview with `###` placeholder
- **EXECUTE:** 12 files, 317 insertions, commit 0c3280a
- **VERIFY:** 834/835 + 159/159 tests PASS; migration applied to `toplineshop_dev`
- **CLOSE:** This WDR
- **NEXT:** PM authorization required for next task
