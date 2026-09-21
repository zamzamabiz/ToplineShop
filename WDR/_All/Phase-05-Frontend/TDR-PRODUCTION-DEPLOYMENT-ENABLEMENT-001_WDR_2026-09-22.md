# WDR: TDR-PRODUCTION-DEPLOYMENT-ENABLEMENT-001

**Task:** CONTROLLED PRODUCTION DEPLOYMENT PREPARATION  
**Date:** 2026-09-22  
**Status:** PASS — READY FOR OWNER INFRASTRUCTURE DECISION  
**Branch:** codex/trade-data-refinery  
**Starting HEAD:** 3a6daef58471b1ff2ff12f7d88fd26c34b8b6a20  
**Final HEAD:** (see governance commit)

---

## 1. Starting HEAD and Baseline

| Item | Value |
|------|-------|
| Starting HEAD | `3a6daef` — chore(gov): record TDR-POST-MVP-FINAL-PRODUCTION-READINESS-GATE-001 in registry |
| Branch | codex/trade-data-refinery |
| Prior gate verdict | GO WITH CONSTRAINTS |

---

## 2. Final Gate Baseline (Carried Forward Accurately)

| Item | Status |
|------|--------|
| Unresolved P0 | 0 |
| Unresolved P1 | 0 |
| Backend 818/819 | PASS |
| Frontend 159/159 | PASS |
| SA.15 root cause | FIXED |
| Webhook secret at-rest encryption | PASS |
| Metrics METRICS_TOKEN bearer auth | PASS |
| Timer .unref() | PASS |
| Tenant isolation | PASS |
| API key security | PASS |
| Auth (HttpOnly, sameSite strict) | PASS |
| Migrations 9/9 applied | PASS |
| Source file integrity | PASS |
| Malware scanning | NOT IMPLEMENTED — P2 |
| Live S3 ingestion | NOT ENABLED — P2 |
| Production environment | NOT PROVISIONED — P2 |
| Full-data restore drill | NOT PROVEN — P3 |

---

## 3. Options Considered

### Option A — Single Linux VM + Managed PostgreSQL + Mounted Volume (Recommended)

Single Linux VPS (4 vCPU / 8 GB) + managed PostgreSQL + persistent attached disk.

- Complexity: Low
- Storage adapter: `STORAGE_ADAPTER=local`, `/var/lib/toplineshop/tdr`
- Backup: managed PG PITR + daily volume snapshot
- Auth/cookie: same-origin via nginx — full SameSite=Strict compatibility
- S3 impact: None (local adapter on mounted volume)

### Option B — Single Linux VM + Managed PostgreSQL + S3-Compatible Storage

Same as A but with S3 for file persistence.

- Complexity: Medium (S3 credentials, adapter config)
- Storage: S3-compatible object store
- Backup: Managed PG PITR + S3 versioning
- S3 impact: File persistence works; ingestion read path still uses local temp copy

### Option C — Managed Container Hosting + Managed PostgreSQL + Durable Storage

Container platform (Fly.io/Railway/Render/Cloud Run) + managed PG.

- Complexity: Low ops burden
- Critical constraint: persistent volume MUST be mounted (container disk is ephemeral)
- Backup: platform PG addon + volume or S3

---

## 4. Recommended Topology

**Option A — Single Linux VM + Managed PostgreSQL + Mounted Volume**

Rationale:
- LocalFsStorageAdapter is production-ready; S3 ingestion bridge not yet enabled
- Single backend instance eliminates distributed lease/lock concerns  
- Managed PostgreSQL provides PITR without extra operational overhead
- Simplest to reason about and operate for initial controlled deployment

```
Internet
   │
   ▼
[ HTTPS reverse proxy — nginx ]
   │
   ├──► Next.js frontend  :3000
   │
   └──► NestJS backend    :4000
              │
              ├──► PostgreSQL (managed, port 5432)
              │
              └──► Persistent volume (/var/lib/toplineshop/tdr)
```

---

## 5. Frontend Deployment Model

| Item | Value |
|------|-------|
| Root | `E:\ToplineShop` (repo root) |
| Build command | `npm run build` (= `next build`) |
| Production start | `npm run start` (= `next start`) |
| Port | 3000 (default) |
| Key env at build time | `NEXT_PUBLIC_API_URL=https://yourdomain.com` |
| Secrets in NEXT_PUBLIC | None — only public URL |
| TypeScript | PASS (exit 0) |
| Test suite | 159/159 PASS |
| Production build | PASS |

---

## 6. Backend Deployment Model

| Item | Value |
|------|-------|
| Root | `E:\ToplineShop\backend` |
| Install | `npm ci --omit=dev` |
| Build | `npm run build` (= `nest build`) → `dist/` |
| Migration (before start) | `npx prisma migrate deploy` |
| Production start | `npm run start:prod` (= `node dist/main`) |
| Port | 4000 (default) |
| Process model | systemd (reference: `docs/systemd/tdr-backend.service`) |
| TypeScript | PASS (exit 0) |
| Test suite | 818/819 PASS (1 governed skip) |

---

## 7. PostgreSQL Model

| Item | Value |
|------|-------|
| Required version | PostgreSQL 18.x (pg_dump/pg_restore must also be 18.x) |
| Migrations | `npx prisma migrate deploy` — never `migrate dev` in production |
| Migration count | 9/9 applied, all additive |
| Connection string | `DATABASE_URL=postgresql://user:pass@host:5432/db?schema=public` |
| Pool options | `?connection_limit=15&pool_timeout=10&sslmode=require` |
| Backup | Managed PITR enabled BEFORE first live data ingestion |
| Migration sequence | pg_dump backup → migrate deploy → migrate status verify → rollout |

---

## 8. Persistent Storage Model

| Item | Value |
|------|-------|
| Adapter | `STORAGE_ADAPTER=local` for initial production |
| Linux path | `/var/lib/toplineshop/tdr` (or provider-mounted equivalent) |
| Permissions | Restricted to service account; no world-read |
| Durability | Persistent volume — survives app restart/redeploy; NOT ephemeral disk |
| Backup | Daily volume snapshot; separate from DB backup |
| Capacity monitoring | Alert when volume > 70% full |
| Subdirectory structure | `<tenantId>/<sourceFileId>` (flat file, no extension) |

---

## 9. S3 Classification

| Item | Status |
|------|--------|
| S3StorageAdapter implementation | COMPLETE — unit tested via mock |
| S3 file persistence (write path) | READY — wire STORAGE_ADAPTER=s3 + credentials |
| Live S3 ingestion (read path) | NOT ENABLED — ingestion parsers operate on local temp copies |
| First production recommendation | Use STORAGE_ADAPTER=local with persistent mounted volume |

D:\ToplineShopData\TDR is development storage only. Not a production storage path.

---

## 10. Malware Scanning Constraint

**Status: NOT IMPLEMENTED — P2**

Current upload protection: extension/MIME check, size bound (500 MB), path safety, authenticated access.

For initial controlled production deployment:
- All upload users are authenticated (enforced)
- All users are provisioned tenants (TENANT_ADMIN assigns users)
- Upload exposure is operator-controlled

**Constraint:** Acceptable for controlled trusted-user internal deployment.
Not acceptable before opening uploads to untrusted or external users.
PM-authorized task required before public intake.

---

## 11. Domain / TLS Model

| Item | Detail |
|------|--------|
| TLS requirement | HTTPS mandatory in production |
| TLS termination | Reverse proxy (nginx) |
| Application | Serves HTTP; proxy forwards |
| HTTP → HTTPS | Enforced by nginx redirect |
| Secure cookie | Automatic in `NODE_ENV=production` |
| SameSite | `strict` |
| Recommended topology | Single registrable domain via nginx path-based routing |
| Split-domain | Supported but requires SameSite=None — not recommended for first deployment |
| Reference config | `docs/nginx/tdr-nginx.conf` |

---

## 12. Auth / Cookie Topology

| Property | Value |
|----------|-------|
| Refresh cookie | HttpOnly |
| Secure flag | Always true in production |
| SameSite | `strict` |
| CORS | `CORS_ALLOWED_ORIGINS` = exact frontend origin, no wildcard |
| credentials | `credentials: include` on all API calls |
| Recommended topology | Same-origin (frontend + API at `yourdomain.com`) |

---

## 13. Production Environment Contract

Full contract: `docs/TDR-PRODUCTION-ENVIRONMENT.md`

**Required variables that were missing from prior env.example — now added:**

| Variable | Use |
|----------|-----|
| `METRICS_TOKEN` | Bearer token for `GET /metrics`; required in production |
| `TDR_WEBHOOK_SECRET_ENCRYPTION_KEY` | AES-256-GCM key; FATAL if missing in production |

`backend/.env.example` updated to document both variables with generation guidance.

---

## 14. Secret Management Contract

All secrets injected at deploy time. Never committed to repo.

| Secret | Minimum Entropy | Generation |
|--------|----------------|-----------|
| JWT_ACCESS_SECRET | Not in KNOWN_WEAK_SECRETS | `openssl rand -hex 32` |
| JWT_REFRESH_SECRET | Same, must differ | `openssl rand -hex 32` |
| TDR_WEBHOOK_SECRET_ENCRYPTION_KEY | Exactly 64 hex chars (32 bytes) | `openssl rand -hex 32` |
| METRICS_TOKEN | Non-empty in production | `openssl rand -hex 32` |

---

## 15. Metrics Protection

Implementation: `METRICS_TOKEN` bearer auth in `backend/src/app.controller.ts`

| Condition | Behavior |
|-----------|----------|
| METRICS_TOKEN set | Requires `Authorization: Bearer <token>` |
| METRICS_TOKEN absent + production | 401 all requests |
| METRICS_TOKEN absent + dev | Open (local dev convenience) |

Production contract: configure Prometheus scraper with `bearer_token: <METRICS_TOKEN>`.
Network restriction via nginx `allow/deny` recommended as defense-in-depth.

---

## 16. Webhook Encryption Key Operational Requirement

`TDR_WEBHOOK_SECRET_ENCRYPTION_KEY` is a critical operational secret.

- Key loss = existing webhook signing secrets unrecoverable
- Must be backed up in a secure key store (separate from the application secrets file)
- Rotation procedure: decrypt all secrets with old key, re-encrypt with new key (future PM-authorized task)
- Never commit to repo, never log
- `TdrWebhookService.onModuleInit()` throws FATAL if absent in production

---

## 17. Worker Instance Constraint

**BACKEND WORKER EXECUTION = SINGLE CONTROLLED INSTANCE**

The ingestion engine, quality worker, and export worker use DB-backed in-process leasing.
Multiple backend instances without distributed locking review is NOT supported for initial production.

Frontend may scale independently (stateless Next.js).

---

## 18. Backup Model

| Component | Method | Required Before Live Data |
|-----------|--------|--------------------------|
| PostgreSQL | Managed PITR or daily pg_dump | YES |
| File storage (local) | Volume snapshot daily | YES |
| File storage (S3) | S3 versioning + cross-bucket sync | YES |
| Pre-deployment | pg_dump -F c before every migration | YES |

Restore contract: both DB and file storage must be restored in sync.
`storageKey`, `contentHash`, `tenantId`, `sourceFileId` must be preserved.

---

## 19. Restore Status

| Item | Status |
|------|--------|
| Schema-only restore | VERIFIED (prior gate: 56 KB dump PASS) |
| Full-data restore drill | NOT PROVEN (P3) |
| Production DR claim | CANNOT BE MADE until full data drill passes against disposable DB |

---

## 20. Migration Deployment Procedure

1. Pre-deployment pg_dump backup
2. Build artifact (`npm run build`)
3. `npx prisma migrate deploy`
4. `npx prisma migrate status` → verify all applied
5. Rollout backend
6. Health check: `/health/live` + `/health/ready`
7. Smoke checklist

Rollback: application rollback does NOT reverse schema. Restore from pre-deployment dump → deploy old version.

---

## 21. Production Smoke Checklist Reference

Full checklist: `docs/TDR-PRODUCTION-SMOKE-CHECKLIST.md`

8 phases: Infrastructure, Authentication, TDR Core Flow, Source Lifecycle,
Versioning, Integration, Observability, Tenant Isolation.

No real data until Phase 1–3 pass cleanly.

---

## 22. First-Data Rollout Policy

1. Environment provisioned with real secrets
2. DB backup/PITR confirmed active
3. Deploy + health probes green
4. Auth smoke
5. Synthetic small upload (test CSV, not real trade data)
6. Processing/quality check
7. Export/download check
8. Source lifecycle check
9. Metrics/log check
10. Backup confirmed
11. Only then: real customs/trade data ingestion

---

## 23. Deployment Artifacts Created

| Artifact | Path | Purpose |
|----------|------|---------|
| Production deployment runbook | `docs/TDR-PRODUCTION-DEPLOYMENT-RUNBOOK.md` | Primary ops reference |
| Production environment contract | `docs/TDR-PRODUCTION-ENVIRONMENT.md` | All env vars, generation guidance |
| Production smoke checklist | `docs/TDR-PRODUCTION-SMOKE-CHECKLIST.md` | Post-deploy verification |
| Nginx reference config | `docs/nginx/tdr-nginx.conf` | Reverse proxy reference |
| systemd backend unit | `docs/systemd/tdr-backend.service` | Backend process model reference |
| systemd frontend unit | `docs/systemd/tdr-frontend.service` | Frontend process model reference |
| `backend/.env.example` | Updated | Added METRICS_TOKEN + TDR_WEBHOOK_SECRET_ENCRYPTION_KEY |
| `docs/TDR-DEPLOYMENT-CHECKLIST.md` | Updated | Fixed stale metrics note, updated test counts |

---

## 24. Deployment Gap Matrix

| Item | Status |
|------|--------|
| Application code | READY IN REPO |
| Production env contract | READY IN REPO |
| Backend build/start | READY IN REPO |
| Frontend build/start | READY IN REPO |
| Migration procedure | READY IN REPO |
| Backup runbook | READY IN REPO |
| Operations runbook | READY IN REPO |
| Smoke checklist | READY IN REPO |
| Nginx reference config | READY IN REPO |
| systemd unit references | READY IN REPO |
| Hosting compute | OWNER DECISION REQUIRED |
| Production domain/DNS | OWNER DECISION REQUIRED |
| TLS certificate | OWNER DECISION REQUIRED |
| Managed PostgreSQL provider | OWNER DECISION REQUIRED |
| Persistent file storage (volume) | OWNER DECISION REQUIRED |
| DB backup/PITR enablement | OWNER DECISION REQUIRED |
| Secret injection mechanism | OWNER DECISION REQUIRED |
| Metrics scraper (Prometheus) | OWNER DECISION REQUIRED |
| Malware scanning | DEFERRED P2 |
| S3 ingestion bridge | DEFERRED P2 |
| Full data restore drill | DEFERRED P3 |
| Outbound webhook egress policy | OWNER DECISION (firewall/egress) |

---

## 25. True Owner Decisions Required

| # | Question | Recommendation |
|---|----------|---------------|
| Q1 | Hosting provider / model? | Option A: Single Linux VPS + managed PG |
| Q2 | Production domain name? | Single registrable domain, path-based routing via nginx |
| Q3 | Managed PostgreSQL provider? | Any with PostgreSQL 18 + PITR (Neon, Supabase, RDS, Railway) |
| Q4 | File storage: mounted volume or S3? | Mounted volume for first deployment; move to S3 when ingestion bridge is enabled |

---

## 26. Test Results

| Suite | Result |
|-------|--------|
| Backend Jest | 818/819 PASS (1 governed skip, 21/21 suites) |
| Frontend Vitest | 159/159 PASS (12/12 suites) |
| Backend TypeScript | PASS (exit 0) |
| Frontend TypeScript | PASS (exit 0) |
| Next production build | PASS |
| Prisma validate | PASS |
| Prisma migrate status | 9/9 applied, up to date |

---

## 27. Remaining P0 / P1 / P2

| ID | Description | Severity | Status |
|----|-------------|---------|--------|
| — | — | P0 | 0 unresolved |
| — | — | P1 | 0 unresolved |
| P2-001 | Upload malware scanning | P2 | NOT IMPLEMENTED — deferred, controlled deployment only |
| P2-002 | Live S3 ingestion bridge | P2 | NOT ENABLED — deferred |
| P2-003 | Production hosting environment | P2 | NOT PROVISIONED — owner decision required |
| P3-001 | Full-data restore drill | P3 | NOT PROVEN — runbook ready, drill pending |

---

## 28. Explicit Confirmations

**MVP REMAINS FROZEN.**

**PHASE 7 NOT STARTED.**

---

## 29. Governance

- Task: TDR-PRODUCTION-DEPLOYMENT-ENABLEMENT-001
- Gate: Production topology defined, repo deployment-ready, owner decisions isolated
- Verdict: **READY FOR OWNER INFRASTRUCTURE DECISION**
- Next action: Owner selects hosting provider/model (Q1–Q4); AI agent execution resumes only after provider is selected and initial environment is provisioned
