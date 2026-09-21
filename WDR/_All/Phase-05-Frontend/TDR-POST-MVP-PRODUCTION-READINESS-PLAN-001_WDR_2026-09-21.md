# WDR — TDR-POST-MVP-PRODUCTION-READINESS-PLAN-001
**Date:** 2026-09-21
**Branch:** codex/trade-data-refinery
**Author:** Javed Ahmed Chohan
**Starting HEAD:** cf1ad8fe9dd7545a4dc4565a0ddab6928ba69e8f
**Mode:** READ-ONLY ARCHITECTURE + PRODUCTION READINESS PLAN
**Type:** Planning / Governance Artifact — NO APPLICATION CODE CHANGED

---

## §1 Accepted MVP Baseline

| Item | Commit | Status |
|------|--------|--------|
| TDR MVP — Final Acceptance | 5783bb6 | OWNER ACCEPTED |
| Governance freeze | ccb8874 | FROZEN |
| Export rowCount crash correction | bf9e5ef + cf1ad8f | PASS |
| MVP Feature Development | — | FROZEN — DO NOT REOPEN |
| Phase 7 | — | NOT STARTED |

**Authoritative baseline commits:** `ccb8874` + `bf9e5ef`

---

## §2 Current Architecture

### 2.1 Stack Overview

| Layer | Technology | Port |
|-------|-----------|------|
| Frontend | Next.js (App Router), React 18, TypeScript | 3000 |
| Backend | NestJS, TypeScript | 4000 |
| Database | PostgreSQL via Prisma ORM | 5432 |
| File Storage | Local filesystem (`StorageService`) | n/a |
| Auth | JWT (access 15m) + HMAC-hashed refresh (30d) in DB | n/a |
| Workers | In-process NestJS `OnModuleInit` + `setInterval` pollers | n/a |

### 2.2 StorageService — Current Implementation

**File:** `backend/src/trade-data-refinery/ingestion/storage/storage.service.ts`

```
Root: process.env.TDR_STORAGE_PATH || process.cwd()/uploads
```

**Capabilities:**
- Path traversal guard: `isStorageKeySafe(key)`
- Atomic persist: `fs.renameSync` → EXDEV fallback stream-copy + size verify
- `createReadStream`, `getFilePath`, `removeSafe`, `removeTempSafe`
- No S3 adapter, no signed URLs, no object storage abstraction

**Source file storage key:** `generateStorageKey(tenantId, sourceFileId)` → tenant-scoped

**Export artifact storage key:** `exports/${tenantId}/${jobId}.csv` — hardcoded pattern in handler

**Temp file root (uploads):** `os.tmpdir()/tdr-uploads` (Multer diskStorage)
**Temp file root (exports):** `os.tmpdir()/tdr-export-<jobId>.csv.tmp`

**Missing from `.env.example`:** `TDR_STORAGE_PATH` is not documented in either `.env.example`.

### 2.3 Upload Service

**File:** `backend/src/trade-data-refinery/ingestion/upload/upload.service.ts`

- Accepted: `.csv`, `.xlsx`
- Size limit: 500 MB (`MAX_UPLOAD_BYTES`) — PM-001 open decision
- Content validation: XLSX magic bytes (PK\x03\x04), CSV null-byte check (first 1 KB)
- SHA-256 content hash → deduplication by `(tenantId, contentHash)` UNIQUE constraint
- Processing fingerprint hash → batch-level duplicate detection
- Atomic DB transaction: `TdrSourceFile` + `TdrBatch` + `TdrProcessingJob`
- Compensation: if DB fails after persist, removes permanent file

**What upload does NOT do:**
- No antivirus / malware scan
- No full MIME validation beyond extension + magic bytes
- No filename sanitisation beyond `path.basename`
- No tenant storage quota check
- No versioning metadata (`logicalDatasetId`, `supersedesSourceFileId`)

### 2.4 TdrSourceFile Model

**Current fields:** `id, tenantId, originalFilename, mimeType, fileSizeBytes, storageKey, contentHash, tradeDirection, uploadedById, uploadedAt, createdAt`

**Missing (target state):**
- `archivedAt: DateTime?`
- `deletedAt: DateTime?` (soft-delete tombstone)
- `deletedReason: String?`
- `retentionExpiresAt: DateTime?`
- `logicalDatasetId: String?` (for versioning groups)
- `versionNumber: Int?`
- `supersedesSourceFileId: String?`
- `supersededBySourceFileId: String?` (or on logicalDataset)
- `replacementReason: String?`

### 2.5 TdrBatch Model

**Current:** Has `replayOfBatchId`, `replayReason` → replay semantics exist.
**Missing:** Explicit archive flag, retention metadata, `parentLogicalDatasetId`.

### 2.6 TdrExportJob Model

**Current fields include:** `storageKey`, `contentHash`, `rowCount`, `rowLimit`, `filterConfig`, `status`, `leaseExpiresAt`, `attemptCount`, `maxAttempts`

**Missing:**
- `expiresAt: DateTime?` — export binary expiry (90-day default)
- `downloadCount: Int` — usage tracking

### 2.7 Authentication / Session Architecture

| Component | Current State |
|-----------|--------------|
| Session table | PostgreSQL `sessions` — persistent |
| Refresh token storage | HMAC hash in DB — GOOD |
| Access token TTL | 15 minutes |
| Refresh token TTL | 30 days |
| Rotation | Yes — revoke old, issue new on refresh |
| Replay detection | Yes — revoke all sessions on expired/revoked token reuse |
| JWT secret fallback | `CHANGE_ME_DEV_ONLY` in code — **PRODUCTION BLOCKER** |
| Frontend token storage | In-memory React state only (PM-005 deferred) |
| Cookie / HttpOnly | Not implemented |
| Page refresh survival | Tokens lost — user must re-login |

### 2.8 Worker / Job Architecture

- **Type:** In-process NestJS pollers via `OnModuleInit`/`setInterval`
- **Lease mechanism:** PostgreSQL `FOR UPDATE SKIP LOCKED`
- **Heartbeat:** Periodic DB update during long-running jobs
- **Reclaim:** Separate interval reclaims expired leases
- **maxAttempts:** 3 (processing), 3 (quality), 3 (export)
- **Terminal state:** `FAILED` after `maxAttempts` — no infinite retry (corrected in CORRECTION-001)
- **Scale limit:** Single-process; horizontal scale requires leader election or external queue
- **No external queue:** Bull/BullMQ/Redis not present

### 2.9 Throttling

- `ThrottlerModule`: 100 requests / 60 seconds — global, not tenant-aware

### 2.10 Health Endpoint

`GET /health` — public, returns `{ api: 'ok', database: 'ok' }`. No readiness/liveness probe separation.

### 2.11 Logging

NestJS `Logger` (structured). No correlation IDs. No tenant-ID-safe log filtering. No log aggregation config. No log rotation.

### 2.12 Environment Variables

| Variable | Location | Status |
|----------|----------|--------|
| `NODE_ENV` | backend/.env.example | Present |
| `PORT` | backend/.env.example | Present |
| `DATABASE_URL` | backend/.env.example | Present (placeholder) |
| `JWT_ACCESS_SECRET` | backend/.env.example | Present (placeholder) |
| `JWT_REFRESH_SECRET` | backend/.env.example | Present (placeholder) |
| `CORS_ALLOWED_ORIGINS` | backend/.env.example | Present |
| `TDR_STORAGE_PATH` | **MISSING from .env.example** | GAP |
| `NEXT_PUBLIC_API_URL` | frontend/.env.example | Present |
| Secret management | None | MISSING |
| Production secret store | None | MISSING |

---

## §3 Approved Storage and Retention Policy

*(Locked owner/architect decisions — not for debate)*

### 3.1 Local Development Storage Target

```
D:\ToplineShopData\TDR\
  source\     ← permanent source file binaries
  exports\    ← completed export CSVs
  temp\       ← upload staging + export scratch
  archive\    ← archived source files (cold)
```

**Implementation requirement:** `TDR_STORAGE_PATH=D:\ToplineShopData\TDR` for dev. Application code must use `StorageService` logical keys — no hardcoded `D:\` paths in business logic.

**Current state:** `StorageService` already uses logical keys + `TDR_STORAGE_PATH` env override. The path structure sub-directories (`source/`, `exports/`, `temp/`, `archive/`) are not yet enforced — exports use `exports/${tenantId}/` prefix but source files use a flat generated key. **PARTIAL.**

### 3.2 Production Storage Target

**S3-compatible object storage.** `StorageService` must be replaced by a storage abstraction interface:

```typescript
interface IStorageAdapter {
  put(key: string, stream: Readable, meta?: StorageMeta): Promise<void>;
  get(key: string): Promise<Readable>;
  delete(key: string): Promise<void>;
  signedDownloadUrl(key: string, ttlSeconds: number): Promise<string>;
  exists(key: string): Promise<boolean>;
  copy(sourceKey: string, destKey: string): Promise<void>;
}
```

Concrete implementations: `LocalFsStorageAdapter` (dev), `S3StorageAdapter` (prod).

Business logic (`UploadService`, `TdrExportHandlerService`, export download) must depend on `IStorageAdapter`, not `StorageService` directly.

### 3.3 Source File Retention

| Phase | Status | Duration |
|-------|--------|---------|
| HOT / ACTIVE | Default | 0–12 months |
| ARCHIVED / COLD | After 12 months | To 7-year limit |
| Permanent retention | Application default | 7 years |
| Tenant contract override | Future | Configurable |

**7 years is an application default — not a legal claim.**

### 3.4 Export Artifact Retention

| Data | Retention |
|------|-----------|
| Export binary (CSV) | 90 days from completion |
| Export job metadata / hash / lineage | 7 years |
| Re-generation after expiry | From retained refined records |

### 3.5 Temp File Retention

| Scenario | Retention |
|----------|-----------|
| Successful job temp artifacts | Purge immediately after persist |
| Failed-job diagnostic artifacts | 7–30 days per diagnostic policy |

### 3.6 Source File Invariant

- Original uploaded file = **immutable source evidence**
- Never edit/overwrite original
- SAVE = automatic on successful upload
- EDIT ORIGINAL = prohibited

---

## §4 D:\ Local Development Plan

**Target:** Set `TDR_STORAGE_PATH=D:\ToplineShopData\TDR` in `backend/.env`.

**Required changes (not yet implemented):**
1. Create `D:\ToplineShopData\TDR\` directory structure
2. Add `TDR_STORAGE_PATH` to `backend/.env.example` with documentation
3. Enforce sub-directory routing in storage keys:
   - Source files: `source/{tenantId}/{sourceFileId}` (currently unqualified)
   - Export artifacts: `exports/{tenantId}/{jobId}.csv` (already prefixed)
   - Temp staging: not stored via StorageService — use `temp/` sub-path optionally
   - Archive: `archive/{tenantId}/{sourceFileId}` (future)

**IMPORTANT:** The D:\ path is development/local only. Production uses object storage.

---

## §5 Production Object-Storage Plan

### 5.1 StorageService Abstraction (Required before production)

Replace class injection with an interface-backed adapter:

```
StorageModule.forRoot({
  adapter: process.env.STORAGE_ADAPTER, // 'local' | 's3'
  s3: { bucket, region, accessKeyId, secretAccessKey, endpoint? }
  local: { rootPath: process.env.TDR_STORAGE_PATH }
})
```

All services receive `IStorageAdapter` via NestJS DI.

### 5.2 S3 Key Strategy

```
source/{tenantId}/{sourceFileId}       ← source uploads
exports/{tenantId}/{exportJobId}.csv   ← completed exports
temp/                                  ← NOT in S3 (use local tmp for processing)
archive/{tenantId}/{sourceFileId}      ← archived cold tier
```

### 5.3 Signed Download URLs

Export download: generate pre-signed URL (15-minute TTL) instead of streaming through application. Source file download: same pattern — role-gated, audited, signed URL returned.

### 5.4 New Environment Variables Required

```
STORAGE_ADAPTER=s3
S3_BUCKET=toplineshop-tdr-prod
S3_REGION=...
S3_ACCESS_KEY_ID=...
S3_SECRET_ACCESS_KEY=...
S3_ENDPOINT=...         # for non-AWS S3-compatible
```

---

## §6 File-Management UX Policy

### 6.1 Source File Actions

| Action | Visibility | Role | Confirmation | Backend Op | Audit Event | Resulting State |
|--------|-----------|------|-------------|-----------|-------------|----------------|
| View metadata | Default | TENANT_ADMIN, IMPORT/EXPORT_MANAGER, ANALYST | None | GET sourceFile | None | — |
| Download Original | Role-gated button | TENANT_ADMIN, IMPORT_MANAGER (IMPORT), EXPORT_MANAGER (EXPORT) | None | GET /tdr/source-files/:id/download → signed URL | `tdr.sourcefile.download` | — |
| Archive | Action menu | TENANT_ADMIN | "Archive this source file?" | PATCH sourceFile.archivedAt = now | `tdr.sourcefile.archived` | ARCHIVED; hidden from default lists |
| Upload New Version | Button on source detail | TENANT_ADMIN, IMPORT/EXPORT_MANAGER | None | POST /tdr/batches/upload with supersedesSourceFileId | `tdr.sourcefile.version_uploaded` | New sourceFileId + batchId; original unchanged |
| View Lineage | Button/tab | Any authenticated | None | GET batch + processing chain | None | — |
| Restore (archived) | Archive filter only | TENANT_ADMIN, SUPER_ADMIN | "Restore to active?" | PATCH sourceFile.archivedAt = null | `tdr.sourcefile.restored` | ACTIVE |
| Request Permanent Deletion | Admin panel only | TENANT_ADMIN | "Confirm delete + reason" | POST /admin/source-files/:id/deletion-request | `tdr.sourcefile.deletion_requested` | PENDING_DELETION; reviewed by SUPER_ADMIN |

**Never implement:** Edit Original, Save, Delete Now (ordinary button).

### 6.2 Archive Semantics

Archived data:
- Hidden from default active views
- Searchable through archive filter
- Read-only
- Restorable by TENANT_ADMIN/SUPER_ADMIN
- Not automatically reprocessed

Archive does NOT delete: source metadata, batch records, normalized records, corrections, lineage, audit history.

### 6.3 Permanent Deletion Workflow

Permanent deletion requires:
1. SUPER_ADMIN authorization
2. Retention period expired (default 7 years)
3. No active processing dependency
4. No legal hold flag
5. Impact preview (batch count, record count, export jobs)
6. Explicit confirmation + reason field
7. Audit record persisted
8. Tombstone metadata kept after physical deletion

Tenant administrator may **request** deletion; execution requires SUPER_ADMIN.

### 6.4 Batch Actions UX

| Action | Role | Confirmation | Notes |
|--------|------|-------------|-------|
| View batch detail | Any | None | Records, issues, quality status |
| View quarantine panel | TENANT_ADMIN, IMPORT/EXPORT_MANAGER | None | Issue list |
| Correct quarantine record | TENANT_ADMIN, IMPORT/EXPORT_MANAGER | Confirm correction | Triggers re-evaluation |
| Request replay | TENANT_ADMIN | "Reprocess this batch?" | Creates new batch with `replayOfBatchId` |
| View archived batches | Requires archive filter | None | Hidden from default view |

---

## §7 Gap Matrix

| ID | Area | Approved Target | Current State | Classification |
|----|------|----------------|--------------|----------------|
| G-A | Storage abstraction | `IStorageAdapter` interface | Concrete `StorageService` class (local FS only) | MISSING |
| G-B | Local FS configuration | `D:\ToplineShopData\TDR\` + sub-dirs in .env | `TDR_STORAGE_PATH` not in `.env.example`; flat key structure | PARTIAL |
| G-C | D:\ dev root | Directory + env var documented | Not created/documented | MISSING |
| G-D | Source-file metadata | versioning fields, archivedAt, deletedAt, retentionExpiresAt | None of these fields exist | MISSING |
| G-E | Original-file download | Role-gated endpoint + signed URL | No download endpoint for source files | MISSING |
| G-F | Archive/restore | Archive action, restore action, hidden from default views | Not implemented | MISSING |
| G-G | Retention lifecycle | HOT→ARCHIVE→7yr; export 90d | No lifecycle management | MISSING |
| G-H | Permanent deletion workflow | SUPER_ADMIN gate + impact preview + tombstone | No deletion workflow | MISSING |
| G-I | Versioned replacement upload | New sourceFileId + logical dataset link | Replay exists; no logical dataset/versioning | PARTIAL |
| G-J | Tombstones | Keep metadata after binary deletion | No soft-delete on TdrSourceFile | MISSING |
| G-K | Export expiry | 90-day binary expiry | No expiry field or cleanup job | MISSING |
| G-L | Temp cleanup | Purge on success; 7-30d on failure | Best-effort cleanup in handlers; no scheduled cleanup | PARTIAL |
| G-M | Storage audit events | Audit all file access | Upload audited; download not audited; archive/delete not audited | PARTIAL |
| G-N | File access RBAC | Per-direction per-role download | Upload RBAC done; download RBAC not implemented (no download endpoint) | PARTIAL |
| G-O | Object-storage readiness | S3-compatible adapter | Local-only `StorageService` | MISSING |
| G-P | Backup/recovery | PostgreSQL backup + object-storage backup + restore drills | No strategy documented or implemented | MISSING |
| G-Q | Malware/content scanning | AV scan on upload | Extension + magic bytes only | MISSING |
| G-R | Upload limits | PM-001 pending decision | 500 MB default — PM-001 open | OWNER DECISION REQUIRED |
| G-S | Checksum/integrity | SHA-256 on upload; periodic verify | SHA-256 on upload ✓; no periodic verify | PARTIAL |
| G-T | Tenant quotas | Future configurable | Not implemented | POST-MVP OPTIONAL |

---

## §8 Production Blockers (P0 — REQUIRED BEFORE PRODUCTION)

| # | Blocker | Current State | Required Action |
|---|---------|--------------|----------------|
| P0-001 | JWT secrets use `CHANGE_ME_DEV_ONLY` fallback in code | `auth.module.ts` line 15; `auth.service.ts` line 233 | Enforce secrets via env or secret manager; remove fallback |
| P0-002 | Frontend tokens in-memory only (PM-005) | Lost on page refresh; no httpOnly cookie | Implement secure httpOnly session strategy |
| P0-003 | CORS `ALLOWED_ORIGINS` hardcoded to localhost | `backend/.env.example` | Set production domain; validate at startup |
| P0-004 | No TLS/HTTPS configuration | HTTP only | TLS termination (reverse proxy or direct) |
| P0-005 | No secret management | Secrets in .env file | Use Vault, AWS Secrets Manager, or equivalent |
| P0-006 | `StorageService` is local-FS only | Not portable | `IStorageAdapter` abstraction + S3 implementation |
| P0-007 | `TDR_STORAGE_PATH` not in `.env.example` | Undocumented env var | Document + validate at startup |
| P0-008 | No database connection pooling config | Default Prisma pool | Set `connection_limit` and `pool_timeout` for production load |
| P0-009 | No migration deployment process | Manual `prisma migrate deploy` | Automate migration in deployment pipeline |
| P0-010 | Health endpoint does not separate liveness / readiness | Single `/health` | Add `/health/live` + `/health/ready` for orchestrator support |
| P0-011 | No rate limiting on upload endpoint | Global 100/60s throttle | Per-tenant upload rate limit + file-size-aware limits |
| P0-012 | No antivirus/malware scanning | Extension + magic bytes only | At minimum ClamAV or cloud scan before persist |
| P0-013 | Export temp files written to OS temp; no cleanup guarantee | Best-effort only | Scheduled cleanup job for orphaned temp files |
| P0-014 | Workers are in-process single-instance | Cannot horizontally scale | Document single-instance constraint; plan queue migration for scale |

---

## §9 Security Plan

### 9.1 MUST BEFORE PRODUCTION

| Item | Issue | Action |
|------|-------|--------|
| JWT secret enforcement | `CHANGE_ME_DEV_ONLY` fallback | Remove fallback; crash on startup if secret missing/weak |
| Upload content validation | Extension + magic bytes only | Add ClamAV or equivalent AV scan async pipeline |
| MIME/extension validation | Extension check only | Validate `Content-Type` header + recheck post-upload |
| Filename sanitization | `path.basename` only | Reject non-standard characters; normalize Unicode |
| Path traversal | `isStorageKeySafe` exists | Audit + add integration test; extend to S3 key validation |
| Object authorization | Not on source file download | Enforce tenantId + RBAC on every file access |
| Encryption in transit | HTTP only | TLS required for all endpoints |
| Secret rotation | Hardcoded fallback | Establish rotation policy + automated process |
| RBAC audit | Upload RBAC verified | Audit download, archive, correction, export endpoints |
| Tenant isolation | DB constraints + tenantId in queries | Penetration test tenant boundary |
| Rate limiting | Global 100/60s | Per-tenant + per-IP rate limits; upload endpoint separate |
| Upload abuse limits | 500 MB single file | Add per-tenant daily/monthly upload byte quota |

### 9.2 SHOULD AFTER MVP

| Item | Action |
|------|--------|
| Signed download URLs | Pre-signed S3 URLs (15 min) instead of proxy streaming |
| Encryption at rest | S3 SSE-KMS or equivalent |
| Retention/deletion audit | Full audit trail for every retention lifecycle event |
| Session concurrent limit | Max N active sessions per user (configurable) |
| IP-change re-auth | Flag or require re-authentication on IP change |

### 9.3 LATER

| Item | Action |
|------|--------|
| Advanced malware sandboxing | Deep content analysis pipeline |
| DLP (data loss prevention) | Detect PII/sensitive fields in exports |
| SOC 2 compliance mapping | Map controls to architecture |

---

## §10 Auth Persistence Plan (PM-005)

### Current State

Tokens live in React state only. Lost on page refresh. PM-005 was deferred from MVP. The backend session architecture (DB-persisted, rotation, replay detection) is production-ready.

### Options

**Option A — Maintain in-memory only (current)**
- Pros: No XSS token theft via storage
- Cons: UX disruption on every refresh; users must re-login constantly
- Production suitability: **NOT ACCEPTABLE** for production

**Option B — Secure HttpOnly Cookie (RECOMMENDED)**
- Access token: short-lived Bearer in memory (as now)
- Refresh token: `HttpOnly; Secure; SameSite=Strict` cookie — JS cannot read it
- Backend: `/auth/refresh` endpoint reads cookie server-side
- Frontend: No storage changes; cookie managed by browser
- Pros: Best-practice auth; survives page refresh; resistant to XSS token theft
- Cons: Requires CSRF protection (`SameSite=Strict` handles most cases)
- Production suitability: **RECOMMENDED**

**Option C — sessionStorage**
- Survives page refresh within tab; lost on tab close
- Token accessible to JS — XSS risk
- Not recommended for refresh tokens

**Recommendation:** Implement Option B (HttpOnly cookie) as part of PM-005. Backend already has the session infrastructure; the change is primarily frontend cookie handling + backend `Set-Cookie` on login/refresh.

**Do NOT use:** `localStorage` for refresh tokens.

---

## §11 Backup / Restore / DR Plan

### 11.1 PostgreSQL

| Parameter | Target |
|-----------|--------|
| Backup type | Continuous WAL archiving + daily base backup |
| Frequency | Daily full; continuous WAL (point-in-time recovery) |
| Retention | 30 days |
| RPO | < 1 hour |
| RTO | < 4 hours |
| Offsite | Cross-region replica or S3 WAL archive |
| Restore drill | Monthly restore drill to staging |
| Tool | pg_basebackup + WAL-G or managed PostgreSQL (RDS/Cloud SQL) |

### 11.2 Source Object Files

| Parameter | Target |
|-----------|--------|
| Storage type | S3 with versioning enabled |
| Replication | S3 cross-region replication |
| RPO | Near-zero (S3 replication lag) |
| RTO | Minutes (S3 access restored) |
| Backup drill | Quarterly test-restore of sample files |

### 11.3 Mapping Configuration

Stored in PostgreSQL (`tdr_schema_mappings`) → covered by PostgreSQL backup.

### 11.4 Audit / History

Stored in PostgreSQL (`audit_logs`) → covered by PostgreSQL backup. Immutable by design.

### 11.5 Exports Where Retained

- Within 90-day window: stored in S3 → covered by S3 replication
- After 90 days: regenerable from retained refined records

### 11.6 DR Targets

| Scenario | RPO | RTO |
|----------|-----|-----|
| Database corruption | < 1 hour | < 4 hours |
| Object storage loss | Near-zero | Minutes |
| Full region failure | < 24 hours | < 8 hours |

### 11.7 Restore Drill Cadence

- Monthly: PostgreSQL PITR to staging
- Quarterly: Full DR drill (DB + object storage)
- Annually: Cross-region failover test

---

## §12 Observability Plan

### 12.1 Structured Logging

| Item | Current | Required |
|------|---------|---------|
| Framework | NestJS Logger | Add `pino` or `winston` structured logger |
| Correlation ID | Missing | `X-Request-ID` header; propagate through all log lines |
| Tenant ID in logs | Missing | Include tenantId in log context; NEVER log raw trade row data |
| Log levels | Default NestJS | ERROR, WARN, INFO, DEBUG — configurable per environment |
| Log aggregation | None | Centralized (e.g., CloudWatch, Datadog, ELK) |
| Log rotation | None | Implement for local dev; use service in production |

### 12.2 Job / Worker Metrics

| Metric | Collection |
|--------|-----------|
| Processing job queue depth (PENDING) | DB query on cron/poll |
| Quality job queue depth (PENDING) | DB query |
| Export job queue depth (PENDING) | DB query |
| Job failure rate | Count FAILED jobs per 1h window |
| Job processing latency | `completedAt - createdAt` per job |
| Lease reclaim count | Log + counter |
| Heartbeat misses | Log + alert |

### 12.3 API Metrics

| Metric | Collection |
|--------|-----------|
| API request latency | Middleware histogram (p50/p95/p99) |
| Error rate per endpoint | Count 4xx/5xx |
| Upload request count | Counter |
| Export request count | Counter |
| Active sessions count | DB query |

### 12.4 Storage Metrics

| Metric | Notes |
|--------|-------|
| Storage bytes per tenant | S3 inventory or local du |
| Upload file size distribution | Histogram |
| Export file size | Per job |
| Temp file age | Alert on orphan temp files > 24h |

### 12.5 Alerts (MUST CONFIGURE BEFORE PRODUCTION)

| Alert | Threshold | Severity |
|-------|-----------|---------|
| Job FAILED with maxAttempts exhausted | Any | P1 |
| Export queue depth > 10 | 5 minutes | P2 |
| Processing queue depth > 20 | 5 minutes | P2 |
| DB connection error | Any | P0 |
| Storage write failure | Any | P0 |
| JWT secret is `CHANGE_ME_DEV_ONLY` at startup | Detected | FATAL |
| Health check failure | 3 consecutive | P0 |
| Orphan temp files > 24h | Any | P2 |

### 12.6 Sensitive Data Policy

- NEVER log raw trade row content (`hsCodeRaw`, `productDescriptionRaw`, party names, etc.)
- OK to log: tenantId, batchId, sourceFileId, jobId, row counts, dispositions, error codes
- Export CSV content: never in application logs

---

## §13 Scale Roadmap (100M–500M+ Records)

**IMPORTANT:** No benchmark proof exists for current MVP. All projections are architectural analysis only.

### Stage A — Current MVP / Small Datasets (0–100K records/batch, up to 1M total)

| Characteristic | Current Architecture |
|---------------|---------------------|
| Workers | In-process pollers, single instance |
| Query pattern | Full table scans avoided; indexes on `[tenantId, batchId, rowDisposition]`, tradeDate, hsCode, etc. |
| Analytics | Direct Prisma queries with aggregation |
| Export | Keyset-paginated chunked streaming |
| Bottleneck | Single PostgreSQL instance; in-process workers |

**Current risk:** No horizontal worker scale. Single batch processes sequentially. Acceptable for MVP volumes.

### Stage B — 1M–10M Records

**Required changes:**
- PostgreSQL connection pooling: PgBouncer (transaction mode, pool_size 20–50)
- Increase chunk sizes (`CHUNK_SIZE` from 500 → 2000–5000)
- Add DB indexes: `[tenantId, tradeDate, exportEligible]` composite
- Worker: add configurable `MAX_CONCURRENT_JOBS` (currently 1 poll → 1 job at a time)
- Export: increase `EXPORT_CHUNK_SIZE`; consider streaming directly to S3 (no local tmp file)
- Analytics: introduce `GROUP BY` query optimization; review `AGGREGATE_POINT_BUDGET` constant
- Storage: migrate to S3 (required at this stage)

### Stage C — 10M–100M Records

**Required changes:**
- **External queue:** Replace `setInterval` + `FOR UPDATE SKIP LOCKED` with Bull/BullMQ + Redis for reliable distributed job dispatch
- **Table partitioning:** Partition `tdr_records` by `(tenantId, tradeDate)` range + list
- **Materialized views:** Pre-aggregate analytics (daily/monthly summary by tenant + direction)
- **Read replicas:** Separate read replica for analytics queries
- **Connection pooling:** PgBouncer cluster
- **Analytics API:** Query pre-aggregated views; fall back to live for recent data
- **Batch processing:** Worker concurrency per tenant, not global
- **Storage lifecycle:** S3 Intelligent-Tiering for source files; lifecycle rules for export expiry

### Stage D — 100M–500M+ Records

**Required changes:**
- **PostgreSQL vertical scaling + partitioning** to maximum; evaluate TimescaleDB for time-series queries
- **Analytical warehouse (justified at this stage):** BigQuery, Redshift, or ClickHouse for analytics-only workloads. OLTP stays in PostgreSQL; analytics queries routed to warehouse.
- **Event streaming:** Kafka or Kinesis for CDC from PostgreSQL → warehouse
- **Search engine:** OpenSearch if HS code / description full-text search required
- **Multi-region:** Active-passive or active-active depending on data residency requirements
- **Tenant quota enforcement:** At upload, at query, at export
- **Load testing:** k6 or Gatling baseline before each stage transition

**Cost guidance:** Do not introduce analytical warehouse until query latency evidence demands it (Stage C or threshold crossed at Stage D).

---

## §14 CRM / ERP Integration Roadmap

### 14.1 Generic Integration Foundation (Build First)

| Component | Description |
|-----------|-------------|
| Webhook infrastructure | POST to tenant-configured URL on batch events (READY, FAILED, EXPORTED) |
| Outbound event bus | Internal NestJS event emitter → webhook dispatcher |
| Webhook retry | Exponential backoff, max 5 attempts, DLQ |
| Webhook auth | HMAC-signed payload (X-ToplineShop-Signature) |
| Event schema | Versioned JSON event envelope: `{event, version, tenantId, data}` |
| REST API export endpoint | Paginated normalized records API for downstream consumers |
| API key management | Per-tenant API keys for machine-to-machine auth |
| SFTP drop listener | Inbound batch ingestion via SFTP (future) |

### 14.2 Vendor Connectors (Build Second — Do Not Implement Now)

| Connector Category | Examples |
|-------------------|---------|
| CRM | Salesforce, HubSpot |
| ERP | SAP, Oracle NetSuite, Microsoft Dynamics |
| Customs/Compliance | Pakistan Customs EDI, ASYCUDA, WCO API |
| Analytics | Power BI, Tableau connector |
| Document | CSV push, JSON feed, Excel |

**Priority:** Generic integration foundation before any vendor connector. Vendor connectors are per-contract work.

### 14.3 Downstream Handoff Contract (Current MVP)

Current export: CSV download, tenant-filtered, ACCEPTED + exportEligible records only. Downstream consumers must poll for COMPLETED export status then download. This contract is frozen and accepted.

---

## §15 Prioritized Backlog

### P0 — Required Before Production

*(From §8 blockers)*

| ID | Item |
|----|------|
| P0-001 | Remove JWT secret fallback; enforce production secrets |
| P0-002 | Auth session persistence — HttpOnly cookie (PM-005) |
| P0-003 | Production CORS configuration |
| P0-004 | TLS/HTTPS enforcement |
| P0-005 | Secret management integration |
| P0-006 | `IStorageAdapter` abstraction + S3 implementation |
| P0-007 | `TDR_STORAGE_PATH` in `.env.example`; startup validation |
| P0-008 | PostgreSQL connection pooling |
| P0-009 | Automated migration deployment pipeline |
| P0-010 | Liveness + readiness health endpoints |
| P0-011 | Per-tenant upload rate limiting |
| P0-012 | Antivirus/malware scanning on upload |
| P0-013 | Orphaned temp file cleanup job |
| P0-014 | Single-instance worker constraint documented |

### P1 — High-Priority Production Readiness

| ID | Item |
|----|------|
| P1-001 | `TdrSourceFile` metadata: `archivedAt`, `deletedAt`, `retentionExpiresAt` |
| P1-002 | Source file download endpoint (role-gated + audited) |
| P1-003 | Archive/restore workflow (backend + UI) |
| P1-004 | Export binary expiry field + cleanup job |
| P1-005 | Structured logging + correlation IDs + tenant-safe log policy |
| P1-006 | Backup/restore strategy implementation (PostgreSQL WAL + S3 replication) |
| P1-007 | Monitoring and alerting (job failures, queue depth, DB health) |
| P1-008 | Audit events for file download, archive, restore, deletion |
| P1-009 | Per-tenant API key management (for integration foundation) |
| P1-010 | D:\ local dev storage structure documentation + env setup guide |
| P1-011 | Startup secret validation (crash if `CHANGE_ME` detected in production) |

### P2 — Post-MVP Enhancement

| ID | Item |
|----|------|
| P2-001 | Versioned replacement upload (logicalDatasetId + supersedesSourceFileId) |
| P2-002 | Tombstone metadata after binary deletion |
| P2-003 | Webhook event infrastructure |
| P2-004 | Signed download URLs (S3 pre-signed) |
| P2-005 | Encryption at rest (S3 SSE-KMS) |
| P2-006 | Source file lineage UI |
| P2-007 | Batch archive filter UI |
| P2-008 | Tenant retention policy configuration |
| P2-009 | Storage usage metrics per tenant |
| P2-010 | SFTP inbound drop listener |

### P3 — Future Scale / Optional

| ID | Item |
|----|------|
| P3-001 | External queue (Bull/BullMQ + Redis) — Stage C |
| P3-002 | Table partitioning — Stage C |
| P3-003 | Materialized analytics views — Stage C |
| P3-004 | Analytical warehouse (BigQuery/ClickHouse) — Stage D |
| P3-005 | Tenant quotas |
| P3-006 | Multi-region deployment |
| P3-007 | Vendor CRM/ERP connectors |
| P3-008 | DLP (data loss prevention) |
| P3-009 | SOC 2 compliance mapping |

---

## §16 Dependency Order

```
[P0-001] Secrets hardening
    ↓
[P0-003/004] CORS + TLS
    ↓
[P0-002] Auth persistence (PM-005)
    ↓
[P0-006/007] Storage abstraction + D:\ env docs
    ↓
[P0-008/009] DB pooling + migration pipeline
    ↓
[P0-012/013] AV scan + temp cleanup
    ↓
[P0-010/011] Health probes + rate limiting
    ↓
[P0-014] Worker constraint documented / queue decision
    ↓
[P1-001] Source file metadata schema migration
    ↓
[P1-002/003] File download + archive/restore endpoints
    ↓
[P1-004] Export expiry + cleanup job
    ↓
[P1-005/007] Logging + monitoring + alerting
    ↓
[P1-006] Backup/restore implementation + drill
    ↓
[P2-001/002] Versioning + tombstones
    ↓
[P2-003] Webhook integration foundation
    ↓
[P3-001+] Scale migrations (evidence-driven)
```

---

## §17 Proposed Mega-Task Map (4–6 Execution Tasks)

### MEGA-7 — Production Hardening Core

**Task ID:** TDR-POST-MVP-PROD-HARDENING-001
**Scope:**
- P0-001: Remove JWT fallback; enforce via env; crash-on-bad-secret at startup
- P0-003/004: CORS production config; TLS documentation
- P0-007: `TDR_STORAGE_PATH` in `.env.example`; startup validation
- P0-008: PostgreSQL connection pooling configuration
- P0-009: Migration deployment pipeline script
- P0-010: `/health/live` + `/health/ready` separation
- P0-011: Per-tenant + per-IP upload rate limiting
- P0-013: Scheduled temp file cleanup job (cron via `setInterval` + DB flag or file age)
- P1-011: Startup secret validation guard

**Dependencies:** MVP frozen
**Schema migration:** NO (connection pool, rate limit, startup guard are config/code only)
**Runtime/data migration:** NO
**Risk:** LOW — no business logic changes, config + guard additions only
**Success criteria:** Startup crashes with clear error on weak/missing secrets; `/health/ready` returns DB status separately; temp files older than 24h cleaned; CORS blocks non-allowed origins; upload rate limiter fires on abuse

---

### MEGA-8 — Storage Abstraction + Auth Persistence

**Task ID:** TDR-POST-MVP-STORAGE-AUTH-001
**Scope:**
- P0-002: HttpOnly cookie auth (PM-005) — access token in memory, refresh token in `Set-Cookie`
- P0-006: `IStorageAdapter` interface; `LocalFsStorageAdapter`; `S3StorageAdapter`; DI wiring
- P0-005: Secret management integration documentation + env variable expansion
- P0-014: Single-instance worker constraint documented in `START-HERE.md`
- P1-010: D:\ local dev storage guide

**Dependencies:** MEGA-7 complete
**Schema migration:** NO
**Runtime/data migration:** YES — existing uploaded files must be migrated to new StorageService key paths if sub-directory structure changes; plan migration script before execution
**Risk:** MEDIUM — StorageService refactor touches upload, export handler, and download; auth cookie change touches login/refresh/logout flow
**Success criteria:** `IStorageAdapter` injected; S3 adapter integrated (not necessarily deployed); existing files accessible; HttpOnly cookie set on login; page refresh preserves session

---

### MEGA-9 — Source File Lifecycle + Schema Migration

**Task ID:** TDR-POST-MVP-SOURCE-LIFECYCLE-001
**Scope:**
- P1-001: Schema migration — add `archivedAt`, `deletedAt`, `retentionExpiresAt`, `deletedReason` to `TdrSourceFile`
- P1-002: Source file download endpoint + RBAC + audit
- P1-003: Archive action endpoint + restore endpoint + batch archive filter
- P1-004: `TdrExportJob.expiresAt` field; export binary cleanup job
- P1-008: Audit events for download, archive, restore, deletion-request
- P2-002: Tombstone pattern for TdrSourceFile

**Dependencies:** MEGA-8 complete (storage abstraction must exist for signed-URL download)
**Schema migration:** YES — additive columns on `tdr_source_files` and `tdr_export_jobs`; nullable/default safe
**Runtime/data migration:** YES — backfill `retentionExpiresAt = uploadedAt + 7 years` for existing records
**Risk:** MEDIUM — schema migration; all new endpoints are additive; no existing behavior changed
**Success criteria:** Archive hides source files from default list; restore makes them visible again; download endpoint returns file with audit event; export jobs have 90-day expiry; cleanup job removes expired binaries

---

### MEGA-10 — Observability + Security Hardening

**Task ID:** TDR-POST-MVP-OBSERVABILITY-SECURITY-001
**Scope:**
- P1-005: Structured logging (`pino`); correlation IDs; tenant-safe log policy
- P1-007: Monitoring + alerting integration (configurable metrics endpoint or agent)
- P0-012: AV/malware scan integration on upload (async scan pipeline; file quarantined pending scan)
- P2-004: Signed S3 download URLs for source files and exports
- P2-005: Encryption-at-rest documentation (S3 SSE-KMS config)
- P2-009: Storage usage metrics endpoint

**Dependencies:** MEGA-8 (S3 adapter for signed URLs)
**Schema migration:** NO
**Runtime/data migration:** NO
**Risk:** LOW–MEDIUM — logging change is cross-cutting; AV scan adds upload latency; scope is additive
**Success criteria:** Every request has correlation ID in logs; no raw trade data in logs; job failure alert fires; AV scan rejects test EICAR file; signed URL expires after TTL

---

### MEGA-11 — Backup/DR + Integration Foundation

**Task ID:** TDR-POST-MVP-BACKUP-INTEGRATION-001
**Scope:**
- P1-006: PostgreSQL WAL archiving + backup automation script/Terraform; restore drill documentation
- P1-009: Per-tenant API key management (generate, revoke, authenticate)
- P2-003: Webhook event dispatcher — outbound on batch READY/FAILED/EXPORTED
- P2-010: SFTP inbound batch drop (optional for this mega — owner decision)
- DR runbook documentation

**Dependencies:** MEGA-9 (lifecycle clean), MEGA-10 (observability — monitor backup jobs)
**Schema migration:** YES — API keys table; webhook subscriptions table
**Runtime/data migration:** NO
**Risk:** LOW — new tables, new endpoints; no existing behavior changed
**Success criteria:** Automated daily backup runs; restore drill passes; webhook fires on batch READY with correct HMAC signature; API key auth works on records endpoint

---

### MEGA-12 — Versioned Upload + File Management UX

**Task ID:** TDR-POST-MVP-VERSIONING-UX-001
**Scope:**
- P2-001: `logicalDatasetId`, `versionNumber`, `supersedesSourceFileId` fields + upload flow
- P2-006: Source file lineage UI
- P2-007: Batch archive filter UI
- File management UX screens: Source Detail, Archived Batches, Replacement Upload, Deletion Request
- Permanent deletion request workflow (SUPER_ADMIN review queue)

**Dependencies:** MEGA-9 (lifecycle schema), MEGA-11 (API keys)
**Schema migration:** YES — versioning fields on `TdrSourceFile`; DeletionRequest table
**Runtime/data migration:** YES — backfill `versionNumber = 1` for all existing source files
**Risk:** LOW-MEDIUM — additive schema; UI-heavy; no core business logic change
**Success criteria:** Replacement upload creates new version, links to original; archived batches filtered correctly; deletion request enters review queue

---

## §18 True Owner Decisions Remaining

| # | Question | Recommended Default | Alternatives | Impact |
|---|---------|-------------------|-------------|--------|
| OD-001 | Upload file size limit (PM-001 open) | 500 MB current default | 100 MB (safer), 1 GB (large XLSX) | Affects server memory, storage costs, abuse risk |
| OD-002 | Antivirus scanning: sync (blocks upload) or async (quarantines pending scan)? | Async — quarantine file until scan completes | Sync — simpler but adds 2–10s latency | User experience vs. simplicity |
| OD-003 | Auth: httpOnly cookie session OK for web app security model? | Yes — Option B recommended | In-memory only (current, not production-suitable) | Security, UX |
| OD-004 | SFTP inbound: include in MEGA-11 or defer? | Defer to P3 until a concrete integration partner is named | Include in MEGA-11 | Scope, timeline |
| OD-005 | Analytical warehouse: is there a timeline or scale threshold that triggers the decision? | Trigger at Stage C (>10M records) | Earlier if analytics query latency >5s becomes a blocker | Cost, complexity |
| OD-006 | Retention: is 7 years the correct default, or does the owner want a specific jurisdiction's requirement confirmed with legal? | 7 years application default is safe starting point | Adjust per legal/compliance review | Compliance |

---

## §19 Risks

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|-----------|
| JWT `CHANGE_ME_DEV_ONLY` reaches production | Medium | Critical — token forgery possible | P0-001: remove fallback; startup crash guard |
| Source files lost if local D:\ drive fails | High (local dev) | High | D:\ is dev only; production requires S3 with cross-region replication |
| In-process workers crash on server restart → orphan LEASED jobs | Medium | Medium | Reclaim-on-startup sweep; lease expiry ensures recovery |
| PM-005 deferred too long → users forced to re-login constantly | High | Medium UX | Prioritize MEGA-8 auth persistence |
| S3 migration breaks existing file references | Medium | High | Migration script must verify all existing `storageKey` values remain valid |
| Antivirus gap allows malware upload | Low (current user base) | High (at scale) | Add async AV scan before MEGA-9 completes |
| Single-process workers cannot scale horizontally | Certain at Stage B+ | High | Document constraint now; plan MEGA-Queue (Stage C) |
| Analytics queries degrade at 10M+ records | Certain without optimization | Medium | Stage B indexes + materialized views at Stage C |

---

## §20 Explicit Confirmations

**PHASE 7 NOT STARTED**

**MVP REMAINS FROZEN — NO FEATURE DEVELOPMENT REOPENED**

**NO APPLICATION SOURCE CODE WAS MODIFIED IN THIS PLANNING TASK**

---

## §21 Commit Reference

| Item | Value |
|------|-------|
| Starting HEAD | cf1ad8fe9dd7545a4dc4565a0ddab6928ba69e8f |
| Files changed | This WDR only |
| Application code changed | NONE |
| Schema changed | NONE |
| Commit | (see final verdict) |
