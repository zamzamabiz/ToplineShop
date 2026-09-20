# WDR — TDR-CORRECTION-REVALIDATION-CORRECTION-001
**Date:** 2026-09-21  
**Branch:** codex/trade-data-refinery  
**Author:** Javed Ahmed Chohan  
**Verdict:** PASS

---

## §1 Task Summary

Fix two confirmed revalidation defects in `CorrectionService` that caused an owner-authorized governed correction (`quantityNormalized = 100` on record `c5c71391`) to leave the record in QUARANTINED instead of ACCEPTED.

---

## §2 Root Causes Fixed

### Defect A — Classification C: REQUIRED_FIELD_MISSING re-fires after correction
**Root cause:** `buildRevalidationRow` reconstructs `quantityRaw = ""` from the DB record (blank raw field, never corrected). Re-normalization re-derives `quantityNormalized = null` → `REQUIRED_FIELD_MISSING` fires again even though a valid correction was applied.

**Fix:** Introduced `filterCorrectedRequiredIssues()` which suppresses `REQUIRED_FIELD_MISSING` for any raw field whose normalized counterpart is marked `CORRECTED` in `valueTreatmentMeta` with a non-empty value.  
Map: `RAW_TO_NORMALIZED_COUNTERPART` (exported constant).

### Defect B — Classification B: TRADE_DATE_INVALID regression
**Root cause:** `buildRevalidationRow` uses `String(record.tradeDate)` where `tradeDate` is a JavaScript `Date` object (from PostgreSQL `@db.Date`). `String(Date)` produces a locale datetime string (e.g., `"Mon Jan 13 2025 05:00:00 GMT+0500"`) which `DATE_PARSE_DMY` cannot parse → `TRADE_DATE_INVALID` fires.

**Critical finding:** `tradeDateRaw` does NOT exist on the `TdrRecord` Prisma schema (only `tradeDate DateTime? @db.Date`). Original source text is not persisted.

**Fix:** Introduced `revalidationDateString(d: Date, transformationRule?: string): string` which formats the `@db.Date` field back to a source-parseable string using UTC accessors (timezone-safe for date-only values) and the column's `transformationRule`:
- `DATE_PARSE_DMY` → `DD-MM-YYYY`
- `DATE_PARSE_MDY` → `MM-DD-YYYY`
- Default → `YYYY-MM-DD`

`buildRevalidationRow` now checks `v instanceof Date` and calls `revalidationDateString` before `String(v)`.

---

## §3 Files Changed

| File | Change |
|------|--------|
| `backend/src/trade-data-refinery/quality/correction/correction.service.ts` | Defect A + B fix, `reEvaluateRecord` method, batch count delta (Step 6) |
| `backend/src/trade-data-refinery/tdr.controller.ts` | Added `POST .../re-evaluate` endpoint (SUPER_ADMIN, TENANT_ADMIN only) |
| `backend/src/trade-data-refinery/tdr-correction-revalidation.spec.ts` | 22 new tests (15 target + 7 additional coverage) |
| `scripts/Invoke-QuarantineCorrection.ps1` | Fixed `/quality-detail` → `/quality`; added §5 re-evaluate call |

---

## §4 New Exports (Testable Pure Functions)

- `revalidationDateString(d: Date, transformationRule?: string): string`
- `buildRevalidationRow(record, config): Record<string, string>`
- `filterCorrectedRequiredIssues(issues, meta, record): ValidationIssueInput[]`
- `RAW_TO_NORMALIZED_COUNTERPART: Readonly<Partial<Record<string, string>>>`

---

## §5 New Method: `reEvaluateRecord`

Added `CorrectionService.reEvaluateRecord(batchId, recordId, tenantId)` to re-evaluate an already-corrected record using the fixed pipeline. Does NOT create a new `TdrQuarantineReview` (not a correction event). Transaction:
1. Close OPEN artefact issues from broken prior revalidation
2. Re-run `buildRevalidationRow → normalizeRowV1 → validateRowV1 → filterCorrectedRequiredIssues → determineDisposition`
3. Create new issues (if any remain)
4. Update `rowDisposition`, `exportEligible`, `quarantineReviewRequired`
5. Update batch counts via `buildCountDelta` if disposition changed

Exposed via `POST /tdr/batches/:batchId/records/:recordId/re-evaluate` (ADMIN only).

---

## §6 Batch Count Delta (Step 6 in applyCorrection)

Prior `applyCorrection` never updated `TdrBatch.acceptedRows`/`quarantinedRows`/`rejectedRows`. Added Step 6 to both `applyCorrection` and `reEvaluateRecord`. The helper `buildCountDelta(oldDisp, newDisp)` uses Prisma atomic `{ increment: 1 }` / `{ decrement: 1 }` operators. Only fires when disposition changes.

---

## §7 Test Results

```
Tests: 22 passed (tdr-correction-revalidation.spec.ts)
Full suite: 571/572 passed, 1 pre-existing skip
TypeScript: 0 errors
Prisma: schema valid, 7 migrations, database up to date
```

Test categories:
- §1 `revalidationDateString` — 5 tests (DMY, MDY, default, zero-pad, UTC-midnight safety)
- §2 `buildRevalidationRow` — 4 tests (Date conversion, string passthrough, null → "", column coverage)
- §3 `filterCorrectedRequiredIssues` — 7 tests (passthrough, suppress, not-corrected, empty, null, unknown field, mixed)
- §4 `RAW_TO_NORMALIZED_COUNTERPART` — 3 tests
- §5 End-to-end pipeline — 3 tests (no TRADE_DATE_INVALID, no REQUIRED qty, zero issues total)

---

## §8 Constraints Verified

- ✅ Did NOT start Phase 7
- ✅ Did NOT reupload source files
- ✅ Did NOT modify Pakistan Customs mapping profiles
- ✅ Did NOT mutate raw source values (quantityRaw remains blank)
- ✅ Did NOT manually set record dispositions
- ✅ Did NOT manually close validation issues
- ✅ Did NOT submit a second correction for the same value
- ✅ Exact-file staging only (no `git add .`)
- ✅ No password / token / hash in code or WDR
- ✅ No auth bypass, no hardcoded JWT
- ✅ No localStorage / sessionStorage
- ✅ No manual DB edits

---

## §9 Runtime Verification (Next Step)

The `re-evaluate` endpoint is ready. Owner should run:
```
.\scripts\Invoke-QuarantineCorrection.ps1
```

This now calls:
1. `POST .../correct` — already executed (quantityNormalized = 100 in DB)
2. `POST .../re-evaluate` — applies the fixed pipeline to the existing corrected record
3. `GET .../quality` — verifies rowDisposition = ACCEPTED, quantityRaw blank, quantityNormalized = 100
4. Batch progress — verifies acceptedRows = 16, quarantinedRows = 0

**Note:** The correction (`quantityNormalized = 100`) was already applied in the prior run. The `re-evaluate` call re-processes the existing correction, NOT a second correction.

---

## §10 Git Baseline
- HEAD at time of fix: `430d387`
- Changed files staged exactly (no `git add .`)
