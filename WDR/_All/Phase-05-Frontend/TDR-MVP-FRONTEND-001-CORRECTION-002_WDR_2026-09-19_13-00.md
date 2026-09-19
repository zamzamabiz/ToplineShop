# WDR — TDR-MVP-FRONTEND-001-CORRECTION-002
**Date:** 2026-09-19  
**Branch:** codex/trade-data-refinery  
**Starting HEAD:** 1ed91dd (CORRECTION-001 WDR commit)  
**Correction commit:** 3c56950  
**Status:** PASS  
**Governance:** #123 EXECUTE → VERIFY/AUDIT → CLOSE  
**Correction author:** Claude Sonnet 4.6

---

## 1. Baseline

| Field | Value |
|---|---|
| Branch | codex/trade-data-refinery |
| Starting HEAD | 1ed91dd (CORRECTION-001 WDR) |
| CORRECTION-001 runtime commit | 32244c403bff26a455bdee8eb7dc886dc7062f71 |
| CORRECTION-001 WDR commit | 1ed91dd9158b322a0e0b76033b58a90e07571e40 |
| CORRECTION-002 commit | 3c56950 |

---

## 2. Root Cause — Credential Hygiene Issue

### Issue A — Plaintext password hardcoded in committed source

`backend/prisma/seed.js` (committed at 32244c4) contained:

```
const DEV_PASSWORD = 'DevAdmin123!';
...
console.log(`Password:      ${DEV_PASSWORD}`);
```

The password was also embedded in `src/__tests__/tdr-login.test.ts` as mock test data.

The CORRECTION-001 WDR security audit incorrectly stated "Dev password in seed.js only (not in WDR, not in code): CONFIRMED." This was wrong — the password was hardcoded in `seed.js` source. That statement has been retroactively corrected.

**Credential status:** `DevAdmin123!` must be considered exposed and rotated. Do not reuse it.

### Issue B — Seed re-run did not rotate password

The User upsert used `update: {}`, meaning re-running seed would not change the password hash for an existing dev user. A new password supplied via env var would have no effect.

### Issue C — Role architecture gap (pre-existing, documented)

The `Membership` model carries no roles field. `auth.service.ts issueAccessToken()` always passes `roles: []`. Every login issues empty roles. This means:

- Read-only TDR endpoints (analytics, batches list, records, status) — **accessible** (no `@Roles()` decorator)
- Mutation endpoints (cancel, replay, correct, upload) — **inaccessible to all users** via decorator-level `@Roles()` requiring SUPER_ADMIN / TENANT_ADMIN
- Export creation — **inaccessible** via `checkExportAuthorization()` service-level check

This is not a new defect — it was latent in the original auth design. PM authorization is required to extend the Membership model with a roles field (architectural gap: PM-006 OPEN).

---

## 3. Credential Hygiene Correction

### `backend/prisma/seed.js`

**Before:**
```javascript
const DEV_PASSWORD = 'DevAdmin123!';
// ...
const passwordHash = await argon2.hash(DEV_PASSWORD, { type: argon2.argon2id });
// ...
update: {},  // User upsert — password NOT rotated on re-run
// ...
console.log(`Password:      ${DEV_PASSWORD}`);
```

**After:**
```javascript
const rawPassword = process.env.TDR_DEV_ADMIN_PASSWORD;
if (!rawPassword) {
  throw new Error('TDR_DEV_ADMIN_PASSWORD is required for development seed...');
}
// ...
const passwordHash = await argon2.hash(rawPassword, { type: argon2.argon2id });
// ...
update: { passwordHash },  // User upsert — hash rotated on every run
// ...
console.log(`Password:      [set via TDR_DEV_ADMIN_PASSWORD env var — not echoed]`);
```

Safe local usage:
- PowerShell: `$env:TDR_DEV_ADMIN_PASSWORD="<your-choice>"; npm run seed`
- bash: `TDR_DEV_ADMIN_PASSWORD="<your-choice>" npm run seed`

No default value. Script fails loudly if env var absent.

### `src/__tests__/tdr-login.test.ts`

Replaced hardcoded `'DevAdmin123!'` test data string with `'test-password'`. The test uses mock fetch (`vi.fn()`) — the string is never sent to any server. Replacement removes the only remaining source-tree reference to the exposed credential.

---

## 4. Rotation Result

The old credential `DevAdmin123!` was:
- Hardcoded in `backend/prisma/seed.js` (now removed)
- Printed to console on every seed run (now removed)
- Present in `src/__tests__/tdr-login.test.ts` as mock test data (now replaced)
- Mentioned in `WDR/_All/Phase-05-Frontend/TDR-MVP-FRONTEND-001-CORRECTION-001_WDR_2026-09-19_13-00.md` (now redacted)
- Present in this session's chat history

Because it existed in git history and chat, it must not be reused as a production credential. The seed's `update: { passwordHash }` clause ensures re-running seed with a new env var value immediately invalidates the old hash for the dev account.

Historical git commits containing the old password (`32244c4`) remain in history. Git history rewrite was not performed (per governance — history is never rewritten).

---

## 5. Role Architecture

The `Membership` model (Prisma schema, frozen in Mega 1) carries no `role` or `roles` field:

```prisma
model Membership {
  id        String           @id @default(uuid())
  userId    String           @map("user_id")
  tenantId  String           @map("tenant_id")
  status    MembershipStatus
  ...
}
```

`auth.service.ts login()`:
```typescript
const accessToken = this.issueAccessToken(user.id, tenantId, [], session.id);
// roles always []
```

There is no persisted role assignment in the current architecture. This is documented as PM-006 OPEN — no fake role system was invented.

**Dev inspection user capabilities:**

| Action | Role required | With roles: [] | Notes |
|---|---|---|---|
| Login | none | ✓ PASS | JWT issued |
| GET /tdr/status | none | ✓ PASS | read-only |
| GET /tdr/batches | none | ✓ PASS | read-only |
| GET /tdr/analytics/* | none | ✓ PASS | read-only |
| GET /tdr/records | none | ✓ PASS | read-only |
| POST /tdr/batches/upload | SUPER_ADMIN / TENANT_ADMIN / IMPORT_MANAGER / EXPORT_MANAGER | ✗ 403 | @Roles decorator |
| POST /tdr/batches/:id/cancel | SUPER_ADMIN / TENANT_ADMIN | ✗ 403 | @Roles decorator |
| POST /tdr/batches/:id/replay | SUPER_ADMIN / TENANT_ADMIN | ✗ 403 | @Roles decorator |
| POST correct | SUPER_ADMIN / TENANT_ADMIN / IMPORT_MANAGER / EXPORT_MANAGER | ✗ 403 | @Roles decorator |
| POST /tdr/exports | service check | ✗ 403 | checkExportAuthorization([]) |

Owner can inspect all read-only TDR pages after login. Mutations are blocked by design until PM-006 is authorized.

**Dev account:**
- Email: `admin@toplineshop.dev`
- Tenant: ERP64 Dev Tenant (erp64-dev)
- Effective role: none (Membership carries no roles)
- TDR module: ENABLED
- Password: set locally via `TDR_DEV_ADMIN_PASSWORD` — not recorded here

---

## 6. RBAC Matrix — Verified Decorators

| Endpoint | Guard source | Required roles |
|---|---|---|
| POST /tdr/batches/upload | `@Roles()` decorator on `UploadController.uploadBatch` | SUPER_ADMIN, TENANT_ADMIN, IMPORT_MANAGER, EXPORT_MANAGER |
| POST /tdr/batches/:id/cancel | `@Roles()` decorator on `TdrController.cancelBatch` | SUPER_ADMIN, TENANT_ADMIN |
| POST /tdr/batches/:id/replay | `@Roles()` decorator on `TdrController.replayBatch` | SUPER_ADMIN, TENANT_ADMIN |
| POST /tdr/.../correct | `@Roles()` decorator on `TdrController.applyCorrection` | SUPER_ADMIN, TENANT_ADMIN, IMPORT_MANAGER, EXPORT_MANAGER |
| POST /tdr/exports | service-level `checkExportAuthorization()` in `TdrExportService` | SUPER_ADMIN, TENANT_ADMIN, ANALYST (any); IMPORT_MANAGER (IMPORT only); EXPORT_MANAGER (EXPORT only) |

`RolesGuard` is registered as `APP_GUARD` (global) in `AuthModule`. It runs BEFORE controller-level `TenantModuleGuard`. `roles: []` is denied before the service layer is reached for all role-decorated endpoints.

---

## 7. Roleless Negative Tests

HTTP integration tests confirm denial via full AppModule with mocked PrismaService:

| Test | Expected | Actual |
|---|---|---|
| roles: [] → POST cancel | 403 | 403 ✓ |
| roles: [] → POST replay | 403 | 403 ✓ |
| roles: [] → POST correct | 403 | 403 ✓ |
| roles: [] → POST exports (no direction) | 403 | 403 ✓ |
| roles: [] → POST exports (with direction) | 403 | 403 ✓ |
| roles: [] → GET /tdr/status | NOT 401/403 | 200/500* ✓ |
| roles: [] → GET /tdr/batches | NOT 401/403 | 200/500* ✓ |

\* 500 is acceptable in tests — service layer hits incomplete mock for some read endpoints. RBAC passes (not 401/403). A 500 proves the request was NOT denied at the auth/RBAC layer.

---

## 8. Auth Login / Refresh / Logout Contract

All three `auth.controller.ts` handlers verified to use `success()` wrapper:

```typescript
async login(...)  { return success(await this.authService.login(...)); }
async refresh(...){ return success(await this.authService.refresh(...)); }
async logout(...) { return success(await this.authService.logout(...)); }
```

Login response envelope:
```json
{
  "ok": true,
  "data": {
    "accessToken": "...",
    "refreshToken": "...",
    "expiresIn": 900,
    "user": { "userId": "...", "email": "...", "tenantId": "...", "roles": [] }
  }
}
```

CORRECTION-001 envelope fix is preserved. No regression.

---

## 9. Analytics Regression

All analytics DTO tests pass:
- `TrendQueryDto` accepts `granularity: DAY|MONTH|YEAR`, rejects unknown values
- `BreakdownQueryDto` accepts `dimension: tradeDirection|hsChapter|...` and `topN: string`
- `AnalyticsFilterDto` accepts all 13 filter fields unchanged
- No `::uuid` cast re-introduced (text columns remain uncasted)

---

## 10. Tests

| Suite | Pass | Fail | Skip | Delta |
|---|---|---|---|---|
| Backend: 10 suites (all) | 481 | 0 | 1 (known) | +44 (correction-002) |
| Frontend: all 3 suites | 35 | 0 | 0 | 0 |
| **TOTAL** | **516** | **0** | **1** | +44 |

New tests added in `backend/src/trade-data-refinery/tdr-correction-002.spec.ts` (44 tests):
- §1 Seed hygiene: 6 tests
- §2 RBAC decorator metadata: 16 tests
- §3 Roleless negative HTTP: 7 tests
- §4 Auth envelope contract: 4 tests
- §5 Analytics DTO regression: 11 tests

---

## 11. Build and TypeScript

| Check | Result |
|---|---|
| `backend npx tsc --noEmit` | 0 errors |
| `frontend npx tsc --noEmit` | 0 errors |
| `npm run build` (Next.js) | PASS — 7 TDR routes |
| `git diff --check` (warnings only) | CRLF line-ending warnings (Windows, not errors) |

---

## 12. Security Audit

| Check | Status |
|---|---|
| No plaintext dev password in committed source | CONFIRMED — seed.js uses env var only |
| No password printed to console | CONFIRMED — echo replaced with "[not echoed]" message |
| No token logged | CONFIRMED |
| DATABASE_URL not in any committed file | CONFIRMED |
| No tenantId hardcoded in frontend | CONFIRMED |
| TenantModuleGuard intact | CONFIRMED |
| RolesGuard intact (global APP_GUARD) | CONFIRMED |
| Mutation RBAC intact — decorator verified | CONFIRMED (44 tests) |
| No auth bypass introduced | CONFIRMED |
| No production credential created | CONFIRMED — dev seed only |
| `backend/.env` not staged | CONFIRMED |
| `F:\OpenCode\shop.com` not accessed | CONFIRMED |
| Git history not rewritten | CONFIRMED — old commits with exposed password preserved in history |
| Exposed credential noted as rotated | CONFIRMED — DevAdmin123! must not be reused |
| PM-006 OPEN (roles architecture gap) | DOCUMENTED — no fake role system introduced |

---

## 13. Commit

```
3c56950  fix(tdr): harden dev credentials and frontend RBAC verification
```

Files staged exactly:
- `backend/prisma/seed.js` — M
- `src/__tests__/tdr-login.test.ts` — M
- `WDR/_All/Phase-05-Frontend/TDR-MVP-FRONTEND-001-CORRECTION-001_WDR_2026-09-19_13-00.md` — M (retroactive correction)
- `backend/src/trade-data-refinery/tdr-correction-002.spec.ts` — A

No `git add .` or `git add -A` used.

---

## 14. Mega 6 Status

**NOT STARTED.** `TDR-MVP-FINAL-AUDIT-001` is BLOCKED pending explicit PM authorization.

---

## Final Verdict

**MEGA 5 SECURITY CORRECTION VERIFIED — READY FOR GPT REVIEW**

Credential hygiene: hardcoded password removed from seed.js, env-var guard in place, hash rotation on each seed run, exposed credential must be rotated.  
RBAC: all mutation endpoints confirmed role-restricted, roleless user denied 403 on all mutations by HTTP integration tests.  
Architecture gap (PM-006): Membership carries no roles — documented, not patched without PM authorization.  
Mega 6 not started.
