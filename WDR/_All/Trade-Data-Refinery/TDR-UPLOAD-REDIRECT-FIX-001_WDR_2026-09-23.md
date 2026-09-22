# WDR: TDR-UPLOAD-REDIRECT-FIX-001
## Upload batchId Redirect, Type Correction, and Period Conflict Guard

**Date:** 2026-09-23
**Branch:** codex/trade-data-refinery
**Status:** PASS — CLOSED
**Commit:** 6306b24

---

## §1 — Task Summary

Three production defects in the TDR upload flow, identified by owner after browser testing:

| ID | Defect | Severity |
|----|--------|----------|
| UP-001 | `batch.id` used for redirect but API returns `batchId` → `/tdr/batches/undefined` | P1 |
| UP-002 | `uploadFile` typed as `Promise<TdrBatch>` but actual response is `UploadResult` shape | P1 |
| UP-003 | No validation preventing upload when selected direction/year/month disagrees with TDR_V1 filename | P2 |

---

## §2 — Root Cause Analysis

### UP-001 / UP-002 — Type mismatch (batchId vs id)

The backend `UploadService.handleUpload()` returns `UploadResult`:
```typescript
interface UploadResult {
  sourceFileId: string;
  batchId: string;       // ← actual field name
  jobId: string;
  standardizedFilename: string;
  status: 'QUEUED';
}
```

`tdr-api.ts:uploadFile` was typed `Promise<TdrBatch>`. `TdrBatch` has `id`, not `batchId`. The cast `body.data as TdrBatch` compiled silently. The upload page then did `router.push(\`/tdr/batches/${batch.id}\`)` — `batch.id` was `undefined`, producing `/tdr/batches/undefined`.

### UP-003 — No period conflict detection

When a user selects e.g. `IMPORT / 2025 / January` in the form but uploads a file named `TDR_V1_EXP_2024_12_001.csv`, the mismatch was silently accepted, leading to a batch with wrong metadata.

---

## §3 — Fixes Applied

### `src/types/tdr.ts`
Added `UploadResponse` interface matching backend `UploadResult`:
```typescript
export interface UploadResponse {
  sourceFileId: string;
  batchId: string;
  jobId: string;
  standardizedFilename: string;
  status: 'QUEUED';
}
```

### `src/lib/tdr-api.ts`
- Added `UploadResponse` to imports from `@/types/tdr`
- Changed `uploadFile` signature: `Promise<TdrBatch>` → `Promise<UploadResponse>`
- Changed cast: `body.data as TdrBatch` → `body.data as UploadResponse`

### `src/app/tdr/upload/page.tsx`
- Redirect fix: `batch.id` → `result.batchId`
- Navigation guard: `if (!result.batchId) throw new Error('...')` before `router.push`
- Added `parseTdrFilename()` — regex extracts direction/year/month from `TDR_V1_(IMP|EXP)_YYYY[_MM]_` filenames
- Added `getFilenamePeriodConflict()` — returns conflict message if any of direction/year/month disagree
- `periodConflict` state: amber warning displayed; submit button disabled when conflict present
- `handleSubmit` early-returns if `periodConflict` is set (belt-and-suspenders)

### `src/__tests__/tdr-api.test.ts`
9 new tests across 2 new `describe` blocks:
- `uploadFile`: response shape (`batchId` accessible), auth header + endpoint, error propagation on 422
- `getFilenamePeriodConflict helpers`: null for non-TDR filename, null for full match, null when filename lacks month, direction/year/month mismatch detection

---

## §4 — Acceptance Criteria

| # | Criterion | Result |
|---|-----------|--------|
| AC-1 | `uploadFile` return type is `UploadResponse` (not `TdrBatch`) | PASS |
| AC-2 | `result.batchId` used for router.push | PASS |
| AC-3 | Guard throws if `batchId` absent in response | PASS |
| AC-4 | Period conflict detected: direction, year, month mismatches | PASS |
| AC-5 | Amber warning shown when conflict detected | PASS |
| AC-6 | Submit disabled when conflict present | PASS |
| AC-7 | Non-TDR_V1 filenames pass conflict check unconditionally | PASS |
| AC-8 | Full-year TDR_V1 filename (no month segment) does not conflict when month is selected | PASS |
| AC-9 | 168/168 frontend tests pass | PASS |
| AC-10 | No new TS errors introduced | PASS |

---

## §5 — Test Evidence

```
Frontend (Vitest):  168/168 passing (was 159 before this session)
New tests (6306b24): +9
```

Pre-existing TS errors (not introduced by this commit):
- `tdr-source-lifecycle.test.tsx:58` — TdrBatch mock missing `standardizedFilename` (from STD-001 work)
- `projectRegistry.ts:3029,4917,4926` — `"PENDING"` status and `WdrEntry.path` (governance registry issues)

---

## §6 — Files Changed

| File | Change |
|------|--------|
| `src/types/tdr.ts` | +`UploadResponse` interface |
| `src/lib/tdr-api.ts` | `uploadFile` return type + import |
| `src/app/tdr/upload/page.tsx` | Redirect fix + guard + period conflict |
| `src/__tests__/tdr-api.test.ts` | +9 tests (uploadFile + conflict helpers) |

---

## §7 — Audit Note: Audit Log FK

The `AuditService.recordEvent()` wraps all Prisma calls in `try/catch` and logs errors without re-throwing. If `actorUserId` from JWT does not match a `User.id` row (e.g. stale token in dev after DB reseed), the FK violation is caught silently and the audit record is dropped. This does **not** affect the upload response or the redirect. No code change required — existing resilience is sufficient.

The FK constraints on `TdrSourceFile.uploadedById` and `TdrBatch.createdById` (inside the transaction) would fail with a 500 if the user doesn't exist, but since the upload succeeds and returns `batchId`, those constraints are passing correctly in the active dev environment.

---

## §8 — Governance

**#123 Protocol:** DISCUSS → DECIDE → EXECUTE → VERIFY → CLOSE → NEXT

- **DISCUSS:** 3 defects: type mismatch causing /undefined redirect, no period conflict guard
- **DECIDE:** Add `UploadResponse` type; fix return type; use `result.batchId`; parse TDR_V1 filename for conflict
- **EXECUTE:** 4 files, commit 6306b24, 190 insertions
- **VERIFY:** 168/168 Vitest, no new TS errors
- **CLOSE:** All 10 ACs pass
- **NEXT:** PM authorization required for next task; owner browser verification of upload flow (AC-19/AC-20 from TDR-STANDARDIZED-FILENAME-001 WDR) still pending
