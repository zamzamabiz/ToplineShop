# ToplineShop — Phase 8 Database/Auth/RBAC Readiness Plan

> **Status**: READINESS PLAN — PLANNING ONLY
> **Date**: 2026-09-10
> **Task**: TOPLINE-P8-001
> **Phase**: Phase 8 — Database, Authentication, RBAC & Security
> **Author**: Implementation Agent under PM governance
> **Approval Required**: PM before any database schema change, auth code, package install, or migration

This is a planning artifact only. **No database commands were executed. No auth/RBAC code, packages, or migrations were written. No implementation occurred.** The current repository at HEAD `314fe82` is identical to the post-Phase-7 freeze-gate state from the perspective of database, auth, and RBAC files.

---

## A. Governance Header

- **Task**: TOPLINE-P8-001 — Phase 8 Database/Auth/RBAC Readiness Plan
- **Date**: 2026-09-10
- **Phase**: Phase 8 — Database, Authentication, RBAC & Security
- **Type**: READINESS PLAN (planning-only)
- **Approval boundary**: PM must approve before any future TOPLINE-P8-002+ task begins.
- **Implementation confirmation**: This task did **not** modify any backend source, frontend source, package, Prisma schema, migration, env file, or deployable artifact. The only files created or modified are the six files allowed by the P8-001 prompt: this plan, the registry update, the agent reports, the PM_OUTBOX hold notice, and the WDR.

---

## B. Objective and Boundaries

### Security objective
Phase 8 must deliver an audit-grade foundation for:
1. Tenant-aware user identity (registration, login, logout, password reset, email verification).
2. Backend-enforced Role-Based Access Control (RBAC) so the existing 4 write endpoints (`POST /tenants`, `POST /vendors`, `POST /categories`, `POST /products`) and all future endpoints can answer "is this caller allowed?" without changing endpoint shapes.
3. Safe, default-deny behavior under missing/invalid/expired credentials.
4. Audit completeness for every authenticated and denied action, building on the existing `AuditLog` capability.

### Planning vs implementation
This document is a plan. It is a contract for what later PM-approved tasks will do. It does **not** start, authorize, or execute any Phase 8 work. PM must approve the plan and then approve each subsequent task before that task runs.

### Protection of frozen Phase 4 and Phase 7
- Phase 4 schema (7 models, 1 migration) and Phase 7 code (5 controllers, 4 write endpoints, 11 read endpoints, testing foundation) are **frozen**. Phase 8 must protect them.
- Phase 8 must **not** change the shape of existing endpoints, the `Create*Dto` validation rules, the `success()` envelope, the `*Summary` projections, the `phase-7` registry rollup, the testing foundation, or the frontend API client contracts.
- Phase 8 must **not** add new write endpoints or PATCH/DELETE endpoints. Future P8 tasks will wrap existing endpoints in guards; the endpoint shapes stay the same.

### #FDD alignment
- Frontend (Phase 2, Phase 6) is already frozen with mock data. Phase 8 must not change frontend routes, components, or types. The existing frontend `api-client.ts` POST methods will continue to work in mock-data mode; gating them is **not** a Phase 8 task (the frontend can be wired to real auth-aware endpoints in a later PM-approved phase).
- "Frontend guards are UX only" per Phase 3 design — Phase 8 enforces on the backend.

---

## C. Inherited Implemented Baseline

### Implemented and frozen (cannot be changed without PM approval)
| Item | Status | Source / commit |
|---|---|---|
| Prisma 6.19.3 + `@prisma/client` 6.19.3 installed | Implemented | `backend/package.json` |
| 7 Prisma models | Implemented | `backend/prisma/schema.prisma` |
| 7 Prisma enums | Implemented | `backend/prisma/schema.prisma` |
| One migration: `20260907172636_init_core_schema` | Implemented | `backend/prisma/migrations/` |
| 11 indexes, 11 FKs, no destructive SQL, no seed | Implemented | P4-004B audit |
| NestJS 11 backend with 5 controllers (app, tenants, vendors, categories, products) | Implemented | Phase 7 (commits `9b3ec1e`, `031005c`, `189a587`, `ce2bc2b`) |
| 11 GET endpoints (read-only) | Implemented | P5-003…P5-007 |
| 4 POST endpoints (write API): `POST /tenants`, `POST /vendors`, `POST /categories`, `POST /products` | Implemented | P7-004/-R2, P7-005, P7-006, P7-007 |
| 4 `Create*Dto` classes with class-validator | Implemented | `backend/src/*/dto/create-*.dto.ts` |
| 4 `Create*Request` types + 4 `create*` frontend client methods + `postApi` helper | Implemented | P7-009 (commit `4646688`) |
| Global pipes: `CustomValidationPipe`, `AllExceptionsFilter`, `LoggingInterceptor` | Implemented | `backend/src/main.ts` |
| CORS configured for `http://localhost:3000` (env-overridable) | Implemented | `backend/src/main.ts` |
| `AuditLog` Prisma model + `AuditService.recordEvent()` skeleton | Implemented but **not wired** | `backend/src/audit/`, P5-004 |
| Jest testing foundation (`test.utils.ts`, `test.module.ts`, 12-test proof spec) | Implemented | P7-008 (commit `2197d84`) |
| 4 evidence scripts (`test-tenant-create.js`, `test-vendor-create.js`, `test-category-create.js`, `test-product-create.js`) | Implemented | P7-004-R2 through P7-007 |
| `phase-7` registry rollup: `status: "CLOSED"`, `progress: 100`, `taskCount: 19`, `completedTaskCount: 19` | Implemented | P7-010 + corrective R1/R2 |
| `wdr-046`…`wdr-064` (16 Phase 7 WDR audit entries) | Implemented | P7-001…P7-010-R2 |

### Designed (Phase 3 docs) but **not implemented** — must not be assumed to exist
| Item | Phase 3 design location | Status |
|---|---|---|
| `User.passwordHash` column | `PHASE-03-DATABASE-SCHEMA-DESIGN.md` §5.1 | Not implemented; Phase 4 schema explicitly deferred `passwordHash` to Phase 8+ |
| `User.emailVerified` column | `PHASE-03-DATABASE-SCHEMA-DESIGN.md` §5.1 | Not implemented; deferred to Phase 8+ |
| `AuthAccount` model (OAuth providers, encrypted access/refresh tokens) | `PHASE-03-AUTH-RBAC-DESIGN.md` §4.11 | Not implemented; deferred |
| `Session` model (session tokens, IP, user agent) | `PHASE-03-AUTH-RBAC-DESIGN.md` §4.12 | Not implemented; deferred |
| `Role` model (PLATFORM/TENANT/MODULE scope, `isSystem`) | `PHASE-03-AUTH-RBAC-DESIGN.md` §4.4 | Not implemented; deferred |
| `Permission` model (`module.resource.action`, `isDangerous`) | `PHASE-03-AUTH-RBAC-DESIGN.md` §4.5 | Not implemented; deferred |
| `RolePermission` (M:N) | `PHASE-03-AUTH-RBAC-DESIGN.md` §4.6 | Not implemented; deferred |
| `TenantMembershipRole` (membership × role) | `PHASE-03-AUTH-RBAC-DESIGN.md` §4.7 | Not implemented; deferred |
| `Module` and `TenantModule` (per-tenant module enablement) | `PHASE-03-AUTH-RBAC-DESIGN.md` §4.8, §4.9 | Not implemented; deferred |
| `VendorMembership` (vendor × user × `OWNER`/`MANAGER`/`STAFF`) | `PHASE-03-AUTH-RBAC-DESIGN.md` §4.10 | Not implemented; deferred |
| `ApprovalGate` (financial/AI approval flow) | `PHASE-03-AUTH-RBAC-DESIGN.md` §4.13 | Not implemented; deferred |
| `Auth.js` / `passport` / JWT / cookie / session middleware | `PHASE-03-AUTH-RBAC-DESIGN.md` §10 (packages) | **Not installed**; not implemented |
| `AuthGuard`, `RolesGuard`, `PermissionsGuard`, `@UseGuards`, `@Roles`, `@SetMetadata` | Various Phase 3 §9 | **None present** in `backend/src` (verified) |
| Auth header validation, bearer token parsing, request user attachment | n/a | **Not implemented**; `Authorization` header is in CORS allowed list but is never read |
| `User` model has only identity placeholder fields (email, name, phone, avatar, status) — no password, no session, no role binding | Phase 4 schema | Confirmed in `schema.prisma` |
| `Membership` is currently `(userId, tenantId)` with `status: ACTIVE|INVITED|SUSPENDED` only — no role binding | Phase 4 schema | Confirmed in `schema.prisma` |
| `Vendor.ownerId` is a nullable FK to `User` — used for ownership display, **not** access control | Phase 4 + P7-005 WDR | Confirmed |
| `AuditLog.metadata` (JSONB) and `AuditLog.summary` columns exist; `AuditService.recordEvent()` exists but **no service calls it** | `backend/src/audit/` | Verified — `recordEvent` callers: 0 in `backend/src` |

### Deferred
- All Phase 3 design tables listed under "Designed but not implemented" above are deferred from Phase 8 to later PM-approved phases. Phase 8 may add a small **subset** (the minimum needed for tenant-aware auth) but must record every addition in a future WDR.

### Absent
- `passwordHash`, `passwordResetToken`, `emailVerificationToken` columns
- Any `Session`, `AuthAccount`, `Role`, `Permission`, `RolePermission`, `TenantMembershipRole`, `Module`, `TenantModule`, `VendorMembership`, `ApprovalGate` model
- Any `AuthGuard` / `RolesGuard` / `PermissionsGuard` class
- Any `JwtStrategy`, `PassportStrategy`, `Argon2idHasher`, `BcryptHasher` class
- Any `@CurrentUser()`, `@RequireAuth()`, `@Roles()`, `@Permissions()` decorator
- Any cookie/session/bearer-token middleware
- `frontend` auth UI (login form, register form, password reset form, role-aware navigation, etc.)
- Real `.env` with real secrets

### Frontend protection boundary (the frozen contract Phase 8 must not change)
- `src/types/api.ts` — 4 `Create*Request` literal-union types + 4 `*Summary` response types
- `src/lib/api-client.ts` — 11 GET methods + 4 POST methods (`createTenant`/`createVendor`/`createCategory`/`createProduct`) + `fetchApi` + `postApi` + `API_BASE_URL`
- No frontend file may be modified by a Phase 8 implementation task without PM approval.

---

## D. Database Readiness

### What exists
- Prisma 6.19.3 client + CLI installed. `prisma:validate` and `prisma:generate` are package scripts. `PrismaService` extends `PrismaClient` and overrides `onModuleInit`/`onModuleDestroy` — `onModuleInit` is **empty** (does not connect to a database). `onModuleDestroy` calls `this.$disconnect()`.
- One migration: `backend/prisma/migrations/20260907172636_init_core_schema/` with `migration_lock.toml` and one SQL file. Migration was executed against the local dev database during P4-004B. No DROP, no destructive SQL, no seed.
- 7 models: `Tenant`, `User`, `Membership`, `Vendor`, `Category`, `Product`, `AuditLog`. 7 enums: `TenantType`, `TenantStatus`, `UserStatus`, `MembershipStatus`, `VendorStatus`, `CategoryStatus`, `ProductStatus`.
- `backend/.env.example` lists placeholder names only: `DATABASE_URL`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET` (all with placeholder values). `backend/.env` is git-ignored. Real `.env` was not opened and must not be opened by any future Phase 8 task.
- The local PostgreSQL is `toplineshop_dev` (per `PHASE-04-DATABASE-FOUNDATION-FREEZE-GATE.md` §6). No production database is configured.

### What is missing
- No `passwordHash` column on `User`. No `Session` or `AuthAccount` model. No `Role`/`Permission`/`RolePermission` models. No `VendorMembership` model.
- No `Session` token model. No `passwordResetToken`/`emailVerificationToken` columns.
- `AuditLog.ipAddress` and `AuditLog.userAgent` columns are missing (Phase 3 §4.14 listed them; Phase 4 schema deferred to Phase 8+). Without them, auth events cannot record client context.
- No `RefreshToken` / `tokenRevocation` model.
- No way to record "this user attempted to call `POST /vendors` without a valid token" because the audit call site does not exist.

### Prisma / PostgreSQL connection behavior
- `PrismaService.onModuleInit` is empty. Database connection is **not** established at backend startup.
- The `health` endpoint reports `database: not_configured` because the in-handler `try/catch` catches the absence of a live connection and returns the placeholder string. Verified during P4-005 freeze gate.
- A future P8 task that turns on real DB connectivity must decide: connect at startup (current `onModuleInit` becomes `await this.$connect()`), or connect on first query (lazy, requires re-engineering). Recommendation (PM to confirm): keep lazy until P8 proves production-safety; the existing health check is sufficient for the existing read-only smoke. **This is a question, not a decision** — PM should choose at the time of P8-002/003.

### Frozen boundaries (must not be broken by Phase 8)
- Existing 7 models, 7 enums, 1 migration must not be deleted or DROPped. Phase 8 may **add** new models/columns/enums/migration(s), but any change to existing fields requires a new PM-approved task and a corrective WDR.
- `backend/.env` must remain git-ignored. Real secrets must never be committed.
- `PrismaService` constructor and `onModuleDestroy` must continue to extend `PrismaClient` and call `this.$disconnect()` on shutdown.
- No `prisma migrate reset`, no `prisma db push --force-reset`, no `prisma db seed`, no `DROP TABLE`, no `TRUNCATE`. All destructive commands remain forbidden by `#123` and the Phase 4 freeze gate.

### Possible Phase 8 schema additions (questions, not decisions)
The following are candidate additions to support Phase 8. Each is a question for PM — not a committed change.
1. **Add `User.passwordHash` (VARCHAR(255) nullable for OAuth users)** — minimum needed for email/password login. Phase 3 design already documented this column. Phase 4 explicitly deferred it. **Open question**: nullable only (for OAuth) or also enforce non-null for password users via a future `AuthAccount` model? Recommendation: nullable, but require a future task to ensure every authenticated user has at least one `AuthAccount` row.
2. **Add `User.emailVerified` (BOOLEAN, default false)** — needed for "must verify before login" flows. Phase 3 §5.1. Open question: blocking (cannot login until verified) vs non-blocking (can login but with limited permissions until verified)? Recommendation: non-blocking with `emailVerified=false` permissions limited to `auth.verifyEmail`, `auth.resendVerification`.
3. **Add `AuditLog.ipAddress` (VARCHAR(45)) and `AuditLog.userAgent` (TEXT)** — needed for auth context. Phase 3 §4.14. Recommendation: add both; they are nullable for system events and required for auth events.
4. **Add `Session` model** — for refresh-token tracking, device list, revoke. Phase 3 §4.12. Open question: cookie session vs opaque-token session vs JWT? Recommendation: opaque refresh-token + short-lived JWT access token (industry standard, easy to revoke).
5. **Add `Role`, `Permission`, `RolePermission`, `TenantMembershipRole` models** — minimum RBAC. Phase 3 §4.4–4.7. Open question: per-tenant roles, per-platform roles, or both? Recommendation: per-tenant roles assigned via `TenantMembershipRole`; platform-level roles via a separate `UserRole` table (or a row in `Membership` with `status: PLATFORM_ADMIN`).
6. **Add `VendorMembership` model** — vendor user assignment with `OWNER`/`MANAGER`/`STAFF` role. Phase 3 §4.10. Open question: replace `Vendor.ownerId` with `VendorMembership` (preferred) or keep both? Recommendation: keep `Vendor.ownerId` for back-compat and add `VendorMembership` for granular access (each vendor can have multiple users with different roles).

### Local vs production safety
- Local: `toplineshop_dev` PostgreSQL, can be destroyed and re-migrated freely. Future P8 tasks that need a fresh local DB must request explicit PM approval to run `prisma migrate reset` against the local DB.
- Production: not configured. Any future P8 task that touches a production database is forbidden by `#123`.

---

## E. Authentication Readiness

### Identity / login principles
- **Email + password is the only locally-supported credential type** until a future OAuth provider task is PM-approved. Phase 3 design includes OAuth (`AuthAccount` model) but it is **not** in scope for Phase 8.
- **No anonymous sessions.** A request without a valid access token to a protected endpoint must be rejected with HTTP 401.
- **No "remember me" tokens.** Refresh tokens are long-lived (30 days recommended) but revocable per session.

### Password hashing
- **Argon2id** is the recommended modern default. Phase 3 design does not specify a hash algorithm. Recommendation (PM to confirm): `argon2` npm package, `argon2.hash(password, { type: argon2.argon2id })`. Cost: tune on first run; record baseline timing in a Phase 8 audit.
- **bcrypt** is an acceptable fallback for older Node runtimes but is **not** recommended (CPU cost tuning is harder; GPU attacks are easier than against Argon2id).
- **Plaintext or reversible storage is forbidden.** Phase 3 §6.3 said passwords are stored in a `passwordHash` column (implying a one-way hash); the Phase 4 schema defers that column. Phase 8 must add the column AND wire a hasher.
- **Password policy** (minimum length, complexity, breach-list check): a future PM-approved task. Phase 8 minimum: 12 characters, no maximum (allow passphrases), trim whitespace, reject all-whitespace. **Open question**: do we check against HIBP or a similar breach list at registration/login? Recommendation: out of scope for Phase 8 (privacy + latency); revisit in a later phase.

### Credential storage
- `User.passwordHash` (new column, nullable for OAuth users).
- **No** plaintext email/SMS backup of passwords. **No** storing passwords in `AuditLog.metadata` or logs.
- **No** logging of the access token, refresh token, or bearer header value. The existing `LoggingInterceptor` does not log headers, which is the correct default; preserve it.

### Access / session / refresh / revocation / rotation
- **Access token**: short-lived JWT (e.g., 15 minutes). Contains `sub` (user id), `tenantId` (active tenant), `roles` (denormalized for fast guard check), `iat`, `exp`, `jti` (session id).
- **Refresh token**: long-lived (30 days), opaque random string (NOT a JWT). Stored hashed in `Session.refreshTokenHash`. One refresh token per session, **one session per device**.
- **Active tenant context**: the JWT carries a `tenantId`. A user with multiple `Membership`s can switch active tenant via `POST /auth/switch-tenant` (returns a new JWT with the new `tenantId`). Switch is itself audit-logged.
- **Revocation**: logout deletes the `Session` row. The access token's `jti` is also stored in `Session.id`; a session lookup during request handling rejects tokens whose `jti` no longer exists. Access tokens expire on their own; refresh tokens die on logout or admin revoke.
- **Rotation**: refresh tokens are single-use. Every refresh issues a new refresh token and deletes the old `Session` row (replay attack defense).
- **Disabled user / membership**: the existing `User.status: UserStatus` enum (`ACTIVE`, `DISABLED`) and `Membership.status: MembershipStatus` (`ACTIVE`, `INVITED`, `SUSPENDED`) are the suspension points. A request whose `User.status === 'DISABLED'` or whose active `Membership.status !== 'ACTIVE'` is rejected with HTTP 403. PM-confirmable: should disabled-user requests return 401 or 403? Recommendation: 401 (do not leak the user's existence) but allow legitimate "your account is disabled" responses to authenticated-and-then-disabled sessions.

### Cookie vs bearer
- **Bearer access tokens in `Authorization: Bearer <jwt>` header.** Avoids CSRF (no automatic cookie sending) and matches the existing CORS configuration (`Authorization` is already in `allowedHeaders`).
- **Refresh tokens are also bearer**, not cookies. They are sent only on `POST /auth/refresh` and `POST /auth/logout`. Single-use rotation prevents the most common cookie-based refresh attacks.
- **No** `Set-Cookie` from any auth endpoint. The frontend does not need a cookie store.
- **No `SameSite`/`Secure`/`HttpOnly` cookie attributes** are needed because we do not use cookies.

### Secret lifecycle
- `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET` are read from env at startup, never logged, never returned in any response, and never stored in `User` or `Session` (only their hashes are stored, if any). HS256 is acceptable for the access token (shared secret, simple, fast); RS256 is acceptable if a public-key verification model is desired later. Recommendation: HS256 for access, opaque (random-string) for refresh, with `argon2.hash(refreshToken)` to store the hash.
- **Secret rotation**: a future PM-approved task. Phase 8 minimum: a single secret per env var, generated via a documented `openssl rand -hex 64` step, recorded in the local `.env` (git-ignored). The `backend/.env.example` placeholder is `CHANGE_ME_DEV_ONLY` and must stay that way.
- **Production secret storage**: PM must approve the actual secret store (AWS Secrets Manager, GCP Secret Manager, HashiCorp Vault, etc.) before production deployment. **Out of scope for Phase 8.**

### Disabled-user / membership behavior
- A `User` with `status: DISABLED` cannot authenticate (no access token issued, refresh rejected).
- A `Membership` with `status: SUSPENDED` causes any request carrying that membership's `tenantId` to be rejected for that tenant. The user can still authenticate against other tenants they belong to.
- A `Membership` with `status: INVITED` cannot authenticate against that tenant until accepted. The user can still authenticate against other tenants.

### Open choices (PM must decide before P8-002/003)
1. HS256 vs RS256 for the access token.
2. Single-device vs multi-device sessions.
3. 15-min access / 30-day refresh vs different numbers.
4. Whether `POST /auth/switch-tenant` is in scope for the first P8 task or a later one.
5. Whether to require email verification before first login.
6. Whether to lock accounts after N failed login attempts, and at what threshold.
7. Whether password reset is in scope for the first P8 task or a later one.

---

## F. Tenant-Aware RBAC Readiness

### Owner / admin / vendor / customer / guest boundaries
Phase 3 design proposed:
- **Owner / Super Admin**: sees all tenants; all actions audit-logged.
- **Platform Admin**: limited tenant support; cannot access vendor financials.
- **Vendor Owner / Manager / Staff**: vendor-scoped only.
- **Wholesale Buyer**: requires approval; B2B only.
- **Registered Customer**: own orders, own profile.
- **Guest**: read-only public marketplace.

For Phase 8, the minimum RBAC scope is:
- A `Membership` row exists → user can act within that tenant.
- A `VendorMembership` row (new) → user can act within that vendor.
- A `Role` + `Permission` + `RolePermission` set → user can perform specific actions.
- Cross-tenant access: **deny by default**. A request whose `tenantId` does not match any `Membership` for the user is rejected with HTTP 403.

### User / Membership / Tenant / Role / Permission relationships
- `User` (global) 1:N `Membership` (per tenant) 1:N `TenantMembershipRole` (role binding) N:1 `Role` N:M `Permission` via `RolePermission`.
- `User` 1:N `VendorMembership` (per vendor) 1:1 `Vendor` with role `OWNER`/`MANAGER`/`STAFF`.
- `Tenant` 1:N `Membership`, 1:N `Vendor`, 1:N `Category`, 1:N `Product`, 1:N `AuditLog`.
- `Role.scope` is one of `PLATFORM` (e.g., `OWNER`, `PLATFORM_ADMIN`), `TENANT` (e.g., `VENDOR_OWNER`, `VENDOR_MANAGER`), or `MODULE` (future).

### Backend authority
- **Every** write endpoint (and every future read of protected data) must run a `RolesGuard`/`PermissionsGuard` that resolves `userId → roles → permissions → allowed` for the request's `tenantId` and `vendorId` (if applicable).
- The guard is the **single authority**. No endpoint may skip it. The guard must be a NestJS global guard OR applied to every controller method — both are acceptable as long as no route is unprotected.
- The existing `CustomValidationPipe`, `AllExceptionsFilter`, and `LoggingInterceptor` continue to apply. The new auth guard is added as a global guard, in the order: `LoggingInterceptor` → `AuthGuard` → `RolesGuard` → `PermissionsGuard` → `CustomValidationPipe` → controller method.

### Frontend UX-only checks
- The existing frontend `/owner/*`, `/admin/*`, `/vendor/*` routes are visible but currently fetches data via the read-only GET endpoints. Phase 8 must not add new frontend route guards — that is a future frontend task. The backend guards are sufficient for security; the frontend can stay as-is and a future task will add a UX-only "show / hide" pass.

### Deny-by-default cross-tenant access
- A request with no `Membership` for the requested `tenantId` is rejected. This is enforced by the `AuthGuard` checking `userId` against `Membership` and by the `PermissionsGuard` checking the resolved `role` against the requested `tenantId`.
- A request whose JWT carries `tenantId=A` but the body targets `tenantId=B` is rejected with HTTP 403 (tenant mismatch).
- A vendor-scoped user (`VendorMembership`) cannot read or write another vendor's data even within the same tenant.

### Module and financial boundaries
- Module enablement (`Module`, `TenantModule`) is **deferred** from Phase 8. Phase 8 does not introduce module enablement. A future PM-approved phase may add it.
- Financial operations (`POST /payments`, `POST /refunds`, `POST /settlements`) are **deferred to Phase 9+**. Phase 8 must not authorize them. The `OWNER` role in Phase 3 was given access to `owner.finance.*` — that is a Phase 9 design, not Phase 8.
- For Phase 8, the minimum financial safety is: **deny by default**. A user with no `OWNER`-equivalent role cannot reach any `owner.*` permission. The platform does not yet have any financial endpoints, so the question is moot in practice but must be encoded in the seed permissions.

### Phase 3 vs Phase 4 schema contradictions (open questions, not decisions)

Phase 3 §4 listed the following tables that **were not** implemented in Phase 4. The P4-003 "Core Schema Foundation Design Lock" document explicitly deferred them. The contradictions and recommendations are:

| Phase 3 model | Status in Phase 4 | Recommendation for Phase 8 | PM decision needed |
|---|---|---|---|
| `User.passwordHash` | Not present (deferred) | Add as `String?` in P8-002/003 | Yes — confirm add |
| `User.emailVerified` | Not present (deferred) | Add as `Boolean @default(false)` in P8-002/003 | Yes — confirm add |
| `AuthAccount` (OAuth) | Not present (deferred) | Out of scope for Phase 8 | Yes — confirm defer |
| `Session` (refresh tokens, IP, UA) | Not present (deferred) | Add in P8-002/003 | Yes — confirm add |
| `Role` (PLATFORM/TENANT/MODULE scope) | Not present (deferred) | Add in P8-003/004 (after auth basics work) | Yes — confirm add |
| `Permission` (`module.resource.action`) | Not present (deferred) | Add in P8-003/004 | Yes — confirm add |
| `RolePermission` (M:N) | Not present (deferred) | Add in P8-003/004 | Yes — confirm add |
| `TenantMembershipRole` (membership × role) | Not present (deferred) | Add in P8-003/004 | Yes — confirm add |
| `Module` and `TenantModule` (per-tenant module enablement) | Not present (deferred) | Defer to a post-Phase 8 phase | Yes — confirm defer |
| `VendorMembership` (vendor × user × role) | Not present (deferred); `Vendor.ownerId` is the only vendor↔user link today | Add in P8-003/004 (alongside `Role`) | Yes — confirm add |
| `ApprovalGate` (financial/AI approval) | Not present (deferred) | Defer to Phase 9+ | Yes — confirm defer |
| `AuditLog.ipAddress`, `AuditLog.userAgent` | Not present (deferred) | Add in P8-002 (small additive migration) | Yes — confirm add |
| `UserRole` / `StaffRole` from Phase 3 §4.1 / §5.7 | Not present (overlap with `Membership`) | Do not add both. Use `Membership` + `TenantMembershipRole` (post-Phase 3 unified model) | Yes — confirm unification |

### Recommendation summary
- Add (in subsequent P8 tasks, after PM approval): `User.passwordHash`, `User.emailVerified`, `Session`, `AuditLog.ipAddress`, `AuditLog.userAgent`, `Role`, `Permission`, `RolePermission`, `TenantMembershipRole`, `VendorMembership`.
- Do not add (defer to later phases): `AuthAccount`, `Module`, `TenantModule`, `ApprovalGate`, `UserRole`/`StaffRole` (merged into `Membership` + `TenantMembershipRole`).
- All adds must come as a single forward-only migration in a future P8 task. Existing 7 models and 1 migration must remain unchanged.

---

## G. Security and Audit Readiness

### Auth events
- **Every** auth-relevant action must be recorded in `AuditLog`. Minimum events:
  - `auth.login.success` (with `userId`, `tenantId`, `ipAddress`, `userAgent`)
  - `auth.login.failure` (with `email` not `userId`, `ipAddress`, `userAgent`, `reason`)
  - `auth.logout` (with `userId`, `sessionId`, `ipAddress`)
  - `auth.refresh.success` / `auth.refresh.failure`
  - `auth.token.expired` (for observability)
  - `auth.password.reset.requested` / `auth.password.reset.completed`
  - `auth.email.verified`
  - `auth.membership.suspended` / `auth.membership.reinstated`
  - `auth.user.disabled` / `auth.user.reinstated`
  - `auth.tenant.switch` (with `fromTenantId`, `toTenantId`)
- `AuditLog.metadata` (existing JSONB column) carries per-event details.

### Denial / role-change auditing
- Every guard denial is logged: `auth.denied` with `userId`, `tenantId`, `endpoint`, `method`, `requiredPermission`, `ipAddress`, `userAgent`.
- Every role / permission change is logged: `auth.role.granted`, `auth.role.revoked`, `auth.permission.added`, `auth.permission.removed`, with `actorUserId`, `targetUserId`, `roleId`/`permissionId`, `tenantId`.
- `AuditLog` is **immutable** at the service layer: `AuditService.recordEvent()` is the only allowed write; `update` and `delete` operations are forbidden in code (no service method exposes them, no controller calls them).

### Safe errors
- The existing `AllExceptionsFilter` maps known errors to safe envelopes:
  - `NotFoundException` → HTTP 404 with `{ ok: false, error: { code: "NOT_FOUND", message: "<resource> not found" } }`
  - `ConflictException` → HTTP 409 with `{ ok: false, error: { code: "CONFLICT", message: "<conflict>" } }`
  - Validation errors → HTTP 400 with `{ ok: false, error: { code: "VALIDATION_ERROR", message: "Request validation failed", details: [...] } }`
- Auth errors must follow the same pattern: 401 for missing/expired token, 403 for forbidden. Both must NOT leak whether the user exists. The error message for 401 is fixed (`"Authentication required"`); the error message for 403 is fixed (`"Access denied"`).
- The `error.message` MUST NOT include `email`, `userId`, `tenantId`, `permission`, or any other internal identifier. **Open question**: should we include a correlation ID? Recommendation: yes, the existing `X-Correlation-ID` header is already plumbed through `LoggingInterceptor`; reuse it in error responses so users can reference it in support tickets.

### Redaction
- The existing `LoggingInterceptor` does not log request headers, query strings, or bodies. **This is correct. Preserve it.**
- `AuditLog.metadata` is `JSONB`. A future helper `redactMetadata(json)` must strip `password`, `passwordHash`, `token`, `accessToken`, `refreshToken`, `Authorization` header value, and any field name matching `*token*` or `*secret*` before insertion. Recommendation: implement in P8-002 as part of `AuditService.recordEvent()`; **do not** rely on callers to redact.
- The frontend `api-client.ts` and the WDR audit scripts must continue to NOT print the access token, refresh token, or `Authorization` header. Verified by inspection.

### Rate limits
- **Not implemented.** `backend/package.json` does not include `@nestjs/throttler` or any rate-limit dependency.
- Phase 3 §10 mentioned rate limits as a security primitive but did not specify a library. **Open question**: should Phase 8 include rate limiting? Recommendation: yes for auth endpoints (`POST /auth/login` ≤ 5/min/IP, `POST /auth/refresh` ≤ 30/min/IP, `POST /auth/forgot-password` ≤ 3/min/email). Use `@nestjs/throttler`. **PM must confirm before P8-002.**

### Brute-force protection
- Lockout after N consecutive failed login attempts. **Open question**: threshold and duration. Recommendation: 5 attempts → 15-minute lockout per email+IP pair. Lockout state stored in Redis or a new `LoginAttempt` model (PM to choose).
- Phase 8 minimum: in-memory lockout is **not** acceptable (it doesn't survive restarts and doesn't work across instances).

### CORS
- Existing CORS allows `GET`, `POST`, `PATCH`, `DELETE`, `OPTIONS` from `CORS_ALLOWED_ORIGINS` env (default `http://localhost:3000`) with `credentials: true`.
- Phase 8 minimum: tighten the default origin list (the default `http://localhost:3000` is acceptable for dev; production origins are env-supplied). No `*` allowed. The `Authorization` and `X-Correlation-ID` headers are already in `allowedHeaders` — keep them.

### Validation
- The existing `CustomValidationPipe` runs `whitelist: true`, `forbidNonWhitelisted: true`, `transform: true`. **This is correct. Preserve it.**
- Phase 8 auth endpoints must use DTOs with the same rigor. The DTOs are the input contract; class-validator is the enforcement.

### Secure defaults
- All new auth routes return 401 (not 200) for missing/invalid tokens. The existing `AllExceptionsFilter` preserves this if `UnauthorizedException` is used; the new auth code must use `UnauthorizedException` (401) and `ForbiddenException` (403), not raw HTTP responses.
- Sessions have a maximum lifetime (30 days refresh, 15 min access). No "never expire" sessions.
- Refresh tokens are single-use. A replayed refresh token is detected (the row is already gone) and the entire session is revoked.

---

## H. Gap and Decision Register

| ID | Gap / Decision | Evidence | Risk | Recommended Direction | PM Approval Needed | Blocking Task |
|---|---|---|---|---|---|---|
| GAP-01 | No `User.passwordHash` column | `backend/prisma/schema.prisma` | HIGH — cannot do email/password login | Add `String?` column via additive migration in P8-003 | Yes | P8-003 |
| GAP-02 | No `User.emailVerified` column | `backend/prisma/schema.prisma` | MEDIUM — cannot gate unverified users | Add `Boolean @default(false)` via additive migration in P8-003 | Yes | P8-003 |
| GAP-03 | No `Session` model for refresh tokens | `schema.prisma`, Phase 3 §4.12 | HIGH — no revocable sessions | Add `Session` model in P8-003 | Yes | P8-003 |
| GAP-04 | No `Role` / `Permission` / `RolePermission` / `TenantMembershipRole` models | `schema.prisma`, Phase 3 §4.4–4.7 | HIGH — no RBAC | Add in P8-004 (after auth basics) | Yes | P8-004 |
| GAP-05 | No `VendorMembership` model | `schema.prisma`, Phase 3 §4.10 | HIGH — no per-vendor user roles | Add in P8-004 | Yes | P8-004 |
| GAP-06 | `AuditLog.ipAddress` and `AuditLog.userAgent` columns missing | `schema.prisma`, Phase 3 §4.14 | MEDIUM — auth events lack client context | Add in P8-002 (small additive migration) | Yes | P8-002 |
| GAP-07 | `AuditService.recordEvent()` is not called by any service | `backend/src/audit/`, search for `recordEvent` in `backend/src` | MEDIUM — Phase 8 auth/denial events have nowhere to land | Wire the existing call sites; add auth/denial call sites in P8-002/003/004 | No (call sites only) | P8-002/003/004 |
| GAP-08 | No `AuthGuard` / `RolesGuard` / `PermissionsGuard` | `backend/src/`, no `@UseGuards` anywhere | HIGH — endpoints are publicly writable today | Add in P8-002 (auth) and P8-004 (RBAC) | Yes | P8-002, P8-004 |
| GAP-09 | No rate limiting | `backend/package.json` no throttler | MEDIUM — login brute-force possible | Add `@nestjs/throttler` in P8-002/003 for auth endpoints | Yes (new package) | P8-002/003 |
| GAP-10 | No email-verification flow | none | MEDIUM — unverified users can do anything | Implement in P8-005 (post-auth) | Yes | P8-005 |
| GAP-11 | No password reset flow | none | MEDIUM — locked-out users have no recovery | Implement in P8-005 (post-auth) | Yes | P8-005 |
| GAP-12 | No `POST /auth/login` / `/logout` / `/refresh` / `/switch-tenant` endpoints | `backend/src/tenants/`, `vendors/`, etc. have no auth controller | HIGH — auth surface missing | Add `auth` module in P8-003 | Yes | P8-003 |
| GAP-13 | `Vendor.ownerId` is the only vendor↔user link; no `VendorMembership` | `schema.prisma` | MEDIUM — multi-user vendor scenarios unsupported | Keep `Vendor.ownerId` (back-compat); add `VendorMembership` in P8-004 | Yes | P8-004 |
| GAP-14 | All 4 write endpoints (`POST /tenants`, `/vendors`, `/categories`, `/products`) are publicly writable | `backend/src/*/controllers/` | CRITICAL — anyone can create tenants, vendors, categories, products without auth | Wrap all 4 write endpoints in `AuthGuard` + `RolesGuard` in P8-002 (deny-by-default if no permission; even platform-owner must be authenticated) | Yes | P8-002 |
| GAP-15 | `PrismaService.onModuleInit` does not connect; `health` says `database: not_configured` | `backend/src/prisma/prisma.service.ts`, `backend/src/health/health.service.ts` | LOW (today) | P8-002 (or later) decides: lazy vs startup connect. PM must confirm. | Yes | P8-002+ |
| GAP-16 | `Membership.status: INVITED` users can authenticate against that tenant today (no enforcement) | `backend/src/` (no enforcement) | MEDIUM | P8-004 enforces `Membership.status === ACTIVE` for the active tenant | Yes | P8-004 |
| GAP-17 | `User.status: DISABLED` does not block authentication | `backend/src/` (no enforcement) | HIGH | P8-003 enforces `User.status === ACTIVE` | Yes | P8-003 |
| GAP-18 | Frontend routes `/owner/*`, `/admin/*`, `/vendor/*` are visible to any visitor; no route guards | `src/app/` | MEDIUM (UX only, backend is the authority) | Out of scope for Phase 8 (frontend is frozen) | No | Future phase |
| GAP-19 | `backend/.env.example` shows `JWT_ACCESS_SECRET=CHANGE_ME_DEV_ONLY` placeholder — correct for dev, but no production secret store is approved | `backend/.env.example` | HIGH in production | PM must approve secret store before any production deployment | Yes (production only) | Production |
| GAP-20 | No `@nestjs/throttler` or other rate-limit dependency | `backend/package.json` | MEDIUM | Add in P8-002/003 if PM confirms | Yes (new package) | P8-002/003 |
| GAP-21 | No `argon2`, `bcrypt`, or other password-hashing library | `backend/package.json` | HIGH | Add `argon2` in P8-002 (PM-confirmed) | Yes (new package) | P8-002 |
| GAP-22 | No JWT library (`@nestjs/jwt`, `jsonwebtoken`) | `backend/package.json` | HIGH | Add `@nestjs/jwt` and `@nestjs/passport` in P8-002/003 | Yes (new packages) | P8-002/003 |
| GAP-23 | Phase 3 design `UserRole` and `StaffRole` tables overlap with the `Membership` model | `PHASE-03-DATABASE-SCHEMA-DESIGN.md` §5.1, P4-003 | LOW (design conflict only) | Use `Membership` + `TenantMembershipRole` (post-Phase 3 unified). Do not add `UserRole`/`StaffRole`. | Yes | P8-004 |
| GAP-24 | `Module` and `TenantModule` (per-tenant module enablement) not present | `PHASE-03-AUTH-RBAC-DESIGN.md` §4.8–4.9 | LOW (no current need) | Defer to a post-Phase 8 phase | Yes (defer) | Future phase |
| GAP-25 | `ApprovalGate` (financial/AI approval) not present | `PHASE-03-AUTH-RBAC-DESIGN.md` §4.13 | LOW (no financial/AI work in Phase 8) | Defer to Phase 9+ | Yes (defer) | Phase 9+ |
| GAP-26 | `AuthAccount` (OAuth providers) not present | `PHASE-03-AUTH-RBAC-DESIGN.md` §4.11 | LOW (Phase 8 is email/password only) | Defer to a post-Phase 8 phase | Yes (defer) | Future phase |

---

## I. Risk Register

| ID | Risk | Severity | Mitigation | Verification Evidence | Owner |
|---|---|---|---|---|---|
| RISK-01 | **Unauthenticated writes** — anyone can `POST /tenants`, `/vendors`, `/categories`, `/products` today | CRITICAL | P8-002 wraps all 4 write endpoints in `AuthGuard`; deny-by-default; smoke test that unauthenticated requests return 401 | Existing `test-product-create.js` etc. fail to seed (no auth); PM-audited test report | PM + impl |
| RISK-02 | **Tenant isolation breach** — a future `findMany` could leak across tenants | HIGH | Phase 7 services already filter by `tenantId` for category/product; future services must follow the same pattern; P8-004 adds a `TenantContextGuard` that asserts the JWT's `tenantId` matches the route's resolved tenant | Existing category/product tests pass with same-tenant and fail with cross-tenant | PM + impl |
| RISK-03 | **Credential leakage** — password/token in logs or error responses | HIGH | `LoggingInterceptor` already excludes headers/bodies; `AuditService.redactMetadata()` strips `*token*`/`*secret*`/`*password*`; `AllExceptionsFilter` returns fixed messages for 401/403 | Manual code review + integration test that logs do not contain the credential substring | PM + impl |
| RISK-04 | **Token / session compromise** — stolen JWT used by attacker | HIGH | Short access-token lifetime (15 min); single-use refresh tokens; session revocation deletes the row so a replay fails; `AuditLog.ipAddress`/`userAgent` enable compromise detection | P8-003 tests that revoked sessions reject the access token; replay of a used refresh token triggers session revoke | PM + impl |
| RISK-05 | **Privilege escalation** — a user escalates from `VENDOR_STAFF` to `OWNER` via a forgotten route | HIGH | `RolesGuard` is a global guard; `PermissionsGuard` resolves the actual role hierarchy; admin actions go through `OWNER`-only permissions; all role changes audit-logged | P8-004 test that a `VENDOR_STAFF` token cannot call `owner.*` | PM + impl |
| RISK-06 | **Destructive migration** — `prisma migrate reset` or a DROP wipes the dev DB | MEDIUM (local only) | The current `PrismaService` does not connect at startup, so a `prisma db push` is the only risk. P8-002 keeps lazy connect. PM must approve any `migrate reset`. | Phase 4 freeze gate proved no destructive SQL was in the original migration | PM |
| RISK-07 | **Audit gaps** — auth events are not recorded | MEDIUM | P8-002 adds `AuditLog.ipAddress`/`userAgent`; P8-003 wires auth events; P8-004 wires denial events; `AuditService.recordEvent()` is the only writer | P8-003 test that `auth.login.success` creates an `AuditLog` row with the right fields | PM + impl |
| RISK-08 | **Production configuration** — secrets in env, CORS origins, JWT secret rotation | HIGH (in production) | Phase 8 is dev-only by design. Production deployment is out of scope. PM must approve production secret store, CORS origin list, and secret rotation policy before any production deploy. | Phase 4 freeze gate proved no production connection | PM (production only) |
| RISK-09 | **Phase 3 vs Phase 4 design contradictions** — `UserRole`/`StaffRole` (Phase 3) vs `Membership` (Phase 4) | LOW (design conflict) | GAP-23 recommends `Membership` + `TenantMembershipRole` as the unified model. No `UserRole`/`StaffRole` is added. | This document records the decision; P8-004 implements it. | PM |
| RISK-10 | **Phase 8 scope creep** — adding Module/TenantModule/ApprovalGate/AuthAccount prematurely | MEDIUM | P8 plan is bounded to email/password + RBAC + audit. Module/TenantModule deferred; ApprovalGate deferred; AuthAccount deferred. | This document enumerates the deferred items explicitly | PM |

---

## J. Proposed Governed Task Sequence

**Constraint**: Phase 8 is registered with `megaPromptTarget: 4`. The sequence below has 4 implementation tasks (P8-002, P8-003, P8-004, P8-005) plus the freeze gate (P8-006). If the audit reveals that P8-005 (email verification + password reset) needs to be split, the sequence can grow to 5 implementation tasks. **All tasks P8-002+ are PROPOSED, not approved. PM must approve each before execution. P8-001 does not register any of them.**

| Task | Title | Objective | Dependencies | Conceptual Scope | Allowed File Families | Forbidden Scope | Verification | Stop Conditions | WDR Evidence | PM Gate |
|---|---|---|---|---|---|---|---|---|---|---|
| **P8-002** | Auth Foundation + Write-Endpoint Guard Wrapping | Add the schema columns needed for auth (`User.passwordHash`, `User.emailVerified`, `AuditLog.ipAddress`, `AuditLog.userAgent`); add the `Session` model; add `argon2` and `@nestjs/jwt`; wire `AuditService.recordEvent` for the new audit context; add `AuthGuard` as a global NestJS guard; wrap all 4 write endpoints (`POST /tenants`, `/vendors`, `/categories`, `/products`) in the guard with deny-by-default; preserve every existing route shape; add `POST /auth/login` (returns access + refresh tokens) and `POST /auth/logout` (deletes session) and `POST /auth/refresh` (rotates refresh); keep login failures returning a fixed 401 message with no email/user-id leak. | P8-001 | Schema additive migration; auth module; `AuthGuard`; login/logout/refresh endpoints; 4 write endpoints wrapped | `backend/prisma/schema.prisma`, `backend/prisma/migrations/`, `backend/src/auth/`, `backend/src/tenants/`, `backend/src/vendors/`, `backend/src/categories/`, `backend/src/products/`, `backend/src/audit/`, `backend/src/common/`, `backend/src/prisma/`, `backend/src/app.module.ts`, `backend/src/main.ts`, `backend/package.json`, `backend/package-lock.json`, `backend/src/testing/test.utils.ts`, `backend/src/testing/test.module.ts`, `backend/scripts/test-*.js` (new auth tests) | Frontend, frontend API client, frontend types, frontend pages/components, env files (real `.env`), migrations that modify existing columns, Phase 4/7 frozen source other than additive changes required for auth, real secrets, any DB-connecting command in production, shop.com | `npm run build` (backend), `npm test` (backend), `node scripts/test-*.js` (auth test scripts), `npm run smoke` (existing read-only smoke must still pass), `git diff --check` | Destructive DB action; real secret in commit; production target; tenant uncertainty; contradiction; scope expansion | Single WDR; registry updated; pmAudit PLANNED until PM audit; 4 write endpoints return 401 when called without `Authorization: Bearer <jwt>`; 4 write endpoints return 201 with valid token; existing 202 backend tests (12 Jest + 202 evidence scripts) still pass | Yes |
| **P8-003** | Auth Event Wiring + Session Hardening | Wire `AuditService.recordEvent` for all auth events (`auth.login.success`, `auth.login.failure`, `auth.logout`, `auth.refresh.success`, `auth.refresh.failure`, `auth.token.expired`); add `User.status === ACTIVE` enforcement in `AuthGuard`; add `Membership.status === ACTIVE` enforcement for the active tenant; add refresh-token rotation enforcement (single-use); add brute-force lockout (5 attempts → 15-min lockout per email+IP); add a new `LoginAttempt` model for the lockout state; ensure `AuditLog.metadata` is redacted before write; ensure `X-Correlation-ID` is included in error responses. | P8-002 | `AuthGuard` extension; `LoginAttempt` model; `AuditService` redactor; lockout state | `backend/src/auth/`, `backend/src/audit/`, `backend/prisma/schema.prisma`, `backend/prisma/migrations/`, `backend/src/tenants/`, `backend/src/vendors/`, `backend/src/categories/`, `backend/src/products/`, `backend/src/health/`, `backend/src/common/`, `backend/src/app.module.ts`, `backend/src/main.ts`, `backend/src/testing/`, `backend/scripts/test-*.js` | Frontend, real `.env`, real secrets, destructive migration, shop.com, modifications to Phase 4/7 schema beyond additive | `npm run build` (backend), `npm test` (backend), auth failure scenario tests, lockout scenario tests, `git diff --check` | Destructive DB; secret leak; tenant uncertainty; scope expansion | Single WDR; auth events visible in `AuditLog`; locked-out user cannot log in; replayed refresh token revokes the entire session; redactor does not include `*token*`/`*secret*`/`*password*` in `AuditLog.metadata` | Yes |
| **P8-004** | RBAC: Role, Permission, TenantMembershipRole, VendorMembership | Add the `Role`, `Permission`, `RolePermission`, `TenantMembershipRole`, `VendorMembership` models; add a `PermissionsGuard`; add a `TenantContextGuard` that asserts the JWT's `tenantId` matches the route's resolved tenant; wire RBAC into the 4 write endpoints; add a `seed:rbac` script (or `prisma db seed` equivalent, PM-approved only) that creates the canonical seed roles (`OWNER`, `PLATFORM_ADMIN`, `VENDOR_OWNER`, `VENDOR_MANAGER`, `VENDOR_STAFF`) and a starter permission set (`auth.*`, `tenants.*`, `vendors.*`, `categories.*`, `products.*`, `audit.*`, `owner.*`); add a `POST /auth/switch-tenant` endpoint; add `UserRole`-equivalent as a derived view (do not add the table). | P8-003 | RBAC models; `PermissionsGuard`; `TenantContextGuard`; seed script | `backend/prisma/schema.prisma`, `backend/prisma/migrations/`, `backend/src/auth/`, `backend/src/tenants/`, `backend/src/vendors/`, `backend/src/categories/`, `backend/src/products/`, `backend/src/audit/`, `backend/src/common/`, `backend/src/app.module.ts`, `backend/src/testing/`, `backend/scripts/test-*.js` (new RBAC tests) | Frontend, real `.env`, destructive migration that removes any of the 7 frozen models, shop.com, any production seed | `npm run build` (backend), `npm test` (backend), tenant-isolation tests (same-tenant PASS, cross-tenant 403), role tests (VENDOR_STAFF cannot call owner-only), `git diff --check` | Destructive DB; secret leak; contradiction; scope expansion | Single WDR; 4 write endpoints enforce tenant + role; seed script is idempotent; cross-tenant request rejected with 403 | Yes |
| **P8-005** | Email Verification + Password Reset | Add `POST /auth/register` (creates `User` with hashed password, INVITED `Membership` for the requested tenant, sends verification email — out of scope: actually sending the email, use a stub `NotificationService` that logs the verification link); add `POST /auth/verify-email`; add `POST /auth/forgot-password`; add `POST /auth/reset-password`; add `EmailVerificationToken` and `PasswordResetToken` models (or fold into `Session` — PM to choose); rate-limit `POST /auth/register`, `POST /auth/forgot-password`; update `emailVerified` on `User` when verified; require `emailVerified === true` for the first login (PM-confirmable). | P8-004 | Verification + reset flow | `backend/src/auth/`, `backend/prisma/schema.prisma`, `backend/prisma/migrations/`, `backend/src/tenants/`, `backend/src/vendors/`, `backend/src/categories/`, `backend/src/products/`, `backend/src/common/`, `backend/src/testing/`, `backend/scripts/test-*.js` | Frontend, real email sending, real `.env`, destructive migration, shop.com | `npm run build` (backend), `npm test` (backend), register → verify → login flow, forgot → reset → login flow, rate-limit scenario, `git diff --check` | Destructive DB; secret leak; email-service unavailability (degrade gracefully); scope expansion | Single WDR; verification gates login; reset is single-use; rate limit enforced | Yes |
| **P8-006** | Phase 8 Freeze Gate | Verify all Phase 8 tasks are complete, internally consistent, safely scoped, documented, buildable, and ready to freeze before Phase 9. Same shape as P7-010 freeze gate: registry consistency check, scope safety audit, code health (build + lint + test + diff --check), dashboard source verification, no product code beyond Phase 8 scope, no Phase 9 work started. | P8-005 | Freeze gate (audit-only) | `src/project/projectRegistry.ts`, `AGENT_REPORTS/latest-status.md`, `AGENT_REPORTS/latest-wdr-summary.md`, `PM_OUTBOX/next-opencode-prompt.md`, `WDR/_All/Phase-08-Database-Auth-RBAC/TOPLINE-P8-006_WDR_2026-09-10.md` | All implementation work; frontend; packages (unless a corrective add is required); secrets; production; shop.com; Phase 9 | `npm run build` (root + backend), `npm run lint` (root), `npm test` (backend), `git diff --check`, targeted search for `id: "TOPLINE-P8-002"` through `id: "TOPLINE-P8-005"` in registry, targeted search for `wdr-066` through `wdr-069` | Registry inconsistency; scope expansion; production target; contradiction; unauthorized frontend change | Single WDR; phase-8 rollup `status: "CLOSED"`; `taskCount` matches actual `tasks[]` length | Yes |

**Database/auth work separation**: P8-002 + P8-003 + P8-004 are irreversible additive migrations (schema changes). P8-005 is also additive (new `EmailVerificationToken` / `PasswordResetToken` model, or PM-allowed fold into `Session`). P8-006 is audit-only. No task removes or renames any of the 7 frozen models from Phase 4.

**Package additions** (PM-approved only): `argon2` (P8-002), `@nestjs/jwt` + `@nestjs/passport` (P8-002), `@nestjs/throttler` (P8-002/003, optional, PM-decision), `passport-jwt` (P8-002, transitive of `@nestjs/passport`).

---

## K. Verification Matrix

| Future task | Static checks | Build | Tests | Negative-security tests | Tenant-isolation tests | Migration review | Browser/E2E |
|---|---|---|---|---|---|---|---|
| P8-002 | `git diff --check`; no `console.log` of tokens | `npm run build` (backend), `npm run build` (root — registry should not change, but verify no broken import) | `npm test` (backend) — new auth tests; existing 12 Jest + 202 evidence scripts must still pass | Login with wrong password returns 401 with fixed message; missing `Authorization` header returns 401; expired token returns 401; revoked session's access token returns 401 | Cross-tenant call returns 403 (VENDOR_STAFF on tenant B cannot write to tenant A); same-tenant call returns 201 | Review the additive migration: only `ADD COLUMN` / `CREATE TABLE`; no `ALTER COLUMN DROP NOT NULL`; no `DROP TABLE` | n/a (backend only) |
| P8-003 | `git diff --check`; `AuditLog.metadata` redaction test | `npm run build` (backend) | `npm test` (backend) — auth event tests; lockout tests; refresh-rotation tests | 5 failed logins lock the account for 15 min; replayed refresh token revokes the entire session; disabled user cannot log in; suspended membership cannot act within the tenant | n/a (no new tenant logic) | Review the `LoginAttempt` migration: idempotent (additive only) | n/a |
| P8-004 | `git diff --check`; seed script idempotency | `npm run build` (backend) | `npm test` (backend) — RBAC tests; cross-tenant tests; role tests | Vendor staff cannot call `owner.*`; cross-tenant call returns 403; same-tenant vendor staff cannot write to another vendor | VENDOR_STAFF on vendor 1 cannot write to vendor 2 in the same tenant | Review the `Role`, `Permission`, `RolePermission`, `TenantMembershipRole`, `VendorMembership` migration: additive only; seed runs cleanly against the local dev DB | n/a |
| P8-005 | `git diff --check`; rate-limit test | `npm run build` (backend) | `npm test` (backend) — register/verify/reset flow tests; rate-limit tests | Unverified user cannot log in; reset link single-use; rate limit enforced | n/a | Review the `EmailVerificationToken` / `PasswordResetToken` migration: additive only | n/a (no frontend wiring; the frontend is frozen) |
| P8-006 | `git diff --check`; targeted registry searches | `npm run build` (root + backend), `npm run lint` (root) | `npm test` (backend) | n/a (audit) | n/a (audit) | n/a (audit) | n/a (audit) |

**Database commands require separate explicit authorization**: any `prisma migrate dev`, `prisma db push`, `prisma db seed`, `prisma migrate reset`, raw SQL, or connection to a non-local database must be in its own PM-approved task with a clear destructive-vs-additive flag.

---

## L. Global Stop Conditions

A future Phase 8 task must STOP as BLOCKED and report before edits if any of the following is true:

1. **Destructive DB risk** — any task that would DROP, TRUNCATE, or `ALTER COLUMN DROP NOT NULL` on a frozen column must STOP. Phase 4 freeze gate forbids destructive migrations; Phase 8 inherits that.
2. **Production target** — any task that connects to a non-local database or that would affect a deployed environment must STOP. Phase 8 is dev-only.
3. **Real secrets** — any task that reads `backend/.env` (not `.env.example`) or that writes a real secret to the repository must STOP. Use the placeholder values from `.env.example` and document the production secret store in a separate task.
4. **Unresolved architecture contradiction** — if a future task's plan contradicts this document, the previous WDR, or the Phase 4 freeze gate, the task must STOP and ask PM to resolve.
5. **Tenant uncertainty** — if a future task cannot prove (via test) that its change preserves tenant isolation, it must STOP.
6. **Scope expansion** — if a future task needs to touch a file outside its `Allowed File Families`, it must STOP and ask PM to expand the scope (or split the task).
7. **Inability to verify** — if a future task cannot run `npm run build`, `npm test`, `git diff --check`, or its own required tests for reasons unrelated to environment, it must STOP.
8. **Forbidden-path access** — any read/write/copy from `F:\OpenCode\shop.com` is forbidden at all times. Any task that requires it must STOP.

---

## M. Recommended Next Task

**Recommended next task: TOPLINE-P8-002 — Auth Foundation + Write-Endpoint Guard Wrapping.**

### Why it is dependency-first
P8-002 must come first because:
1. It adds the schema columns (`User.passwordHash`, `User.emailVerified`, `AuditLog.ipAddress`, `AuditLog.userAgent`) and the `Session` model that every later Phase 8 task depends on.
2. It introduces the `AuthGuard` global guard that protects the 4 existing write endpoints from RISK-01 (CRITICAL: unauthenticated writes today).
3. It adds `POST /auth/login` / `/logout` / `/refresh` — the only auth surface — and the JWT issuance + refresh-token rotation that P8-003, P8-004, P8-005 all build on.
4. It adds the `argon2` and `@nestjs/jwt` packages and the secret-loading pattern that the rest of Phase 8 reuses.

P8-003, P8-004, P8-005 cannot be implemented safely without P8-002's `AuthGuard` and `Session` model in place — every test they write depends on a working login flow.

### Marked unapproved
This recommendation is **unapproved**. P8-002 has not been added to the registry. The P8-001 governance reconciliation does not register P8-002, P8-003, P8-004, P8-005, or P8-006. PM must write a separate, PM-approved prompt for P8-002 after the P8-001 audit passes. P8-001 STOPPED BEFORE TOPLINE-P8-002 per #123.

---

## End of plan

This document is the P8-001 deliverable. The canonical registry update for P8-001 is `src/project/projectRegistry.ts`; the canonical WDR is `WDR/_All/Phase-08-Database-Auth-RBAC/TOPLINE-P8-001_WDR_2026-09-10.md`. The PM_OUTBOX hold notice is `PM_OUTBOX/next-opencode-prompt.md`. The two agent reports are `AGENT_REPORTS/latest-status.md` and `AGENT_REPORTS/latest-wdr-summary.md`. No other file was created or modified.
