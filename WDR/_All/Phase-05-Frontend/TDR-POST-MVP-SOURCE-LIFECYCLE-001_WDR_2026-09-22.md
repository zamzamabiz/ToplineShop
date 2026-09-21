# WDR — TDR-POST-MVP-SOURCE-LIFECYCLE-001
**Task:** POST-MVP MEGA TASK 3 — Source File Retention, Archive/Restore, Original Download, Export Expiry
**Date:** 2026-09-22
**Verdict:** PASS

---

## §1 Pre-Implementation Backfill Verification

| Table | Action | Rows Updated |
|-------|--------|-------------|
| tdr_source_files | retentionExpiresAt = uploadedAt + 7 years | 4 |
| tdr_export_jobs | expiresAt = completedAt + 90 days | 5 |
| tdr_source_files remaining null | — | 0 |
| tdr_export_jobs remaining null (COMPLETED) | — | 0 |

Prisma client regenerated after migration. Backfill script: `backend/backfill-tmp.mjs`.

---

## §2 Migration

- Applied: `20260921195420_add_source_lifecycle_and_export_expiry`
- All ADD COLUMN, all nullable, no DROP, no destructive SQL
- Prisma validate: PASS

---

## §3 Backend Changes

### New Files
| File | Purpose |
|------|---------|
| `backend/src/trade-data-refinery/services/tdr-source-lifecycle.service.ts` | archive/restore/download with RBAC + audit |
| `backend/src/trade-data-refinery/export/service/tdr-export-cleanup.service.ts` | hourly expired export binary cleanup |

### Modified Files
| File | Change |
|------|--------|
| `dto/list-batches.dto.ts` | Added `lifecycle?: 'ACTIVE' | 'ARCHIVED' | 'ALL'` |
| `services/tdr.service.ts` | lifecycle filter in listBatches; sourceFileId/archivedAt/retentionExpiresAt in response |
| `ingestion/upload/upload.service.ts` | Set `retentionExpiresAt = uploadedAt + 7 years` on create |
| `export/orchestrator/tdr-export-orchestrator.service.ts` | Set `expiresAt = completedAt + 90 days` in completeJob |
| `export/service/tdr-export.service.ts` | 410 GoneException on expired; download RBAC; Content-Disposition CR/LF strip |
| `tdr.controller.ts` | New endpoints: POST source-files/:id/archive, POST source-files/:id/restore, GET source-files/:id/download |
| `trade-data-refinery.module.ts` | Registered TdrSourceLifecycleService, TdrExportCleanupService |

---

## §4 RBAC Summary

| Operation | SUPER_ADMIN | TENANT_ADMIN | IMPORT_MANAGER | EXPORT_MANAGER | ANALYST |
|-----------|:-----------:|:------------:|:--------------:|:--------------:|:-------:|
| Archive source file | ✓ | ✓ | ✗ | ✗ | ✗ |
| Restore source file | ✓ | ✓ | ✗ | ✗ | ✗ |
| Download source IMPORT | ✓ | ✓ | ✓ | ✗ | ✗ |
| Download source EXPORT | ✓ | ✓ | ✗ | ✓ | ✗ |
| Download export IMPORT | ✓ | ✓ | ✓ | ✗ | ✗ |
| Download export EXPORT | ✓ | ✓ | ✗ | ✓ | ✗ |

---

## §5 Lifecycle Filter Behavior

| Param | Effect |
|-------|--------|
| `lifecycle=ACTIVE` (default) | sourceFile.archivedAt IS NULL |
| `lifecycle=ARCHIVED` | sourceFile.archivedAt IS NOT NULL |
| `lifecycle=ALL` | No filter on archivedAt |

---

## §6 Export Expiry Logic

- `expiresAt = completedAt + 90 days` set in `completeJob()`
- `downloadExport()` returns 410 GoneException if `job.expiresAt < now`
- `TdrExportCleanupService` runs hourly: finds COMPLETED exports where `expiresAt < now AND storageKey IS NOT NULL`, deletes binary via StorageService, nulls storageKey in DB — retains DB row
- Idempotent: null storageKey is skipped for removal

---

## §7 Content-Disposition Safety

- Export filename: `job.id.replace(/[\r\n]/g, '')` — strips CR/LF
- Source filename: sanitizes `[\r\n"\\]` → `_`, truncates to 200 chars

---

## §8 Source Immutability

- Archive sets `archivedAt` timestamp only — binary is NOT deleted
- Restore clears `archivedAt` — binary always intact
- No `deletedAt`, no physical deletion in this task

---

## §9 Frontend Changes

| File | Change |
|------|--------|
| `src/app/tdr/batches/page.tsx` | Lifecycle filter selector (Active/Archived/All); archive/restore/download buttons; archived ⚑ indicator |
| `src/app/tdr/exports/page.tsx` | "Expired / unavailable" shown instead of Download CSV when expiresAt < now |
| `src/lib/tdr-api.ts` | `listBatches` lifecycle param; `archiveSourceFile`, `restoreSourceFile`, `downloadSourceFile` functions |
| `src/types/tdr.ts` | Added `sourceFileId`, `sourceFileArchivedAt`, `sourceFileRetentionExpiresAt` to TdrBatch; `expiresAt` to TdrExportJob |

---

## §10 Test Counts

| Suite | Tests | Pass |
|-------|-------|------|
| Backend Jest (backend/src) | 755 | 754/755 (1 pre-existing skip) |
| Frontend Vitest (src/__tests__) | 145 | 145/145 |
| New: tdr-source-lifecycle.spec.ts (backend) | 35 | 35 |
| New: tdr-source-lifecycle.test.tsx (frontend) | 16 | 16 |
| TypeScript: backend tsc --noEmit | — | CLEAN |
| TypeScript: frontend tsc --noEmit | — | CLEAN |
| Prisma validate | — | PASS |

Note: pre-existing skip in backend (auth test) was present before this task.
SA.10 flaky failure at max-worker concurrency is pre-existing S3 mock race; passes at maxWorkers=4 and --runInBand.

---

## §11 Security Constraints Verified

- No credentials committed
- No S3 secrets logged
- No absolute local storage path returned to frontend
- shop.com: not touched
- git add .: not used
- No push
- Tenant boundaries preserved (all queries scoped by tenantId)
- Storage keys cannot escape root/bucket prefix (unchanged from Mega 2)
- Original source files remain immutable (archive = metadata only)
- Export artifact access remains authenticated (Bearer token, RBAC checked)
- Old files not deleted (retentionExpiresAt only marks future date)

---

## §12 Scope Compliance

**IN (implemented):**
- archivedAt / retentionExpiresAt on TdrSourceFile ✓
- expiresAt on TdrExportJob ✓
- archive/restore endpoints with RBAC ✓
- source file download endpoint with RBAC ✓
- lifecycle audit events (tdr.sourceFile.archived, tdr.sourceFile.restored) ✓
- lifecycle filter on batch list ✓
- export binary expiry cleanup service ✓
- expired export 410 response ✓
- minimal frontend lifecycle controls ✓

**OUT (not done, as specified):**
- deletedAt, deletedReason, tombstone, physical source deletion ✓ (not done)
- S3 signed URLs, live S3 cloud deployment ✓ (not done)
- Phase 7 features ✓ (not done)

---

## §13 Next

Mega 4 (PM auth required) per registry.
