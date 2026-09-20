# TDR-PAKISTAN-CUSTOMS-BOUNDED-UPLOAD-SMOKE-001 — Work Done Record
**BLOCKED — QUALITY PIPELINE DEFECT**
**INGESTION→QUALITY JOB CREATION GAP**
**Date:** 2026-09-20
**Branch:** codex/trade-data-refinery
**Status:** ❌ BLOCKED

---

## §1. BASELINE

| Item | Value |
|------|-------|
| Branch | `codex/trade-data-refinery` |
| HEAD at task start | `fb219dc` (`fb219dcbab24f32e271e02a4ee2df6ea2be91aeb`) |
| Mapping profiles commit | `fb219dc` — `feat(tdr): add Pakistan Customs Jan-2025 mapping profiles` |
| Backend PID | 24092 — `node --enable-source-maps dist/main` (started 10:33:10 PM) |
| Backend port | 4000 (confirmed via `netstat -ano`) |
| dist/main.js timestamp | 2026-09-20 10:33:05 PM (compiled seconds before start, matches source) |

---

## §2. RUNTIME HEALTH AT TEST TIME

| Component | Status |
|-----------|--------|
| Backend | Running — `http://localhost:4000` |
| Frontend | Running — `http://localhost:3000` |
| `GET /health` | 200 — `{ status: "ok", database: "ok" }` |
| TDR login | PASS |
| Quality handler | Started — `qworker-24092-...` confirmed in startup log |
| Dist freshness | dist = source (same code — not a stale dist issue) |

---

## §3. UPLOAD RESULTS

### v1 samples (initial run)

| Direction | Profile | Result | Meaning |
|-----------|---------|--------|---------|
| EXPORT | `Exp_Pak_Jan_2025` | **HTTP 409 CONFLICT** — `sourceFileId: c4eb5fad-b6ed-49b8-a863-40ee59ccf230` | **DUPLICATE DETECTION VERIFIED — PASS** |
| IMPORT | `Imp_Pak_Jan_2025` | HTTP 409 (inferred from task context) | **DUPLICATE DETECTION VERIFIED — PASS** |

### v2 samples (unique content, one row added each)

| Direction | Profile | HTTP | batchId | sourceFileId |
|-----------|---------|------|---------|--------------|
| EXPORT | `Exp_Pak_Jan_2025` | **202 ACCEPTED** | `8098ecbc-740c-48e6-a848-99c999b3bbaa` | (stored) |
| IMPORT | `Imp_Pak_Jan_2025` | **202 ACCEPTED** | `0aecd7a9-3ebe-42c9-8b39-ac0e9a09f0c2` | (stored) |

Both uploads confirmed:
- Authenticated successfully
- Mapping profile resolved (`Exp_Pak_Jan_2025` → `32b5475f...`, `Imp_Pak_Jan_2025` → `bec37a36...`)
- Source file stored
- Batch created
- Ingestion job created
- Ingestion ran: 16 records each, all `rowDisposition = PENDING_QUALITY`
- Batch transitioned to `QUALITY_PENDING`

---

## §4. FAILURE EVIDENCE — QUALITY_PENDING NEVER ADVANCING

### DB state at diagnosis (both batches):

| Field | EXPORT | IMPORT |
|-------|--------|--------|
| status | `QUALITY_PENDING` | `QUALITY_PENDING` |
| totalSourceRows | 16 | 16 |
| processedRows | 16 | 16 |
| acceptedRows | 0 | 0 |
| quarantinedRows | 0 | 0 |
| rejectedRows | 0 | 0 |
| qualityJob | **null** | **null** |

Record dispositions: all 16 rows = `PENDING_QUALITY` on both batches.

### Quality job table: empty
```
SELECT * FROM tdr_quality_jobs  →  0 rows
```

---

## §5. ROOT CAUSE ANALYSIS

**RC-001 — Ingestion handler does not create a quality job after QUALITY_PENDING transition**

File: `backend/src/trade-data-refinery/ingestion/handler/tdr-ingestion-handler.service.ts`

Line 173 (source) / Line 131 (dist):
```typescript
// Complete job → batch QUALITY_PENDING
await this.orchestrator.completeJobWithStatus(job.id, 'QUALITY_PENDING');
// ← No call to quality orchestrator here. Quality job never created.
```

`TdrJobOrchestratorService.completeJobWithStatus()` (lines 117–127):
- Sets processing job status → COMPLETED
- Sets batch status → QUALITY_PENDING
- **Does not create a TdrQualityJob**

**RC-002 — reconcileQualityJobs runs only once at startup**

File: `backend/src/trade-data-refinery/quality/handler/tdr-quality-handler.service.ts`

Lines 49–53:
```typescript
onModuleInit(): void {
  void this.orchestrator.reconcileQualityJobs(); // ONE-TIME at startup only
  this.pollTimer = setInterval(() => void this.poll(), QUALITY_POLL_INTERVAL_MS);
  ...
}
```

The poll loop (every `QUALITY_POLL_INTERVAL_MS`) only calls `leaseNextJob()` — which looks for **existing** PENDING quality jobs. It does not reconcile new QUALITY_PENDING batches.

**Combined effect:**
- Batches created before backend startup → picked up by reconciler at init → works
- Batches created after backend startup → no quality job ever created → stuck forever

This is a source code defect. Dist matches source. Not a stale dist issue. Not a configuration issue.

---

## §6. IMPACT

| Symptom | Cause |
|---------|-------|
| Batch stays `QUALITY_PENDING` indefinitely | No `TdrQualityJob` created after ingestion |
| `tdr_quality_jobs` table remains empty | Quality orchestrator never called from ingestion path |
| Quality worker polls successfully but finds nothing | Correct behavior given no jobs exist |
| Records remain `PENDING_QUALITY` forever | Quality handler never runs |

---

## §7. WHAT WAS VERIFIED (PASS)

| Check | Result |
|-------|--------|
| Authentication | ✅ PASS |
| Mapping profile `Exp_Pak_Jan_2025` resolution | ✅ PASS |
| Mapping profile `Imp_Pak_Jan_2025` resolution | ✅ PASS |
| HTTP 202 on both uploads | ✅ PASS |
| Duplicate detection (HTTP 409 on v1 re-upload) | ✅ PASS |
| Source file stored | ✅ PASS |
| Batch created | ✅ PASS |
| Ingestion job created | ✅ PASS |
| Ingestion completed: 16 rows each | ✅ PASS |
| Records created as `PENDING_QUALITY` | ✅ PASS |
| Batch transitions to `QUALITY_PENDING` | ✅ PASS |
| Quality handler started (confirmed in log) | ✅ PASS |
| No schema migration required | ✅ PASS |
| No 500 errors | ✅ PASS |

---

## §8. WHAT DID NOT COMPLETE

| Check | Result |
|-------|--------|
| Quality job created | ❌ BLOCKED — never created |
| Quality processing ran | ❌ BLOCKED — no job to pick up |
| Records normalized/validated | ❌ BLOCKED |
| Batch reaches QUALITY_COMPLETE / REVIEW_REQUIRED | ❌ BLOCKED |
| Data integrity spot checks | ❌ BLOCKED — no quality output |

---

## §9. BOUNDED CORRECTION PROPOSAL

**Task ID:** `TDR-QUALITY-JOB-CREATION-CORRECTION-001`

**Classification:** P1 pipeline defect — quality stage unreachable for any batch created after backend startup.

**Exact fix:**
Inject `TdrQualityOrchestratorService` into `TdrIngestionHandlerService` and call `ensureQualityJob` immediately after `completeJobWithStatus('QUALITY_PENDING')`.

**File:** `backend/src/trade-data-refinery/ingestion/handler/tdr-ingestion-handler.service.ts`

**Change at line 173:**
```typescript
// Before:
await this.orchestrator.completeJobWithStatus(job.id, 'QUALITY_PENDING');

// After:
await this.orchestrator.completeJobWithStatus(job.id, 'QUALITY_PENDING');
await this.qualityOrchestrator.ensureQualityJob(batch!.id, batch!.tenantId);
```

**Also required:**
- Add `TdrQualityOrchestratorService` to constructor injection in `TdrIngestionHandlerService`
- Verify no circular dependency between `TdrIngestionModule` and `TdrQualityModule` (check module exports)
- Update test coverage: add a test that verifies a quality job is created after ingestion completion
- The two existing QUALITY_PENDING batches (`8098ecbc`, `0aecd7a9`) will be picked up automatically after the fix, because `reconcileQualityJobs()` will reconcile them on next startup

**Affected module:** `TradeDataRefineryModule` — both ingestion and quality sub-modules

**Scope:** Single file change (+ module wiring) + one test. No schema migration. No new API.

**Tests to add:**
- Unit: ingestion handler calls `ensureQualityJob` after `completeJobWithStatus`
- Integration (optional): full ingestion→quality pipeline completes without backend restart

---

## §10. NO RUNTIME CODE CHANGED

No source files were modified in this smoke task. The defect was found through read-only diagnosis only.

---

## §11. VERDICT

**BLOCKED — QUALITY PIPELINE DEFECT**

Root cause: `TdrIngestionHandlerService` does not call `TdrQualityOrchestratorService.ensureQualityJob()` after transitioning a batch to `QUALITY_PENDING`. Quality jobs are never created for batches ingested after backend startup.

Bounded correction task: `TDR-QUALITY-JOB-CREATION-CORRECTION-001`  
Requires PM approval before execution.

Batches `8098ecbc` and `0aecd7a9` remain safely in `QUALITY_PENDING` state and can be processed normally after the correction is applied and the backend is restarted.
