# ToplineShop — Environment & Secrets Safety Plan

> **Status**: SAFETY PLAN DOCUMENT — NO SECRETS/BACKEND CREATED  
> **Date**: 2026-09-07  
> **Author**: Implementation Agent under PM governance  
> **Approval Required**: PM before any real secrets or backend configuration

---

## 1. Purpose

This document defines how ToplineShop will safely handle environment files, secrets, database credentials, API keys, payment keys, and sensitive configuration across local development, staging, and production.

It establishes guardrails before backend bootstrap begins, ensuring:
- No secrets enter version control
- Environment separation is enforced
- AI agents have clear STOP rules for secret exposure
- Owner approval gates protect production secrets

**This is a safety plan document only.** No real secrets, .env files, or backend configuration have been created.

---

## 2. Current State

| Item | Status |
|------|--------|
| Environment files | None exist |
| Secrets | None exist |
| Backend | Does not exist |
| Database | Does not exist |
| API endpoints | Do not exist |
| Auth implementation | Does not exist |
| Payment implementation | Does not exist |
| .gitignore | Updated to handle env files properly |
| .env.example | Created with safe placeholders only |

---

## 3. Environment File Policy

### 3.1 Allowed Files (May Be Committed)

| File | Purpose | Contains |
|------|---------|----------|
| `.env.example` | Frontend placeholder reference | Safe placeholder values only |
| `backend/.env.example` (future) | Backend placeholder reference | Safe placeholder values only |
| `.env.staging.example` (future) | Staging placeholder reference | Safe placeholder values only |
| `.env.production.example` (future) | Production placeholder reference | Safe placeholder values only |

### 3.2 Forbidden Files (Must Never Be Committed)

| File | Reason |
|------|--------|
| `.env` | May contain real secrets |
| `.env.local` | Local developer secrets |
| `.env.development` | Development environment secrets |
| `.env.staging` | Staging environment secrets |
| `.env.production` | Production environment secrets |
| `backend/.env` | Backend secrets |
| `backend/.env.local` | Backend local secrets |
| `backend/.env.staging` | Backend staging secrets |
| `backend/.env.production` | Backend production secrets |
| Any file containing real DATABASE_URL, JWT_SECRET, payment keys, API keys, SMTP keys, or admin passwords |

### 3.3 File Creation Rules

1. **Never create real .env files** in version control
2. **Only create .env.example** files with safe placeholders
3. **Placeholder values** must be obviously fake (e.g., `CHANGE_ME_DEV_ONLY`)
4. **Real .env files** created locally must be git-ignored
5. **Backend .env files** follow same pattern when backend is bootstrapped

---

## 4. Required Future Environment Variables

### 4.1 Frontend Public Variables

```env
# App Configuration (safe for client-side)
NEXT_PUBLIC_APP_NAME="ToplineShop"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NEXT_PUBLIC_API_BASE_URL="http://localhost:3001"
NEXT_PUBLIC_ENVIRONMENT="development"
```

### 4.2 Backend Core Variables

```env
# Server
NODE_ENV="development"
PORT="3001"
API_BASE_URL="http://localhost:3001"
FRONTEND_URL="http://localhost:3000"

# CORS
CORS_ALLOWED_ORIGINS="http://localhost:3000"
```

### 4.3 Database Variables

```env
# PostgreSQL
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE"
DATABASE_POOL_SIZE="10"
DATABASE_SSL_MODE="disable"
```

### 4.4 Auth/RBAC Variables

```env
# JWT / Auth
JWT_ACCESS_SECRET="CHANGE_ME_DEV_ONLY_ACCESS_SECRET_MIN_32_CHARS"
JWT_REFRESH_SECRET="CHANGE_ME_DEV_ONLY_REFRESH_SECRET_MIN_32_CHARS"
AUTH_COOKIE_SECRET="CHANGE_ME_DEV_ONLY_COOKIE_SECRET_MIN_32_CHARS"
PASSWORD_HASH_PEPPER="CHANGE_ME_DEV_ONLY_PEPPER"
SESSION_SECRET="CHANGE_ME_DEV_ONLY_SESSION_SECRET"
```

### 4.5 Email/Notification Variables (Future)

```env
# SMTP
SMTP_HOST="smtp.example.com"
SMTP_PORT="587"
SMTP_USER="CHANGE_ME"
SMTP_PASSWORD="CHANGE_ME"
EMAIL_FROM="noreply@toplineshop.com"
```

### 4.6 Payment Variables (Future — LOCKED)

```env
# Payment Provider (DO NOT SET UNTIL PAYMENT PHASE)
PAYMENT_PROVIDER="CHANGE_ME"
PAYMENT_SECRET_KEY="DO_NOT_SET_UNTIL_PAYMENT_PHASE"
PAYMENT_WEBHOOK_SECRET="DO_NOT_SET_UNTIL_PAYMENT_PHASE"
```

### 4.7 AI Variables (Future)

```env
# AI Provider (DO NOT SET UNTIL AI PHASE)
AI_PROVIDER="CHANGE_ME"
AI_API_KEY="DO_NOT_SET_UNTIL_AI_PHASE"
```

### 4.8 Storage Variables (Future)

```env
# Cloud Storage
STORAGE_PROVIDER="CHANGE_ME"
STORAGE_ACCESS_KEY="DO_NOT_SET_UNTIL_STORAGE_PHASE"
STORAGE_SECRET_KEY="DO_NOT_SET_UNTIL_STORAGE_PHASE"
STORAGE_BUCKET="CHANGE_ME"
```

---

## 5. Secrets Safety Rules

### 5.1 Absolute Rules

1. **No secrets in Git** — Never commit real credentials, keys, or tokens
2. **No secrets in WDRs** — Work Description Reports must not contain secrets
3. **No secrets in screenshots** — Redact all sensitive values in browser/dev screenshots
4. **No secrets in chat** — Do not paste real secrets into ChatGPT/opencode unless explicitly approved and masked
5. **No hardcoded keys** — Never embed secrets in source code
6. **No production in local** — Never use production credentials for local development
7. **No live payment keys** — Payment keys only during authorized payment phase
8. **Rotate after exposure** — If a secret is accidentally exposed, rotate immediately
9. **Owner approval required** — Production secrets require Owner/PM approval
10. **Placeholder only in .env.example** — Use obviously fake values

### 5.2 Secret Handling Workflow

```
1. Create .env.example with placeholders
2. Developer copies to .env.local locally
3. Developer fills in real values in .env.local
4. .env.local is git-ignored
5. Never share .env.local contents
6. Production secrets configured via CI/CD or hosting platform
```

### 5.3 Secret Rotation Policy

| Secret Type | Rotation Frequency | Trigger |
|-------------|-------------------|---------|
| JWT_ACCESS_SECRET | Every 90 days | Compromise suspicion |
| JWT_REFRESH_SECRET | Every 90 days | Compromise suspicion |
| DATABASE_URL password | Every 180 days | Compromise suspicion |
| PAYMENT_SECRET_KEY | Per provider recommendation | Compromise or phase start |
| API keys | Per provider recommendation | Compromise or phase start |
| AUTH_COOKIE_SECRET | Every 90 days | Compromise suspicion |

---

## 6. Gitignore Policy

### 6.1 Current .gitignore (Updated)

```gitignore
# env files — ignore all, allow .example placeholders
.env
.env.*
!.env.example
!.env.*.example

# backend env (future)
backend/.env
backend/.env.*
!backend/.env.example
!backend/.env.*.example
```

### 6.2 Gitignore Rules

1. **`.env` ignored** — Root env file
2. **`.env.*` ignored** — All env variants (.env.local, .env.staging, etc.)
3. **`.env.example` allowed** — Safe placeholder file
4. **`.env.*.example` allowed** — Example files for staging/production
5. **`backend/.env*` ignored** — Future backend env files
6. **`backend/.env.example` allowed** — Backend placeholder file
7. **Documentation/WDR not ignored** — Docs and governance files tracked

### 6.3 Gitignore Verification

```bash
# Check if .env would be ignored
git check-ignore .env  # Should return .env

# Check if .env.local would be ignored
git check-ignore .env.local  # Should return .env.local

# Check if .env.example is NOT ignored
git check-ignore .env.example  # Should return nothing (tracked)
```

---

## 7. Environment Separation

### 7.1 Local Development

| Aspect | Policy |
|--------|--------|
| Purpose | Developer workstation |
| DATABASE_URL | Local PostgreSQL or Docker |
| JWT secrets | Development-only values |
| Payment keys | Test/sandbox keys only |
| Logging | Verbose, debug enabled |
| Access | Individual developer |
| Owner approval | Not required |

### 7.2 Test (Automated)

| Aspect | Policy |
|--------|--------|
| Purpose | CI/CD test suite |
| DATABASE_URL | Test database (isolated) |
| JWT secrets | Test-only values |
| Payment keys | Test/sandbox keys only |
| Logging | Minimal |
| Access | CI/CD system |
| Owner approval | Not required |

### 7.3 Staging

| Aspect | Policy |
|--------|--------|
| Purpose | Pre-production validation |
| DATABASE_URL | Staging database (separate from prod) |
| JWT secrets | Staging-specific values |
| Payment keys | Test/sandbox keys |
| Logging | Moderate |
| Access | PM/Dev team |
| Owner approval | Required for first setup |

### 7.4 Production

| Aspect | Policy |
|--------|--------|
| Purpose | Live customer-facing |
| DATABASE_URL | Production database |
| JWT secrets | Production-specific, high-entropy values |
| Payment keys | Live payment keys |
| Logging | Structured, audit-focused |
| Access | Owner/PM only for secrets |
| Owner approval | **Required for all secret configuration** |

---

## 8. Database URL Safety

### 8.1 Rules

1. **Local DB only for development** — Never connect to production from local scripts
2. **Staging DB separate** — Different database instance from production
3. **Production DB isolated** — No external access except approved connections
4. **No production access from local** — Unless explicit Owner/PM approval
5. **No migrations against production** — Without backup and Owner approval
6. **No seed/reset scripts** — Unless explicitly task-authorized
7. **DATABASE_URL never committed** — Always in .gitignore

### 8.2 Database Environment Pattern

```
Local:      postgresql://toplineshop_dev:password@localhost:5432/toplineshop_dev
Test:       postgresql://toplineshop_test:password@localhost:5432/toplineshop_test
Staging:    postgresql://toplineshop_staging:password@staging-db-host:5432/toplineshop_staging
Production: postgresql://toplineshop_prod:password@prod-db-host:5432/toplineshop_prod
```

### 8.3 Migration Safety

1. **Backup before migration** — Always backup production before schema changes
2. **Test on staging first** — Run migrations on staging before production
3. **Owner approval required** — Production migrations need explicit approval
4. **Rollback plan** — Every migration must have a rollback strategy
5. **No destructive operations** — Without Owner approval and backup confirmation

---

## 9. Auth Secret Safety

### 9.1 JWT Secret Rules

1. **Minimum 32 characters** — High entropy required
2. **Environment-specific** — Different values per environment
3. **Long/random** — Generated via secure random generator
4. **No defaults** — Never use default or common values
5. **No sharing** — Never share production JWT secrets in chat/email
6. **Rotation** — Rotate every 90 days or on compromise suspicion

### 9.2 Secret Separation

| Secret | Purpose | Separate Per Environment |
|--------|---------|--------------------------|
| JWT_ACCESS_SECRET | Access token signing | Yes |
| JWT_REFRESH_SECRET | Refresh token signing | Yes |
| AUTH_COOKIE_SECRET | Cookie signing | Yes |
| PASSWORD_HASH_PEPPER | Password hash pepper | Yes |
| SESSION_SECRET | Session signing | Yes |

### 9.3 Secret Generation

- Use `openssl rand -base64 48` or equivalent
- Never use weak passwords or common strings
- Generate separately for each environment
- Store in hosting platform's secret manager (not in files)

---

## 10. Payment Secret Safety

### 10.1 Payment Phase Rules

1. **Deferred until payment phase** — No payment keys before Phase 9+
2. **Test keys first** — Always start with sandbox/test keys
3. **Live keys require Owner approval** — Explicit approval before live configuration
4. **Never expose to frontend** — Payment keys only in backend
5. **Webhook secrets separate** — Different from API keys
6. **All payment events audit-logged** — Every payment action recorded

### 10.2 Payment Key Storage

```
PAYMENT_PROVIDER="stripe"                    # Provider name
PAYMENT_SECRET_KEY="sk_test_..."             # Test key (development)
PAYMENT_SECRET_KEY="sk_live_..."             # Live key (production — Owner approval required)
PAYMENT_WEBHOOK_SECRET="whsec_..."           # Webhook secret
```

### 10.3 Payment Safety Gates

1. **No live keys in development** — Never test with real payment keys
2. **Owner approval for live keys** — Required before production deployment
3. **Audit logging** — All payment API calls logged
4. **Error handling** — Never expose payment errors to client with sensitive details
5. **Webhook verification** — Always verify webhook signatures

---

## 11. AI/API Key Safety

### 11.1 AI Key Rules

1. **Deferred until AI phase** — No AI keys before authorized AI implementation
2. **Tenant-aware usage** — AI keys scoped to platform, not per-tenant
3. **No AI keys committed** — Always in .gitignore
4. **No AI keys in WDRs** — Governance documents must not contain keys
5. **Audit logging** — AI API usage logged per request
6. **Sensitive data protection** — No tenant PII sent to AI without policy approval

### 11.2 AI Usage Policy

| Data Type | Allowed for AI | Condition |
|-----------|----------------|-----------|
| Public product data | Yes | No restriction |
| Aggregated analytics | Yes | No PII |
| Order summaries | Yes | Anonymized |
| Customer PII | No | Without explicit policy |
| Payment data | No | Never |
| Vendor financials | No | Without Owner approval |

### 11.3 External API Key Management

| Provider | Key Type | Storage | Rotation |
|----------|----------|---------|----------|
| AI Provider | API Key | Secret manager | Per provider policy |
| SMTP | Password | Secret manager | Every 180 days |
| Cloud Storage | Access Key | Secret manager | Per provider policy |
| Payment | Secret Key | Secret manager | Per provider policy |

---

## 12. Agent Safety Rules

### 12.1 When AI Agent Detects Secrets

| Detection | Required Behavior |
|-----------|-------------------|
| Real secret in file | STOP → REPORT → WAIT FOR PM/OWNER |
| Real secret in terminal output | STOP → REPORT → WAIT FOR PM/OWNER |
| Accidental env exposure | STOP → REPORT → WAIT FOR PM/OWNER |
| Database reset command | STOP → REPORT → WAIT FOR PM/OWNER |
| Migration command | STOP → REPORT → WAIT FOR PM/OWNER |
| Production credentials | STOP → REPORT → WAIT FOR PM/OWNER |
| Payment keys in code | STOP → REPORT → WAIT FOR PM/OWNER |
| Secret in WDR/doc | STOP → REPORT → WAIT FOR PM/OWNER |

### 12.2 Agent Response Protocol

```
1. DETECT — Agent identifies potential secret/unsafe command
2. STOP — Immediately halt current operation
3. REPORT — Describe what was detected and why it's unsafe
4. WAIT — Do not proceed until PM/Owner provides explicit guidance
5. LOG — Record detection in WDR for audit trail
```

### 12.3 Agent Restrictions

- **Never commit secrets** — Even if requested, refuse
- **Never share secrets** — Even in chat output, mask/redact
- **Never create real .env** — Only .env.example with placeholders
- **Never run production migrations** — Without explicit approval
- **Never access production DB** — Without explicit approval
- **Never configure payment keys** — Without explicit approval

---

## 13. Optional .env.example Decision

### 13.1 Decision

**Created**: `.env.example` with safe placeholder values only.

### 13.2 Contents

```env
# ToplineShop — Frontend Environment Variables
# This file is safe to commit. Contains placeholder values only.

# App
NEXT_PUBLIC_APP_NAME="ToplineShop"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NEXT_PUBLIC_API_BASE_URL="http://localhost:3001"
NEXT_PUBLIC_ENVIRONMENT="development"
```

### 13.3 Safety Assessment

- ✅ No real secrets
- ✅ Obviously fake placeholder values
- ✅ Safe to commit
- ✅ No backend variables (frontend only)
- ✅ No payment keys
- ✅ No JWT secrets
- ✅ No database URLs

---

## 14. Owner Approval Gates

The following require Owner / PM approval:

1. **Production secret configuration** — Any secret in production environment
2. **Payment provider setup** — Configuring live payment keys
3. **Database migration to production** — Schema changes on live DB
4. **Secret rotation in production** — Changing production secrets
5. **API key provisioning** — New external service integration
6. **Staging environment setup** — First staging configuration
7. **CI/CD secret configuration** — Adding secrets to deployment pipeline

---

## 15. Deferred Items

| Item | Status | Notes |
|------|--------|-------|
| Backend .env.example | DEFERRED | Created when backend bootstrapped |
| Payment key configuration | DEFERRED | Phase 9+ |
| AI key configuration | DEFERRED | Phase 10+ |
| SMTP configuration | DEFERRED | Email feature phase |
| Cloud storage configuration | DEFERRED | Storage feature phase |
| CI/CD secret setup | DEFERRED | Deployment phase |
| Staging environment | DEFERRED | Deployment phase |
| Production environment | DEFERRED | Deployment phase |

---

## 16. Explicit "No Real Secrets Created" Note

**This document is a safety plan artifact only.**

- No real secrets created
- No real .env files created
- No .env.local created
- No backend/.env created
- No JWT secrets generated
- No database credentials created
- No payment keys configured
- No API keys provisioned
- No SMTP credentials created
- No cloud storage keys created
- .env.example created with safe placeholders only

---

## 17. Explicit "No Backend/Auth/Database/Payment Implementation Created" Note

- No backend code created
- No API routes created
- No controllers/services/modules created
- No database schemas or migrations created
- No auth implementation created
- No login/logout logic created
- No RBAC middleware implemented
- No payment/checkout/order/RFQ/commerce logic implemented
- No CRM/ERP/FMCG/hospital/school/property/appointment/consultant modules implemented
- Frontend unchanged (17 routes, mock data only)
- No packages installed
- shop.com untouched
- TOPLINE-P3-007 not started
