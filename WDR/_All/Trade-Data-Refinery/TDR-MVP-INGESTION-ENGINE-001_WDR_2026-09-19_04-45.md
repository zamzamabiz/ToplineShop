# WDR — TDR-MVP-INGESTION-ENGINE-001 (Mega 3)

## Task ID
TDR-MVP-INGESTION-ENGINE-001 — MEGA 3: File Upload + Storage + SHA-256 Hashing + CSV/XLSX Parsers + Chunked Ingestion + Checkpoint/Retry/Recovery

## Status
**PASS + CORRECTION-001 APPLIED — READY FOR TDR-MVP-QUALITY-EXPORT-001 (Mega 4)**

> CORRECTION-001 applied: see `TDR-MVP-INGESTION-ENGINE-001-CORRECTION-001_WDR_2026-09-19_05-00.md`
> Commit: `17a6a3d`

## Repository
`E:\ToplineShop`

## Branch
`codex/trade-data-refinery`

## HEAD State

| | Hash |
|---|---|
| Starting HEAD | `39e02911afb596a0592b4eb2fec847c2012831c1` |
| Final HEAD (after commit) | `caa90fc` |

Starting HEAD subject: `fix(tdr): align Mega 2 replay and cancel authorization contract` ✅

Both Mega 2 commits confirmed in ancestry:
- `8058410acb13d68d01a1c6ddeac36d107aa85679` ✅
- `39e02911afb596a0592b4eb2fec847c2012831c1` ✅

## Prompt Archive

- Path: `C:\Users\zamza\.codex\.chatgpt-projects\g-p-6a9e924a10b08191adbabbcd6d6b0f6\ERP64-STRATEGY-2026-09-16\PROMPTS\Trade-Data-Refinery\TDR-MVP-INGESTION-ENGINE-001_PROMPT_2026-09-19_04-30.md`
- Non-empty: ✅

---

## Section 4 Pre-flight: Enum Gap Audit

| Enum | Missing Value | Action |
|---|---|---|
| `BatchStatus` | `QUALITY_PENDING` | Added to schema + migration ✅ |
| `RowDisposition` | `PENDING_QUALITY` | Added to schema + migration ✅ |

### Migration
- File: `backend/prisma/migrations/20260918231408_tdr_ingestion_enums/migration.sql`
- SQL:
  ```sql
  ALTER TYPE "BatchStatus" ADD VALUE 'QUALITY_PENDING';
  ALTER TYPE "RowDisposition" ADD VALUE 'PENDING_QUALITY';
  ```
- Type: additive only (`ADD VALUE`) — no destructive SQL
- Applied: `npx prisma migrate status` → `Database schema is up to date!` ✅
- `npx prisma generate` executed ✅

---

## Packages Installed

| Package | Type | Purpose |
|---|---|---|
| `csv-parse` | dependency | Streaming CSV parser |
| `exceljs` | dependency | XLSX streaming reader |
| `@types/multer` | devDependency | TypeScript types for Express.Multer.File |

`multer` itself is available as a transitive dependency of `@nestjs/platform-express`.

---

## Files Changed

### New files (17)

| File | Description |
|---|---|
| `backend/src/trade-data-refinery/ingestion/constants/ingestion-error.codes.ts` | INGESTION_ERROR error code constants |
| `backend/src/trade-data-refinery/ingestion/constants/ingestion.limits.ts` | Upload/processing limits (file size, row caps, chunk size) |
| `backend/src/trade-data-refinery/ingestion/storage/storage-key.util.ts` | Safe storage key generation, path traversal guard |
| `backend/src/trade-data-refinery/ingestion/storage/storage.service.ts` | LocalDiskStorageAdapter: persist/read/remove temp+permanent |
| `backend/src/trade-data-refinery/ingestion/utils/file-hash.util.ts` | SHA-256 streaming file hash |
| `backend/src/trade-data-refinery/ingestion/utils/row-hash.util.ts` | Deterministic row hash (sorted keys, unicode-safe) |
| `backend/src/trade-data-refinery/ingestion/utils/schema-fingerprint.util.ts` | Header fingerprint (sorted, case-insensitive) |
| `backend/src/trade-data-refinery/ingestion/parsers/parser.types.ts` | ParsedRow, ParseResult shared types |
| `backend/src/trade-data-refinery/ingestion/parsers/csv.parser.ts` | Streaming CSV parser (csv-parse, bom-safe, from_line:2) |
| `backend/src/trade-data-refinery/ingestion/parsers/xlsx.parser.ts` | XLSX bounded parser (exceljs streaming, event cast, first sheet) |
| `backend/src/trade-data-refinery/ingestion/mapping/mapping-resolver.service.ts` | Active mapping resolution (tenant-specific over platform) |
| `backend/src/trade-data-refinery/ingestion/upload/upload.dto.ts` | UploadBatchDto: tradeDirection, mappingProfileId, mappingVersion? |
| `backend/src/trade-data-refinery/ingestion/upload/upload.service.ts` | Upload orchestration: direction RBAC, hash, dup checks, transaction |
| `backend/src/trade-data-refinery/ingestion/upload/upload.controller.ts` | POST /tdr/batches/upload with FileInterceptor + diskStorage |
| `backend/src/trade-data-refinery/ingestion/handler/tdr-ingestion-handler.service.ts` | TdrIngestionHandlerService: implements TdrJobHandler, auto-registers |
| `backend/src/trade-data-refinery/ingestion/tdr-ingestion.module.ts` | TdrIngestionModule (unused by main module — kept for docs) |
| `backend/src/trade-data-refinery/tdr-mega3-unit.spec.ts` | 72 unit tests (71 active + 1 skippable 1M proof) |

### Modified files (7)

| File | Change |
|---|---|
| `backend/prisma/schema.prisma` | Added `QUALITY_PENDING` to BatchStatus, `PENDING_QUALITY` to RowDisposition |
| `backend/prisma/migrations/20260918231408_tdr_ingestion_enums/migration.sql` | Additive enum migration (new file) |
| `backend/src/trade-data-refinery/types/batch-transition.ts` | Added QUALITY_PENDING to transition map (PROCESSING→QUALITY_PENDING, QUALITY_PENDING→PROCESSING/READY/FAILED) |
| `backend/src/trade-data-refinery/trade-data-refinery.module.ts` | Added ingestion providers + UploadController; removed TdrIngestionModule import (circular dep resolved) |
| `backend/src/trade-data-refinery/services/tdr-job-orchestrator.service.ts` | Added: completeJobWithStatus(batchStatus), retryJob(...), isLeaseOwned(...) |
| `backend/package.json` | Added csv-parse, exceljs, @types/multer |
| `backend/package-lock.json` | Updated lock file |
| `WDR/_All/Trade-Data-Refinery/TDR-MVP-BACKEND-CORE-001-CORRECTION-001_WDR_2026-09-19_04-00.md` | Commit hash fill-in: (to be filled) → 39e0291 |

---

## Architecture Decisions

### Upload Flow
1. `POST /tdr/batches/upload` — `FileInterceptor` with multer `diskStorage` to `os.tmpdir()/tdr-uploads/`
2. File extension filter at multer layer: `.csv`, `.xlsx` only
3. File size limit at multer layer: 500MB (PM-001 default)
4. In `UploadService.handleUpload()`:
   - Direction RBAC check (IMPORT_MANAGER→IMPORT only; EXPORT_MANAGER→EXPORT only)
   - SHA-256 streaming hash of temp file
   - Source duplicate check: `TdrSourceFile.@@unique([tenantId, contentHash])` → 409 Conflict
   - Active mapping resolution (tenant-specific > platform)
   - Processing fingerprint computation (tenantId:contentHash:versions)
   - Processing fingerprint duplicate check → 409 Conflict
   - Schema fingerprint check against mapping (if mapping specifies)
   - Storage key generated: `{tenantId}/{pre-generated sourceFileId}`
   - Temp → permanent via `fs.renameSync`
   - Transaction: `TdrSourceFile + TdrBatch (QUEUED) + TdrProcessingJob (PENDING)`
   - Compensation: if DB fails after file moved, permanent file is deleted

### LocalDiskStorageAdapter
- Storage root: `process.env.TDR_STORAGE_PATH || ./uploads` (relative to cwd)
- Key format: `{tenantId}/{sourceFileId}` (no user input in path)
- `isStorageKeySafe()` guards against `..`, absolute paths, null bytes
- `persist(tempPath, key)`: `fs.renameSync` — atomic on same volume
- `removeSafe(key)`, `removeTempSafe(tempPath)`: best-effort, no-throw

### CSV Parser (csv-parse v5)
- Streaming via `createReadStream(filePath).pipe(parse(...))`
- Headers extracted separately: `to: 1, columns: false` first pass
- Data rows: `from_line: 2, columns: headers, relax_column_count: true, cast: false`
- BOM-safe: `bom: true`
- Async generator interface — backpressure from caller naturally limits memory
- Row cap: `MAX_CSV_ROWS = 10,000,000` (enforced in generator)

### XLSX Parser (exceljs streaming)
- `ExcelJS.stream.xlsx.WorkbookReader` with event-based API
- TypeScript cast required: `WorkbookReader`/`WorksheetReader` lack `on()` in type defs
- First worksheet only; skips remaining sheets
- Rows collected in bounded array: max `MAX_XLSX_ROWS = 2,000,000`
- Memory: proportional to `maxRows × cols × avg_cell_size` (bounded by 100MB file cap)
- `xlsxCellToString()`: handles string, number, boolean, Date, richText, formula result, error

### TdrIngestionHandlerService
- Implements `TdrJobHandler` — registers with `TdrProcessorService.registerHandler(this)` on `onModuleInit()`
- Calls `TdrProcessorService.startPolling()` on init (starts the 5s poll loop)
- Per-job heartbeat: `setInterval(30s)` during processing
- Checkpoint: called after every 500-row chunk commit
- Lease guard: `orchestrator.isLeaseOwned(jobId, workerInstanceId)` before each chunk
- Retry: if `attemptCount < maxAttempts`, calls `orchestrator.retryJob(...)` (PENDING + error logged, `lastCheckpointRow` preserved)
- Permanent failure: if `attemptCount >= maxAttempts`, calls `orchestrator.failJob(...)`
- Restart: resumes from `job.lastCheckpointRow` (skips already-committed rows)
- On success: `orchestrator.completeJobWithStatus(job.id, 'QUALITY_PENDING')`
- Row disposition: `PENDING_QUALITY` for all rows from ingestion
- `exportEligible: false` for all rows from ingestion

### Orchestrator Additions (additive — no existing method changed)
| Method | Purpose |
|---|---|
| `completeJobWithStatus(jobId, batchStatus)` | Completes job, sets batch to given status (e.g. QUALITY_PENDING) |
| `retryJob(jobId, workerId, errorMessage, errorCode?)` | Resets LEASED job to PENDING; preserves lastCheckpointRow |
| `isLeaseOwned(jobId, workerId)` | Returns true if job is still LEASED by this worker |

### Circular Dependency Resolution
`TdrIngestionModule` was originally imported by `TradeDataRefineryModule`, but `TdrIngestionHandlerService` needed `TdrJobOrchestratorService` and `TdrProcessorService` from `TradeDataRefineryModule`. Circular dep resolved by registering all ingestion providers directly in `TradeDataRefineryModule` (no separate module import needed). The `tdr-ingestion.module.ts` file is kept for documentation but not imported.

---

## Deliverable Checklist

| Deliverable | Status |
|---|---|
| Section 4 pre-flight: enum gap audit | ✅ |
| PENDING_QUALITY added to RowDisposition (schema + migration) | ✅ |
| QUALITY_PENDING added to BatchStatus (schema + migration) | ✅ |
| prisma migrate + generate | ✅ |
| csv-parse, exceljs, @types/multer installed | ✅ |
| StorageService (LocalDisk: persist/read/remove/generateKey) | ✅ |
| isStorageKeySafe (no path traversal, no null bytes, no absolute paths) | ✅ |
| computeFileHash (SHA-256 streaming) | ✅ |
| computeRowHash (sorted keys, unicode-safe, deterministic) | ✅ |
| computeSchemaFingerprint (sorted, case-insensitive, deterministic) | ✅ |
| CSV streaming parser (csv-parse, bom-safe, from_line:2, async generator) | ✅ |
| XLSX bounded parser (exceljs streaming events, first sheet, row cap) | ✅ |
| MappingResolverService (tenant-specific > platform, active only) | ✅ |
| UploadBatchDto (tradeDirection, mappingProfileId, mappingVersion?) | ✅ |
| UploadService: direction RBAC, SHA-256, dup checks, schema fingerprint, transaction | ✅ |
| POST /tdr/batches/upload (SUPER_ADMIN, TENANT_ADMIN, IMPORT_MANAGER, EXPORT_MANAGER) | ✅ |
| Direction RBAC: IMPORT_MANAGER→IMPORT only; EXPORT_MANAGER→EXPORT only | ✅ |
| Storage compensation on DB failure | ✅ |
| TdrIngestionHandlerService implements TdrJobHandler | ✅ |
| Auto-registration with TdrProcessorService on onModuleInit | ✅ |
| startPolling() called automatically after handler registration | ✅ |
| 500-row chunked transaction (TdrRecord.createMany + optional TdrSourceRow) | ✅ |
| PENDING_QUALITY row disposition for all ingested rows | ✅ |
| exportEligible = false for all ingested rows | ✅ |
| Checkpoint per chunk (orchestrator.checkpoint) | ✅ |
| Lease guard per chunk (isLeaseOwned check) | ✅ |
| Retry logic (attemptCount < maxAttempts → retryJob, else failJob) | ✅ |
| Restart from lastCheckpointRow (skip already-committed rows) | ✅ |
| Batch → QUALITY_PENDING on success | ✅ |
| Heartbeat (30s interval during processing) | ✅ |
| batch-transition.ts QUALITY_PENDING transitions | ✅ |
| TradeDataRefineryModule updated with ingestion providers | ✅ |
| 71 active unit tests (172 Mega 3 assertions) | ✅ |
| 1M row architecture proof | ✅ |
| Full regression 265/266 PASS (1 skipped = 1M proof gate) | ✅ |
| TypeScript 0 errors | ✅ |
| Diff audit | ✅ |

---

## RBAC Summary

| Role | Upload IMPORT | Upload EXPORT |
|---|---|---|
| SUPER_ADMIN | ✅ | ✅ |
| TENANT_ADMIN | ✅ | ✅ |
| IMPORT_MANAGER | ✅ | ❌ 403 |
| EXPORT_MANAGER | ❌ 403 | ✅ |
| All other roles | ❌ (blocked by @Roles guard before reaching controller) | ❌ |

---

## 1M Row Architecture Proof

| Metric | Value |
|---|---|
| Rows generated | 1,000,000 |
| Headers | 6 (hs_code, quantity, unit_price, currency, country, description) |
| Rows parsed / streamed | 1,000,000 |
| Chunks produced (500/chunk) | 2,000 |
| Time elapsed | ~13 seconds |
| Max buffered rows | ≤500 (one chunk at a time — streaming) |
| File committed | NO (temp file, deleted after test) |

Proof executed via `TDR_1M_PROOF=1 npx jest --testPathPattern="tdr-mega3-unit"` — all 72 tests PASS.

---

## Test Results

### Full regression (without 1M proof)
```
Test Suites: 7 passed, 7 total
Tests:       1 skipped, 265 passed, 266 total
Time:        16.1 s
```

### Mega 3 only (with 1M proof)
```
Test Suites: 1 passed, 1 total
Tests:       72 passed, 72 total
Time:        17.6 s
```

### Test groups (tdr-mega3-unit.spec.ts)
| Group | Tests | Coverage |
|---|---|---|
| computeFileHash | 5 | determinism, 64-char hex, content diff, reference match, missing file error |
| computeRowHash | 6 | hex, determinism, column-order independence, value diff, undefined=empty, unicode |
| computeSchemaFingerprint | 5 | hex, column-order independence, **case-PRESERVING** (CORRECTION-001), diff headers, determinism |
| generateStorageKey | 1 | key format |
| isStorageKeySafe | 5 | safe, path traversal, absolute, null byte, empty |
| validateHeaders | 4 | valid, NO_HEADERS, DUPLICATE_HEADER, MALFORMED_HEADER |
| UploadBatchDto | 6 | IMPORT valid, EXPORT valid, bad direction, missing profile, empty profile, optional version |
| batch-transition QUALITY_PENDING | 6 | valid transitions, invalid CANCELLED, present in map |
| ingestion constants | 3 | CHUNK_SIZE, MAX_UPLOAD_BYTES, ACCEPTED_EXTENSIONS |
| upload direction authorization | 9 | all 4 roles + edge cases |
| source duplicate detection | 1 | ConflictException on existing record |
| processing fingerprint duplicate | 1 | ConflictException on existing fingerprint |
| UploadController RBAC metadata | 2 | required roles, excluded roles |
| TdrJobOrchestratorService Mega 3 | 4 | completeJobWithStatus, retryJob, isLeaseOwned true/false |
| chunk boundary logic | 5 | 500, 501, 1000, 1, 1M rows |
| INGESTION_ERROR codes | 2 | uniqueness, required codes present |
| file extension filter | 6 | .csv, .xlsx, .txt, .exe, none, uppercase |
| 1M row proof (TDR_1M_PROOF=1) | 1 (skippable) | 1M rows streamed, 2000 chunks of 500 |

---

## TypeScript Check

```
npx tsc --noEmit → exit code 0 (0 errors)
```

Note: `xlsx.parser.ts` requires `EventEmitter` cast because `ExcelJS.stream.xlsx.WorkbookReader`/`WorksheetReader` lack `on()` in TypeScript definitions. Documented and safe.

---

## Diff Audit

| Check | Result |
|---|---|
| No user input in storage paths | ✅ (storageKey = tenantId/sourceFileId, server-generated) |
| isStorageKeySafe rejects traversal | ✅ |
| Direction RBAC enforced at service layer | ✅ |
| Source duplicate detection (409) | ✅ |
| Processing fingerprint duplicate detection (409) | ✅ |
| Schema fingerprint mismatch throws ConflictException | ✅ |
| Storage compensation on DB failure | ✅ |
| PENDING_QUALITY used for all row dispositions | ✅ |
| exportEligible = false for all rows | ✅ |
| Checkpoint after each chunk | ✅ |
| Lease guard before each chunk | ✅ |
| Retry vs permanent fail logic (attemptCount check) | ✅ |
| lastCheckpointRow preserved on retry | ✅ (retryJob does not touch it) |
| Batch → QUALITY_PENDING on success | ✅ |
| Existing orchestrator methods unchanged | ✅ (3 methods added, 0 modified) |
| Existing Mega 2 tests unaffected | ✅ (194/194 still pass) |
| No schema migration reset | ✅ |
| No destructive SQL | ✅ (ADD VALUE only) |
| DATABASE_URL in any output | NO |
| backend/.env staged | NO |
| WDR/_All/ERP64-Governance/ staged | NO |
| docs/ERP64_GOVERNANCE/ staged | NO |
| scripts/ staged | NO |
| F:\OpenCode\shop.com accessed | NO |
| git add . / -A / --all used | NO |
| Push performed | NO |
| Mega 4 started | NO |

---

## Open PM Decisions (carried forward unchanged)

| # | Decision | Status |
|---|---|---|
| PM-001 | Maximum upload file size | Default 500MB; OPEN for PM override |
| PM-002 | Retention policy for TdrRecord data | OPEN — Mega 6 scope |
| PM-003 | TdrSourceRow storage: opt-in (default OFF) | OPEN — handler checks batch.storeSourceRows |
| PM-004 | Quarantine corrections: as-entered or hash-referenced | OPEN |
| PM-005 | Mega 5 frontend auth: in-memory JWT or localStorage | OPEN |
| PM-006 | Replay authorization policy | OPEN — SUPER_ADMIN + TENANT_ADMIN only (CORRECTION-001) |
| PM-007 | Export output format | OPEN — Mega 4 scope |
| PM-008 | Soft-delete for TdrRecord | OPEN — Mega 6 scope |

---

## Safety Boundaries

| Boundary | Status |
|---|---|
| `git add .` / `-A` / `--all` | NOT USED |
| `prisma migrate reset` | NOT EXECUTED |
| Destructive SQL | NONE — additive ALTER TYPE only |
| DATABASE_URL in any output | NOT PRESENT |
| `backend/.env` staged | NO |
| `WDR/_All/ERP64-Governance/` staged | NO |
| `docs/ERP64_GOVERNANCE/` staged | NO |
| `scripts/` staged | NO |
| `F:\OpenCode\shop.com` accessed | NO |
| Push to remote | NOT PERFORMED |
| TDR-MVP-QUALITY-EXPORT-001 started | NO |

---

## Commit

| Field | Value |
|---|---|
| Hash | `caa90fc` |
| Subject | `feat(tdr): TDR-MVP-INGESTION-ENGINE-001 Mega 3 upload + ingestion engine + 71 tests` |
| Branch | `codex/trade-data-refinery` |
| Files staged | 25 exact files |
| Push performed | NO |

---

## Final Verdict

**MEGA 3 PASS — READY FOR TDR-MVP-QUALITY-EXPORT-001 (Mega 4)**

Mega 3 deliverables complete:
- Section 4 enum pre-flight: QUALITY_PENDING + PENDING_QUALITY added + migrated ✅
- LocalDiskStorageAdapter + path traversal protection ✅
- SHA-256 streaming file hash ✅
- Deterministic row hash + schema fingerprint ✅
- CSV streaming parser (csv-parse, bom-safe, checkpoint-resumable) ✅
- XLSX bounded parser (exceljs streaming events, first sheet, 2M row cap) ✅
- POST /tdr/batches/upload with direction RBAC + duplicate detection ✅
- TdrIngestionHandlerService: auto-registration, 500-row chunks, PENDING_QUALITY, checkpoint/retry/recovery ✅
- Orchestrator: completeJobWithStatus + retryJob + isLeaseOwned (additive) ✅
- Batch transition map: QUALITY_PENDING added ✅
- 71 unit tests active + 1M row proof ✅
- Full regression 265/266 PASS (1 skipped = 1M proof gate) ✅
- TypeScript 0 errors ✅
- Safety boundaries maintained ✅

**Do NOT start TDR-MVP-QUALITY-EXPORT-001 without explicit PM authorization.**
