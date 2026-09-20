# TDR-AUTH-SESSION-LIFECYCLE-CORRECTION-001-CHECKPOINT-001 — Work Done Record
**AUTH SESSION LIFECYCLE RUNTIME VERIFIED — PASS**
**REAL CHROME TOKEN-EXPIRY + REFRESH + STORM PROTECTION EVIDENCE**
**Date:** 2026-09-20
**Branch:** codex/trade-data-refinery
**Status:** ✅ PASS — RUNTIME CERTIFIED

---

## §1. BASELINE

| Item | Value |
|------|-------|
| Branch | `codex/trade-data-refinery` |
| HEAD at checkpoint start | `88fbdcf` |
| Correction commit | `5d6379e` — fix(auth): restore TDR session continuity on token refresh |
| WDR being updated | TDR-AUTH-SESSION-LIFECYCLE-CORRECTION-001 (`88fbdcf`) |
| Purpose | Close remaining evidence gap: prove access-token expiry → refresh → retry in real running browser |

---

## §2. SCOPE

This checkpoint adds **real owner Chrome runtime evidence** to the correction already committed at `5d6379e`.

No runtime code was changed. No new migrations. No Phase 7.

Automated test results from correction commit remain authoritative:
- Frontend Vitest: 62/62 PASS (13 new tests added in correction)
- Backend Jest: 481/482 PASS (1 known skip)
- Frontend tsc: PASS
- Frontend production build: PASS

---

## §3. APPLICATION STATE AT CHECKPOINT

| Component | Status |
|-----------|--------|
| Backend | Running — `http://localhost:4000` |
| Frontend | Running — `http://localhost:3000` |
| `GET /health` | 200 `{ status: "ok", database: "ok" }` |
| Working tree | Clean — no uncommitted changes after `88fbdcf` |

---

## §4. REAL CHROME RUNTIME EVIDENCE — TOKEN EXPIRY + REFRESH

### §4.1 Observed Timeline

| Time | Event |
|------|-------|
| ~21:14:55 | Owner logged in at `http://localhost:3000/tdr` — login succeeded, TDR UI rendered |
| ~21:31:30 | Multiple protected Analytics API requests returned **HTTP 401** — access token had expired (elapsed: ~16 min 35 s; TTL: 900 s / 15 min) |
| ~21:31:32 | **Exactly one** `POST /auth/refresh` issued → **HTTP 200** — new access token issued |
| ~21:31:32 | Protected Analytics requests retried automatically → **HTTP 200** |
| ~21:31:32+ | Browser remained signed in — no manual re-login required |
| ~21:31:32+ | Analytics rendered normally |
| ~21:31:32+ | Subsequent Overview and Analytics requests continued returning **200** |

### §4.2 Refresh Storm Evidence

Multiple concurrent 401 responses from Analytics triggered the `tryRefreshOnce()` mutex.

**Observed:** multiple simultaneous 401s → **exactly one** `POST /auth/refresh` call.

This confirms the module-level `_pendingRefresh` promise mutex implemented in `src/lib/tdr-api.ts`.

### §4.3 Stale Auth UI — No Regression Observed

At no point during the 401 window did the navigation header show an unauthenticated state while protected content showed an error. After refresh and retry completed, the page rendered with the authenticated header intact.

---

## §5. REFRESH LIFECYCLE CONFIRMED

```
Login (21:14:55)
  → accessToken stored in AuthProvider (TTL: 900s)
  → refreshToken stored in AuthProvider (new — RC-001 fix)

[15 min elapsed — access token expires]

Protected Analytics requests (21:31:30)
  → 401 Unauthorized

tryRefreshOnce() called (all concurrent 401s await same Promise — storm protection)
  → POST /auth/refresh { refreshToken } (21:31:32)
  → HTTP 200 → new accessToken + new refreshToken
  → onRefreshSuccess() → AuthProvider state updated

Original requests retried with new accessToken
  → HTTP 200

Analytics renders normally. Header: admin@toplineshop.dev. No re-login required.
```

---

## §6. FAILED REFRESH / SESSION EXPIRED PATH

Not observed in the 15-minute runtime test (session was valid throughout).

Covered by automated tests in `src/__tests__/tdr-auth-refresh-api.test.ts` and `src/__tests__/tdr-auth-refresh.test.tsx`:

| Test | Verified |
|------|---------|
| `calls onAuthFailed and throws when refresh fails` | PASS |
| `shows "Session expired — please sign in again" when onAuthFailed is triggered` | PASS |
| `clearAuth() (logout) does not set sessionExpired` | PASS |
| `onAuthFailed callback does not write to localStorage` | PASS |

Server-side revocation path also confirmed: `JwtStrategy.validate()` checks `session.revokedAt !== null` on every request — revoked sessions return 401 immediately even with non-expired JWT.

---

## §7. HARD REFRESH LIMITATION

Hard browser refresh (F5) still returns to the login gate because `AuthProvider` state is in-memory only.

**Classification:** PM-005 OPEN — IN-MEMORY SESSION LIMITATION

This is not a regression. It is the known MVP limitation documented in every WDR since Mega 5.

---

## §8. SECURITY VERIFICATION

| Constraint | Status |
|-----------|--------|
| No JWT values in URL at any point | ✅ |
| No token values printed in logs or WDR | ✅ |
| No password recorded | ✅ |
| JwtAuthGuard intact | ✅ |
| RolesGuard intact | ✅ |
| TenantModuleGuard intact | ✅ |
| No localStorage / sessionStorage introduced | ✅ |
| Refresh cannot replay after logout | ✅ — confirmed by server revocation model |
| PM-005 in-memory architecture unchanged | ✅ |
| No Phase 7 started | ✅ |

---

## §9. TEST EVIDENCE SUMMARY

| Suite | Result |
|-------|--------|
| Frontend Vitest | 62 / 62 PASS ✅ |
| Backend Jest | 481 / 482 PASS ✅ (1 known skip) |
| Frontend tsc | PASS ✅ |
| Frontend production build | PASS ✅ |
| Real Chrome — login | PASS ✅ |
| Real Chrome — full SPA navigation | PASS ✅ |
| Real Chrome — 15-min access token expiry | PASS ✅ |
| Real Chrome — one refresh for concurrent 401s | PASS ✅ (storm protection confirmed) |
| Real Chrome — page rendered without re-login | PASS ✅ |
| Real Chrome — no stale auth header | PASS ✅ |

---

## §10. GOVERNANCE COMMIT

| Commit | Hash | Content |
|--------|------|---------|
| Correction runtime | `5d6379e` | 6 files — auth-context, tdr-api, layout, tests |
| Correction WDR | `88fbdcf` | WDR — SESSION LIFECYCLE PASS |
| Checkpoint WDR | see below | This file |

---

## §11. VERDICT

**AUTH SESSION LIFECYCLE RUNTIME VERIFIED — PASS**

Real Chrome evidence recorded. Token expiry → auto-refresh → retry confirmed with actual timestamps. Refresh storm protection confirmed. All automated tests pass. No runtime code changes required. No Phase 7 started.

**Next task cleared for PM approval:** `TDR-PAKISTAN-CUSTOMS-MAPPING-PROFILES-001`
