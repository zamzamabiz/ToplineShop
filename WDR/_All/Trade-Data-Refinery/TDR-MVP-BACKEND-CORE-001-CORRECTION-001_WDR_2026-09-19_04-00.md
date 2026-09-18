# WDR — TDR-MVP-BACKEND-CORE-001-CORRECTION-001

## Task ID
TDR-MVP-BACKEND-CORE-001-CORRECTION-001 — Mega 2 Bounded Runtime Correction

## Status
**PASS — MEGA 2 CORRECTION VERIFIED — READY FOR GPT REVIEW**

## Repository
`E:\ToplineShop`

## Branch
`codex/trade-data-refinery`

## Starting HEAD

| | Hash |
|---|---|
| Starting HEAD | `60693f63c10dafc04df9be1e21bff096a8b763ea` |
| Subject | `chore(gov): TDR-MVP-BACKEND-CORE-001 Mega 2 WDR — 180/180 PASS, READY FOR INGESTION ENGINE` |

`8058410acb13d68d01a1c6ddeac36d107aa85679` confirmed in ancestry ✅

## Prompt Archive

- Path: `C:\Users\zamza\.codex\.chatgpt-projects\g-p-6a9e924a10b08191adbabbcd6d6b0f6\ERP64-STRATEGY-2026-09-16\PROMPTS\Trade-Data-Refinery\TDR-MVP-BACKEND-CORE-001-CORRECTION-001_PROMPT_2026-09-19_04-00.md`

## Context: Why This Correction

During GPT review of Mega 2 commit `8058410acb13d68d01a1c6ddeac36d107aa85679`, three deviations from the authorized Mega 2 contract were identified:

1. **Cancel RBAC**: `IMPORT_MANAGER` was included in `@Roles()` for `POST /tdr/batches/:id/cancel` — not in the approved contract
2. **Replay RBAC**: `IMPORT_MANAGER` was included in `@Roles()` for `POST /tdr/batches/:id/replay` — PM-006 remains OPEN; no authorization to pre-grant this
3. **Replay reason optional**: `ReplayBatchDto.reason` was `@IsOptional() reason?: string` — replay reason is required governance lineage and must not be omitted
4. **Tenant context HTTP semantics**: authenticated user with absent `tenantId` threw `401 UnauthorizedException` — the correct behavior is `403 ForbiddenException('Tenant context required')` since the user identity is established

---

## Corrections Applied

### Correction A — Cancel RBAC

| | Before | After |
|---|---|---|
| `POST /tdr/batches/:id/cancel` | `@Roles(SUPER_ADMIN, TENANT_ADMIN, IMPORT_MANAGER)` | `@Roles(SUPER_ADMIN, TENANT_ADMIN)` |

File: `backend/src/trade-data-refinery/tdr.controller.ts`

### Correction B — Replay RBAC

| | Before | After |
|---|---|---|
| `POST /tdr/batches/:id/replay` | `@Roles(SUPER_ADMIN, TENANT_ADMIN, IMPORT_MANAGER)` | `@Roles(SUPER_ADMIN, TENANT_ADMIN)` |

File: `backend/src/trade-data-refinery/tdr.controller.ts`

PM-006 status: **OPEN** — no broader operator authorization approved. Future PM decision may broaden replay access.

### Correction C — Replay Reason Required

| | Before | After |
|---|---|---|
| `ReplayBatchDto.reason` | `@IsOptional() @IsString() @MaxLength(500) reason?: string` | `@IsString() @IsNotEmpty() @MaxLength(500) reason: string` |

File: `backend/src/trade-data-refinery/dto/replay-batch.dto.ts`

Contract: 1–500 characters, non-empty, non-null, required. No default inserted. Missing/empty reason causes validation failure.

### Correction D — Tenant Context HTTP Semantics

| | Before | After |
|---|---|---|
| Authenticated user, missing tenantId | `throw new UnauthorizedException('Missing tenantId in token')` | `throw new ForbiddenException('Tenant context required')` |
| No authenticated user at all | `throw new UnauthorizedException()` | `throw new UnauthorizedException()` (unchanged) |

File: `backend/src/trade-data-refinery/guards/tenant-module.guard.ts`

Semantic contract preserved:
- No identity at all → 401 Unauthorized
- Identity established, but tenant context absent → 403 Forbidden ("Tenant context required")
- Module not enabled → 403 Forbidden ("TRADE_DATA_REFINERY module not enabled for tenant")

---

## Files Changed (4 files, all in `backend/src/trade-data-refinery/`)

| File | Change |
|---|---|
| `backend/src/trade-data-refinery/tdr.controller.ts` | Cancel and replay @Roles: removed IMPORT_MANAGER |
| `backend/src/trade-data-refinery/dto/replay-batch.dto.ts` | reason: required, @IsNotEmpty() added, optional removed |
| `backend/src/trade-data-refinery/guards/tenant-module.guard.ts` | Missing tenantId: UnauthorizedException → ForbiddenException |
| `backend/src/trade-data-refinery/tdr-mega2-unit.spec.ts` | Updated 1 existing test + added 14 new correction tests |

NOT changed:
- No schema changes
- No migrations
- No package changes
- No frontend changes
- No env files
- `TradeDataRefineryModule`, orchestrator, processor, service, config, utilities — all unchanged

---

## Authorized Mega 2 Contract (after correction)

### Cancel RBAC
`POST /tdr/batches/:id/cancel` — allowed: **SUPER_ADMIN, TENANT_ADMIN**

### Replay RBAC
`POST /tdr/batches/:id/replay` — allowed: **SUPER_ADMIN, TENANT_ADMIN**

### Replay reason
Required string, 1–500 characters, non-empty. No default. Must be supplied at API call.

### Tenant context HTTP semantics
| Condition | HTTP Code |
|---|---|
| No `request.user` (unauthenticated) | 401 Unauthorized |
| `request.user` present, `tenantId` absent | 403 Forbidden ("Tenant context required") |
| `tenantId` present, module disabled/absent | 403 Forbidden ("TRADE_DATA_REFINERY module not enabled for tenant") |
| `tenantId` present, module enabled | allowed |

### PM-006 (replay authorization)
**OPEN** — no authorization to grant IMPORT_MANAGER or any other operator role replay access. Future PM decision required.

---

## Test Results

### Pre-correction
180/180 PASS

### Post-correction
194/194 PASS (180 prior + 14 new correction-specific tests)

```
Test Suites: 6 passed, 6 total
Tests:       194 passed, 194 total
Time:        11.15 s
```

### New tests added (14)
| Group | Tests |
|---|---|
| RolesGuard — cancel/replay RBAC | cancel: TENANT_ADMIN allowed, SUPER_ADMIN allowed, IMPORT_MANAGER 403, VIEWER 403; replay: SUPER_ADMIN allowed, TENANT_ADMIN allowed, IMPORT_MANAGER 403 (PM-006 OPEN), ANALYST 403; metadata: cancel+replay do not include IMPORT_MANAGER |
| ReplayBatchDto validation | missing reason fails, empty string fails, over-500 chars fails, valid bounded reason passes, exactly-500 chars passes |

### Updated tests (1)
- `'authenticated user without tenantId throws ForbiddenException (not 401)'` — corrected from UnauthorizedException to ForbiddenException to match Correction D

---

## TypeScript Check

```
npx tsc --noEmit → exit code 0 (0 errors)
```

---

## Diff Audit

| Check | Result |
|---|---|
| IMPORT_MANAGER cannot cancel | CONFIRMED ✅ |
| IMPORT_MANAGER cannot replay | CONFIRMED ✅ |
| replay reason required | CONFIRMED ✅ |
| missing authenticated tenant context → 403 | CONFIRMED ✅ |
| unauthenticated identity → 401 | CONFIRMED ✅ |
| TenantModule disabled → 403 | CONFIRMED ✅ |
| no cross-tenant behavior changed | CONFIRMED ✅ |
| no schema changes | CONFIRMED ✅ |
| no migrations | CONFIRMED ✅ |
| no packages | CONFIRMED ✅ |
| no ingestion code | CONFIRMED ✅ |
| no frontend changes | CONFIRMED ✅ |
| no secrets | CONFIRMED ✅ |
| no env files | CONFIRMED ✅ |
| only 4 authorized files changed | CONFIRMED ✅ |

---

## Safety Boundaries

| Boundary | Status |
|---|---|
| `git add .` / `-A` / `--all` | NOT USED |
| Schema/migration changes | NONE |
| DATABASE_URL in any output | NOT PRESENT |
| `backend/.env` staged | NO |
| `WDR/_All/ERP64-Governance/` staged | NO |
| `docs/ERP64_GOVERNANCE/` staged | NO |
| `scripts/` staged | NO |
| `F:\OpenCode\shop.com` accessed | NO |
| Push to remote | NOT PERFORMED |
| TDR-MVP-INGESTION-ENGINE-001 started | NO |

---

## Commit

| Field | Value |
|---|---|
| Hash | `39e02911afb596a0592b4eb2fec847c2012831c1` |
| Subject | `fix(tdr): align Mega 2 replay and cancel authorization contract` |
| Files staged | 5: 4 runtime corrections + this WDR |
| Push performed | NO |

---

## Corrected Mega 2 WDR

Path: `WDR/_All/Trade-Data-Refinery/TDR-MVP-BACKEND-CORE-001_WDR_2026-09-19_03-42.md`

Corrections applied in-place:
- TenantModuleGuard section: updated to reflect 403 for missing tenantId (with correction note)
- Deliverable checklist: ReplayBatchDto reason corrected to REQUIRED; RBAC corrected to SUPER_ADMIN + TENANT_ADMIN only
- Endpoints table: IMPORT_MANAGER removed from cancel and replay; correction note added
- PM-006: updated to OPEN status with correction note

---

## Final Verdict

**MEGA 2 CORRECTION VERIFIED — READY FOR GPT REVIEW**

Do NOT start TDR-MVP-INGESTION-ENGINE-001 without explicit PM authorization.
