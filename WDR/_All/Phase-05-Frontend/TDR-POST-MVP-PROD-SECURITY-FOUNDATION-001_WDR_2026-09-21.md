# WDR: TDR-POST-MVP-PROD-SECURITY-FOUNDATION-001
**Date:** 2026-09-21  
**Task:** POST-MVP-PROD-SECURITY-FOUNDATION-001 — MEGA TASK 1  
**Author:** Javed Ahmed Chohan  
**Branch:** codex/trade-data-refinery  
**Status:** PASS  

---

## §1 — Scope

MEGA TASK 1 of the post-MVP production readiness plan (TDR-POST-MVP-PRODUCTION-READINESS-PLAN-001).
Implements the security and session foundation required before production deployment.

**In scope:**
- JWT secret hardening with fatal startup error on weak/missing secrets in production
- Central environment validation (`validateEnv()`) called before `NestFactory.create()`
- HttpOnly cookie refresh token (PM-005): cookie lifecycle on login/refresh/logout
- Frontend session restoration on page reload via cookie
- Health/live + health/ready endpoints
- Production CORS hardening (no wildcard with credentials)
- Backend security foundation tests (19 tests)
- Frontend session persistence tests (8 tests + 8 updated tests)

**Out of scope (hard boundaries not crossed):**
- IStorageAdapter / D:\ storage migration / S3
- Source file lifecycle schema
- Observability platform / BullMQ / Redis
- Backup implementation
- CRM/ERP connectors / SFTP
- Partitioning / Phase 7

---

## §2 — Files Changed

### New files
| File | Purpose |
|------|---------|
| `backend/src/config/env-validation.ts` | Central env validation; throws FATAL in production on missing/weak secrets |
| `backend/src/auth/auth-security-foundation.spec.ts` | 19 security tests (§A validateEnv, §B cookie lifecycle, §C health probes) |
| `src/__tests__/auth-session-persistence.test.tsx` | 8 PM-005 session persistence tests |

### Modified files
| File | Change |
|------|--------|
| `backend/src/main.ts` | Calls `validateEnv()` before `NestFactory.create()`; CORS uses `env.corsOrigins` |
| `backend/src/auth/auth.controller.ts` | HttpOnly cookie: `setRefreshCookie`, `clearRefreshCookie`, `parseCookieHeader`; PM-005 login/refresh/logout |
| `backend/src/auth/dto/refresh.dto.ts` | `refreshToken` made optional (`?`) — cookie is primary |
| `backend/src/app.controller.ts` | Added `GET /health/live` and `GET /health/ready` endpoints (both `@Public()`) |
| `backend/src/app.service.ts` | `getLiveness()` + `getReadiness()` (503 if DB unavailable or config invalid) |
| `backend/.env.example` | Added `COOKIE_SECURE`, `TDR_STORAGE_PATH`; TLS/HTTPS contract comments; secret management contract |
| `src/lib/tdr-api.ts` | `authRefresh()` uses `credentials: 'include'`, no body token; `authLogin`/`authLogout` use `credentials: 'include'`; `tryRefreshOnce` no longer checks `getRefreshToken` |
| `src/lib/auth-context.tsx` | PM-005: `restoring` state; mount effect calls `authRefresh()` to restore from cookie; `getRefreshToken` returns null (cookie is authority) |
| `src/__tests__/tdr-auth-refresh-api.test.ts` | Updated test "getRefreshToken null" — now verifies cookie-based behavior (2 fetch calls, onAuthFailed called) |
| `src/__tests__/tdr-auth-refresh.test.tsx` | `authRefresh` mock returns `mockRejectedValue` (Promise) instead of `undefined` |
| `src/__tests__/tdr-login-gate.test.tsx` | `authRefresh` mock returns `mockRejectedValue` (Promise) instead of `undefined` |

---

## §3 — Security Contracts Established

### JWT Secret Hardening
- `validateEnv()` in `backend/src/config/env-validation.ts` throws FATAL if in production and:
  - `JWT_ACCESS_SECRET` or `JWT_REFRESH_SECRET` is absent, empty, or in `KNOWN_WEAK_SECRETS` set
  - `KNOWN_WEAK_SECRETS = { 'CHANGE_ME_DEV_ONLY', 'changeme', 'secret', 'password', '123456', '' }`
  - `DATABASE_URL` is absent
  - `CORS_ALLOWED_ORIGINS` contains wildcard `*`

### HttpOnly Cookie (PM-005)
- Cookie name: `tdr_refresh`
- Flags: `HttpOnly=true`, `Secure=true` (in production or when `COOKIE_SECURE=true`), `SameSite=Strict`, `Path=/auth`
- TTL: 30 days (`maxAge`)
- Set on: `POST /auth/login`
- Rotated on: `POST /auth/refresh`
- Cleared on: `POST /auth/logout`
- Cookie is parsed without middleware (`parseCookieHeader` function)
- In production: body `refreshToken` fallback is rejected (cookie-only)
- In development: body `refreshToken` fallback accepted (DX convenience)

### No JS-Accessible Token Storage
- `authRefresh()` sends `credentials: 'include'` — no body token
- `auth-context.tsx` `getRefreshToken` callback returns `null` — no token stored in memory/localStorage
- `tryRefreshOnce()` no longer reads `getRefreshToken` — calls `authRefresh()` directly

### Session Restoration
- `AuthProvider` mount effect calls `authRefresh()` with `credentials: 'include'`
- If cookie valid → sets `accessToken` in state; `restoring: false`
- If cookie absent/expired → silent catch; `restoring: false`; user sees login gate
- `restoring: true` until attempt completes (prevents login gate flash)

### Production CORS
- `main.ts` reads `CORS_ALLOWED_ORIGINS` from env (validated by `validateEnv()`)
- No wildcard allowed in production
- `credentials: true` required for cookie support

### Health Probes
- `GET /health/live` — liveness; never fails due to DB; always 200 from a running process
- `GET /health/ready` — readiness; 200 if DB reachable and config valid; 503 otherwise
- Both are `@Public()` (no auth required)

---

## §4 — Test Results

### Backend (Jest)
```
Test Suites: 17 passed, 17 total
Tests:       1 skipped, 675 passed, 676 total
```
- **New**: `auth-security-foundation.spec.ts` — 19 tests (§A: 11, §B: 3, §C: 5)

### Frontend (Vitest)
```
Test Files: 10 passed (10)
Tests:      129 passed (129)
```
- **New**: `auth-session-persistence.test.tsx` — 8 tests (P.1/1b/2/3/4/5/6/7/8)
- **Updated**: `tdr-auth-refresh-api.test.ts` — 8 tests (all pass)
- **Updated**: `tdr-auth-refresh.test.tsx` — 5 tests (all pass)
- **Updated**: `tdr-login-gate.test.tsx` — 15 tests (all pass)

### TypeScript
```
backend: npx tsc --noEmit → 0 errors
frontend: npx tsc --noEmit → 0 errors
```

### Prisma
```
npx prisma validate → schema valid
```

---

## §5 — Governance

### Stop Conditions Checked
- [x] No destructive risk
- [x] No architecture contradiction
- [x] No unexpected existing content modified
- [x] No scope expansion
- [x] No secrets in repo
- [x] No database destructive action
- [x] shop.com not touched

### Exact Files Staged
Will be staged exactly (no `git add .` / `git add -A`):
- `backend/src/config/env-validation.ts`
- `backend/src/main.ts`
- `backend/src/auth/auth.controller.ts`
- `backend/src/auth/dto/refresh.dto.ts`
- `backend/src/app.controller.ts`
- `backend/src/app.service.ts`
- `backend/.env.example`
- `backend/src/auth/auth-security-foundation.spec.ts`
- `src/lib/tdr-api.ts`
- `src/lib/auth-context.tsx`
- `src/__tests__/auth-session-persistence.test.tsx`
- `src/__tests__/tdr-auth-refresh-api.test.ts`
- `src/__tests__/tdr-auth-refresh.test.tsx`
- `src/__tests__/tdr-login-gate.test.tsx`
- `WDR/_All/Phase-05-Frontend/TDR-POST-MVP-PROD-SECURITY-FOUNDATION-001_WDR_2026-09-21.md`

---

## §6 — Next Action

MEGA TASK 1 complete. Next: PM authorization required for MEGA TASK 2 (IStorageAdapter / S3 migration).
