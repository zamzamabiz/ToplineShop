# WDR: TDR-EXPORT-ENUM-CAST-FIX-001
**Date:** 2026-09-23  
**Branch:** codex/trade-data-refinery  
**Commit:** d534380  
**Status:** PASS CLOSED  

---

## Task ID
TDR-EXPORT-ENUM-CAST-FIX-001

## Scope
Fix P2010 PostgreSQL 42883 error on specific-batch export creation; remove backend row-limit ceiling from user-facing UI.

---

## Root Cause

`fetchExportChunk` in `tdr-export-handler.service.ts` built a `Prisma.sql` condition:

```typescript
Prisma.sql`r.trade_direction = ${filter.tradeDirection}`
```

Prisma passes `${value}` as a bound parameter `$1` with PostgreSQL type `text`. The column `trade_direction` is `"TradeDirection"` (a custom PostgreSQL enum). PostgreSQL error 42883 fires because there is no implicit `text = "TradeDirection"` operator.

The analytics service (`analytics.service.ts:282`) already applied the correct cast:
```typescript
Prisma.sql`trade_direction = ${filter.tradeDirection}::"TradeDirection"`
```
The export handler was the only missing site.

---

## Requirements Addressed

| # | Requirement | Status |
|---|-------------|--------|
| 1 | Find every raw SQL query comparing `trade_direction` with a parameterized value | PASS — one site confirmed |
| 2 | Cast to `"TradeDirection"` enum explicitly | PASS |
| 3 | Apply consistently to export row fetch, estimates, all-record exports | PASS — estimate uses ORM (no cast needed); handler fix covers all filter paths |
| 4 | Keep parameterized SQL — no user-input concatenation | PASS |
| 5 | MAX_EXPORT_ROW_LIMIT used consistently for new jobs | PASS (unchanged from prior task) |
| 6 | Remove visible "N / M limit" text from the export job table | PASS |
| 7 | Rebuild and restart backend (:4000) | PASS |
| 8 | Add regression tests for both IMPORT and EXPORT enum filters | PASS — §11 (3 tests) |

---

## Changes

### Backend

**`backend/src/trade-data-refinery/export/handler/tdr-export-handler.service.ts`**
- Line 198: `Prisma.sql\`r.trade_direction = ${filter.tradeDirection}\`` → `Prisma.sql\`r.trade_direction = ${filter.tradeDirection}::"TradeDirection"\``

**`backend/src/trade-data-refinery/tdr-export-integration.spec.ts`**
- §11 added (3 tests): IMPORT cast, EXPORT cast, structural documentation that the unfixed form lacks the annotation

### Frontend

**`src/app/tdr/exports/page.tsx`**  
- `ExportJobRow` Rows cell: removed `{' / '}{job.rowLimit != null ? job.rowLimit.toLocaleString() : '—'} limit` — shows only `rowCount`

**`src/__tests__/tdr-exports-page.test.tsx`**
- §13.3: changed to check `td.textContent?.trim() === '16'` (not `N / M` pattern)
- §13.4: changed to check `td.textContent?.trim() === '0'` (not `0 /` startsWith)
- §13.5: inverted — asserts `queryByText(/50,000 limit/i)` is `null`

---

## Test Evidence

**Backend (856/857 passing, 1 intentional skip — 21 suites):**
```
Test Suites: 21 passed, 21 total
Tests:       1 skipped, 856 passed, 857 total
```
*(+3 vs prior: §11 TradeDirection enum cast regression tests)*

**Frontend (182/182 passing — 12 files):**
```
Test Files: 12 passed (12)
Tests:      182 passed (182)
```

---

## Acceptance Tests (Manual — Owner Required)

- [ ] Export TDR_V1_IMP_2025_01_001.csv (10 rows) — status reaches COMPLETED, 10 rows
- [ ] Export TDR_V1_EXP_2025_01_001.csv (10 rows) — status reaches COMPLETED, 10 rows
- [ ] Export the large 159,387-row batch — no EXPORT_LIMIT_EXCEEDED error
- [ ] Export via "All accepted records" — estimate shows count, export completes
- [ ] Row count cell in job table shows plain number, no "/ N limit" suffix

---

## Architecture Notes

- `estimateExport` uses `prisma.tdrRecord.count` (ORM) — not affected by enum cast bug; no fix needed there
- `row_disposition = 'ACCEPTED'` hardcoded SQL string literal is NOT a parameterized value; PostgreSQL treats it as `unknown` type which can be implicitly cast to enum — no fix needed there
- The `"TradeDirection"` name is double-quoted CamelCase — matches `CREATE TYPE "TradeDirection"` in migration `20260918215807`
- This cast pattern is already established in analytics: `analytics.service.ts:282`

---

## Safety Boundaries

- No schema migration required
- No production data modified
- No secrets committed
- `F:\OpenCode\shop.com` not touched

---

## Governance

- #FDD: Visual fix (row-limit removed from job table) + backend correctness
- #123: EXECUTE → VERIFY (856+182 tests) → CLOSE
- Next task requires PM authorization
