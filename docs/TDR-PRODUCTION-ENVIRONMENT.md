# TDR Production Environment Contract

Trade Data Refinery-Bushra — Production Environment Variables v1.0  
Date: 2026-09-22

---

## Overview

All variables below must be present in the production environment before starting
the backend. `validateEnv()` in `backend/src/config/env-validation.ts` enforces
this at startup — missing or weak values cause a fatal exit.

Inject secrets via CI/CD secret store, cloud secret manager, or a restricted
environment file (`/etc/tdr/env`, `chmod 600`, owned by the service account).
**NEVER commit real secrets to this repository.**

---

## Required — Backend

### Core

| Variable | Required | Description | Example / Format |
|----------|----------|-------------|-----------------|
| `NODE_ENV` | Yes | Must be `production` | `production` |
| `PORT` | Yes | Backend listen port | `4000` |
| `DATABASE_URL` | Yes | PostgreSQL connection string | `postgresql://user:pass@host:5432/tdr_prod?schema=public` |
| `JWT_ACCESS_SECRET` | Yes | Access token signing secret | 64+ random hex chars |
| `JWT_REFRESH_SECRET` | Yes | Refresh token signing secret | 64+ random hex chars, different from access |
| `CORS_ALLOWED_ORIGINS` | Yes | Frontend origin(s) | `https://yourdomain.com` |
| `TDR_WEBHOOK_SECRET_ENCRYPTION_KEY` | Yes | AES-256-GCM key for webhook secrets at rest | 64 lowercase hex chars |
| `METRICS_TOKEN` | Yes | Bearer token for GET /metrics | 64+ random hex chars |

### Storage — Local (STORAGE_ADAPTER=local)

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `STORAGE_ADAPTER` | Yes | `local` | `local` |
| `TDR_STORAGE_PATH` | Yes | Absolute path to persistent file volume | `/var/lib/toplineshop/tdr` |

### Storage — S3 (STORAGE_ADAPTER=s3)

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `STORAGE_ADAPTER` | Yes | `s3` | `s3` |
| `S3_BUCKET` | Yes | S3 bucket name | `toplineshop-tdr-prod` |
| `S3_REGION` | Yes | Bucket region | `ap-south-1` |
| `S3_ACCESS_KEY_ID` | Yes | AWS / provider access key | — |
| `S3_SECRET_ACCESS_KEY` | Yes | AWS / provider secret key | — |
| `S3_ENDPOINT` | No | Override for non-AWS endpoints | `https://s3.provider.com` |
| `S3_KEY_PREFIX` | No | Object key namespace | `tdr/` |

### Optional

| Variable | Default | Description |
|----------|---------|-------------|
| `COOKIE_SECURE` | `true` in production | Force-true when `NODE_ENV=production` |

---

## Required — Frontend

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `NEXT_PUBLIC_API_URL` | Yes | Backend API base URL (must match CORS_ALLOWED_ORIGINS target) | `https://yourdomain.com` |
| `NEXT_PUBLIC_APP_NAME` | No | Display name | `Trade Data Refinery` |
| `NEXT_PUBLIC_ENVIRONMENT` | No | Display environment tag | `production` |

**Note:** `NEXT_PUBLIC_*` variables are baked into the Next.js bundle at build time.
They must be set when running `npm run build`, not just at runtime.
Do NOT include backend secrets in `NEXT_PUBLIC_*`.

---

## Secret Generation Guide

Use these commands on a secure host. Never generate production secrets in a shared
terminal session. Never print them to shared logs.

```bash
# JWT_ACCESS_SECRET
openssl rand -hex 32

# JWT_REFRESH_SECRET (must differ from JWT_ACCESS_SECRET)
openssl rand -hex 32

# TDR_WEBHOOK_SECRET_ENCRYPTION_KEY (must be exactly 64 hex chars = 32 bytes)
openssl rand -hex 32

# METRICS_TOKEN
openssl rand -hex 32
```

**Minimum entropy requirements (from code):**

| Secret | Minimum | Format |
|--------|---------|--------|
| JWT_ACCESS_SECRET | Not in KNOWN_WEAK_SECRETS set, non-empty | Any string; 64+ hex recommended |
| JWT_REFRESH_SECRET | Same | Different from ACCESS_SECRET |
| TDR_WEBHOOK_SECRET_ENCRYPTION_KEY | Exactly 64 lowercase hex chars | 32 bytes AES-256-GCM key |
| METRICS_TOKEN | Non-empty (production) | Any string; 64+ hex recommended |

**KNOWN_WEAK_SECRETS rejected by validateEnv:**  
`CHANGE_ME_DEV_ONLY`, `changeme`, `secret`, `password`, `123456`, `""`

---

## PostgreSQL Connection String

```
postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=public
```

**Production hardening options (append to URL):**

| Option | Recommended Value | Notes |
|--------|------------------|-------|
| `connection_limit` | `10–25` | Start at 10; increase under measured load |
| `pool_timeout` | `10` | Seconds before pool timeout error |
| `sslmode` | `require` | Enforce TLS to DB (managed PG default) |

Example:  
`postgresql://tdr_user:SECRET@db.provider.com:5432/tdr_prod?schema=public&connection_limit=15&pool_timeout=10&sslmode=require`

---

## Production Startup Validation Gates

The following conditions cause a FATAL startup error (process exits, does not serve traffic):

| Gate | Condition |
|------|-----------|
| `JWT_ACCESS_SECRET` | Missing or known-weak value |
| `JWT_REFRESH_SECRET` | Missing or known-weak value |
| `DATABASE_URL` | Missing |
| `CORS_ALLOWED_ORIGINS` | Empty or contains `*` |
| `TDR_STORAGE_PATH` | Missing when `STORAGE_ADAPTER=local` |
| `S3_BUCKET` | Missing when `STORAGE_ADAPTER=s3` |
| `S3_REGION` | Missing when `STORAGE_ADAPTER=s3` |
| `S3_ACCESS_KEY_ID` | Missing when `STORAGE_ADAPTER=s3` |
| `S3_SECRET_ACCESS_KEY` | Missing when `STORAGE_ADAPTER=s3` |
| `TDR_WEBHOOK_SECRET_ENCRYPTION_KEY` | Missing (TdrWebhookService.onModuleInit) |
| `METRICS_TOKEN` | Absent + `NODE_ENV=production` → 401 on all scrape requests (not fatal startup, but metrics are unreachable) |

---

## What NOT to Do

- Do not put secrets in `NEXT_PUBLIC_*` — they are public
- Do not set `CORS_ALLOWED_ORIGINS=*` in production — startup will reject it
- Do not use `npm run start:dev` in production — uses ts-node, no optimization
- Do not run `prisma migrate dev` in production — use `prisma migrate deploy`
- Do not run multiple backend instances without reviewing the lease architecture
- Do not use Windows `D:\` path as `TDR_STORAGE_PATH` in production
- Do not store `TDR_WEBHOOK_SECRET_ENCRYPTION_KEY` anywhere it could be lost — key loss = webhook secrets unrecoverable
