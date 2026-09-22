# WDR: TDR-EXPORT-WORKFLOW-SIMPLIFICATION-001
**Date:** 2026-09-23  
**Branch:** codex/trade-data-refinery  
**Commit:** 28649d7  
**Status:** PASS CLOSED  

---

## Task ID
TDR-EXPORT-WORKFLOW-SIMPLIFICATION-001

## Scope
Simplify the TDR Export workflow: replace manual batch ID, direction select, and row-limit input with an intelligent scope selector, a searchable batch dropdown, and a backend estimate endpoint. Users never type a Batch ID. Direction is auto-derived. Row limits are backend-only.

---

## Requirements Addressed

| # | Requirement | Status |
|---|-------------|--------|
| 1 | Remove visible free-text Batch ID field | PASS |
| 2 | Replace with scope selector: Current batch (URL) / batch picker / All accepted records | PASS |
| 3 | Auto-use selected batch's trade direction — no direction picker for single-batch | PASS |
| 4 | Remove visible Row Limit field | PASS |
| 5 | Export all matching accepted + export-eligible records (backend defaults to 1M) | PASS |
| 6 | Streaming + chunked/keyset pagination — no full load into memory | PASS (unchanged from prior work) |
| 7 | Technical ceiling configurable in backend only | PASS |
| 8 | "All accepted records" shows inline estimated row count | PASS |
| 9 | Prevent duplicate clicks | PASS (unchanged from prior work) |
| 10 | Live statuses: QUEUED (PENDING), PROCESSING (LEASED), COMPLETED, FAILED | PASS |
| 11 | On completion, show Download CSV | PASS (unchanged) |
| 12 | Clear error messages — manual validation failures eliminated | PASS |
| 13 | Users never create or type a Batch ID | PASS |
| 14 | Existing records not deleted or emptied | PASS |

---

## Changes

### Backend

**`tdr-export.service.ts`**
- `createExport`: default `rowLimit` changed from `DEFAULT_EXPORT_ROW_LIMIT` (100k) to `MAX_EXPORT_ROW_LIMIT` (1M)
- New method `estimateExport(filter, user)`: counts ACCEPTED+export_eligible records via `prisma.tdrRecord.count`; optional `batchId` scope

**`tdr.controller.ts`**
- New `GET /tdr/exports/estimate?batchId?` endpoint — declared BEFORE `GET /tdr/exports/:id` to prevent routing conflict

### Frontend

**`src/lib/tdr-api.ts`**
- New `estimateExport(token, { batchId? })` function → `GET /tdr/exports/estimate`

**`src/app/tdr/exports/page.tsx`** — major redesign
- Scope selector: radio "All accepted records" | "Specific batch"
- Batch selector: `<select data-testid="batch-select">` populated from `listBatches(pageSize: 100)`
- `getBatch` called for URL-preset batch to guarantee it appears in selector
- `estimateExport` auto-fetched in `useEffect` when scope='all'; count shown inline
- `tradeDirection` auto-derived from selected batch; never shown to user
- `rowLimit` removed from form; not sent in payload
- STATUS_DISPLAY: `PENDING→QUEUED`, `LEASED→PROCESSING`
- `submittingRef` duplicate-click guard retained
- `setInterval` continuous polling retained

### Tests

**`tdr-exports-page.test.tsx`** — 34 tests (was 34)
- Mock `listBatches`, `estimateExport`, `getBatch` added
- §1: rewritten — checks for scope radios, no legacy fields
- §2: rewritten — batch selector appears on scope switch
- §3: rewritten — all-scope payload has no batchId/tradeDirection
- §4: rewritten — batch scope sends auto-direction
- §6: LEASED→PROCESSING badge text
- §13.7: LEASED→PROCESSING badge text
- §17: rewritten — no rowLimit in payload, no spinbutton
- §18: new — batch selector populated from API
- §19: new — estimate count displayed for all scope

**`tdr-export-integration.spec.ts`** — 5 new tests in §10
- `estimateExport` returns exact count
- Scopes to batchId when provided
- Omits batchId when absent
- Returns 0 for empty tenant
- `createExport` defaults rowLimit to MAX_EXPORT_ROW_LIMIT

---

## Test Evidence

**Backend (853/854 passing, 1 intentional skip — 21 suites):**
```
Test Suites: 21 passed, 21 total
Tests: 1 skipped, 853 passed, 854 total
```

**Frontend (182/182 passing — 12 files):**
```
Test Files: 12 passed (12)
Tests: 182 passed (182)
```

---

## Acceptance Tests (Manual — Owner Required)

- [ ] Export the existing 1-row batch successfully via batch selector
- [ ] Export the existing 177,077-row batch completely via batch selector
- [ ] Export all accepted records successfully via "All accepted records" scope
- [ ] Verify deterministic source-row order and no duplicated/missing rows
- [ ] Verify repeated button clicks create only one export job

---

## Architecture Notes

- `GET /tdr/exports/estimate` is a static route and must remain before `GET /tdr/exports/:id` in the controller declaration order — NestJS resolves in order
- `estimateExport` reuses the Prisma `tdrRecord.count` query — no raw SQL, no N+1
- `listBatches` paginates 100 rows; for tenants with >100 batches, the batch search filters the loaded list client-side
- Frontend never sends `rowLimit` — backend defaults to MAX; the value returned in job status still shows in the "N / M limit" table cell

---

## Safety Boundaries

- No schema migration required
- No production data modified
- No secrets committed
- `F:\OpenCode\shop.com` not touched

---

## Governance

- #FDD: Frontend behavior proved via test coverage (§1–§4, §17–§19)
- #123: EXECUTE → VERIFY (853+182 tests) → CLOSE
- Next task requires PM authorization
