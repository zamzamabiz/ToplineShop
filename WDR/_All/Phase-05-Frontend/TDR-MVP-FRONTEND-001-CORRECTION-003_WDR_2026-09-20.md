# TDR-MVP-FRONTEND-001-CORRECTION-003 — Work Done Record
**Date:** 2026-09-20  
**Branch:** codex/trade-data-refinery  
**Status:** PASS

---

## 1. Starting HEAD
`f3b7283` — TDR-END-TO-END-INTEGRATION-AUDIT-001 WDR (audit commit)

## 2. Commits This Correction
| Commit | Description |
|--------|-------------|
| `617d1e1` | chore(gov): archive CORRECTION-003 prompt |
| `d286d77` | fix(auth): resolve tenant-scoped roles from Membership — ARCH-ROLE-001 |
| `6abc66a` | fix(tdr): API contract + scale-safety corrections — CORRECTION-003 |

---

## 3. Gate A — Migration Truth Reconciliation

### MIGRATION-GAP-001 — **FALSE FINDING**
The audit WDR (`f3b7283`) claimed `QUALITY_PENDING` and `PENDING_QUALITY` were missing from migration history.

Verification: `backend/prisma/migrations/20260918231408_tdr_ingestion_enums/migration.sql` already contains:
```sql
ALTER TYPE "BatchStatus" ADD VALUE 'QUALITY_PENDING';
ALTER TYPE "RowDisposition" ADD VALUE 'PENDING_QUALITY';
```

**No enum migration was needed or created.**

### Actual Enum Values (Frozen from schema.prisma)
**BatchStatus (11 values):** RECEIVED, QUEUED, PROCESSING, REVIEW_REQUIRED, READY, PARTIAL, FAILED, CANCELLED, EXPORTING, EXPORTED, QUALITY_PENDING

**RowDisposition (4 values):** ACCEPTED, QUARANTINED, REJECTED, PENDING_QUALITY

The audit WDR used stale names (`DONE`, `CLEAN`, `CORRECTED`, `EXPORTED` as RowDisposition) — none exist in schema. Corrected in this WDR.

---

## 4. Canonical PM Register (Reconciled)
| ID | Description |
|----|-------------|
| PM-001 | Upload-size policy (default 500 MB) |
| PM-002 | Record retention |
| PM-003 | TdrSourceRow |
| PM-004 | Correction privacy |
| PM-005 | Frontend/session token storage |
| PM-006 | Replay authorization (NOT role assignment) |
| PM-007 | Export format |
| PM-008 | Record archive/delete |

**ARCH-ROLE-001** (new, now resolved): Tenant-scoped role persistence on Membership model.

---

## 5. Confirmed Defect Register + Fix Status

| ID | Defect | Status | Fix |
|----|--------|--------|-----|
| API-CONTRACT-001 | listBatches: `body.data` = array, not `BatchListResponse`; `r.batches` undefined | FIXED | `getPage<T,M>` helper; `listBatches` builds `BatchListResponse` from data+meta |
| API-CONTRACT-002 | cancelBatch: frontend typed as returning `TdrBatch`; backend returns `{ cancelled }` | FIXED | Backend returns `{ cancelled, batchId, status }`; frontend type corrected |
| API-CONTRACT-003 | getBatchProgress: id vs batchId; totalRows vs totalSourceRows; no percentComplete | FIXED | Backend maps id→batchId, computes percentComplete (nullable); types fixed |
| API-CONTRACT-004 | listQuarantine: `r.records` undefined; issue-centric not record-centric | FIXED | `getPage` helper; `QuarantineIssue` type; quarantine page rebuilt issue-centric |
| API-CONTRACT-005 | applyCorrection: sends `{ corrections: Record }` but backend needs `CorrectionDto` | FIXED | Frontend sends `{ fieldName, correctedValue, note? }`; type `CorrectionRequest` added |
| API-CONTRACT-006 | createExport: frontend sends `{ filter: {...}, rowLimit }` but backend needs flat DTO | FIXED | Frontend sends flat `CreateExportRequest`; type added |
| API-CONTRACT-007 | Export download: `<a href>` unauthenticated → 401 | FIXED | `downloadExport()`: authenticated fetch → blob → objectURL → click → revoke |
| API-CONTRACT-008 | listRecords: backend returned plain object, `get<T>` reads `body.data` → undefined | FIXED | Backend wraps in `success()`; frontend uses `getPage` |
| UI-CONTRACT-008 | Upload page shows "50 MB" limit; backend allows 500 MB | FIXED | Display changed to "500 MB" |
| UI-CONTRACT-009 | Upload page accepts `.xls`; backend only supports .csv/.xlsx | FIXED | `.xls` removed from `accept` attribute |
| ARCH-ROLE-001 | No persisted roles in Membership; all JWTs issued with `roles: []` | FIXED | Migration + schema change + auth service fix |
| QUALITY-MEMORY-001 | Quality worker loads all pending row IDs into memory upfront | FIXED | Sliding window: QUALITY_CHUNK_SIZE source rows per DB query |
| CORRECTION-ATOMICITY-001 | 5 correction DB ops not in transaction | FIXED | All 5 ops wrapped in `prisma.$transaction` |

### Disproven Defects
- **MIGRATION-GAP-001**: FALSE — migration already existed

---

## 6. Role Architecture (ARCH-ROLE-001 Resolution)

### Schema Change
```prisma
model Membership {
  roles     String[]         @default([])
  ...
}
```

### Migration
`backend/prisma/migrations/20260920000001_membership_roles/migration.sql`:
```sql
ALTER TABLE "memberships" ADD COLUMN "roles" TEXT[] NOT NULL DEFAULT '{}';
```
Additive only. Existing memberships default to empty roles.

### auth.service.ts Changes
**login():** Finds `activeMembership` matching tenantId from already-loaded user.memberships. Extracts `roles = activeMembership?.roles ?? []`. Issues JWT with real roles.

**refresh():** Queries `membership.findUnique({ userId, tenantId })` to reload current roles. No stale role propagation.

### Seed
`admin@toplineshop.dev` explicitly assigned `['TENANT_ADMIN']`. Dev-only, never production.

### JWT Behavior
- Roles are tenant-scoped and server-derived from Membership
- No client role trust
- Default memberships have `roles: []` unless explicitly seeded
- SUPER_ADMIN handling follows platform convention (not seeded)

---

## 7. Session Architecture
PM-005 remains open. Current model: in-memory access token, refresh token rotation. No localStorage change in this correction.

---

## 8. Upload Size + File Formats (Truth)
- **Backend:** 500 MB max, CSV and XLSX only (`ACCEPTED_EXTENSIONS`)
- **Frontend was:** "max 50 MB", accepted `.xls`
- **Frontend now:** "max 500 MB", accepts `.csv,.xlsx` only

---

## 9. API Contract Matrix

| Endpoint | Before | After |
|----------|--------|-------|
| GET /tdr/batches | `data: TdrBatch[]`, frontend read `bl.batches` → undefined | `getPage` builds `BatchListResponse`; adds `originalFilename` from sourceFile join |
| GET /tdr/batches/:id/progress | returned `id` not `batchId`; no `percentComplete` | maps `id→batchId`; computes `percentComplete` (nullable) |
| POST /tdr/batches/:id/cancel | returned `{ cancelled: true }` | returns `{ cancelled, batchId, status: 'CANCELLED' }` |
| GET /tdr/batches/:id/quarantine | `data: issue[]`; frontend read `r.records` → undefined | `getPage`; issue-centric `QuarantineIssue`; adds `rawValue` |
| POST correct | frontend sent `{ corrections: Record }` → 400 | frontend sends `{ fieldName, correctedValue, note? }` |
| POST /tdr/exports | frontend sent `{ filter: {...}, rowLimit }` → 400 | frontend sends flat `CreateExportRequest` |
| GET exports/:id/download | naked `<a href>` → 401 | `downloadExport()` authenticated fetch+blob |
| GET /tdr/records | plain object (no envelope) → `body.data` undefined | wrapped in `success()`; `getPage`; 1-based pagination |

---

## 10. Batch Pagination
1-based throughout. Backend: `page = dto.page ?? 1`, `skip = (page-1) * pageSize`. Frontend pages: `useState(1)`. Prev button disabled at page 1.

---

## 11. Quarantine Contract
Issue-centric. Each `QuarantineIssue` has: `{ id, recordId, fieldName, ruleCode, severity, message, rawValue, status, createdAt, record: { id, sourceRowNumber, rowDisposition, exportEligible, quarantineReviewRequired } }`. Frontend page displays flat issue table with row # and disposition from `issue.record`.

---

## 12. Correction DTO (API-CONTRACT-005)
Frontend sends: `{ fieldName: string; correctedValue: string; note?: string }` matching `CorrectionDto` exactly.

---

## 13. Correction Atomicity (CORRECTION-ATOMICITY-001)
All 5 DB operations now in `prisma.$transaction`:
1. `tdrValidationIssue.updateMany` — mark OPEN → REVIEWED
2. `tdrRecord.update` — apply correction field value
3. `tdrValidationIssue.createMany` — new issues from revalidation
4. `tdrRecord.update` — update disposition + exportEligible + quarantineReviewRequired
5. `tdrQuarantineReview.create` — create review record

Revalidation (normalizeRowV1, validateRowV1, determineDisposition) runs in-memory inside the transaction. Audit event is outside the transaction (non-critical).

---

## 14. Correction Privacy
`correctionPayload` remains bounded: `{ fieldName, correctedValue }` — allowlisted canonical fields, domain-scoped, no full row duplication.

---

## 15. Export Create Contract
Frontend sends flat `CreateExportRequest`: `{ batchId?, tradeDirection?, dateFrom?, dateTo?, hsChapter?, hsCode?, foreignPartyCountryCode?, rowLimit? }`. Matches `CreateExportDto` exactly.

---

## 16. Authenticated Download
`downloadExport(token, exportId)`:
1. `fetch(url, { headers: { Authorization: Bearer ... } })`
2. `res.blob()`
3. `URL.createObjectURL(blob)`
4. Create `<a>`, set `href` + `download`, click, remove, `revokeObjectURL`

No JWT in URL query string. No signed download URL.

---

## 17. Quality Worker Memory Fix (QUALITY-MEMORY-001)
**Before:** `tdrRecord.findMany({ where: { rowDisposition: 'PENDING_QUALITY', batchId } })` — loads ALL pending row IDs into a Map before processing begins.

**After:** Sliding window pattern:
1. Buffer source rows from file into `srcWindow` (up to QUALITY_CHUNK_SIZE)
2. When window full: query DB for `sourceRowNumber IN [window row numbers]` where `rowDisposition = 'PENDING_QUALITY'`
3. Build local `windowMap` (only this window's IDs)
4. Process matching rows, accumulate `qualityResults`
5. When `qualityResults.length >= QUALITY_CHUNK_SIZE`: persist and clear
6. Repeat

Memory at any time: ~2×QUALITY_CHUNK_SIZE rows (one source window + one quality results buffer). Independent of total batch size.

---

## 18. Quality Restartability
Preserved. `PENDING_QUALITY` disposition is still the durable remaining-work marker. Sliding window queries only `PENDING_QUALITY` rows per window — already-committed rows remain final on restart.

---

## 19. Job/Batch Completion Atomicity
No regressions. Existing transaction usage preserved.

---

## 20. Records Pagination
1-based (matches batches). `page = Math.max(1, dto.page ?? 1)`, `skip = (page-1) * pageSize`. Backend now uses `success()` envelope so `body.data` = records array, `body.meta` = pagination.

---

## 21. Fresh Migration Proof
Unable to create isolated test DB in this session. Migration chain is clean per `prisma migrate status` (7 migrations, all applied). Migration SQL verified by inspection — additive only.

---

## 22. Validation Results

| Check | Result |
|-------|--------|
| `npx prisma format` | ✅ Formatted |
| `npx prisma validate` | ✅ Valid |
| `npx prisma migrate status` | ✅ Up to date (7/7 applied) |
| `npx tsc --noEmit` (backend) | ✅ 0 errors |
| `npx tsc --noEmit` (frontend) | ✅ 0 errors |
| `npx jest --no-coverage` (backend) | ✅ 481 passed, 1 skipped |
| `npx vitest run` (frontend) | ✅ 34/34 passed |
| `npm run build` | ✅ All pages built |
| `git diff --check` | ✅ Clean |

---

## 23. Security Audit
- `backend/.env` not staged or committed
- No credentials in WDR, logs, or diffs
- `DATABASE_URL` not exposed
- Roles remain server-derived (no client trust)
- Guards intact: `RolesGuard` (APP_GUARD) + `TenantModuleGuard` + route-level `@Roles()`
- JWT not in URL query string
- No localStorage introduction
- `WDR/_All/ERP64-Governance/`, `docs/ERP64_GOVERNANCE/`, `scripts/` not staged

---

## 24. Performance Audit
- Quality worker: memory bounded to ~2×QUALITY_CHUNK_SIZE — P1-SCALE resolved
- Correction: transaction reduces round-trips (single transaction block vs 5 serial ops)
- Batch select: one additional join per `listBatches` page (sourceFile.originalFilename) — acceptable
- Records service: 1-based pagination is equivalent in query cost to 0-based
- No new broad indexes added

---

## 25. Remaining P2/P3 Items
- **PM-005**: Session token storage strategy (open, no localStorage introduced)
- **ARCH-SESSION-001**: Browser hard-refresh requires re-login (acceptable for current scope)
- **Playwright E2E**: Not added in this correction (requires PM authorization for new dev dependency)
- **HTTP contract tests**: Not added (existing test suites pass; integration tests for new endpoints deferred to Mega 6 if PM authorized)

---

## 26. Mega 6 Readiness Gate

| Gate | Status |
|------|--------|
| Migration reconciled | ✅ MIGRATION-GAP-001 = false, no gap |
| No P0/P1 defects | ✅ All P1 defects resolved |
| Persisted roles permit authorized mutations | ✅ ARCH-ROLE-001 resolved |
| Unauthorized users denied (guards intact) | ✅ |
| API contracts match frontend/backend | ✅ |
| Login/navigation/upload/ingestion/quality/quarantine+correction/analytics/export/download | ✅ Contracts aligned |
| Quality worker memory bounded | ✅ QUALITY-MEMORY-001 resolved |
| Backend regression | ✅ 481/482 passing |
| Frontend regression | ✅ 34/34 passing |
| TypeScript (both) | ✅ Clean |
| Build | ✅ Pass |

**VERDICT: READY FOR TDR-MVP-FINAL-AUDIT-001 (Mega 6 pending PM authorization)**

---

## 27. Files Changed
**Commit A (d286d77):**
- `backend/prisma/schema.prisma` — Membership.roles field
- `backend/prisma/migrations/20260920000001_membership_roles/migration.sql`
- `backend/src/auth/auth.service.ts` — role resolution
- `backend/src/auth/auth.spec.ts` — membership mock
- `backend/prisma/seed.js` — TENANT_ADMIN role

**Commit B (6abc66a):**
- `backend/src/trade-data-refinery/services/tdr.service.ts` — listBatches/getBatchProgress/cancelBatch fixes
- `backend/src/trade-data-refinery/analytics/records.service.ts` — success() envelope + 1-based pagination
- `backend/src/trade-data-refinery/quality/correction/correction.service.ts` — atomicity transaction
- `backend/src/trade-data-refinery/quality/handler/tdr-quality-handler.service.ts` — sliding window
- `backend/src/trade-data-refinery/quality/service/quarantine.service.ts` — rawValue in select
- `backend/src/trade-data-refinery/tdr-correction-002.spec.ts` — stale test updated
- `backend/src/trade-data-refinery/tdr-mega5-unit.spec.ts` — records envelope test fix
- `src/types/tdr.ts` — BatchStatus/RowDisposition/TdrBatch/TdrBatchProgress/TdrStatus/QuarantineIssue/CorrectionRequest/CreateExportRequest
- `src/lib/tdr-api.ts` — getPage helper, all API contract fixes, downloadExport
- `src/app/tdr/page.tsx` — status colors, remove uploadedAt
- `src/app/tdr/batches/page.tsx` — 1-based pagination, remove uploadedAt, status colors
- `src/app/tdr/batches/[id]/page.tsx` — cancelBatch result, percentComplete null, remove mappingProfileId
- `src/app/tdr/quarantine/page.tsx` — issue-centric rebuild, 1-based pagination
- `src/app/tdr/upload/page.tsx` — remove .xls, fix 50→500 MB
- `src/app/tdr/exports/page.tsx` — flat DTO, downloadExport button
- `src/__tests__/tdr-api.test.ts` — downloadExport test
