# WDR — TDR-MVP-BACKEND-CORE-001 (Mega 2)

## Task ID
TDR-MVP-BACKEND-CORE-001 — MEGA 2: NestJS Backend Core + Tenant Module Control + RBAC + Batch/Job APIs + Processing Orchestration

## Status
**PASS — READY FOR TDR-MVP-INGESTION-ENGINE-001**

## Repository
`E:\ToplineShop`

## Branch
`codex/trade-data-refinery`

## HEAD State

| | Hash |
|---|---|
| Starting HEAD | `40549d28a3a5ecb72ce0f5d1640b6261789ac899` |
| Final HEAD (after commit) | `8058410acb13d68d01a1c6ddeac36d107aa85679` |

Starting HEAD subject: `chore(gov): TDR-MVP-DATA-FOUNDATION-001-CHECKPOINT-001 Mega 1 WDR correction` ✅

## Prompt Archive

- Path: `C:\Users\zamza\.codex\.chatgpt-projects\g-p-6a9e924a10b08191adbabbcd6d6b0f6\ERP64-STRATEGY-2026-09-16\PROMPTS\Trade-Data-Refinery\TDR-MVP-BACKEND-CORE-001_PROMPT_2026-09-19_03-24.md`

## Ancestry Guard

`git log --oneline | grep ace7f35` confirms Mega 1 commit `ace7f35662cf2f8e3b2cf589be36a336527e260e` is in ancestry ✅

## Checks Executed

| Check | Result |
|---|---|
| Branch guard | PASS — `codex/trade-data-refinery` confirmed |
| Mega 1 in ancestry | PASS — `ace7f35662cf2f8e3b2cf589be36a336527e260e` confirmed |
| `npx tsc --noEmit` | PASS — exit code 0, 0 errors |
| `npx jest --forceExit` | **180/180 PASS** (142 prior + 38 new Mega 2 unit tests) |
| Secrets in committed files | NONE |
| DATABASE_URL in any artifact | NO |
| backend/.env staged | NO — gitignored |
| No schema/migration changes | CONFIRMED |
| No new packages installed | CONFIRMED |

## Files Changed (16 files)

### New files (14)
| File | Type |
|---|---|
| `backend/src/trade-data-refinery/config/processing-version.config.ts` | A |
| `backend/src/trade-data-refinery/utils/fingerprint.util.ts` | A |
| `backend/src/trade-data-refinery/types/batch-transition.ts` | A |
| `backend/src/trade-data-refinery/types/tdr-job-handler.interface.ts` | A |
| `backend/src/trade-data-refinery/guards/tenant-module.guard.ts` | A |
| `backend/src/trade-data-refinery/services/tenant-module.service.ts` | A |
| `backend/src/trade-data-refinery/services/tdr-job-orchestrator.service.ts` | A |
| `backend/src/trade-data-refinery/services/tdr-processor.service.ts` | A |
| `backend/src/trade-data-refinery/services/tdr.service.ts` | A |
| `backend/src/trade-data-refinery/dto/list-batches.dto.ts` | A |
| `backend/src/trade-data-refinery/dto/replay-batch.dto.ts` | A |
| `backend/src/trade-data-refinery/tdr.controller.ts` | A |
| `backend/src/trade-data-refinery/trade-data-refinery.module.ts` | A |
| `backend/src/trade-data-refinery/tdr-mega2-unit.spec.ts` | A |

### Modified files (2)
| File | Change |
|---|---|
| `backend/src/app.module.ts` | M — TradeDataRefineryModule imported and registered |
| `WDR/_All/Trade-Data-Refinery/TDR-MVP-DATA-FOUNDATION-001-CHECKPOINT-001_WDR_2026-09-19_03-20.md` | M — post-commit HEAD fill-in (final HEAD `40549d28...`) committed here |

## Architecture Decisions

### TenantModuleGuard Placement
- Applied at controller class level: `@UseGuards(TenantModuleGuard)` on `TdrController`
- NOT a global APP_GUARD (only applies to TDR endpoints)
- Execution order: JwtAuthGuard (#1, APP_GUARD) → RolesGuard (#2, APP_GUARD) → TenantModuleGuard (#3, controller)
- Checks `request.user.tenantId` (throws 401 if missing) then module enablement (throws 403 if disabled)

### RolesGuard Early-Return Design Note
`RolesGuard` returns `true` immediately when no `@Roles()` decorator is present (read endpoints). This means `@RequiresTenantContext()` at class level is not checked for read endpoints. Decision: removed `@RequiresTenantContext()` from controller class — `TenantModuleGuard` already enforces `tenantId` for all endpoints. This is correct and non-redundant.

### FOR UPDATE SKIP LOCKED
- Implemented in `TdrJobOrchestratorService.leaseNextJob()` via `prisma.$transaction(async tx => tx.$queryRaw\`...\`)`
- Query uses `'PENDING'::"JobStatus"` cast — hardcoded enum value (not user input), safe from injection
- Template literal parameter `${now}` is parameterized correctly
- Returns snake_case columns from DB (`batch_id`, `tenant_id`, `lease_duration_ms`) — mapped in service

### TdrProcessorService Poll Loop
- Uses `setInterval` + `OnModuleDestroy` cleanup (no `@nestjs/schedule` dependency)
- `startPolling()` is NOT called on `onModuleInit` — explicit call only (Mega 3 scope decision)
- Double-start protected: if `pollTimer` already set, returns immediately

### Replay Design
- Explicit replay bypasses duplicate fingerprint check (same fingerprint OK by design)
- New batch copies versions from original batch (static in Mega 2; dynamic resolution in Mega 3)
- `parserVersion`, `normalizationVersion`, `validationVersion` come from `TDR_PROCESSING_VERSIONS` constants
- `mappingVersion` copied from original batch

### NOT_IMPLEMENTED Sentinel
- `TdrJobHandler.interface.ts` exports `NOT_IMPLEMENTED = Symbol('NOT_IMPLEMENTED')`
- `TdrProcessorService.poll()`: if handler === NOT_IMPLEMENTED → calls `releaseLease(job.id)` (no job failure)
- This prevents leased jobs from sitting orphaned when no ingestion engine is registered yet

## Deliverable Checklist

| Deliverable | Status |
|---|---|
| TradeDataRefineryModule | ✅ |
| TenantModuleGuard (controller-scoped) | ✅ |
| TenantModuleService | ✅ |
| processing-version.config.ts | ✅ |
| fingerprint.util.ts (SHA-256 via Node crypto) | ✅ |
| batch-transition.ts (transition map + CANCELLABLE/REPLAYABLE) | ✅ |
| tdr-job-handler.interface.ts (NOT_IMPLEMENTED sentinel) | ✅ |
| TdrJobOrchestratorService (lease/heartbeat/checkpoint/complete/fail/release/reclaim) | ✅ |
| TdrProcessorService (poll loop, no auto-start) | ✅ |
| TdrService (6 handlers) | ✅ |
| ListBatchesDto (class-validator, page/pageSize/status/tradeDirection) | ✅ |
| ReplayBatchDto (reason optional, maxLength 500) | ✅ |
| TdrController (6 endpoints) | ✅ |
| RBAC: cancel/replay = SUPER_ADMIN + TENANT_ADMIN + IMPORT_MANAGER | ✅ |
| RBAC: read endpoints — no @Roles, all authenticated tenanted users | ✅ |
| Audit events: tdr.batch.cancelled, tdr.batch.replayed | ✅ |
| Pagination: page/pageSize default 1/25, max 100 | ✅ |
| Tenant isolation: findFirst({where:{id, tenantId}}) on all lookups | ✅ |
| AppModule registration | ✅ |
| 38+ unit tests | ✅ (38 tests) |
| TypeScript 0 errors | ✅ |
| 180/180 total tests | ✅ |

## Endpoints Implemented

| Method | Path | RBAC | Guard |
|---|---|---|---|
| GET | /tdr/status | all authenticated (TenantModuleGuard) | TenantModuleGuard |
| GET | /tdr/batches | all authenticated | TenantModuleGuard |
| GET | /tdr/batches/:id | all authenticated | TenantModuleGuard |
| GET | /tdr/batches/:id/progress | all authenticated | TenantModuleGuard |
| POST | /tdr/batches/:id/cancel | SUPER_ADMIN, TENANT_ADMIN, IMPORT_MANAGER | RolesGuard + TenantModuleGuard |
| POST | /tdr/batches/:id/replay | SUPER_ADMIN, TENANT_ADMIN, IMPORT_MANAGER | RolesGuard + TenantModuleGuard |

## Test Results

```
Test Suites: 6 passed, 6 total
Tests:       180 passed, 180 total
Time:        9.9 s
```

### Mega 2 Unit Test Coverage (38 assertions)
| Group | Tests | Coverage |
|---|---|---|
| fingerprint utility | 1–4 | determinism, 64-char hex, tenantId diff, version diff |
| batch transitions | 5–11 | valid/invalid transitions, terminal states, CANCELLABLE_STATUSES, REPLAYABLE_STATUSES |
| TenantModuleGuard | 12–16 | missing user, missing tenantId, disabled module, enabled module, null record |
| TdrJobOrchestratorService | 17–24 | lease no-job, lease found, heartbeat, completeJob, failJob, releaseLease, reclaimExpiredLeases, checkpoint |
| TdrProcessorService | 25–29 | startPolling, double-start protection, stopPolling, NOT_IMPLEMENTED default, registerHandler |
| TdrService | 30–38 | getStatus, listBatches pagination, getBatch 404, getBatch tenant isolation, cancelBatch terminal status, cancelBatch success, replayBatch 404, replayBatch wrong status, replayBatch creates batch+job+audit |

## TypeScript Check

```
npx tsc --noEmit → exit code 0 (0 errors)
```

## NOT in Scope (confirmed not started)

| Item | Status |
|---|---|
| File upload / Multer | NOT STARTED |
| CSV/XLSX parsing | NOT STARTED |
| Row ingestion engine | NOT STARTED |
| Mapping/normalization/validation | NOT STARTED |
| Frontend TDR pages | NOT STARTED |
| Redis/BullMQ | NOT STARTED |
| TDR-MVP-INGESTION-ENGINE-001 | NOT STARTED — requires PM authorization |

## Safety Boundaries

| Boundary | Status |
|---|---|
| `git add .` / `-A` / `--all` | NOT USED — 16 exact files staged individually |
| `prisma migrate reset` | NOT EXECUTED |
| Schema/migration changes | NONE |
| DATABASE_URL in any output | NOT PRESENT |
| `backend/.env` staged | NO |
| `WDR/_All/ERP64-Governance/` staged | NO |
| `docs/ERP64_GOVERNANCE/` staged | NO |
| `scripts/` staged | NO |
| `F:\OpenCode\shop.com` accessed | NO |
| Push to remote | NOT PERFORMED |
| TDR-MVP-INGESTION-ENGINE-001 started | NO |

## Open PM Decisions (carried forward unchanged)

| # | Decision | Status |
|---|---|---|
| PM-001 | Maximum upload file size (500MB default) | Open |
| PM-002 | Retention policy for TdrRecord data | Open |
| PM-003 | TdrSourceRow storage: opt-in (default OFF) | Open |
| PM-004 | Quarantine corrections: as-entered or hash-referenced | Open |
| PM-005 | Mega 5 frontend auth: in-memory JWT or localStorage | Open |
| PM-006 | Replay authorization policy (IMPORT_MANAGER+) | Implemented as SUPER_ADMIN + TENANT_ADMIN + IMPORT_MANAGER in Mega 2 |
| PM-007 | Export output format | Open — Mega 4 scope |
| PM-008 | Soft-delete for TdrRecord | Open — Mega 6 scope |

## Commit

| Field | Value |
|---|---|
| Hash | `8058410acb13d68d01a1c6ddeac36d107aa85679` |
| Subject | `feat(tdr): TDR-MVP-BACKEND-CORE-001 Mega 2 NestJS backend core + 38 tests` |
| Branch | `codex/trade-data-refinery` |
| Files committed | 16 (14 new + 2 modified) |
| Stat | 16 files changed, 1059 insertions(+), 1 deletion(-) |
| Push performed | NO |

---

## Final Verdict

**PASS — READY FOR TDR-MVP-INGESTION-ENGINE-001**

Mega 2 deliverables complete:
- TradeDataRefineryModule fully implemented ✅
- TenantModuleGuard (controller-scoped) ✅
- 6 REST endpoints (status, list, detail, progress, cancel, replay) ✅
- FOR UPDATE SKIP LOCKED job lease via `$queryRaw` in `$transaction` ✅
- Background processor (setInterval, no auto-start, NOT_IMPLEMENTED release) ✅
- Batch status transition validation ✅
- SHA-256 fingerprint utility ✅
- 38 unit tests ✅
- Full regression 180/180 PASS ✅
- TypeScript clean (0 errors) ✅
- Safety boundaries maintained ✅

**Do NOT start TDR-MVP-INGESTION-ENGINE-001 without explicit PM authorization.**
