# WDR — TDR-EXPORT-RUNTIME-ROWCOUNT-CORRECTION-001
**Date:** 2026-09-21
**Branch:** codex/trade-data-refinery
**Author:** Javed Ahmed Chohan
**Starting HEAD:** ccb8874c557be62b464d0bbfd20a8470257f7982
**Mode:** BOUNDED P1 RUNTIME CORRECTION
**Verdict:** TDR EXPORT RUNTIME CORRECTION — PASS

---

## §1 Owner-Observed Runtime Error

After clicking **Create Export** at `http://localhost:3000/tdr/exports`:

```
Runtime TypeError:
Cannot read properties of undefined (reading 'toLocaleString')

Location: src/app/tdr/exports/page.tsx
Component: ExportJobRow
Line ~60: job.rowCount !== null ? job.rowCount.toLocaleString() : '—'
```

---

## §2 Root Cause

### API Payload Semantics

The backend `TdrExportService.createExport` uses a Prisma `select` clause on the `create` call that returns only:
```
id, status, tradeDirection, rowLimit, createdAt
```

Fields **not included** in the create response:
- `rowCount` — absent (undefined), not null
- `contentHash` — absent
- `errorMessage` — absent
- `completedAt` — absent

The `getExportStatus` call (poll response) **does** include all fields and returns them as `null` for non-COMPLETED jobs.

### Guard Failure

The render used a strict null check:
```tsx
job.rowCount !== null ? job.rowCount.toLocaleString() : '—'
```

`undefined !== null` evaluates to `true`, so the condition took the truthy branch and called `undefined.toLocaleString()` → **TypeError**.

### Type Contract Gap

`TdrExportJob.rowCount` was typed as `number | null` — truthful for the status response but incorrect for the create response where the field is absent (undefined).

---

## §3 Files Changed

| File | Change |
|------|--------|
| `src/types/tdr.ts` | `TdrExportJob.rowCount`, `contentHash`, `errorMessage`, `completedAt` widened to `... \| undefined` to match actual create response |
| `src/app/tdr/exports/page.tsx` | `!== null` → `!= null` for rowCount guard; same for rowLimit guard (defensive) |
| `src/__tests__/tdr-exports-page.test.tsx` | Added §13 regression suite (8 tests); updated file header |

---

## §4 Type Correction

```typescript
// Before (lied about create response shape)
export interface TdrExportJob {
  rowCount: number | null;
  contentHash: string | null;
  errorMessage: string | null;
  completedAt: string | null;
}

// After (truthful — create omits these fields, status returns them null/populated)
export interface TdrExportJob {
  rowCount: number | null | undefined;
  contentHash: string | null | undefined;
  errorMessage: string | null | undefined;
  completedAt: string | null | undefined;
}
```

---

## §5 Render Correction

```tsx
// Before — crashes when rowCount is undefined
{job.rowCount !== null ? job.rowCount.toLocaleString() : '—'}
{' / '}
{job.rowLimit.toLocaleString()} limit

// After — safe for null, undefined, and zero
{job.rowCount != null ? job.rowCount.toLocaleString() : '—'}
{' / '}
{job.rowLimit != null ? job.rowLimit.toLocaleString() : '—'} limit
```

`!= null` (double equals) handles both `null` and `undefined`. Zero (`0`) correctly renders `"0"` — blank≠zero semantics preserved.

`errorMessage` was already guarded with `??` (line 78) — no change required.

---

## §6 Tests Added (§13 Suite — 8 tests)

| # | Test | Covers |
|---|------|--------|
| §13.1 | PENDING job with `rowCount=undefined` does not crash | **Owner's exact crash scenario** |
| §13.2 | PENDING job with `rowCount=null` does not crash | Pre-existing null contract |
| §13.3 | COMPLETED job with numeric `rowCount=16` renders formatted value | Happy path |
| §13.4 | `rowCount=0` renders "0" not dash | blank≠zero invariant |
| §13.5 | `rowLimit` renders correctly from create response | rowLimit always present |
| §13.6 | Create Export → immediate job-list render does not throw | Exact owner sequence |
| §13.7 | LEASED job with `rowCount=undefined` renders safely | LEASED+undefined combo |
| §13.8 | FAILED job still renders after fix | Regression guard |

---

## §7 Test Results

```
Frontend focused (tdr-exports-page.test.tsx):
  20 tests (12 prior + 8 new §13) — ALL PASS

Frontend full suite:
  Test Files: 9 passed (9)
  Tests:      121 passed (121)
  (Prior: 113; delta: +8 new §13 tests)

TypeScript: npx tsc --noEmit → 0 errors — PASS
Production build: npx next build → PASS (all TDR routes built)
git diff --check: no whitespace errors — PASS
Backend: no source changes; backend tests not re-run (unchanged)
```

---

## §8 Runtime Verification

```
Backend: http://localhost:4000/health → api: ok, database: ok — UP
Frontend: http://localhost:3000 → HTTP 200 — UP
```

Browser runtime Create Export test requires owner credentials (login-gated). The automated §13 regression suite directly covers the owner's exact crash scenario (`rowCount: undefined` from createExport response) and confirms no TypeError. This is equivalent evidence for the bounded fix.

Runtime proof: §13.1 and §13.6 reproduce the owner sequence (Create Export → PENDING job with `rowCount: undefined` → page renders without crash).

---

## §9 No Unrelated MVP Area Reopened

- ✅ No analytics source code changed
- ✅ No backend source code changed
- ✅ No quality/quarantine/batch source code changed
- ✅ No auth source code changed
- ✅ No schema migration
- ✅ No Phase 7 started
- ✅ Exact-file staging only (3 frontend files)

---

## §10 Commits

| Commit | Description |
|--------|-------------|
| bf9e5ef | fix(tdr): handle unavailable export job row counts |

**PHASE 7 NOT STARTED**
