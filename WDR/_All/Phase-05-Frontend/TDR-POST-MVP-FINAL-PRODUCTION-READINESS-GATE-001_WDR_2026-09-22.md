# WDR: TDR-POST-MVP-FINAL-PRODUCTION-READINESS-GATE-001

**Task:** POST-MVP FINAL PRODUCTION READINESS GATE  
**Date:** 2026-09-22  
**Status:** PASS — GO WITH CONSTRAINTS  
**Branch:** codex/trade-data-refinery  
**HEAD at close:** (see governance commit)

---

## Verdict: GO WITH CONSTRAINTS

The system is production-ready for its declared scope. Two infrastructure-level items
(malware scanning, live S3 ingestion) are intentionally deferred with documented risk;
no P0 or P1 defects remain unresolved.

---

## Fixes Applied This Gate

### FIX-1: SA.15 Flake — S3 ReadStream Lazy-Open Race (ROOT CAUSE RESOLVED)

**File:** `backend/src/trade-data-refinery/ingestion/storage/s3.adapter.ts`

**Root cause:** `createReadStream(tempPath)` opens the file handle asynchronously on
Windows. When the mock AWS SDK resolves immediately (without consuming the stream),
`unlink(tempPath)` runs before Node's I/O thread opens the file. The delayed ENOENT
fires as an unhandled stream error during the next test (SA.15).

**Fix:** Added `body.on('error', () => {})` to prevent unhandled error propagation and
`body.destroy()` immediately after `client.send()` resolves, releasing any open handle
before `unlink`.

**Verification:** 3 consecutive parallel Jest runs — 0 SA.15 failures.

---

### FIX-2: Webhook Signing Secret At-Rest Encryption (AES-256-GCM)

**Files:**
- `backend/src/trade-data-refinery/services/webhook-secret.util.ts` (new)
- `backend/src/trade-data-refinery/services/tdr-webhook.service.ts` (modified)

**Encryption:** AES-256-GCM with random 12-byte IV per secret.  
**Stored format:** `enc:v1:<iv_hex>:<authTag_hex>:<ciphertext_hex>`  
**Key source:** `TDR_WEBHOOK_SECRET_ENCRYPTION_KEY` env var (64 hex chars / 32 bytes).

**Behavior:**
- Key set → secrets encrypted at rest; plaintext returned once on subscription creation.
- Key not set + production → `onModuleInit()` throws FATAL.
- Key not set + dev → warning logged; plaintext stored (backward-compat).
- Existing DB records without `enc:v1:` prefix → treated as legacy plaintext (decryptWebhookSecret returns unchanged).

**Tests added:** WS.1–WS.5 in `backend/src/tdr-versioning-integration.spec.ts`

---

### FIX-3: Metrics Endpoint Production Protection

**File:** `backend/src/app.controller.ts`

**Before:** `GET /metrics` was `@Public()` with no authentication.

**After:** `METRICS_TOKEN` bearer authentication:
- `METRICS_TOKEN` set → requires `Authorization: Bearer <token>` header.
- `METRICS_TOKEN` not set + production → 401 for all requests.
- `METRICS_TOKEN` not set + dev → open (local dev convenience).

Prometheus scrapers must be configured with the `METRICS_TOKEN` value.

---

### FIX-4: Timer `.unref()` — Worker Exit Warning Resolved

**Files:**
- `backend/src/trade-data-refinery/services/tdr-webhook.service.ts`
- `backend/src/trade-data-refinery/ingestion/storage/temp-cleanup.service.ts`

Added `.unref()` to all `setInterval`/`setTimeout` background timers so they do not
prevent Jest worker process exit. `clearInterval` / `onModuleDestroy()` still cancels
them properly in production.

---

## Audit Results by Domain

### Migration History
- 9/9 migrations applied, database up to date.
- `20260919002056_tdr_quality_export_jobs`: pre-existing no-op (empty migration) — no action needed.
- All migrations additive-only: no DROP COLUMN, DROP TABLE, or destructive CASCADE.

### Source File Integrity
- 4/4 source files: actual SHA-256 matches `contentHash` in DB — PASS.
- `logicalDatasetId = id`, `versionNumber = 1` for all 4 files — PASS.

### Multi-Tenancy Audit
- All service queries include explicit `tenantId` filter: PASS.
- `@@unique([tenantId, contentHash])` prevents cross-tenant hash collision.
- TenantModuleGuard on all `/tdr` routes; no `@Public()` on any TDR endpoint.

### API Key Security
- Key format: `tdr_<8-hex>.<48-hex>` (~224-bit entropy). PASS.
- Storage: `keyHash` (SHA-256) only; plaintext never stored. PASS.
- `revokedAt` + `expiresAt` checks enforced. PASS.
- `VALID_SCOPES` = 3 bounded values. PASS.
- Tenant binding: all queries include `tenantId`. PASS.

### Auth Final Audit
- HttpOnly cookie: `httpOnly: true`. PASS.
- SameSite: `'strict'`. PASS.
- Secure: `true` in production or `COOKIE_SECURE=true`. PASS.
- Refresh token: cookie-only in production; body fallback only in dev. PASS.
- validateEnv: 11 production gates tested and passing (A.1–A.11). PASS.

### Export Artifact Audit
- All export download endpoints covered by TenantModuleGuard (JWT required). PASS.
- Tenant isolation enforced: `tenantId` scoped in all export queries. PASS.
- Export expiry: `retentionExpiresAt` set; TdrExportCleanupService handles expired jobs. PASS.

### Deletion Workflow Audit
- Approval sets `status = 'APPROVED'` — no physical file deletion. PASS.
- Constraint honored: no physical source deletion.

### Versioning Audit
- `@@unique([tenantId, contentHash])` rejects identical binary replacement. PASS.
- `logicalDatasetId` lineage chain intact in DB. PASS.
- Previous version remains ACTIVE (not auto-archived) — as designed. PASS.

### Observability Audit
- MetricsService cardinality: `@Global()`, bounded label sets, no dynamic key inclusion. PASS.
- CorrelationID middleware: present on all requests. PASS.
- RequestLoggerMiddleware: structured logging, no credential leakage. PASS.

### Webhook Security Final Audit
- HMAC sha256 over `${ts}.${body}`. PASS.
- SSRF blocked: localhost, 127.x, ::1, 169.254.x, RFC-1918. PASS.
- HTTPS enforced in production. PASS.
- Max 3 delivery attempts, exponential backoff. PASS.
- `signingSecret` returned once on creation (now encrypted at rest). PASS.

### Backup Drill
- `pg_dump --schema-only` executed successfully: 56,585 bytes.
- Drill file created and removed — current database unchanged. PASS.

### Production Startup Negative Tests
- A.1 weak `JWT_ACCESS_SECRET` in production → FATAL. PASS.
- A.4 weak `JWT_REFRESH_SECRET` in production → FATAL. PASS.
- A.6 missing `DATABASE_URL` in production → FATAL. PASS.
- A.7 wildcard CORS in production → FATAL. PASS.
- `TDR_WEBHOOK_SECRET_ENCRYPTION_KEY` missing in production → `onModuleInit()` throws. PASS.

---

## Classifications (Deferred Items)

| Item | Classification | Rationale |
|------|---------------|-----------|
| Upload malware scanning | P2 / GO WITH CONSTRAINTS | File type validation present (MIME + extension). No AV scanning. Acceptable for current operator-controlled environment; must be addressed before public intake. |
| Live S3 ingestion | P2 / GO WITH CONSTRAINTS | S3StorageAdapter fully implemented and tested via mocks. `STORAGE_ADAPTER=s3` not enabled; requires live credentials. Safe to enable when credentials are injected. |
| Deployment environment audit | P2 / GO WITH CONSTRAINTS | Pre-production (dev). Production deployment requires `NODE_ENV=production`, strong secrets, TLS, METRICS_TOKEN, TDR_WEBHOOK_SECRET_ENCRYPTION_KEY. |
| Restore drill (full data) | P3 | Schema-only drill passed. Full data restore from production backup requires a disposable DB and is a runbook step, not a code change. |

---

## Test Results

| Suite | Passing | Notes |
|-------|---------|-------|
| Backend Jest (parallel) | 818/819 | 1 pre-existing skip; 0 failures; 3 consecutive clean runs |
| Frontend Vitest | 159/159 | All 12 suites pass |
| Backend tsc | PASS | 0 errors |
| Frontend tsc | PASS | 0 errors |
| next build | PASS | All routes prerendered/SSR as expected |
| prisma validate | PASS | Schema valid |
| prisma migrate status | PASS | 9/9 applied, up to date |

---

## Changed Files

| File | Change |
|------|--------|
| `backend/src/trade-data-refinery/ingestion/storage/s3.adapter.ts` | Add `body.on('error', () => {})` + `body.destroy()` before unlink (SA.15 root-cause fix) |
| `backend/src/trade-data-refinery/services/webhook-secret.util.ts` | NEW: AES-256-GCM encrypt/decrypt for webhook signing secrets |
| `backend/src/trade-data-refinery/services/tdr-webhook.service.ts` | Encrypt secret at subscribe; decrypt before HMAC; fatal check for missing key in prod; `.unref()` on timer |
| `backend/src/trade-data-refinery/ingestion/storage/temp-cleanup.service.ts` | `.unref()` on cleanup timers |
| `backend/src/app.controller.ts` | METRICS_TOKEN bearer auth on `GET /metrics`; fatal in production without token |
| `backend/src/tdr-versioning-integration.spec.ts` | WS.1–WS.5: webhook secret encryption utility tests |

---

## Scope Constraints Honored

- No DROP COLUMN / DROP TABLE (all additive).
- No push to remote.
- No credentials committed.
- No Phase 7 content.
- No physical source deletion.
- `F:\OpenCode\shop.com` untouched.
- No real production secrets in repo.

---

## Final P0/P1 Accounting

| ID | Description | Status |
|----|-------------|--------|
| P0-001 | SA.15 flake (parallel test race) | FIXED: `s3.adapter.ts` |
| P0-002 | Webhook signing secret plaintext storage | FIXED: AES-256-GCM encryption |
| P0-003 | Metrics endpoint unprotected in production | FIXED: METRICS_TOKEN bearer auth |
| P1-001 | Worker process exit warning (timer leak) | FIXED: `.unref()` on all background timers |

---

## Governance

- Task: TDR-POST-MVP-FINAL-PRODUCTION-READINESS-GATE-001
- Gate: All POST-MVP production readiness items addressed
- Verdict: **GO WITH CONSTRAINTS**
- Constraints: Malware scanning, live S3, full deployment environment — documented and classified P2/P3
- Next task: Requires PM authorization (production deployment preparation)
