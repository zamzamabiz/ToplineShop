# WDR — TDR-POST-MVP-STORAGE-DURABILITY-001
## Storage Abstraction + Local Durability + S3 Readiness

| Field | Value |
|---|---|
| Task ID | TDR-POST-MVP-STORAGE-DURABILITY-001 |
| Status | **PASS** |
| Date | 2026-09-21 |
| Branch | codex/trade-data-refinery |
| Starting HEAD | a7d3a14 |
| Commit | (see below) |

---

## Scope

**IN SCOPE (executed):**
- `IStorageAdapter` interface — single contract for all storage operations
- `LocalFsStorageAdapter` — local filesystem, D:\ToplineShopData\TDR root, EXDEV-safe
- `S3StorageAdapter` — S3-compatible object storage, lazy-loaded SDK, foundation-tested
- `TempCleanupService` — 24h age-based orphan temp-file cleanup, 1h interval
- `StorageService` refactored as DI facade delegating to adapter
- `STORAGE_ADAPTER` / `TDR_STORAGE_PATH` / S3 env vars in `.env.example`
- Storage key backward-compatibility preserved (`{tenantId}/{sourceFileId}`)
- D:\ToplineShopData\TDR directory created with `source/`, `exports/`, `temp/`, `archive/`
- Migration of 13 files from `backend/uploads/` to `D:\ToplineShopData\TDR\` (originals retained)
- 44 new storage abstraction tests (`tdr-storage-abstraction.spec.ts`)

**OUT OF SCOPE (not executed):**
Source-file archive schema, retentionExpiresAt, deletedAt/tombstone, export expiry schema,
signed URL generation, live S3 cloud test, streaming CSV/XLSX parsers for S3, BullMQ, Phase 7+

---

## Security Boundaries (all maintained)

| Constraint | Status |
|---|---|
| No credentials committed | ✓ `.env.example` has empty S3 placeholders only |
| No S3 secrets logged | ✓ S3 config vars excluded from Logger output |
| No absolute local path returned to frontend | ✓ `getFilePath()` is backend-internal only |
| Tenant boundaries preserved | ✓ Storage keys remain `{tenantId}/...` scoped |
| Storage keys cannot escape root/bucket prefix | ✓ `isStorageKeySafe()` guards all key resolution |
| Original source files remain immutable | ✓ `put()` writes to new path; never modifies source |
| Export artifact access remains authenticated | ✓ No change to export download auth flow |
| Originals NOT deleted | ✓ `backend/uploads/` untouched; copies only |
| shop.com isolation | ✓ Not accessed |
| git add -A / git add . never used | ✓ Exact-file staging only |

---

## Files Changed

### New Files
| File | Purpose |
|---|---|
| `backend/src/trade-data-refinery/ingestion/storage/i-storage.adapter.ts` | IStorageAdapter interface |
| `backend/src/trade-data-refinery/ingestion/storage/storage.config.ts` | resolveStorageConfig() with env validation |
| `backend/src/trade-data-refinery/ingestion/storage/local-fs.adapter.ts` | LocalFsStorageAdapter (EXDEV-safe) |
| `backend/src/trade-data-refinery/ingestion/storage/s3.adapter.ts` | S3StorageAdapter (lazy SDK, mock-tested) |
| `backend/src/trade-data-refinery/ingestion/storage/temp-cleanup.service.ts` | TempCleanupService (24h/1h) |
| `backend/src/trade-data-refinery/tdr-storage-abstraction.spec.ts` | 44 storage abstraction tests |

### Modified Files
| File | Change |
|---|---|
| `backend/src/trade-data-refinery/ingestion/storage/storage.service.ts` | Refactored to DI facade, delegates to IStorageAdapter |
| `backend/src/trade-data-refinery/trade-data-refinery.module.ts` | Added TempCleanupService to providers |
| `backend/.env.example` | Added STORAGE_ADAPTER, TDR_STORAGE_PATH, S3 vars, durability contract |
| `backend/src/trade-data-refinery/tdr-mega3-unit.spec.ts` | Fixed EXDEV test spy (resolvePath moved to adapter) |
| `backend/package.json` / `package-lock.json` | Added @aws-sdk/client-s3 |

---

## Storage Architecture

```
StorageService (DI boundary, injected by all consumers)
  └── IStorageAdapter (interface)
       ├── LocalFsStorageAdapter   ← STORAGE_ADAPTER=local (default dev)
       │     Root: TDR_STORAGE_PATH (dev: D:\ToplineShopData\TDR)
       │     EXDEV-safe: rename → stream copy + size verify
       │
       └── S3StorageAdapter        ← STORAGE_ADAPTER=s3 (production)
             Bucket: S3_BUCKET
             Prefix: S3_KEY_PREFIX (default: tdr/)
             Lazy-loads @aws-sdk/client-s3
```

**Storage key contract (backward-compatible):**
- Source files: `{tenantId}/{sourceFileId}` — unchanged from existing DB rows
- Export files: `exports/{tenantId}/{jobId}.csv` — unchanged

**S3 limitation (documented):** CSV/XLSX ingestion parsers require local file paths.
`S3StorageAdapter.getLocalPath()` returns null. `StorageService.getFilePath()` throws for S3.
Future task: add streaming parser support. Switch to S3 is blocked on this.

---

## Migration Proof

| Metric | Value |
|---|---|
| Files in `backend/uploads/` (before) | 13 |
| Files in `D:\ToplineShopData\TDR\` (after) | 13 |
| Size mismatches | 0 |
| Hash mismatches (SHA-256) | 0 |
| Originals deleted | 0 (retained) |

Files migrated:
- 4 source files under `6755271c-7b4c-40f2-a5aa-8be135cee886/`
- 5 export CSV files under `exports/6755271c-7b4c-40f2-a5aa-8be135cee886/`
- 4 sample CSV files under `samples/`

---

## Test Results

| Suite | Result |
|---|---|
| `tdr-storage-abstraction.spec.ts` | 44/44 PASS |
| Full backend Jest | 719/720 PASS (1 skip pre-existing) |
| Frontend Vitest | 129/129 PASS |
| `npx tsc --noEmit` | 0 errors |
| `prisma validate` | schema valid |
| `prisma migrate status` | up to date (7 migrations) |

Backend test count: up from 675 to 719 (+44 new).

### §23 Tests Coverage

| § | Test | Status |
|---|---|---|
| SA.1 | Path traversal rejection (6 cases) | ✓ |
| SA.2 | Local put/read/exists/delete/copy/metadata | ✓ |
| SA.3 | Nested directory creation | ✓ |
| SA.4 | EXDEV fallback to streaming copy | ✓ |
| SA.5 | Copy size verification | ✓ |
| SA.6 | Invalid root/key fails safely | ✓ |
| SA.7 | Source key tenant-scoped | ✓ |
| SA.8 | Export key format | ✓ |
| SA.9 | SHA-256 hash verification helper | ✓ |
| SA.10 | S3 adapter put (mocked SDK) | ✓ |
| SA.11 | S3 adapter get/head (mocked SDK) | ✓ |
| SA.12 | S3 adapter delete (mocked SDK) | ✓ |
| SA.13 | S3 getLocalPath returns null | ✓ |
| SA.14 | Missing S3 config fails startup validation | ✓ |
| SA.15 | Temp cleanup: ignores recent files | ✓ |
| SA.16 | Temp cleanup: removes stale orphan files | ✓ |
| SA.17 | Temp cleanup: ignores non-TDR files | ✓ |
| SA.18 | StorageService persist delegates to adapter.put | ✓ |
| SA.19 | getFilePath throws for S3 adapter | ✓ |
| SA.20 | Old storageKey format resolves correctly | ✓ |
| SA.21 | Export storageKey resolves to exports subdir | ✓ |
| SA.22 | createReadStream delegates to adapter.getStream | ✓ |

---

## Durability Contract

**LOCAL (D:\ToplineShopData\TDR):**
- Development convenience only
- No automated backup — manual backup required
- EXDEV-safe atomic writes (rename or stream copy + size verify)
- Age-based temp file cleanup (24h threshold, 1h interval)

**PRODUCTION (S3):**
- S3-compatible durable object storage (AWS S3, MinIO, Cloudflare R2)
- Versioning recommended
- Encryption at rest recommended (SSE-S3 or SSE-KMS)
- Cross-region replication or provider durability strategy for DR

**RESTORE CONTRACT:**
PostgreSQL backup protects metadata (TdrSourceFile, TdrBatch, TdrExportJob).
Object-storage backup protects binary files (source + export artifacts).
A valid restore requires BOTH: metadata DB and object storage in sync.
storageKey, contentHash, tenantId, sourceFileId must be preserved across restore.

---

## Blockers

None.

---

## Next

- PM authorization required before proceeding
- Suggested next Mega task: TDR-POST-MVP-RELIABILITY-001 (Mega 8) or
  TDR-POST-MVP-AUDIT-LOG-001 per post-MVP readiness plan
- S3 limitation (streaming parsers) must be resolved before switching to STORAGE_ADAPTER=s3
