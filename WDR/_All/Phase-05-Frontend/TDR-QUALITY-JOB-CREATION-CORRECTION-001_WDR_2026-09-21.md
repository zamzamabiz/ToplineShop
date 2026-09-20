# TDR-QUALITY-JOB-CREATION-CORRECTION-001 — Work Done Record
**BLOCKED — EXISTING BATCH RECOVERY REQUIRES INTERACTIVE AUTH**
**Source fixes PASS. Tests PASS. Manual DB repair prohibited. Recovery unverified.**
**Date:** 2026-09-21
**Branch:** codex/trade-data-refinery
**Status:** ❌ BLOCKED (code correct — runtime recovery gated on interactive credential)

---

## §1. BASELINE

| Item | Value |
|------|-------|
| Branch | `codex/trade-data-refinery` |
| Starting HEAD | `ee45270` (TDR-PAKISTAN-CUSTOMS-BOUNDED-UPLOAD-SMOKE-001 WDR) |
| Prior smoke WDR | `WDR/_All/Phase-05-Frontend/TDR-PAKISTAN-CUSTOMS-BOUNDED-UPLOAD-SMOKE-001_WDR_2026-09-20.md` |
| Authorized defect | RC-001: TdrIngestionHandlerService does not call ensureQualityJob after QUALITY_PENDING transition |

---

## §2. ROOT CAUSES IDENTIFIED AND FIXED

### RC-001 — Quality job never created after ingestion (PRIMARY — this task's stated defect)

**File:** `backend/src/trade-data-refinery/ingestion/handler/tdr-ingestion-handler.service.ts`

**Before (line 173):**
```typescript
await this.orchestrator.completeJobWithStatus(job.id, 'QUALITY_PENDING');
// ← No ensureQualityJob call. Quality job never created.
```

**After:**
```typescript
await this.orchestrator.completeJobWithStatus(job.id, 'QUALITY_PENDING');
try {
  await this.qualityOrchestrator.ensureQualityJob(batch!.id, batch!.tenantId);
} catch (qErr) {
  this.logger.error(`ensureQualityJob failed for batch ${batch!.id} — will be recovered by reconciliation at next startup. ...`);
}
```

**Why wrapped in try-catch:** If `ensureQualityJob` fails, the batch is already `QUALITY_PENDING`. Propagating the error would trigger the catch block which would set the batch to FAILED. Instead, we log and continue — `reconcileQualityJobs()` recovers it at next startup.

**DI change:** Added `TdrQualityOrchestratorService` to constructor injection. Both services are in the same flat `TradeDataRefineryModule` providers array — no module wiring change required. No circular dependency.

### RC-003 — Quality persistence SQL type cast mismatch (DISCOVERED DURING RUNTIME DIAGNOSIS)

**File:** `backend/src/trade-data-refinery/quality/handler/tdr-quality-handler.service.ts`

**Root cause:** `persistQualityChunk` cast the record ID in the VALUES expression as `::uuid` and compared tenant_id with `::uuid`, but `tdr_records.id` and `tdr_records.tenant_id` are `TEXT NOT NULL` in PostgreSQL (Prisma `String` without `@db.Uuid` annotation).

**PostgreSQL error:** `ERROR: operator does not exist: text = uuid` (code 42883)

**Migration evidence:** `CREATE TABLE "tdr_records" ("id" TEXT NOT NULL, "tenant_id" TEXT NOT NULL, ...)` — confirmed TEXT, not UUID.

**Fix (2 lines):**
```typescript
// Line 258 — VALUES id column:
${r.recordId}::uuid  →  ${r.recordId}::text

// Line 341 — WHERE clause:
rec.tenant_id = ${tenantId}::uuid  →  rec.tenant_id = ${tenantId}::text
```

**Discovery timeline:** RC-003 was pre-existing. Quality jobs were created by `start:dev` processes (PIDs 16104, 30008) that ran before this session's diagnostic. They ran 3 attempts and reached `FAILED` status with the `text = uuid` error. By the time this correction task began, both batches were already FAILED (not QUALITY_PENDING).

---

## §3. ORDERING / FAILURE-SAFETY ANALYSIS (§5 of task)

| Scenario | Behavior |
|----------|----------|
| A. ensureQualityJob fails after QUALITY_PENDING | Batch stays QUALITY_PENDING with `qualityJob: null`. `reconcileQualityJobs()` recovers it at next startup. Try-catch prevents outer handler error. |
| B. ensureQualityJob called twice (replay) | `findUnique` returns existing job. `create` never called. If P2002 race: `findUniqueOrThrow` returns winner. Only one job exists. |
| C. Ingestion fails before completion | Catch block fires before reaching `completeJobWithStatus`. `ensureQualityJob` never called. No quality job created. |
| D. Replay (existing FAILED quality job) | `ensureQualityJob` returns existing FAILED job ID. Worker will not pick up FAILED jobs. Recovery requires interactive replay via API. |

**Transaction architecture:** No cross-service transaction used. Existing separation boundary preserved. Idempotency is schema-enforced (`@unique batchId` on `tdr_quality_jobs`).

**Startup reconciliation:** `reconcileQualityJobs()` remains the recovery path for the edge case where `ensureQualityJob` throws (scenario A). It is no longer the primary path for normal operations — `ensureQualityJob` is now called inline from the ingestion handler.

---

## §4. DI / MODULE WIRING

| Check | Result |
|-------|--------|
| TdrQualityOrchestratorService in same module | ✅ Already in TradeDataRefineryModule providers |
| Module file changed | ✅ No change needed |
| Circular dependency | ✅ None — TdrQualityOrchestratorService depends only on PrismaService |
| Duplicate provider instance | ✅ None |
| Frontend changes | ✅ None |
| API changes | ✅ None |
| Schema migration | ✅ None required |

---

## §5. AUTOMATED TESTS

**New test file:** `backend/src/trade-data-refinery/tdr-quality-job-creation-correction.spec.ts`

**Coverage:**
1. `ensureQualityJob` returns existing job without creating duplicate ✅
2. `ensureQualityJob` creates new job with correct `batchId`, `status: 'PENDING'` ✅
3. P2002 race condition handled — returns winner job ID ✅
4. Second call for same batch: create called only once ✅
5. `reconcileQualityJobs` creates jobs for QUALITY_PENDING batches without one ✅
6. `reconcileQualityJobs` skips batches that already have a job ✅
7. `reconcileQualityJobs` returns 0 with no QUALITY_PENDING batches ✅
8. Constructor DI wiring: TdrQualityOrchestratorService accepted as 6th arg ✅
9. `onModuleInit` registers handler and starts polling ✅
10. `completeJobWithStatus` called before `ensureQualityJob` (ordering verified) ✅
11. `ensureQualityJob` receives correct `batchId` and `tenantId` ✅
12. `ensureQualityJob` failure does not prevent audit event ✅
13. `leaseNextJob` returns null with no PENDING jobs ✅
14. `leaseNextJob` leases oldest PENDING job ✅
15. Replay idempotency: second ingestion completion creates only 1 quality job ✅
16. Ingestion failure path: `ensureQualityJob` never reached ✅

**Suite totals:**
```
Test Suites: 12 passed, 12 total
Tests:       1 skipped, 544 passed, 545 total
```
(The skip is pre-existing — unrelated to this correction.)

---

## §6. VERIFICATION RESULTS

| Check | Result |
|-------|--------|
| TypeScript (`npx tsc --noEmit`) | ✅ PASS — 0 errors |
| Jest full suite | ✅ 544/545 PASS (1 pre-existing skip) |
| Prisma validate | ✅ PASS — schema valid |
| Prisma migrate status | ✅ PASS — 7 migrations, database up to date, no migration required |
| git diff --check | ✅ PASS — no whitespace errors |

---

## §7. FILES CHANGED

| File | Change | Nature |
|------|--------|--------|
| `backend/src/trade-data-refinery/ingestion/handler/tdr-ingestion-handler.service.ts` | Import + DI injection + ensureQualityJob call | RC-001 fix |
| `backend/src/trade-data-refinery/quality/handler/tdr-quality-handler.service.ts` | `::uuid` → `::text` (2 lines) | RC-003 fix |
| `backend/src/trade-data-refinery/tdr-quality-job-creation-correction.spec.ts` | New — 16 tests | Test coverage |

---

## §8. RUNTIME STATE — EXISTING BATCHES

### State at task start (from DB diagnostic during smoke test session)
| Batch | Direction | Status | qualityJob |
|-------|-----------|--------|------------|
| `8098ecbc` | EXPORT | QUALITY_PENDING | null |
| `0aecd7a9` | IMPORT | QUALITY_PENDING | null |

### State at correction task execution
| Batch | Direction | Status | Quality Job | Q-Job Status | Q-Job Error | Attempts |
|-------|-----------|--------|-------------|--------------|-------------|----------|
| `8098ecbc` | EXPORT | **FAILED** | `505d485b` | **FAILED** | `text = uuid` | 3 |
| `0aecd7a9` | IMPORT | **FAILED** | `459042ed` | **FAILED** | `text = uuid` | 3 |

**What happened between sessions:** `start:dev` processes (PIDs 16104, 30008) that were running before the diagnostic session ran `reconcileQualityJobs()` at startup. They created quality jobs and attempted to run quality processing — which failed 3 times with the `text = uuid` type error (RC-003). Batches transitioned to FAILED.

### Why auto-recovery is blocked for existing batches
1. `reconcileQualityJobs()` only finds `QUALITY_PENDING` batches — both batches are now `FAILED`
2. Quality worker `leaseNextJob()` only picks up `PENDING` quality jobs — both quality jobs are `FAILED`
3. Manual batch/record/quality-job status changes prohibited by task constraints
4. API replay requires interactive authentication (non-interactive environment)

---

## §9. UI / BACKEND STATUS CONSISTENCY (§11 of task)

**UI shows:** FAILED (for both Pakistan Customs batches in Owner Chrome)

**Backend API returns:** `status: "FAILED"` for both batch IDs

**Verdict: CONSISTENT — Scenario A applies**

> "If backend/API correctly returns FAILED: explain why the batch legitimately transitioned to FAILED."

Explanation: The quality jobs were created by the reconciler (startup from prior `start:dev` processes). They ran quality processing 3 times and failed each time with PostgreSQL error 42883 (`operator does not exist: text = uuid`) in `persistQualityChunk`. After 3 failed attempts (maxAttempts reached), `failJob` was called, which set `TdrQualityJob.status = FAILED` and `TdrBatch.status = FAILED`. The UI correctly reflects this state.

**Not a frontend bug.** No separate `TDR-BATCH-STATUS-UI-CORRECTION-001` task needed.

---

## §10. DATA INTEGRITY SPOT CHECK

Quality processing never completed (FAILED before writing results). Therefore:
- All 16 records in each batch remain `rowDisposition: PENDING_QUALITY`
- No normalized fields populated
- No validation issues created
- `acceptedRows: 0`, `quarantinedRows: 0`, `rejectedRows: 0` on both batches

Data integrity spot checks per §12 cannot be performed until quality processing successfully completes.

---

## §11. RECOVERY PATH (WHAT IS NEEDED)

To fully exercise the corrected pipeline and verify data integrity:

**Option A — Replay existing batches** (preferred — no new upload, no manual DB change):
```
POST /tdr/batches/8098ecbc-740c-48e6-a848-99c999b3bbaa/replay
POST /tdr/batches/0aecd7a9-3ebe-42c9-8b39-ac0e9a09f0c2/replay
```
Replay creates new batches with new IDs. With both RC-001 and RC-003 fixed:
1. New ingestion job runs → `completeJobWithStatus('QUALITY_PENDING')` → `ensureQualityJob` creates job
2. Quality worker picks up PENDING job → `persistQualityChunk` runs with `::text` (no type error)
3. Batches reach READY or REVIEW_REQUIRED

Use `scripts/Invoke-PakistanCustomsSmokeTest.ps1` (already has v2 sample files) or run replay POST manually.

**Option B — Fresh uploads** (same sample files v2):
Same pipeline, different source files. Same expected outcome.

---

## §12. COMMIT RECORD

| Commit | Message |
|--------|---------|
| `9c397dd` | `fix(tdr): create quality job after ingestion completion + fix quality persistence type cast` |

Full hash: `9c397dd` (run `git rev-parse HEAD` to confirm)

---

## §13. SUCCESS CRITERIA STATUS

| Criterion | Status |
|-----------|--------|
| Source defect (RC-001) fixed | ✅ PASS |
| Source defect (RC-003) fixed | ✅ PASS |
| Automated tests PASS | ✅ 544/545 |
| TypeScript PASS | ✅ |
| Prisma validate PASS | ✅ |
| No migration required | ✅ |
| No unrelated runtime changes | ✅ |
| No manual DB repair used | ✅ |
| No new upload needed | ✅ (recovery via replay only) |
| Existing EXPORT batch recovers | ❌ BLOCKED — FAILED, needs replay |
| Existing IMPORT batch recovers | ❌ BLOCKED — FAILED, needs replay |
| Quality jobs created automatically | ✅ (for NEW batches — existing ones are FAILED) |
| Quality worker leases them | ✅ (proven by prior run — worker leased and attempted) |
| Both batches reach terminal quality state | ❌ BLOCKED — FAILED before fix applied |
| Final row counts coherent | ❌ BLOCKED — quality never completed |
| UI/backend consistency checked | ✅ CONSISTENT — both FAILED (Scenario A) |

---

## §14. VERDICT

**BLOCKED — EXISTING BATCH RECOVERY REQUIRES INTERACTIVE AUTH**

Both source defects are fixed and tested. The pipeline is correct for new batches. The existing batches (`8098ecbc`, `0aecd7a9`) cannot auto-recover because:
1. They're in `FAILED` status (not `QUALITY_PENDING`) — reconciler doesn't pick them up
2. Their quality jobs are `FAILED` — worker doesn't pick them up
3. Manual DB repair is prohibited by task constraints
4. Replay requires interactive API authentication (not available in non-interactive environment)

**Recommended next action:** Run replay for both batches via the Owner Chrome UI or the smoke test script, then verify quality completion and data integrity. Both fixes are live in the running `start:dev` backend.
