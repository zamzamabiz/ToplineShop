# TDR Local Production-Like Environment

Trade Data Refinery-Bushra — Local Validation Environment Reference v1.0  
Date: 2026-09-22  
Task: TDR-LOCAL-PRODUCTION-LIKE-VALIDATION-001

---

## Purpose

This document defines the local production-like validation environment for TDR.
The owner has chosen to run ERP64 TDR locally for several months of sustained
testing and real-data validation before any VPS or public deployment.

**This is a deliberate validation phase. VPS/public deployment is deferred by owner decision.**

---

## Three Environment Tiers

| Tier | When | NODE_ENV | JWT Secrets | Cookie Secure | HTTPS |
|------|------|----------|-------------|---------------|-------|
| Development | Active feature work, test runs | `development` | Placeholder OK | false | Not required |
| **Local Production-Like Validation** | **Months-long owner testing with real data** | **`development` or `production-local`** | **MUST USE STRONG SECRETS** | **false (HTTP)** | **Not required** |
| Future VPS Production | After owner acceptance gate | `production` | MUST USE STRONG SECRETS | true | REQUIRED |

---

## Local Architecture

```
Windows localhost
     │
     ├── Next.js frontend        :3000
     │
     ├── NestJS backend          :4000
     │       │
     │       ├── PostgreSQL      :5433
     │       │
     │       └── D:\ToplineShopData\TDR\
     │                ├── <tenantId>\  (source files — immutable)
     │                ├── exports\
     │                ├── temp\
     │                └── archive\
     │
     └── Browser                 http://localhost:3000
```

---

## Backend Environment Variables — Local Validation

File: `backend/.env`  
**This file is NOT in git. Never commit it. Contains real credentials.**

### Required — Core

| Variable | Dev Default | Local Validation Value | Notes |
|----------|-------------|----------------------|-------|
| `NODE_ENV` | `development` | `development` | Keep as development to allow HTTP cookies |
| `PORT` | `4000` | `4000` | Leave unchanged |
| `DATABASE_URL` | `postgresql://user:pass@localhost:5433/toplineshop_dev` | Same + verify port/db name | Port is 5433 on this machine |
| `JWT_ACCESS_SECRET` | `CHANGE_ME_DEV_ONLY` | **REPLACE with strong secret** | See §Secret generation |
| `JWT_REFRESH_SECRET` | `CHANGE_ME_DEV_ONLY` | **REPLACE with strong secret** | Must differ from access secret |
| `CORS_ALLOWED_ORIGINS` | `http://localhost:3000` | `http://localhost:3000` | Leave unchanged |
| `STORAGE_ADAPTER` | `local` | `local` | Keep local for this phase |
| `TDR_STORAGE_PATH` | `D:\ToplineShopData\TDR` | `D:\ToplineShopData\TDR` | Matches existing data root |

### Required — Security (Add if not present)

| Variable | Value | Notes |
|----------|-------|-------|
| `TDR_WEBHOOK_SECRET_ENCRYPTION_KEY` | `<64 hex chars>` | REQUIRED before creating webhook subscriptions. Generate: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` |
| `METRICS_TOKEN` | `<any string>` | Optional locally but recommended for consistency. Without it, `/metrics` is open in dev. |

### Optional

| Variable | Default | Notes |
|----------|---------|-------|
| `COOKIE_SECURE` | `false` | Leave false for HTTP localhost |
| `API_BASE_URL` | `http://localhost:4000` | Leave unchanged |
| `FRONTEND_URL` | `http://localhost:3000` | Leave unchanged |

---

## Frontend Environment Variables — Local Validation

File: `.env.local` at repo root (create if absent)

```
NEXT_PUBLIC_API_URL=http://localhost:4000
NEXT_PUBLIC_APP_NAME=Trade Data Refinery
NEXT_PUBLIC_ENVIRONMENT=local-validation
```

---

## Secret Generation (Local)

Generate strong JWT secrets using Node.js (no external tools needed):

```powershell
# JWT_ACCESS_SECRET
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# JWT_REFRESH_SECRET (run again — must be different)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# TDR_WEBHOOK_SECRET_ENCRYPTION_KEY (must be exactly 64 hex chars)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Paste the outputs into `backend/.env`. Do not commit the file.

---

## Cookie Behavior on Localhost

HttpOnly refresh cookies work correctly on `http://localhost:3000` because:
- `NODE_ENV=development` → `COOKIE_SECURE=false` → Secure flag NOT set
- `SameSite=Strict` → Same-origin request (localhost → localhost) is allowed
- No HTTPS required for localhost cookie delivery

**No change to the production cookie security contract is made.**
This is an environment-appropriate behavior for localhost.

---

## Auth Behavior on Localhost

The validateEnv() function enforces strict JWT secret requirements ONLY when
`NODE_ENV=production`. During local validation with `NODE_ENV=development`, the
application starts with weak or placeholder secrets.

**For months-long real-data validation: REPLACE JWT_ACCESS_SECRET and JWT_REFRESH_SECRET
with strong secrets before ingesting real shipment data.**

---

## Storage Configuration

Source files are stored immutably at:
```
D:\ToplineShopData\TDR\<tenantId>\<sourceFileId>
```

Exports are stored at:
```
D:\ToplineShopData\TDR\exports\<tenantId>\<exportJobId>.csv
```

**These paths are outside the git repository. They are NOT backed up by git.**

---

## Database Configuration

| Item | Value |
|------|-------|
| Host | localhost |
| Port | 5433 (non-standard — local override) |
| Database | toplineshop_dev |
| Schema | public |
| User | postgres |

---

## Known Limitations for This Phase

| Item | Status | Notes |
|------|--------|-------|
| Upload malware scanning | NOT IMPLEMENTED — P2 | Only upload files from trusted sources |
| Live S3 ingestion | NOT ENABLED — P2 | Local storage path is used |
| HTTPS | Not required locally | HTTP is fine for localhost |
| External hosting | NOT PROVISIONED — owner decision | Deliberate deferral |
| Full production restore SLA | NOT PROVEN — P3 | Local restore drill passed |

---

## What NOT to do

- Do not upload real trade data from unknown or untrusted sources (no malware scanning)
- Do not use `npm run start:dev` for sustained validation (watch mode; use `npm run start:prod` for stability)
- Do not run multiple backend instances simultaneously (single worker instance constraint)
- Do not expose port 4000 to the local network unless intentionally
