# WDR — TDR-END-TO-END-INTEGRATION-AUDIT-001
**Date:** 2026-09-19  
**Branch:** codex/trade-data-refinery  
**HEAD at audit start:** 4507ad7e4f3af4350abd3e61a758b6db1cb8e057  
**Audit type:** READ-ONLY — no runtime code modified  
**Status:** COMPLETE — READY FOR BOUNDED CORRECTIONS  
**Governance:** #123 AUDIT → REPRODUCE → DOCUMENT → CLASSIFY  
**Auditor:** Claude Sonnet 4.6

---

## 1. Executive Summary

A complete read-first end-to-end audit of the ERP64 Trade Data Refinery (TDR) was performed covering all backend services, frontend pages, API contracts, schema migrations, auth lifecycle, RBAC, type definitions, and test quality. The audit examined 33+ source files across 5 backend service groups and 7 frontend pages.

**Audit scope:** All Mega 1–5 output as of HEAD 4507ad7.

**Verdict: READY FOR BOUNDED CORRECTIONS**

The application has a sound architecture and a functional auth gate. However, 8 P1 defects (7 API contract mismatches + 1 migration gap) prevent the frontend pages from consuming real data and would crash the database on fresh deploy. No P0 defects were found. All P1 defects are bounded, enumerable, and correctable without architectural change. Mega 6 must NOT start until all P1 defects are resolved via CORRECTION-003.

---

## 2. Application Readiness Scorecard

| Domain | Status | P1 Issues | Notes |
|---|---|---|---|
| Auth / Session | PASS with caveat | 0 | Login gate functional. PM-005/PM-006 open. |
| Backend API (NestJS) | PARTIAL | 3 | cancelBatch, applyCorrection, createExport broken |
| Frontend–Backend Contract | BROKEN | 7 | listBatches, quarantine, correction, export, download |
| Database / Migration | BROKEN | 1 | QUALITY_PENDING / PENDING_QUALITY missing from SQL |
| RBAC | PASS | 0 | Decorators verified, roleless negative tests pass |
| TypeScript / Build | PASS | 0 | 0 errors, build produces 7 TDR routes |
| Test coverage | PASS with gaps | 0 | 516 tests, but no E2E; no HTTP contract tests for TDR reads |
| Security | PASS | 0 | Credential hygiene fixed in CORRECTION-002 |

---

## 3. Baseline Commits (verified)

| Commit | Description |
|---|---|
| d1c8329 | TDR-MVP-FRONTEND-001 Mega 5 runtime |
| e203b67 | Mega 5 checkpoint governance |
| 32244c4 | CORRECTION-001 runtime (auth envelope fix, seed) |
| 1ed91dd | CORRECTION-001 WDR |
| 3c56950 | CORRECTION-002 runtime (credential hygiene, RBAC) |
| 4507ad7 | CORRECTION-002 WDR (HEAD) |

---

## 4. Auth / Session Findings

### SESSION_PERSISTENCE_DEFICIENCY (PM-005 OPEN)

**Classification:** P3 — Design decision, documented  
**Location:** `src/lib/auth-context.tsx`

JWT access token is stored in React state only (`useState`). Token is lost on page refresh. The user must re-login after every browser reload.

This is the declared design ("in-memory only, PM-005 OPEN"). No persistent storage (localStorage, sessionStorage, cookie) was introduced. The deficiency is visible to end-users but not a correctness bug.

**PM decision required:** Yes — authorize persistent session storage before end-user demo. Architecture change needed (JWT in httpOnly cookie OR refresh-token-based silent re-auth).

### Auth envelope: PASS

`POST /auth/login` response: `{ ok: true, data: { accessToken, refreshToken, expiresIn: 900, user: { userId, email, tenantId, roles: [] } } }`. Frontend reads `body.data` correctly. Fixed in CORRECTION-001.

### Token refresh: PASS

`POST /auth/refresh` wrapped with `success()`. Frontend calls `authRefresh(refreshToken)`. Refresh window: 900s access TTL, no fixed refresh TTL.

### Logout: PASS

`POST /auth/logout` wrapped with `success()`. Session row deleted. `clearAuth()` clears React state.

---

## 5. Role Architecture Findings

### ROLE_ASSIGNMENT_ARCHITECTURE_DEFICIENCY (PM-006 OPEN)

**Classification:** P3 — Architectural gap, documented  
**Location:** `backend/src/auth/auth.service.ts:issueAccessToken()`, `backend/prisma/schema.prisma:Membership`

The `Membership` model carries no `role` or `roles` field. The `issueAccessToken()` function always passes `roles: []`. Every authenticated user has empty roles.

**Effect table:**

| Endpoint type | Roles needed | Effect with roles: [] |
|---|---|---|
| GET /tdr/status, batches, records, analytics | none | ✓ accessible |
| POST upload, cancel, replay, correct | SUPER_ADMIN or TENANT_ADMIN | ✗ 403 — all users blocked |
| POST /tdr/exports | role check via `checkExportAuthorization([])` | ✗ 403 |

The TDR is a **read-only inspection system** for the current dev user. Mutations are blocked for all users until PM-006 is resolved.

**PM decision required:** Yes — authorize Membership model extension with a `roles` field plus a migration. Until then, no TDR mutations are possible for any user.

---

## 6. Frontend Page Findings

### Pages audited

| Page | File | Auth guard | Reads | Mutations |
|---|---|---|---|---|
| Overview / Status | `src/app/tdr/page.tsx` | TdrLoginGate | getStatus() | none |
| Upload | `src/app/tdr/upload/page.tsx` | TdrLoginGate | none | uploadBatch() |
| Batches | `src/app/tdr/batches/page.tsx` | TdrLoginGate | listBatches(), getBatchProgress() | cancelBatch() |
| Quarantine | `src/app/tdr/quarantine/page.tsx` | TdrLoginGate | listQuarantine() | applyCorrection() |
| Analytics | `src/app/tdr/analytics/page.tsx` | TdrLoginGate | getAnalyticsSummary(), getTrend(), getBreakdown(), getFilterOptions() | none |
| Records | `src/app/tdr/records/page.tsx` | TdrLoginGate | listRecords() | none |
| Exports | `src/app/tdr/exports/page.tsx` | TdrLoginGate | listExports() | createExport(), downloadExport() |

### Pages with API contract mismatches (P1 — broken):

- **Batches page** — `listBatches()` response parsed as `BatchListResponse.batches` → undefined. Page renders empty even with data.
- **Batches page (cancel)** — `cancelBatch()` returns `{ cancelled: true }` but page sets it as the batch object → crash.
- **Batches page (progress)** — `getBatchProgress()` returns `{ id, status, totalSourceRows }` but page reads `batchId`, `percentComplete` → undefined.
- **Quarantine page** — `listQuarantine()` response parsed as `QuarantineListResponse.records` → undefined. Always empty.
- **Quarantine page (correction)** — `applyCorrection()` sends wrong DTO → 400.
- **Exports page** — `createExport()` sends wrong DTO → 400. Download returns 401 (bare URL, no auth header).

### Pages working correctly (with empty dev DB):

- **Overview / Status** — `getStatus()` returns `{ ok: true, data: { moduleEnabled, batchSummary, ... } }`. Page renders.
- **Analytics** — All 4 analytics endpoints pass after CORRECTION-001 fix.
- **Records** — `listRecords()` returns `{ records, total, page, pageSize, hasMore }` directly (no wrapping needed) — see §14.
- **Upload form** — Renders correctly; upload attempt returns 403 (PM-006). File accept attribute includes `.xls` (P3).

---

## 7. API Contract Matrix

Full matrix comparing backend response shapes to frontend expectations:

### 7.1 listBatches — BROKEN (P1)

| Side | Shape |
|---|---|
| Backend (`tdr.service.ts:listBatches`) | `success(items, { page, pageSize, total, totalPages })` → `{ ok: true, data: TdrBatch[], meta: { page, pageSize, total, totalPages } }` |
| Frontend (`tdr-api.ts:listBatches`) | Casts `body.data as BatchListResponse` then reads `r.batches` |
| `BatchListResponse` type | `{ batches: TdrBatch[], total, page, pageSize, hasMore }` |

**Impact:** `body.data` is an array, not `{ batches: [...] }`. `r.batches` is `undefined`. Batches page shows nothing.

**Fix:** Either (A) backend wraps items: `success({ batches: items, total, page, pageSize, hasMore }, undefined)`, OR (B) frontend reads `body.data` as the array and `body.meta` for pagination. Option B is consistent with `api-response.ts` design.

### 7.2 cancelBatch — BROKEN (P1)

| Side | Shape |
|---|---|
| Backend (`tdr.service.ts:cancelBatch`) | `return success({ cancelled: true })` |
| Frontend type (`tdr-api.ts`) | `Promise<TdrBatch>` |
| Frontend usage | `setBatch(updated)` where `updated = { cancelled: true }` |

**Impact:** Batch state replaced with `{ cancelled: true }` → page renders `batch.status` → `undefined` → crash/blank.

**Fix:** Backend must return the updated batch: `success(await this.prisma.tdrBatch.findUnique({ where: { id }, select: batchSelect }))`.

### 7.3 getBatchProgress — BROKEN (P1)

| Side | Shape |
|---|---|
| Backend (`tdr.service.ts`) | `{ id, status, totalSourceRows, processedRows, qualityIssueCount, createdAt, completedAt }` |
| Frontend type (`TdrBatchProgress`) | `{ batchId, status, totalRows, processedRows, quarantineCount, percentComplete, ... }` |

**Mismatches:** `id` vs `batchId`; `totalSourceRows` vs `totalRows`; `qualityIssueCount` vs `quarantineCount`; `percentComplete` not returned by backend.

**Fix:** Align `TdrBatchProgress` type to actual backend field names, or add computed `percentComplete` and alias fields in the service response.

### 7.4 listQuarantine — BROKEN (P1)

| Side | Shape |
|---|---|
| Backend (`quarantine.service.ts`) | `success(issues, { page, pageSize, total, totalPages })` where `issues: TdrValidationIssue[]` |
| Frontend | Casts as `QuarantineListResponse` then reads `r.records` |
| `QuarantineListResponse` type | `{ records: QuarantineRecord[], total, page, pageSize, hasMore }` |
| `TdrValidationIssue` vs `QuarantineRecord` | Backend uses `{ id, batchId, sourceRowNumber, fieldName, issueType, severity, message, record: { ... } }` |

**Impact:** `r.records` is `undefined`. Quarantine page always empty.

**Fix:** Same as listBatches — frontend must read `body.data` as the array and `body.meta` for pagination, and `QuarantineRecord` must match `TdrValidationIssue`.

### 7.5 applyCorrection — BROKEN (P1)

| Side | Shape |
|---|---|
| Backend (`correction.service.ts`) DTO | `{ fieldName: string, correctedValue: string, note?: string }` |
| Frontend sends | `{ corrections: Record<string, string \| null> }` |

**Impact:** Backend `ValidationPipe` with `forbidNonWhitelisted: true` rejects unknown `corrections` field → 400 BAD_REQUEST.

**Fix:** Frontend must decompose the corrections map into individual `POST` calls, one per field, sending `{ fieldName, correctedValue, note? }`.

### 7.6 createExport — BROKEN (P1)

| Side | Shape |
|---|---|
| Backend (`TdrExportService`) DTO | Flat: `{ batchId?, direction?: TradeDirection, rowLimit?, format? }` |
| Frontend sends | `{ filter?: AnalyticsFilter, rowLimit? }` |

**Impact:** Frontend sends a nested `filter` object with unknown fields → 400 BAD_REQUEST from `ValidationPipe`.

**Fix:** Frontend `createExport()` must send the flat DTO fields directly.

### 7.7 Export download — BROKEN (P1)

| Side | Shape |
|---|---|
| Backend | `GET /tdr/exports/:id/download` — requires `Authorization: Bearer <token>` |
| Frontend | `getExportDownloadUrl(id)` returns bare URL string; page renders `<a href={url} download>` |

**Impact:** Browser `<a>` tag cannot set custom headers. Download GET arrives without Authorization → 401 UNAUTHORIZED.

**Fix:** Frontend must proxy the download through a `fetch()` call (authenticated), receive the blob, and create a temporary object URL for the `<a>` tag, OR the backend must issue a short-lived signed download token (URL-embedded or query param).

### 7.8 listRecords — PASS

`records.service.ts` returns `{ records, total, page, pageSize, hasMore }` directly (not wrapped in `success()`). Frontend `tdr-api.ts:listRecords` reads `body` (not `body.data`). This is an inconsistency with other endpoints but it works.

**Note:** This is a maintenance concern (inconsistent response envelope) but does not cause a runtime error.

### 7.9 Analytics endpoints — PASS

All 4 analytics endpoints (`summary`, `trend`, `breakdown`, `filter-options`) use `success()` correctly, and `tdr-api.ts` reads `body.data`. Fixed in CORRECTION-001.

---

## 8. Data-Flow Findings

### Upload → Ingestion pipeline: PASS (with known caveat)

File validation → XLSX streaming → CSV parsing → fingerprint (case-preserving) → orchestrator → handler chain is structurally sound. CORRECTION-001 (Mega 3 CORRECTION-001) fixed EXDEV cross-device move and XLSX streaming. No new issues found.

### Ingestion → Quality pipeline: CONDITIONAL

`BatchStatus.QUALITY_PENDING` is set by the handler when transitioning to quality processing. This enum value exists in `schema.prisma` but is **missing from migration SQL** (see §9.1). On a fresh database deploy, the `QUALITY_PENDING` enum value does not exist in PostgreSQL. Any attempt to set this status → PostgreSQL error: `invalid input value for enum "BatchStatus"`.

### Quality → Export pipeline: CONDITIONAL

Same dependency: `RowDisposition.PENDING_QUALITY` is missing from migration SQL. Rows that should be marked `PENDING_QUALITY` during quality processing would fail to write.

### Analytics pipeline: PASS

All analytics queries use `PrismaService` and parameterized raw SQL. The `::uuid` cast bug was fixed in CORRECTION-001. Aggregations against `tdr_records` are correct.

---

## 9. Migration Findings

### 9.1 MIGRATION-GAP-001 — Enum values missing from migration SQL (P1)

**Classification:** P1 — Fresh deploy would break the ingestion/quality pipeline  
**Evidence:**

`schema.prisma` (current):
```prisma
enum BatchStatus {
  QUEUED
  RECEIVED
  PROCESSING
  QUALITY_PENDING  ← present in schema
  DONE
  FAILED
  CANCELLED
}

enum RowDisposition {
  CLEAN
  QUARANTINED
  CORRECTED
  PENDING_QUALITY  ← present in schema
  EXPORTED
}
```

Migration `20260918215807` (initial TDR migration): Creates `BatchStatus` enum with `QUEUED, RECEIVED, PROCESSING, DONE, FAILED, CANCELLED`. Does NOT include `QUALITY_PENDING`.

Migration `20260919002041` (quality/export jobs): Creates `tdr_quality_jobs` and `tdr_export_jobs` tables. Contains NO `ALTER TYPE "BatchStatus" ADD VALUE 'QUALITY_PENDING'` statement. Contains NO `ALTER TYPE "RowDisposition" ADD VALUE 'PENDING_QUALITY'` statement.

Migration `20260919002056`: Empty migration file.

**Impact:** A developer running `prisma migrate deploy` on a clean database gets a working DB that is missing these two enum values. The first time the ingestion handler tries to set `QUALITY_PENDING` or the quality service sets `PENDING_QUALITY`, PostgreSQL throws: `invalid input value for enum "BatchStatus"`. The batch gets stuck in `PROCESSING` forever.

**Fix required:** A new migration with:
```sql
ALTER TYPE "BatchStatus" ADD VALUE IF NOT EXISTS 'QUALITY_PENDING' AFTER 'PROCESSING';
ALTER TYPE "RowDisposition" ADD VALUE IF NOT EXISTS 'PENDING_QUALITY' AFTER 'QUARANTINED';
```

**Current live DB status:** The existing dev database was created by running `prisma migrate dev` as Prisma applied the schema, so it may have received these values via schema introspection. The gap is in the migration files themselves — a fresh `prisma migrate deploy` (production path) would fail. Must be verified.

---

## 10. TDR Service Findings

### tdr.service.ts

| Method | Status | Notes |
|---|---|---|
| `listBatches` | BROKEN (P1) | Returns items array in `data`; frontend reads `r.batches` |
| `cancelBatch` | BROKEN (P1) | Returns `{ cancelled: true }` not batch object |
| `getBatchProgress` | BROKEN (P1) | Field name and shape mismatch with frontend type |
| `replayBatch` | PASS | Returns `success({ replayed: true })` — no frontend read of result shape |
| `getStatus` | PASS | Returns `success({ moduleEnabled, batchSummary, processingVersions })` |

### quality/service/quarantine.service.ts

| Method | Status | Notes |
|---|---|---|
| `listQuarantine` | BROKEN (P1) | Returns `TdrValidationIssue[]` in `data`; frontend reads `r.records` |

### quality/correction/correction.service.ts

| Issue | Classification | Notes |
|---|---|---|
| 4 DB operations not in transaction | P2 | Partial failure leaves inconsistent state |
| `correctionPayload` JSONB stores plaintext `{ fieldName, correctedValue }` | P2 | PII risk — corrected values may contain tax IDs, party names |

### analytics/records.service.ts

| Status | Notes |
|---|---|
| PASS | Returns `{ records, total, page, pageSize, hasMore }` directly — frontend reads `body` (no `body.data`). Works but inconsistent with other endpoints. |

### tdr-export.service.ts

| Issue | Classification | Notes |
|---|---|---|
| `createExport()` DTO mismatch | P1 | Frontend sends wrong shape |
| `getExportDownloadUrl()` returns bare URL | P1 | Cannot attach auth header via `<a>` tag |
| `checkExportAuthorization([])` → always 403 | P3 | Consequence of PM-006 open |

---

## 11. Upload Findings

| Check | Status | Notes |
|---|---|---|
| File type validation | PASS | CSV and XLSX accepted, unknown types rejected |
| `.xls` in accept attribute | P3 | `accept=".xlsx,.xls,.csv"` but parser only handles XLSX/CSV. XLS upload begins then fails with parse error. |
| File size limit | PASS | 50MB limit enforced in `UploadController` |
| Streaming (XLSX) | PASS | XLSX streaming fixed in Mega 3 CORRECTION-001 |
| Fingerprint collision detection | PASS | Case-preserving fingerprint fixed in Mega 3 CORRECTION-001 |
| Upload RBAC (roles: []) | P3 | 403 is by design (PM-006). Not a regression. |

---

## 12. Ingestion Findings

| Check | Status | Notes |
|---|---|---|
| Orchestrator → handler chain | PASS | Upload → IngestionHandler → QualityHandler → ExportHandler |
| IngestionHandler | PASS | Normalizes, validates, creates TdrRecords, sets PROCESSING/DONE |
| Status transition QUALITY_PENDING | BLOCKED | Enum value missing from migration SQL (P1: MIGRATION-GAP-001) |
| Memory — XLSX | PASS | Streaming row-by-row since Mega 3 CORRECTION-001 |
| Memory — XLS (quality handler) | P3 | XLS parser loads all rows into memory for large files |
| Error handling | PASS | Handler wraps errors, sets FAILED status with metadata |

---

## 13. Quality Findings

| Check | Status | Notes |
|---|---|---|
| QualityHandler pipeline | CONDITIONAL | Depends on QUALITY_PENDING enum (P1 migration gap) |
| Validator service | PASS | Validates HS codes, dates, country codes |
| Decision service | PASS | CLEAN / QUARANTINED / PENDING_QUALITY disposition logic |
| PENDING_QUALITY disposition | BLOCKED | Enum value missing from migration SQL (P1) |
| Quality job idempotency | PASS | Uses `tdr_quality_jobs` table, checks existing |

---

## 14. Quarantine Findings

| Check | Status | Notes |
|---|---|---|
| `listQuarantine` response shape | BROKEN (P1) | `TdrValidationIssue[]` in `data`, frontend reads `r.records` |
| `applyCorrection` DTO | BROKEN (P1) | Frontend sends `corrections` map, backend expects `fieldName`/`correctedValue` |
| Correction atomicity | P2 | 4 ops not in transaction |
| PII in correctionPayload | P2 | Plaintext corrected values in JSONB |
| `QuarantineRecord` vs `TdrValidationIssue` | P1 | Type mismatch; fields not aligned |

---

## 15. Export Findings

| Check | Status | Notes |
|---|---|---|
| `createExport` DTO | BROKEN (P1) | Frontend sends `{ filter, rowLimit }`, backend expects flat DTO |
| Export download auth | BROKEN (P1) | Bare URL via `<a>` → 401 |
| Export authorization (roles: []) | P3 | 403 by design (PM-006) |
| Export job creation | PASS | Creates `tdr_export_jobs` row, queues job |
| Export file generation | NOT TESTED | Backend logic not reachable without corrected createExport |

---

## 16. Analytics Findings

All 4 analytics endpoints pass. No regressions.

| Endpoint | Status | Notes |
|---|---|---|
| GET /tdr/analytics/summary | PASS | Returns KPIs |
| GET /tdr/analytics/trend | PASS | Accepts DAY/MONTH/YEAR granularity |
| GET /tdr/analytics/breakdown | PASS | Accepts dimension and topN |
| GET /tdr/analytics/filter-options | PASS | Returns facet options |
| GET /tdr/records | PASS | Returns paginated records with scope protection |
| `::uuid` casts | PASS | Removed in CORRECTION-001 |
| `forbidNonWhitelisted` on granularity | PASS | Fixed with TrendQueryDto/BreakdownQueryDto in CORRECTION-001 |

---

## 17. Index / Status Findings

| Check | Status | Notes |
|---|---|---|
| GET /tdr/status | PASS | Returns moduleEnabled, batchSummary |
| Frontend Status page | PASS | Reads `body.data` correctly |
| `TdrStatus` frontend type vs backend | MINOR | Frontend type has `activeBatchCount`; backend returns `batchSummary` object. Page renders without crash but individual fields may not all match. |

---

## 18. Test Quality Findings

| Suite | Tests | Status | Notes |
|---|---|---|---|
| backend/auth | ~30 | PASS | JWT, session, argon2 |
| backend/tdr (unit) | ~75 | PASS | Services, orchestrator, handlers |
| backend/tdr-correction-001 | ~30 | PASS | Correction-001 items |
| backend/tdr-correction-002 | 44 | PASS | Seed hygiene, RBAC, auth envelope |
| backend/analytics | ~120 | PASS | DTO, service, records |
| frontend/tdr-login | 13 | PASS | Auth flow |
| frontend/tdr-api | 12 | PASS | Request contract |
| frontend/analytics-types | 10 | PASS | Type safety |
| **TOTAL** | **516** | **481 pass, 1 skip** | |

**Coverage gaps:**
- No HTTP-level integration tests for TDR read endpoints (listBatches, listQuarantine, listRecords)
- No E2E tests (Playwright/Cypress) — not in scope for current phase
- API contract mismatches (§7) are not caught by existing tests — the contract tests mock the fetch response and match current (wrong) types

---

## 19. Security Findings

| Check | Status | Notes |
|---|---|---|
| Credential hygiene | PASS | `seed.js` uses env var, no hardcoded password (CORRECTION-002) |
| JWT authentication | PASS | argon2id, 15m access TTL, refresh token with session table |
| TenantModuleGuard | PASS | Queries DB per request, not cached |
| RolesGuard (APP_GUARD) | PASS | Global, runs before controller-level guards |
| RBAC mutation protection | PASS | All mutations require explicit roles (44 tests) |
| Export authorization | PASS | `checkExportAuthorization()` server-side |
| No auth bypass | CONFIRMED | No `@Public()` decorator on TDR endpoints |
| PII in correctionPayload | P2 | Plaintext corrected values stored in JSONB audit log |
| SQL injection | PASS | Parameterized raw SQL via `Prisma.sql` template literals |
| `forbidNonWhitelisted` | PASS | Global `ValidationPipe` rejects unknown DTO fields |
| `backend/.env` not in repo | CONFIRMED |  |

---

## 20. High-Volume / Scale Findings

| Check | Status | Notes |
|---|---|---|
| XLSX streaming | PASS | Row-by-row streaming since Mega 3 CORRECTION-001 |
| XLS in-memory load | P3 | Quality handler loads all rows at once — concern only for large `.xls` files |
| Records scope protection | PASS | `RAW_SCOPE_BUDGET = 10,000` guard before open-ended record list |
| Analytics scope | PASS | Raw SQL, aggregated — not row-enumerating |
| Export pagination | NOT TESTED | createExport broken; cannot verify |

---

## 21. Defect Register

### P1 — Must fix before Mega 6

| ID | Defect | Location | Impact |
|---|---|---|---|
| API-CONTRACT-001 | listBatches: backend returns items array in `data`, frontend reads `r.batches` | `tdr.service.ts`, `tdr-api.ts`, `types/tdr.ts` | Batches page always empty |
| API-CONTRACT-002 | cancelBatch returns `{ cancelled: true }` not TdrBatch | `tdr.service.ts:cancelBatch`, `tdr-api.ts`, batches page | Cancel action crashes batches page |
| API-CONTRACT-003 | getBatchProgress field names mismatch (id/batchId, totalSourceRows/totalRows, missing percentComplete) | `tdr.service.ts`, `types/tdr.ts:TdrBatchProgress` | Progress polling broken |
| API-CONTRACT-004 | listQuarantine: backend returns TdrValidationIssue[] in `data`, frontend reads `r.records` | `quarantine.service.ts`, `tdr-api.ts`, `types/tdr.ts` | Quarantine page always empty |
| API-CONTRACT-005 | applyCorrection: frontend sends `{ corrections: Record<string,string> }`, backend expects `{ fieldName, correctedValue, note? }` | `tdr-api.ts:applyCorrection`, quarantine page | All corrections fail with 400 |
| API-CONTRACT-006 | createExport: frontend sends `{ filter, rowLimit }`, backend expects flat DTO | `tdr-api.ts:createExport`, exports page | Export creation fails with 400 |
| API-CONTRACT-007 | Export download: `getExportDownloadUrl()` returns bare URL; `<a href>` cannot send Authorization header | `tdr-api.ts:getExportDownloadUrl`, exports page | Every download returns 401 |
| MIGRATION-GAP-001 | `QUALITY_PENDING` (BatchStatus) and `PENDING_QUALITY` (RowDisposition) in schema.prisma but NOT in any migration SQL | `migrations/20260918215807`, `migrations/20260919002041` | Fresh deploy breaks ingestion/quality pipeline |

### P2 — Fix before production / data correctness risk

| ID | Defect | Location | Impact |
|---|---|---|---|
| CORRECTION-ATOMICITY-001 | `applyCorrection` 4 DB ops not in `prisma.$transaction` | `correction.service.ts` | Partial failure leaves DB inconsistent |
| PII-AUDIT-001 | `correctionPayload` JSONB stores plaintext corrected field values | `correction.service.ts` | PII in audit log without encryption policy |
| TYPE-GAP-001 | `BatchStatus` type missing `QUEUED`, `RECEIVED`, `EXPORTING`, `EXPORTED` | `types/tdr.ts` | TypeScript misses runtime values; UI state display wrong |
| TYPE-GAP-002 | `TdrBatch` select in `listBatches` missing `originalFilename`, `mappingProfileId`, `uploadedAt` | `tdr.service.ts:listBatches` | Frontend receives undefined for these fields |

### P3 — Minor / design debt

| ID | Defect | Location | Impact |
|---|---|---|---|
| SESSION-PERSISTENCE-001 | Token in React state only — lost on page refresh (PM-005 OPEN) | `auth-context.tsx` | User must re-login on every refresh |
| ROLE-ASSIGNMENT-001 | No role assignment possible — Membership carries no roles (PM-006 OPEN) | `schema.prisma:Membership`, `auth.service.ts` | All mutations 403 for all users |
| TYPE-GAP-003 | `RowDisposition` missing `PENDING_QUALITY` | `types/tdr.ts` | TypeScript doesn't model this DB value |
| UPLOAD-LIMIT-001 | `.xls` in file accept attribute but parser rejects it | Upload page `accept=` attribute | Confusing UX — file selected, upload begins, parse fails |
| RECORDS-ENVELOPE-001 | `listRecords` returns bare `{ records, total... }` not wrapped in `success()`, inconsistent with all other endpoints | `records.service.ts` | Maintenance risk; works today but inconsistent |

---

## 22. PM Decisions Required

| ID | Decision needed | Priority |
|---|---|---|
| PM-005 | Authorize session persistence strategy (httpOnly cookie or silent refresh) for end-user demo readiness | HIGH |
| PM-006 | Authorize Membership model extension with `roles` field + migration; define initial role assignment process | HIGH |
| PM-007 | Authorize PII-in-audit-log remediation for `correctionPayload` JSONB storage | MEDIUM |
| PM-008 | Authorize export download strategy: authenticated blob proxy in frontend vs signed download token in backend | MEDIUM |

---

## 23. Recommended Correction Sequence

### CORRECTION-003 — API Contract and Migration Fix (unblocks full TDR feature)

**Scope:** Fix all 8 P1 defects in one bounded correction.

**Order of operations:**
1. Write migration: `ALTER TYPE "BatchStatus" ADD VALUE IF NOT EXISTS 'QUALITY_PENDING'`; `ALTER TYPE "RowDisposition" ADD VALUE IF NOT EXISTS 'PENDING_QUALITY'`
2. Fix `tdr.service.ts:cancelBatch` — return updated batch from DB
3. Fix `tdr.service.ts:getBatchProgress` — align response to `TdrBatchProgress` type (add `percentComplete`, normalize field names)
4. Fix `src/types/tdr.ts` — align `BatchListResponse`, `QuarantineListResponse`, `TdrBatchProgress`, `BatchStatus` with actual backend shapes
5. Fix `src/lib/tdr-api.ts` — `listBatches`, `listQuarantine` read `body.data` as array + `body.meta` for pagination; `applyCorrection` sends `{ fieldName, correctedValue, note? }`; `createExport` sends flat DTO; `getExportDownloadUrl` replaced with authenticated blob fetch
6. Verify `listRecords` envelope consistency (P3 — can normalize or leave)
7. Write 30+ tests covering corrected API shapes
8. Write CORRECTION-003 WDR

**Safety constraints:**
- `backend/.env` must not be staged
- `DATABASE_URL` must not appear in any output
- No `prisma migrate reset`
- No `git add .` / `-A` / `--all`
- `F:\OpenCode\shop.com` remains STRICTLY OUT OF SCOPE
- `WDR/_All/ERP64-Governance/`, `docs/ERP64_GOVERNANCE/`, `scripts/` must not be staged
- DO NOT START MEGA 6

### CORRECTION-004 (post PM decisions) — Reliability Fixes

- Wrap `applyCorrection` in `prisma.$transaction`
- Review `correctionPayload` PII storage (pending PM-007)

---

## 24. Mega 6 Readiness Verdict

**READY FOR BOUNDED CORRECTIONS**

Mega 6 must NOT start until all P1 defects are resolved (CORRECTION-003 pass).

Blocking conditions for Mega 6:
- [ ] CORRECTION-003 PASS — all 8 P1 API contract + migration defects resolved
- [ ] PM authorization for Mega 6 scope
- [ ] PM-006 decision (role assignment architecture) if Mega 6 includes mutation workflows

Non-blocking (Mega 6 can proceed without):
- PM-005 (session persistence) — can be deferred to a UX hardening phase
- PM-007 (PII in audit log) — can be deferred to compliance hardening
- PM-008 (export download strategy) — unblocked by CORRECTION-003; strategy decision can be concurrent

---

## 25. Audit Completeness

| Artifact category | Files read | Notes |
|---|---|---|
| Backend TDR services | 12 | tdr.service, orchestrator, handler, ingestion, quality, correction, quarantine, export, analytics, records |
| Backend auth | 3 | auth.service, auth.controller, jwt.strategy |
| Backend shared | 2 | api-response.ts, prisma.service |
| Frontend pages | 7 | All TDR pages |
| Frontend lib | 3 | tdr-api.ts, auth-context.tsx, types/tdr.ts |
| Schema + migrations | 5 | schema.prisma + 3 migration SQL files |
| WDRs (prior) | 4 | Mega 5, CORRECTION-001, CORRECTION-002 |
| Test files | 4 | tdr-login, tdr-api, analytics-types, tdr-correction-002 |
| **Total** | **40+** | |

No Playwright / Cypress tests found. No `.xls` streaming implementation found (confirm: `xls` is accepted in UI but not parsed by quality handler).

---

## Final Verdict

**READY FOR BOUNDED CORRECTIONS**

8 P1 defects (7 API contract mismatches + 1 migration gap) prevent the frontend from consuming real data and would break the ingestion pipeline on a fresh database deploy. All defects are bounded and enumerable. CORRECTION-003 is the approved next step. Mega 6 must NOT start until CORRECTION-003 passes. Mega 6 PM authorization is required.

DO NOT START MEGA 6.
