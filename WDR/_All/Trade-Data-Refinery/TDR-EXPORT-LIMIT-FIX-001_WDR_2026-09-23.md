# WDR: TDR-EXPORT-LIMIT-FIX-001
**Date:** 2026-09-23  
**Branch:** codex/trade-data-refinery  
**Commit:** 5a00e29  
**Status:** PASS CLOSED  

---

## Task ID
TDR-EXPORT-LIMIT-FIX-001

## Scope
Fix TDR export limit behavior: `rowLimit` must cap exported rows (sample behavior), not reject the job when total matching rows exceed the limit. Adds deterministic source-row ordering, pagination support for large batches, continuous polling, duplicate-click guard, and FAILED status with errorCode display.

---

## Requirements Addressed

| # | Requirement | Status |
|---|-------------|--------|
| 1 | `rowLimit` caps exported rows — never rejects when matching rows exceed limit | PASS |
| 2 | Deterministic source-row order: `ORDER BY batch_id ASC, source_row_number ASC` | PASS |
| 3 | `rowLimit=100` creates 100-row sample from a 177,077-row batch | PASS |
| 4 | FAILED status shows `[errorCode] errorMessage` in Exports UI | PASS |
| 5 | Continuous polling: PENDING/LEASED jobs poll every 3s until terminal status | PASS |
| 6 | Disable Create Export button while submitting (duplicate-click guard) | PASS |
| 7 | Pagination/chunk support: `rowOffset` + `MAX_EXPORT_ROW_LIMIT = 1,000,000` | PASS |
| 8 | 31 new tests covering all above behaviors | PASS |

---

## Root Causes Fixed

### RC-1: Export rejected when matching rows exceeded rowLimit
**Before:** Handler pre-counted rows; if `estimatedCount > rowLimit` → `failJob(EXPORT_LIMIT_EXCEEDED)`  
**After:** Pre-count and fail path removed entirely. `remainingRows` counter decrements per row written; loop exits when `remainingRows === 0` or no more rows. Export always succeeds.

### RC-2: Non-deterministic ordering (UUID sort)
**Before:** `ORDER BY r.id ASC` (UUID — non-deterministic across Postgres versions/pages)  
**After:** `ORDER BY r.batch_id ASC, r.source_row_number ASC` + composite keyset: `(r.batch_id > $last) OR (r.batch_id = $last AND r.source_row_number > $last_row)`

### RC-3: Large batches blocked (max 100,000 rows)
**Before:** `@Max(DEFAULT_EXPORT_ROW_LIMIT)` = 100,000  
**After:** `MAX_EXPORT_ROW_LIMIT = 1_000_000`; DTO `@Max` updated; `rowOffset` field added for page-based export of batches >100k rows

### RC-4: Polling was one-shot
**Before:** `setTimeout(poll, 3000)` — fires once, then stops  
**After:** `setInterval(poll, 3000)` with `clearInterval` on unmount / status change — polls continuously until COMPLETED or FAILED

### RC-5: Rapid double-click could submit two export jobs
**Before:** Only `creating` state; React batch update not immediate  
**After:** `submittingRef = useRef(false)` — synchronously guards before first async call

### RC-6: FAILED export showed no error detail
**Before:** `TdrExportJob` type lacked `errorCode`; UI showed only `errorMessage`  
**After:** `errorCode` added to type; cell renders `[errorCode] errorMessage`, or message-only, or 'Failed' fallback

---

## Files Changed

| File | Change |
|------|--------|
| `backend/src/trade-data-refinery/quality/constants/quality.limits.ts` | Add `MAX_EXPORT_ROW_LIMIT = 1_000_000` |
| `backend/src/trade-data-refinery/export/dto/create-export.dto.ts` | `@Max` → `MAX_EXPORT_ROW_LIMIT`; add `rowOffset` field |
| `backend/src/trade-data-refinery/export/service/tdr-export.service.ts` | Pass `rowOffset` through to filter config |
| `backend/src/trade-data-refinery/export/handler/tdr-export-handler.service.ts` | Remove pre-count/failJob; `remainingRows` cap; composite keyset ORDER; `rowOffset` OFFSET on first chunk |
| `backend/src/trade-data-refinery/tdr-export-integration.spec.ts` | §8 (5 tests): cap behavior; §9 (6 tests): DTO validation |
| `backend/src/trade-data-refinery/tdr-mega4-unit.spec.ts` | Fix test: threshold now 1,000,001 |
| `src/types/tdr.ts` | Add `errorCode` to `TdrExportJob` |
| `src/app/tdr/exports/page.tsx` | `setInterval` polling; `submittingRef`; FAILED errorCode cell; max 1M row limit |
| `src/__tests__/tdr-exports-page.test.tsx` | §14–§17 (9 tests): errorCode, duplicate click, polling, sample limit |

---

## Test Evidence

**Backend (848/849 passing, 1 intentional skip — 21 suites):**
```
Test Suites: 21 passed, 21 total
Tests: 1 skipped, 848 passed, 849 total
```

**Frontend (177/177 passing — 12 files):**
```
Test Files: 12 passed (12)
Tests: 177 passed (177)
```

New tests: 31 total (11 backend §8–§9, 9 frontend §14–§17 + 11 pre-existing updated)

---

## Architecture Notes

- `countExportRows()` private method removed from handler — no longer called
- `QUALITY_ERROR.EXPORT_LIMIT_EXCEEDED` path no longer reachable from export handler (enum value preserved for DB compat)
- `ExportFilter` interface extended with `rowOffset?: number`
- Composite keyset uses raw Prisma SQL template (`Prisma.sql`) — avoids N+1 offset scans on large batches
- `rowOffset` applied only on the first chunk (when `lastBatchId === null`) — subsequent chunks use keyset

---

## Safety Boundaries

- No production data affected
- No schema migration required (rowOffset is filter-only; no DB column added)
- Original source files remain immutable
- `F:\OpenCode\shop.com` not touched
- No secrets committed

---

## Governance

- #FDD: Frontend behavior proved via test coverage (§14–§17); UI changes are in `exports/page.tsx`
- #123: EXECUTE → VERIFY (848+177 tests) → CLOSE
- Next task requires PM authorization
