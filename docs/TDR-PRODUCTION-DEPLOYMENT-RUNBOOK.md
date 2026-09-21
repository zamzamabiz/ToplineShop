# TDR Production Deployment Runbook

Trade Data Refinery-Bushra — Production Deployment Reference v1.0  
Date: 2026-09-22  
Status: READY FOR OWNER INFRASTRUCTURE DECISION  
Gate: TDR-PRODUCTION-DEPLOYMENT-ENABLEMENT-001

---

## 1. Scope and Context

This runbook covers deploying the Trade Data Refinery-Bushra (TDR) platform
to a controlled production environment. It assumes:

- The final production readiness gate has passed (TDR-POST-MVP-FINAL-PRODUCTION-READINESS-GATE-001 — PASS, GO WITH CONSTRAINTS)
- Deployment is to a controlled, authenticated-user environment (not public internet upload)
- Malware scanning is not yet implemented (P2 constraint; see §11)
- Live S3 ingestion is not yet enabled (P2 constraint; see §12)

---

## 2. Application Components

| Component | Technology | Description |
|-----------|-----------|-------------|
| Backend | NestJS (Node.js) | REST API, ingestion engine, quality, export, auth |
| Frontend | Next.js (React) | TDR dashboard, analytics UI |
| Database | PostgreSQL 18.x | All metadata (source files, batches, exports, users, audit) |
| File storage | LocalFsStorageAdapter or S3 | Binary source files and export artifacts |

---

## 3. Recommended Initial Production Topology

```
Internet
   │
   ▼
[ HTTPS reverse proxy — nginx or equivalent ]
   │
   ├──► Frontend (Next.js)  :3000  — serves all UI routes
   │
   └──► Backend (NestJS)    :4000  — serves /api, /auth, /tdr, /health, /metrics
              │
              ├──► PostgreSQL (managed or self-hosted)
              │
              └──► Persistent file volume (/var/lib/toplineshop/tdr)
```

**Rationale for this topology:**
- LocalFsStorageAdapter is production-ready; S3 ingestion bridge is not yet enabled
- Single backend instance eliminates distributed lease/lock concerns
- Managed PostgreSQL provides PITR backup without operational overhead
- All secrets injected from CI/CD or secret manager — not in repo

---

## 4. Three Deployment Options

### Option A — Single Linux VM + Managed PostgreSQL + Mounted Volume (Recommended)

**Architecture:**  
One Linux VPS (e.g. 4 vCPU / 8 GB RAM) + managed PostgreSQL + persistent attached disk

| Dimension | Value |
|-----------|-------|
| Complexity | Low |
| Operational burden | Medium (VM management) |
| Auth/cookie safety | Full HTTPS via nginx — no cross-origin complications |
| Storage | Persistent mounted volume, snapshot-backed |
| Backup model | Managed PG PITR + daily volume snapshot |
| Scaling path | Vertical scale VM; frontend can be split to CDN |
| S3 impact | None — local adapter works on mounted volume |

**Infrastructure needed:** VM provider, managed PG, DNS, TLS certificate

---

### Option B — Single Linux VM + Managed PostgreSQL + S3-Compatible Storage

**Architecture:**  
Same as Option A but `STORAGE_ADAPTER=s3` pointing to S3/R2/MinIO

| Dimension | Value |
|-----------|-------|
| Complexity | Medium (S3 credentials, adapter wiring) |
| Operational burden | Low storage ops burden (provider handles durability) |
| Auth/cookie safety | Same as A |
| Storage | S3-compatible object store — high durability |
| Backup model | Managed PG PITR + S3 versioning |
| Scaling path | Better long-term scalability |
| S3 impact | Requires live S3 ingestion enablement (currently P2) |

**Note:** Live S3 ingestion (temp-download bridge for parsers) is currently not enabled.
Until that bridge is activated, the ingestion parsers operate on local temp copies.
The S3 adapter handles source file persistence correctly; the gap is in the ingestion
read path, not the storage write path.

**Infrastructure needed:** VM, managed PG, S3-compatible bucket, DNS, TLS

---

### Option C — Managed Container Hosting + Managed PostgreSQL + Durable Storage

**Architecture:**  
Cloud container hosting (e.g. Fly.io, Railway, Render, GCP Cloud Run) + managed PG

| Dimension | Value |
|-----------|-------|
| Complexity | Low ops (platform handles process management) |
| Operational burden | Very low |
| Auth/cookie safety | Must ensure persistent volume for file storage — not ephemeral disk |
| Storage | Persistent volume attached to container, or S3 |
| Backup model | Platform PG addon PITR + volume snapshot or S3 versioning |
| Scaling path | Platform-native; backend still single-instance initially |
| S3 impact | Same as Option B if using S3 |

**Critical constraint:** Container disk is ephemeral by default. A persistent volume
(not the container layer) MUST be mounted at `TDR_STORAGE_PATH`. Without this,
source files are lost on container restart.

**Infrastructure needed:** Container platform account, managed PG addon, DNS, TLS

---

## 5. Backend Deployment Steps

### 5.1 Prerequisites

```bash
# On the production host
node --version   # v22+ recommended
npm --version    # v10+
npx prisma --version  # 6.x
postgresql --version  # or confirm managed PG 18.x
```

### 5.2 Install Dependencies

```bash
cd /app/backend
npm ci --omit=dev
npx prisma generate
```

### 5.3 Build

```bash
npm run build
# Produces: dist/
```

### 5.4 Run Migrations

```bash
# Run BEFORE starting the new backend version
npx prisma migrate deploy

# Verify
npx prisma migrate status
# Expected: 9/9 migrations applied, no pending
```

### 5.5 Start Production Backend

```bash
NODE_ENV=production node dist/main
# or: npm run start:prod
```

`validateEnv()` runs immediately. If any required secret is missing or weak, the
process exits with a FATAL message — check logs before proceeding.

### 5.6 Health Verification

```bash
curl http://localhost:4000/health/live    # → 200 {"status":"ok"}
curl http://localhost:4000/health/ready   # → 200 {"status":"ok",...}
```

---

## 6. Frontend Deployment Steps

### 6.1 Build

```bash
cd /app  # repo root (Next.js is at root)
npm ci
NEXT_PUBLIC_API_URL=https://api.yourdomain.com npm run build
# Produces: .next/
```

### 6.2 Start Production Frontend

```bash
NODE_ENV=production npm run start
# Starts Next.js production server on port 3000
```

### 6.3 Verify

```bash
curl http://localhost:3000  # → 200 HTML response
```

---

## 7. Migration Deployment Sequence

This sequence MUST be followed for every deployment that includes new migrations.

```
1.  Take pre-deployment DB backup
    → pg_dump -F c -f pre-deploy-$(date +%Y%m%d).dump

2.  Build new backend artifact
    → npm run build (in backend/)

3.  Verify DB connectivity from host
    → npx prisma db pull --print (dry check, no changes)

4.  Apply migrations
    → npx prisma migrate deploy

5.  Verify all applied
    → npx prisma migrate status
    → Expected: all applied, no pending

6.  Roll out backend (replace running process)
    → systemctl restart tdr-backend (or platform equivalent)

7.  Roll out frontend
    → systemctl restart tdr-frontend

8.  Health check
    → GET /health/live → 200
    → GET /health/ready → 200

9.  Smoke test (§production smoke checklist)
```

**Rollback principle:** Application rollback does NOT automatically reverse
schema migrations. If a schema migration must be reverted, restore from the
pre-deployment backup to a separate DB, then switch `DATABASE_URL` after
deploying the previous backend version.

---

## 8. Process Model

### 8.1 Backend — systemd (recommended for Linux VM deployments)

See `docs/systemd/tdr-backend.service` for the reference unit file.

Key settings:
- `Restart=on-failure` — restarts on crash
- `RestartSec=5` — prevents tight restart loops
- `StandardOutput=journal` — logs go to journald
- `EnvironmentFile=/etc/tdr/env` — secrets injected from restricted file

### 8.2 Backend — Container Platforms

Use the platform's native restart policy (e.g. `restart: unless-stopped` in Compose).

### 8.3 Frontend — systemd

Same pattern; separate unit file.

### 8.4 Worker Instance Constraint — CRITICAL

**BACKEND WORKER EXECUTION = SINGLE CONTROLLED INSTANCE**

The ingestion engine, quality worker, and export worker use an in-process
lease/locking mechanism (DB-backed). Running multiple backend instances
concurrently without distributed locking review is NOT supported for the
initial production deployment. Scale frontend independently; keep backend
at one controlled instance.

---

## 9. HTTPS / TLS

TLS MUST be present in production. The application itself serves HTTP.
TLS termination occurs at the reverse proxy layer.

- Nginx reference configuration: `docs/nginx/tdr-nginx.conf`
- HTTP → HTTPS redirect enforced by nginx
- `proxy_set_header X-Forwarded-Proto https` passed to backend
- `COOKIE_SECURE` is automatically `true` when `NODE_ENV=production`
- Cookie `SameSite=Strict` requires same registrable domain between frontend and API

**Same-origin topology (recommended for first production):**

```
yourdomain.com        → Frontend (Next.js)
yourdomain.com/api    → Backend (NestJS) via proxy_pass
```

Cookie `SameSite=Strict` works correctly because both share `yourdomain.com`.

**Split-domain topology (alternative):**

```
app.yourdomain.com    → Frontend
api.yourdomain.com    → Backend
```

Requires `SameSite=None; Secure` for cross-site cookie, which is stricter
on browser requirements. Not recommended for first deployment.

---

## 10. Auth / Cookie Topology

| Property | Value |
|----------|-------|
| Refresh cookie | HttpOnly — not accessible to JavaScript |
| Secure flag | Always true in production (`NODE_ENV=production`) |
| SameSite | `strict` — prevents CSRF across site boundaries |
| credentials: include | Frontend sends cookies on all API requests |
| CORS | `CORS_ALLOWED_ORIGINS` must match exact frontend origin |

**CORS_ALLOWED_ORIGINS** format: `https://yourdomain.com` (no trailing slash, no wildcard).

---

## 11. Upload Malware Scanning (P2 Constraint)

**Status: NOT IMPLEMENTED**

For the initial controlled production deployment:

- All upload users must be authenticated (enforced — no public upload endpoint)
- All users must be provisioned tenants (TENANT_ADMIN assigns users)
- Current upload validation: extension/MIME check, size bound (500 MB), path safety
- Malware scanning is absent

**Constraint for initial deployment:** Acceptable for a controlled,
trusted-user internal deployment. Not acceptable before opening uploads
to untrusted or external users.

A vendor selection and implementation task must be PM-authorized before
any public-facing intake is enabled.

---

## 12. S3 Ingestion Classification (P2 Constraint)

**Status: NOT ENABLED**

- `S3StorageAdapter` is fully implemented, tested, and production-ready for file persistence
- The ingestion parsers (CSV/XLSX) operate on local file paths
- A temp-download bridge (S3 object → local temp file → parse → delete temp) has not been activated
- For initial production: use `STORAGE_ADAPTER=local` with a persistent mounted volume

**To enable S3 for file persistence only (without ingestion path):**
`STORAGE_ADAPTER=s3` + S3 credentials in env. Files are stored durably in S3.
The ingestion gap is in the read path, not the write path.

Full S3 ingestion enablement requires a separate PM-authorized task.

---

## 13. Backup Contract

Both the database and file storage MUST be backed up before first real data ingestion.

| Component | Backup Method | Minimum Schedule | Required Before Live Data |
|-----------|--------------|-----------------|--------------------------|
| PostgreSQL | Managed PITR or pg_dump daily | Daily | YES |
| File storage (local) | Volume snapshot | Daily | YES |
| File storage (S3) | S3 versioning + cross-bucket sync | Continuous | YES |

See `docs/TDR-BACKUP-RESTORE-RUNBOOK.md` for full procedures.

**Full-data restore drill status:** Not yet proven against production-scale data.
Schema-only drill passed (56KB SQL dump). A full data restore must be performed
against a disposable DB before declaring production DR capability.

---

## 14. First Production Data Rollout Policy

Do not load real trade/customs data until all of the following have passed:

1. Environment provisioned with real secrets
2. DB backup/PITR confirmed active
3. Application deployed and health probes green
4. Auth smoke: login + F5 restore + logout
5. Synthetic small upload (test CSV, not real customs data)
6. Processing / quality check: batch reaches QUALITY_PENDING → PASS
7. Export / download check
8. Source lifecycle check: archive → restore
9. Metrics auth verified: `GET /metrics` with METRICS_TOKEN
10. Logs checked for unexpected ERROR lines
11. Backup confirmed for first DB state

Only then proceed with real customs/trade data ingestion.

---

## 15. Deployment Gap Matrix

| Item | Status |
|------|--------|
| Application code | READY IN REPO |
| Production env contract | READY IN REPO (see TDR-PRODUCTION-ENVIRONMENT.md) |
| Backend build/start commands | READY IN REPO |
| Frontend build/start commands | READY IN REPO |
| Migration procedure | READY IN REPO |
| Backup runbook | READY IN REPO |
| Operations runbook | READY IN REPO |
| Smoke checklist | READY IN REPO |
| Nginx reference config | READY IN REPO (docs/nginx/tdr-nginx.conf) |
| Systemd unit reference | READY IN REPO (docs/systemd/) |
| Hosting compute | OWNER DECISION REQUIRED |
| Production domain/DNS | OWNER DECISION REQUIRED |
| TLS certificate | OWNER DECISION REQUIRED (Let's Encrypt or provider) |
| Managed PostgreSQL provider | OWNER DECISION REQUIRED |
| Persistent file storage | OWNER DECISION REQUIRED |
| DB backup / PITR enablement | OWNER DECISION REQUIRED |
| Secret injection mechanism | OWNER DECISION REQUIRED |
| Metrics scraper (Prometheus) | OWNER DECISION REQUIRED |
| Malware scanner | DEFERRED P2 |
| S3 ingestion bridge | DEFERRED P2 |
| Full data restore drill | DEFERRED P3 |
| Outbound webhook internet access | OWNER DECISION (firewall/egress policy) |

---

## 16. True Owner Decisions Required

### Q1: Hosting provider / model

**Question:** Where will the application run?

**Recommendation:** Option A — Single Linux VPS (4 vCPU / 8 GB RAM) + managed PostgreSQL.  
Simplest operational model; easy to reason about; aligns with single-instance backend constraint.

**Alternatives:** Option B (S3 storage), Option C (container platform)

**Impact of deferral:** No deployment can proceed without a host.

---

### Q2: Production domain

**Question:** What domain name will the application use?

**Recommendation:** Single registrable domain (e.g. `tdr.yourdomain.com`) for both frontend
and API via nginx path-based routing. Avoids cross-site cookie complexity.

**Impact of deferral:** TLS, CORS config, and NEXT_PUBLIC_API_URL cannot be finalized.

---

### Q3: Managed PostgreSQL provider

**Question:** Which managed PostgreSQL service will be used?

**Recommendation:** Any provider offering PostgreSQL 18, automated backups, and PITR
(e.g. Neon, Supabase, AWS RDS, DigitalOcean Managed Databases, Railway Postgres).

**Impact of deferral:** DATABASE_URL cannot be set. Backup model unknown.

---

### Q4: Persistent file storage

**Question:** For `STORAGE_ADAPTER=local`: which volume/disk will hold `/var/lib/toplineshop/tdr`?

For `STORAGE_ADAPTER=s3`: which S3-compatible provider and bucket?

**Recommendation:** For first deployment, a persistent attached disk on the same VM.
Move to S3 when the S3 ingestion bridge is enabled.

**Impact of deferral:** Source files have no durable home; no backup possible.
