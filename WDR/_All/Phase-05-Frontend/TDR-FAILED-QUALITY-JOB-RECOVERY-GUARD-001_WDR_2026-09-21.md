# TDR-FAILED-QUALITY-JOB-RECOVERY-GUARD-001 — Work Done Record
**FAILED QUALITY JOB RECOVERY GUARD — PASS**
**Date:** 2026-09-21
**Branch:** codex/trade-data-refinery
**Status:** ✅ PASS

---

## §1. BASELINE

| Item | Value |
|------|-------|
| Branch | `codex/trade-data-refinery` |
| Starting HEAD | `1fcbd55` (TDR-QUALITY-JOB-CREATION-CORRECTION-001 WDR — PASS) |
| Full hashes | `1fcbd55eb8416867faa40a2f31f8ceb188b7cc3a`, `e1a0c79b78f5e3c1da52c22c465949d73a3b2372`, `9c397ddc9463993447eb3f3a80c3dcc1fc202049` |
| Audit target | `e1a0c79` — RC-004 fix that added `withFailedJob` to `reconcileQualityJobs` |
| Existing recovery results | EXPORT `8098ecbc` READY 16 accepted / 0 quarantined. IMPORT `0aecd7a9` REVIEW_REQUIRED 15 accepted / 1 quarantined. |

---

## §2. AUDIT FINDINGS

### RC-004 Behavior Audit

**`ensureQualityJob` (lines 16–62):**
- If existing job status is `FAILED`: updates to PENDING, clears all lease/error fields, resets `attemptCount: 0`, returns ID
- If existing job status is anything else (PENDING, LEASED, COMPLETED): returns ID unchanged
- If no existing job: creates new PENDING job (P2002-race-safe)

**`reconcileQualityJobs` as shipped in `e1a0c79` (now hardened):**
- Category 1 — `withoutJob`: `QUALITY_PENDING` batches with `qualityJob: null`
- Category 2 — `withFailedJob`: batches with `qualityJob.status = FAILED` AND `records.some.rowDisposition = PENDING_QUALITY`
- For each batch in both categories: called `ensureQualityJob`, which resets FAILED→PENDING

---

## §3. INFINITE RETRY ASSESSMENT

### Is the loop possible?

**YES — was confirmed possible with `e1a0c79`.**

**Proof of loop:**

| Step | Action | State |
|------|--------|-------|
| 1 | Quality job fails (any reason) | `TdrQualityJob.status = FAILED`, `TdrBatch.status = FAILED` |
| 2 | `failJob()` called | `TdrRecord.rowDisposition` unchanged — remains `PENDING_QUALITY` |
| 3 | Backend restarts | `reconcileQualityJobs()` fires at `onModuleInit` |
| 4 | `withFailedJob` query matches | `qualityJob.status = FAILED` AND `records.some.rowDisposition = PENDING_QUALITY` — both TRUE |
| 5 | `ensureQualityJob` called | Resets FAILED job to PENDING, `attemptCount: 0` |
| 6 | Worker leases | Attempts quality processing |
| 7 | Same error recurs | `failJob()` called again |
| 8 | Go to step 2 | Infinite loop on every restart |

**Why `failJob()` doesn't clear `PENDING_QUALITY`:**
`failJob()` only updates `TdrQualityJob` (status, error fields) and `TdrBatch` (status). It does NOT update any `TdrRecord.rowDisposition`. Records remain `PENDING_QUALITY` forever after any failure unless quality processing actually completes a chunk write.

**Permanently failed conditions that trigger the loop:**

| Error Code | Cause | Recoverable by fix? |
|-----------|-------|---------------------|
| `UNSUPPORTED_NORMALIZATION_VERSION` | Schema version mismatch | No — permanent without handler upgrade |
| `UNSUPPORTED_VALIDATION_VERSION` | Schema version mismatch | No |
| `MAPPING_NOT_FOUND` | Missing mapping record | Conditional — only if mapping restored |
| `MAPPING_IDENTITY_UNRESOLVABLE` | Null mappingId on batch | No |
| `BATCH_NOT_FOUND` | Batch deleted | No |
| Any transient infra error that exhausted maxAttempts | Network/DB error | Possibly — but should require explicit decision |

**Conclusion:** The `withFailedJob` reconciler category was correct for the one-time RC-003 recovery but is unsafe as a permanent startup routine.

---

## §4. MAXATTEMPTS SEMANTICS ANALYSIS

**`maxAttempts` default: 3** (Prisma schema, `tdr_quality_jobs.max_attempts INT DEFAULT 3`)

**With `e1a0c79`'s `withFailedJob`:**
- Job exhausts maxAttempts → `failJob` called → `attemptCount = 3`
- On restart: `ensureQualityJob` resets `attemptCount: 0`
- Job leases → `attemptCount` increments to 1 → fails → max attempts = 1 < 3 → retryJob
- Eventually exhausts again → `failJob` → `attemptCount = 3` again
- On next restart: loop continues

**`maxAttempts` was effectively bypassed** by the reconciler's unconditional reset.

---

## §5. FIX APPLIED

**Approach chosen:** Remove `withFailedJob` from `reconcileQualityJobs`.

This is the smallest safe fix:
- No schema migration required
- No new enums or flags
- No changes to `failJob`, `retryJob`, or `leaseNextJob`
- FAILED→PENDING reset in `ensureQualityJob` is retained for the explicit replay API path
- The startup reconciler reverts to its original, safe behavior (category 1 only)

**Recovery path for FAILED batches:** Use the `POST /tdr/batches/:id/replay` API endpoint. Replay creates a new batch with a new ID. The new batch goes through ingestion → `ensureQualityJob` creates a fresh quality job → quality processing runs on the corrected pipeline.

**File changed:** `backend/src/trade-data-refinery/quality/orchestrator/tdr-quality-orchestrator.service.ts`

**Before (e1a0c79):**
```typescript
async reconcileQualityJobs(): Promise<number> {
  const withoutJob = await this.prisma.tdrBatch.findMany({
    where: { status: 'QUALITY_PENDING', qualityJob: null },
    select: { id: true, tenantId: true },
  });

  const withFailedJob = await this.prisma.tdrBatch.findMany({
    where: {
      qualityJob: { status: 'FAILED' },
      records: { some: { rowDisposition: 'PENDING_QUALITY' } },
    },
    select: { id: true, tenantId: true },
  });

  const allStranded = [...withoutJob, ...withFailedJob];
  // ...
```

**After (a3a6fa6):**
```typescript
async reconcileQualityJobs(): Promise<number> {
  const withoutJob = await this.prisma.tdrBatch.findMany({
    where: { status: 'QUALITY_PENDING', qualityJob: null },
    select: { id: true, tenantId: true },
  });
  // FAILED batches require explicit replay — removed withFailedJob to prevent infinite loop
  // ...
```

---

## §6. TESTS

**File:** `backend/src/trade-data-refinery/tdr-quality-job-creation-correction.spec.ts`

### New safety tests added

| Test | Guards |
|------|--------|
| `reconcile does NOT reset FAILED jobs on startup` | Reconciler calls 0 updates when no QUALITY_PENDING batches |
| `does not resurrect a FAILED job that exhausted maxAttempts` | Exhausted FAILED job stays FAILED — reconciler query finds 0 batches |
| `reconcile called N times for same FAILED state returns 0 each time — no infinite loop` | Idempotent: 3 consecutive reconcile calls all return 0 for FAILED state |

### Removed (now wrong behavior)

| Removed Test | Reason |
|-------------|--------|
| `resets FAILED quality jobs to PENDING for batches with PENDING_QUALITY records` | This behavior was the defect being fixed |
| `handles both QUALITY_PENDING and FAILED stranded batches in one reconcile pass` | Same |

### Retained critical tests

| Test | Verifies |
|------|---------|
| `ensureQualityJob resets FAILED job to PENDING` | Explicit recovery path (for replay/API calls) still works |
| `ensureQualityJob does NOT reset COMPLETED job` | COMPLETED jobs are never disturbed |
| `ensureQualityJob returns existing PENDING job without creating duplicate` | Idempotency for normal path |
| `creates quality jobs for QUALITY_PENDING batches without a job` | Core reconcile case still works |
| `skips QUALITY_PENDING batches that already have a PENDING quality job` | No duplicate jobs |
| `returns 0 when no QUALITY_PENDING batches exist` | Clean-state reconcile |
| All 12 ingestion handler tests | Ordering, DI wiring, try-catch behavior unchanged |

**Suite totals:**
```
Test Suites: 12 passed, 12 total
Tests:       1 skipped, 549 passed, 550 total
```
(21 correction spec tests, 1 pre-existing skip unrelated to this task)

---

## §7. VERIFICATION RESULTS

| Check | Result |
|-------|--------|
| TypeScript (`npx tsc --noEmit`) | ✅ PASS — 0 errors |
| Jest full suite | ✅ 549/550 PASS (1 pre-existing skip) |
| Prisma validate | ✅ PASS — schema valid |
| Prisma migrate status | ✅ PASS — 7 migrations, database up to date |
| git diff --check | ✅ PASS — no whitespace errors (CRLF warnings are expected on Windows) |
| Schema migration added | ✅ None required or added |

---

## §8. RUNTIME CHECK

**Backend watch-mode auto-recompiled** with the hardened reconciler when `tdr-quality-orchestrator.service.ts` was saved.

**Pakistan Customs batch states after restart (verified via Prisma query):**

| Batch | Direction | Status | Q-Job Status | attemptCount |
|-------|-----------|--------|--------------|--------------|
| `8098ecbc` | EXPORT | **READY** | **COMPLETED** | 1 |
| `0aecd7a9` | IMPORT | **REVIEW_REQUIRED** | **COMPLETED** | 1 |

**All quality jobs:** 4 COMPLETED — no FAILED jobs, no unexpected PENDING transitions. No completed job was reprocessed. No terminal FAILED job was resurrected. No duplicate jobs created.

---

## §9. FILES CHANGED

| File | Change | Commit |
|------|--------|--------|
| `backend/src/trade-data-refinery/quality/orchestrator/tdr-quality-orchestrator.service.ts` | Removed `withFailedJob` query and merge from `reconcileQualityJobs`; updated JSDoc | `a3a6fa6` |
| `backend/src/trade-data-refinery/tdr-quality-job-creation-correction.spec.ts` | Replaced stale two-findMany reconcile tests with safety-hardened tests (21 total) | `a3a6fa6` |

---

## §10. POLICY STATEMENT

| Policy | Implementation |
|--------|---------------|
| FAILED quality jobs are terminal by default | `reconcileQualityJobs` no longer touches FAILED batches |
| `maxAttempts` semantics are preserved | Exhausted FAILED job stays FAILED across restarts |
| Explicit recovery is possible | `ensureQualityJob` resets FAILED→PENDING when called explicitly (replay API path) |
| Startup reconciler scope | QUALITY_PENDING batches with no job only |
| Infinite retry loop | Eliminated by removing `withFailedJob` from startup reconciler |

---

## §11. COMMIT RECORD

| Commit | Message |
|--------|---------|
| `a3a6fa6` | `fix(tdr): guard failed quality job recovery — remove withFailedJob from reconciler` |

---

## §12. SUCCESS CRITERIA STATUS

| Criterion | Status |
|-----------|--------|
| Infinite retry loop identified | ✅ Confirmed via code analysis |
| Infinite retry loop eliminated | ✅ PASS |
| maxAttempts remains terminal | ✅ PASS |
| Restart cannot resurrect arbitrary FAILED jobs | ✅ PASS |
| PENDING quality job remains untouched | ✅ PASS |
| COMPLETED quality job remains untouched | ✅ PASS |
| QUALITY_PENDING batch with no job still gets a job | ✅ PASS |
| ensureQualityJob explicit recovery still works | ✅ PASS (retained in ensureQualityJob) |
| No schema migration | ✅ PASS |
| TypeScript PASS | ✅ PASS |
| Jest suite PASS | ✅ 549/550 (1 pre-existing skip) |
| Pakistan Customs batches unchanged | ✅ READY / REVIEW_REQUIRED — unchanged |
| No completed job reprocessed | ✅ PASS |

---

## §13. VERDICT

**✅ FAILED QUALITY JOB RECOVERY GUARD — PASS**

Code changed: YES — `reconcileQualityJobs` hardened, stale tests replaced with safety-hardened tests.
Commit: `a3a6fa6`
Test totals: 549/550 (21 correction spec tests, 1 pre-existing skip)
maxAttempts terminal: YES — exhausted FAILED jobs stay FAILED across restarts
Restart resurrects arbitrary FAILED jobs: NO — guard eliminates this
Pakistan Customs batches after restart: `8098ecbc` READY, `0aecd7a9` REVIEW_REQUIRED — unchanged
WDR path: `WDR/_All/Phase-05-Frontend/TDR-FAILED-QUALITY-JOB-RECOVERY-GUARD-001_WDR_2026-09-21.md`
Next safe task: PM decision required per `projectRegistry.ts`. STOP.
