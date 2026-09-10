# ToplineShop — Phase 8 Database/Auth/RBAC Readiness Plan (R4)

> **Status**: READINESS PLAN — PLANNING ONLY (R4-revised)
> **Date**: 2026-09-11
> **Current corrective task**: TOPLINE-P8-001-R4 — Phase 8 Readiness Plan Canonical Contract Cleanup
> **Original task**: TOPLINE-P8-001 (PASS execution, BLOCKED PM audit)
> **Prior correctives**: TOPLINE-P8-001-R1, R2, R3 (all PASS execution, all BLOCKED PM audit)
> **Phase**: Phase 8 — Database, Authentication, RBAC & Security
> **Author**: Implementation Agent under PM governance
> **Approval Required**: PM before any database schema change, auth code, package install, or migration
> **R3 PM audit commit (predecessor)**: `b43a5114e2f8845e55e28f64cd987b4e4e9a80ce`
> **R1 PM audit commit (historical)**: `c2282eb5c7cf2c51388e7e538f8a6e61f12bd25c`
> **P8-001 implementation commit (historical)**: `82361970c15181c8a19bc1249f3a525bac4ad9cd`
> **P8-001 evidence-fill commit (historical)**: `894d2b36f52c3442650774b2371f035252d8834b`
> **R1 implementation commit (historical)**: `42cc6ac63e375a1adb82f692f3885fd8b29a55ad`
> **R1 evidence-fill commit (historical)**: `343798502c41cf51a05748371b8fc1b4336d9bfd`
> **R2 implementation commit (historical)**: `1789cef06978109fef92043668a7e36e62674f5f`
> **R2 evidence-fill commit (historical)**: `34581637b992ff4f6c9c81a7b9c53e304597d63d`
> **R3 implementation commit (historical)**: `fb1d3e2b64961286390b138123adfc3e5bc3d815`
> **R3 evidence-fill commit (historical)**: `1c9e886529d9fba34e95bca0f84c552ebb0019f9`

This is a planning artifact only. **No database commands were executed. No auth/RBAC code, packages, or migrations were written. No implementation occurred.** This R4 revision is the final canonical-contract cleanup of the P8-001 readiness plan against the P8-001 / R1 / R2 / R3 PM audits; it does not authorize any Phase 8 implementation work. R4 is governed by `#123` (DISCUSS → DECIDE → EXECUTE → VERIFY/AUDIT → CLOSE → NEXT) and is the only approved corrective task. It does **not** start `TOPLINE-P8-002`.

Historical R1, R2, and R3 evidence is preserved in their immutable WDRs and audits; this live plan body is the current R4 canonical contract. Earlier framing that named R1 as the current corrective is now historical and is replaced by this R4 header.

---

## A. Governance Header (R4 canonical)

- **Original task**: TOPLINE-P8-001 — Phase 8 Database/Auth/RBAC Readiness Plan
- **Current corrective task**: TOPLINE-P8-001-R4 — Phase 8 Readiness Plan Canonical Contract Cleanup
- **Prior correctives**: TOPLINE-P8-001-R1, R2, R3 (all PASS execution, all BLOCKED PM audit; preserved in immutable WDRs/audits)
- **Date**: 2026-09-11
- **Phase**: Phase 8 — Database, Authentication, RBAC & Security
- **Type**: READINESS PLAN REVISION (planning-only)
- **Approval boundary**: PM must approve before any future TOPLINE-P8-002+ task begins.
- **Implementation confirmation**: This R4 task did **not** modify any backend source, frontend source, package, Prisma schema, migration, env file, or deployable artifact. The only files created or modified are the six files allowed by the R4 prompt: this plan (revised), the registry update, the two agent reports, the PM_OUTBOX R4 audit hold notice, and the R4 WDR.
- **Prompt budget correction (R1 §A, preserved; restated for R4)**: Phase 8 core mega-prompt target is **5** (within the 2–5 budget of `docs/PROJECT_CONSTITUTION.md` §7), and the core sequence is exactly **P8-001, P8-002, P8-003, P8-004, P8-005**. R1, R2, R3, and R4 are corrective tasks and do **not** increment `megaPromptsCompleted`. P8-006 is removed from the proposed core sequence.

---

## B. Objective and Boundaries

### Security objective
Phase 8 must deliver an audit-grade foundation for:
1. Tenant-aware user identity (login and logout only; **registration, email verification, password reset, OAuth, and self-service flows are NOT Phase 8 deliverables** — see §Z Deferred items).
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

## C. Prompt Budget and Sequence (R1 §A)

| Item | Value (R1) |
|---|---|
| `phase-8.megaPromptTarget` | **5** |
| `phase-8.megaPromptsCompleted` | **1** (P8-001 only; R1 is corrective and does not increment) |
| Core sequence | P8-001, P8-002, P8-003, P8-004, P8-005 |
| P8-006 in core sequence | **REMOVED** — it was an overshoot of the prompt budget |
| R1 (TOPLINE-P8-001-R1) | corrective task; not a mega prompt; does not increment `megaPromptsCompleted` |
| Items deferred to later PM decisions (R1 §A; R2 §Z) | self-registration, email verification, password reset, OAuth, `User.emailVerified`, `Module`/`TenantModule`, financial `ApprovalGate`, real notification delivery |

### R1 bounded future scopes (R1 §B)

- **P8-002** is the **sole owner** of all authentication persistence required by P8-003 (chosen auth persistence model, additive schema, the `Session` model, refresh-token digest, audit context columns, related enums/indexes/constraints, the additive forward-only migration, rollback documentation, and explicitly authorized local-only application). P8-002 is **schema/migration-only**: **no** `AuthGuard`, **no** login/logout/refresh endpoint, **no** JWT issuance, **no** auth behavior, **no** RBAC, **no** frontend work, and **no** package installation. **P8-002 installs no packages.** P8-002 must use the decisions explicitly selected by PM in the future P8-002 PM prompt; recommendations in this plan are not approvals.
- **P8-003** owns authentication and session behavior plus protection of the four current write endpoints: `AuthGuard`, login/logout/refresh, refresh rotation/reuse handling, public-route allowlist, audit redaction/events, and write-endpoint protection. P8-003 is the **sole planned owner** of future PM-approved auth package installation (each package requires separate PM approval). P8-003 must **not** edit `backend/prisma/schema.prisma` or migrations and must **not** create `Session`/credential persistence — those are P8-002 deliverables. **No** RBAC schema or permission hierarchy.
- **P8-004** owns the RBAC persistence/enforcement additive migration (`Role`, `Permission`, `RolePermission`, `TenantMembershipRole`, `VendorMembership`), `PermissionsGuard`, `TenantContextGuard`, negative cross-tenant tests, authorization freshness, and audit hardening. **No** email verification/reset/OAuth. **No** frontend work.
- **P8-005** is audit and freeze only. It must not implement fixes silently. P8-005 is **never** an implementation task.

---

## D. Inherited Implemented Baseline

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
| 5 evidence scripts (`scripts/test-tenant-create.js`, `scripts/test-vendor-create.js`, `scripts/test-category-create.js`, `scripts/test-product-create.js`, `scripts/smoke-health.js`) | Implemented | P7-004-R2 through P7-007 |
| `phase-7` registry rollup: `status: "CLOSED"`, `progress: 100`, `taskCount: 19`, `completedTaskCount: 19` | Implemented | P7-010 + corrective R1/R2 |
| `wdr-046`…`wdr-064` (16 Phase 7 WDR audit entries) | Implemented | P7-001…P7-010-R2 |

**Real test inventory (R1 §F correction)** — replaces the false "12 Jest + 202 evidence scripts" wording:
- **Jest tests**: exactly **12** in `backend/src/testing/test.utils.spec.ts` (verified by `it(` count). P8-001 audit reproduced 12/12 PASS.
- **Evidence scripts** (Node, not Jest): **5** under `backend/scripts/`: `test-tenant-create.js`, `test-vendor-create.js`, `test-category-create.js`, `test-product-create.js`, `smoke-health.js`. The "202" claim is removed; future task verification rows must use this real, executable inventory.
- **`@nestjs/throttler`, `argon2`, `@nestjs/jwt`, `@nestjs/passport`, `jsonwebtoken`, `passport-jwt`, `bcrypt`**: **not in `backend/package.json`** (verified). R1 §F also removes the unverified claim that `passport-jwt` is transitive to `@nestjs/passport`; package relationships must be verified from the actual `package.json` and official package documentation at the time of any future PM-approved install.

### Designed (Phase 3 docs) but **not implemented** — must not be assumed to exist
| Item | Phase 3 design location | Status |
|---|---|---|
| `User.passwordHash` column | `PHASE-03-DATABASE-SCHEMA-DESIGN.md` §5.1 | Not implemented; **Phase 8 P8-002 planned candidate** (nullable, PM-decided digest per F) |
| `User.emailVerified` column | `PHASE-03-DATABASE-SCHEMA-DESIGN.md` §5.1 | Not implemented; **deferred — NOT a Phase 8 deliverable** (see §Z) |
| `AuditLog.ipAddress`, `AuditLog.userAgent` columns | `PHASE-03-AUTH-RBAC-DESIGN.md` §4.14 | Not implemented; **Phase 8 P8-002 planned candidate** (additive) |
| `AuthAccount` model (OAuth providers, encrypted access/refresh tokens) | `PHASE-03-AUTH-RBAC-DESIGN.md` §4.11 | Not implemented; **deferred** (see §Z) |
| `Session` model (session tokens, IP, user agent) | `PHASE-03-AUTH-RBAC-DESIGN.md` §4.12 | Not implemented; **Phase 8 P8-002 planned candidate** (additive; PM-decided digest and fields) |
| `Role` model (PLATFORM/TENANT/MODULE scope, `isSystem`) | `PHASE-03-AUTH-RBAC-DESIGN.md` §4.4 | Not implemented; **Phase 8 P8-004 planned candidate** |
| `Permission` model (`module.resource.action`, `isDangerous`) | `PHASE-03-AUTH-RBAC-DESIGN.md` §4.5 | Not implemented; **Phase 8 P8-004 planned candidate** |
| `RolePermission` (M:N) | `PHASE-03-AUTH-RBAC-DESIGN.md` §4.6 | Not implemented; **Phase 8 P8-004 planned candidate** |
| `TenantMembershipRole` (membership × role) | `PHASE-03-AUTH-RBAC-DESIGN.md` §4.7 | Not implemented; **Phase 8 P8-004 planned candidate** |
| `VendorMembership` (vendor × user × `OWNER`/`MANAGER`/`STAFF`) | `PHASE-03-AUTH-RBAC-DESIGN.md` §4.10 | Not implemented; **Phase 8 P8-004 planned candidate** |
| `Module` and `TenantModule` (per-tenant module enablement) | `PHASE-03-AUTH-RBAC-DESIGN.md` §4.8, §4.9 | Not implemented; **deferred** (see §Z) |
| `ApprovalGate` (financial/AI approval flow) | `PHASE-03-AUTH-RBAC-DESIGN.md` §4.13 | Not implemented; **deferred** (see §Z) |
| `Auth.js` / `passport` / JWT / cookie / session middleware | `PHASE-03-AUTH-RBAC-DESIGN.md` §10 (packages) | **Not installed**; not implemented. P8-003 is the sole planned owner of any future PM-approved auth package installation. P8-002 installs no packages. |
| `AuthGuard`, `RolesGuard`, `PermissionsGuard`, `@UseGuards`, `@Roles`, `@SetMetadata` | Various Phase 3 §9 | **None present** in `backend/src` (verified) |
| Auth header validation, bearer token parsing, request user attachment | n/a | **Not implemented**; `Authorization` header is in CORS allowed list but is never read |
| `User` model has only identity placeholder fields (email, name, phone, avatar, status) — no password, no session, no role binding | Phase 4 schema | Confirmed in `schema.prisma` |
| `Membership` is currently `(userId, tenantId)` with `status: ACTIVE|INVITED|SUSPENDED` only — no role binding | Phase 4 schema | Confirmed in `schema.prisma` |
| `Vendor.ownerId` is a nullable FK to `User` — used for ownership display, **not** access control | Phase 4 + P7-005 WDR | Confirmed |
| `AuditLog.metadata` (JSONB) and `AuditLog.summary` columns exist; `AuditService.recordEvent()` exists but **no service calls it** | `backend/src/audit/` | Verified — `recordEvent` callers: 0 in `backend/src` |

### Deferred vs Phase 8 planned candidates (exact split)
- **Phase 8 P8-002 planned candidates** (additive migration, schema/migration-only, no packages, no auth behavior): `User.passwordHash` (nullable, PM-decided digest per F), `AuditLog.ipAddress`, `AuditLog.userAgent`, the `Session` model (PM-decided digest and fields), and any related enums/indexes/constraints. P8-002 must add `Session` exactly once.
- **Phase 8 P8-004 planned candidates** (additive migration): `Role`, `Permission`, `RolePermission`, `TenantMembershipRole`, `VendorMembership`.
- **Genuinely deferred items (NOT Phase 8 deliverables — see §Z)**: `User.emailVerified`, `AuthAccount`, `Module`, `TenantModule`, `ApprovalGate`, `UserRole`/`StaffRole` (merged into `Membership` + `TenantMembershipRole`), registration, email verification, password reset, OAuth, real notification delivery.
- The blanket prior sentence "All Phase 3 design tables are deferred from Phase 8" is replaced by this exact split. Recommendations remain unapproved until each future PM prompt.

### Absent (today's repository state)
- `passwordHash`, `passwordResetToken`, `emailVerificationToken` columns
- Any `AuthAccount`, `Module`, `TenantModule`, `ApprovalGate` model
- Any `AuthGuard` / `RolesGuard` / `PermissionsGuard` class
- (Note: `Session`, `Role`, `Permission`, `RolePermission`, `TenantMembershipRole`, and `VendorMembership` are listed in this section today but are **Phase 8 P8-002 / P8-004 planned candidates**, not absent. They will be added by their respective future PM-approved tasks and must not be assumed to exist today.)
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

## E. Database Readiness

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

### Local vs production safety (R1 §E)
- **Local**: `toplineshop_dev` PostgreSQL. **R1 REMOVES** the prior wording that the local database "can be destroyed and remigrated freely." Destructive operations against any environment — including local — require explicit PM approval regardless of environment. Any future P8 task that needs a fresh local DB must request explicit PM approval to run `prisma migrate reset` (or equivalent) and must record the approval in its WDR.
- **Production**: not configured. Any future P8 task that touches a production database is forbidden by `#123` and the constitution. Future migration tasks must:
  1. Verify the exact local target without exposing connection values.
  2. Inspect generated SQL.
  3. Prove additive/non-destructive behavior.
  4. Document rollback.
  5. STOP on any production target.
- **R1 itself runs no database or Prisma command.** This plan revision is governance-only.

---

## F. Architecture Decision Matrix (R1 §C)

This matrix **does not** label any unresolved choice as "resolved by this plan." Each row records options, security tradeoffs, a recommendation, required evidence, and `PM DECISION REQUIRED`. Approval claims are not allowed.

| Decision | Options | Security Tradeoffs | Recommendation | Required Evidence | PM Decision Required |
|---|---|---|---|---|---|
| Credential representation | (a) `User.passwordHash` column; (b) separate credential model / `AuthAccount` subset | (a) simpler, but couples auth to `User`; (b) cleaner multi-provider, more schema | (a) for Phase 8 email/password; plan to add (b) for OAuth later | Migration SQL review; unit test for password row absent | YES |
| Password hashing algorithm | (a) Argon2id (`argon2`); (b) bcrypt; (c) scrypt; (d) platform-native (`crypto.scrypt`) | (a) best modern default, GPU-resistant, tuning complexity; (b) widely deployed, weaker vs GPU; (c) memory-hard, fewer libs; (d) zero-deps, less battle-tested | (a) Argon2id, with documented cost params tuned on first run | Cost-parameter baseline timing; package manifest compatibility check; Node runtime compatibility | YES |
| Access-token signing | (a) symmetric (HS256); (b) asymmetric (RS256/EdDSA) | (a) simpler, shared secret; (b) public verify, no shared secret, key rotation easier | (a) HS256 for Phase 8, document migration path to (b) | Library decision matrix; rotation runbook | YES |
| Access-token claims & lifetime | (a) `sub`, `tenantId`, `roles`, `iat`, `exp`, `jti`; (b) minimal `sub`+`jti` only; (c) opaque session ref | (a) denormalizes roles → stale risk; (b) requires lookup per request; (c) DB hit per request | (a) but with explicit authorization freshness check (see authorization freshness row) | Token-shape test; freshness policy | YES |
| Refresh-token transport | (a) JavaScript-accessible bearer; (b) HttpOnly + Secure + SameSite cookie | (a) avoids CSRF, but XSS-exfiltratable; (b) CSRF needs explicit mitigations (SameSite=strict + double-submit or rotating nonce), XSS-resistant | **NOT pre-decided**; both are evaluated | XSS/CSRF threat model; frontend storage plan | YES |
| Refresh-token digest/storage | (a) Argon2id hash; (b) HMAC-SHA256 keyed digest; (c) SHA-256 plain; (d) store verbatim | (a) is for low-entropy secrets, **overkill for high-entropy random refresh tokens**; (b) keyed digest is faster and adequate; (c) requires no key but vulnerable if DB leaks; (d) is unacceptable | **NOT pre-decided**; explicit decision between (b) keyed digest and any justified alternative required | DB-leak threat model; cost; test for replay detection | YES |
| Single-device vs multi-device sessions | (a) one active session per user; (b) N sessions per user; (c) N per (user, device) | (a) safest, worst UX; (b) flexible, requires session list/revoke UX; (c) recommended | (c) per (user, device) with explicit session list endpoint | Session listing test; revoke test | YES |
| Session revocation / authorization freshness | (a) access token carries roles + short TTL; (b) roles refreshed on every request via DB; (c) explicit `authzFreshness` claim with TTL ≤ access TTL | (a) stale role risk; (b) DB hit per request; (c) bounded staleness, low DB cost | (c) explicit freshness claim with explicit DB-backed invalidation hooks; **do not** treat long-lived role claims in JWTs as permanently authoritative | Stale-role test; revoke-during-TTL test | YES |
| Platform role vs tenant role persistence | (a) `UserRole` table (Phase 3); (b) `Membership` with platform-role enum; (c) `Membership` + `TenantMembershipRole` (post-Phase 3 unified) | (a) duplicates identity; (b) couples concerns; (c) clean, additive | (c) — `Membership` + `TenantMembershipRole` | Schema migration review; model coverage test | YES |
| Vendor role vs `Vendor.ownerId` | (a) keep `Vendor.ownerId` only; (b) keep `ownerId` + add `VendorMembership`; (c) replace `ownerId` with `VendorMembership` | (a) one user per vendor; (b) back-compat + RBAC; (c) cleanest, but breaks `ownerId` consumers | (b) — keep `ownerId` for back-compat, add `VendorMembership` for granular access | Back-compat test for `ownerId` reads; multi-user vendor scenario test | YES |
| Public-route allowlist (if a global auth guard is used) | (a) explicit `PUBLIC` decorator + allowlist; (b) per-route `@Public()`; (c) no global guard, per-controller guards | (a) most testable; (b) clean, but easy to miss; (c) more code, no global default | (a) — explicit `PUBLIC` decorator + maintainable allowlist | Allowlist test; negative route test (e.g., `/health` reachable, `/tenants` POST blocked) | YES |
| Active-tenant selection; prevent body/query `tenantId` spoofing | (a) `tenantId` from JWT only; (b) JWT primary, route param as override; (c) request body allowed but re-validated | (a) safest, requires explicit `POST /auth/switch-tenant` to change; (b)/(c) risk of spoofing | (a) — `tenantId` is **only** trusted from the JWT; body and query `tenantId` are never trusted | Spoofing test (body `tenantId=B` rejected when JWT says `A`); `switch-tenant` audit test | YES |
| Credential bootstrap for existing users with no password credential | (a) require password set on next login; (b) admin-set temporary password; (c) out-of-scope until first P8 task | All require explicit UX; (c) is fine if no live data depends on it | (a) — first-login forced password set; admin override (b) is a later PM task | Bootstrap test; UX flow | YES |
| Startup vs lazy Prisma connect | (a) startup (`onModuleInit` calls `$connect`); (b) lazy (current empty `onModuleInit`); (c) hybrid | (a) fail-fast; (b) safer for ephemeral local; (c) best of both | (b) for Phase 8; revisit at production cutover | Health check test; restart behavior test | YES |
| Rate limiting / lockout storage | (a) Redis-backed; (b) new `LoginAttempt` table; (c) in-memory | (a) requires Redis; (b) no new infra; (c) does not survive restart, not multi-instance | (b) — additive `LoginAttempt` table; (a) deferred to a later phase if PM chooses Redis | Lockout test; restart-safety test; multi-instance stub | YES |
| Production secret store | (a) AWS Secrets Manager; (b) GCP Secret Manager; (c) HashiCorp Vault; (d) env-only for now | All are out of Phase 8 scope | (d) for Phase 8 with `.env.example` placeholders; PM must approve before any production deploy | PM approval before production deploy | YES (production only) |

---

## G. Token and Logging Safety (R1 §D)

- **Forbidden to log** in any application code, audit metadata, WDR, console output, or test evidence: verification links, password reset links, raw access tokens, raw refresh tokens, the `Authorization` header value, raw credentials, any `*token*` or `*secret*` field value, and any `*password*` field value. This rule is absolute for Phase 8 and every future task.
- **Captured test-only transport**: if a later P8 test must exercise a verification/reset flow, it must use an in-memory fake transport or capture the value in a local-only test variable that is asserted on directly. Captured test values must never be written to application logs, audit metadata, WDRs, or console output. The test must assert presence in the captured variable and absence in every other channel.
- **Refresh-token digest**: do not assume Argon2id is the correct digest for high-entropy random refresh tokens. The refresh-token storage row in F requires an explicit decision between (a) a suitable cryptographic or keyed digest and (b) a justified alternative. Argon2id is intended for low-entropy secrets (passwords); a keyed digest (e.g., HMAC-SHA256) is appropriate for high-entropy random tokens. The decision is gated by PM.
- **Authorization freshness**: long-lived role claims in JWTs must **not** be treated as permanently authoritative. Phase 8 must implement an explicit authorization freshness check (see F, "Session revocation / authorization freshness"). Revocation must invalidate the session row and the active tokens; the test must prove that a revoked-role token is rejected within the access-token TTL.
- **`AuditService` redactor**: when audit metadata is written, a redactor strips `*token*`, `*secret*`, `*password*`, and the `Authorization` header value. Redaction is the writer's responsibility, not the caller's.

---

## H. Tenant-Aware RBAC Readiness

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
| `User.passwordHash` | Not present (deferred) | Add as `String?` in P8-002 | Yes — confirm add |
| `User.emailVerified` | Not present (deferred) | **Not a Phase 8 deliverable** (see §Z Deferred items) | Yes — confirm defer |
| `AuthAccount` (OAuth) | Not present (deferred) | Out of scope for Phase 8 (see §Z) | Yes — confirm defer |
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
- **Phase 8 planned candidates (P8-002 additive migration, pending PM approval in the future P8-002 prompt)**: `User.passwordHash` (nullable), `Session` (PM-decided digest and fields), `AuditLog.ipAddress`, `AuditLog.userAgent`, and any related enums/indexes/constraints. P8-002 must add `Session` exactly once.
- **Phase 8 planned candidates (P8-004 additive migration, pending PM approval in the future P8-004 prompt)**: `Role`, `Permission`, `RolePermission`, `TenantMembershipRole`, `VendorMembership`.
- **Genuinely deferred items (NOT Phase 8 deliverables — see §Z)**: `User.emailVerified`, `AuthAccount`, `Module`, `TenantModule`, `ApprovalGate`, `UserRole`/`StaffRole` (merged into `Membership` + `TenantMembershipRole`), registration, email verification, password reset, OAuth, real notification delivery.
- All Phase 8 adds must come as a forward-only additive migration in P8-002. Existing 7 models and 1 migration must remain unchanged.

---

## I. Security and Audit Readiness

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
- `AuditLog.metadata` (existing JSONB column) carries per-event details. The `AuditService` redactor (see G) strips forbidden fields before write.

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

## J. Gap and Decision Register

| ID | Gap / Decision | Evidence | Risk | Recommended Direction | PM Approval Needed | Blocking Task |
|---|---|---|---|---|---|---|
| GAP-01 | No `User.passwordHash` column | `backend/prisma/schema.prisma` | HIGH — cannot do email/password login | Add `String?` column via additive migration in P8-002 | Yes | P8-002 |
| GAP-02 | No `User.emailVerified` column | `backend/prisma/schema.prisma` | MEDIUM — cannot gate unverified users | **NOT a Phase 8 deliverable; deferred to a later PM-approved phase (see §Z)** | Yes (defer) | Future phase |
| GAP-03 | No `Session` model for refresh tokens | `schema.prisma`, Phase 3 §4.12 | HIGH — no revocable sessions | Add `Session` model in P8-002 (PM-decided digest and fields) | Yes | P8-002 |
| GAP-04 | No `Role` / `Permission` / `RolePermission` / `TenantMembershipRole` models | `schema.prisma`, Phase 3 §4.4–4.7 | HIGH — no RBAC | Add in P8-004 (after auth basics work) | Yes | P8-004 |
| GAP-05 | No `VendorMembership` model | `schema.prisma`, Phase 3 §4.10 | HIGH — no per-vendor user roles | Add in P8-004 | Yes | P8-004 |
| GAP-06 | `AuditLog.ipAddress` and `AuditLog.userAgent` columns missing | `schema.prisma`, Phase 3 §4.14 | MEDIUM — auth events lack client context | Add in P8-002 (small additive migration) | Yes | P8-002 |
| GAP-07 | `AuditService.recordEvent()` is not called by any service | `backend/src/audit/`, search for `recordEvent` in `backend/src` | MEDIUM — Phase 8 auth/denial events have nowhere to land | Wire the existing call sites; add auth/denial call sites in P8-002/003/004 | No (call sites only) | P8-002/003/004 |
| GAP-08 | No `AuthGuard` / `RolesGuard` / `PermissionsGuard` | `backend/src/`, no `@UseGuards` anywhere | HIGH — endpoints are publicly writable today | Add `AuthGuard` in P8-003; add `RolesGuard`/`PermissionsGuard` in P8-004 | Yes | P8-003, P8-004 |
| GAP-09 | No rate limiting | `backend/package.json` no throttler | MEDIUM — login brute-force possible | Add `@nestjs/throttler` in P8-002/003 for auth endpoints | Yes (new package) | P8-002/003 |
| GAP-10 | No email-verification flow | none | MEDIUM — unverified users can do anything | Implement in a later PM-approved phase (NOT in core Phase 8 sequence) | Yes | Future phase |
| GAP-11 | No password reset flow | none | MEDIUM — locked-out users have no recovery | Implement in a later PM-approved phase (NOT in core Phase 8 sequence) | Yes | Future phase |
| GAP-12 | No `POST /auth/login` / `/logout` / `/refresh` / `/switch-tenant` endpoints | `backend/src/tenants/`, `vendors/`, etc. have no auth controller | HIGH — auth surface missing | Add `auth` module in P8-003 | Yes | P8-003 |
| GAP-13 | `Vendor.ownerId` is the only vendor↔user link; no `VendorMembership` | `schema.prisma` | MEDIUM — multi-user vendor scenarios unsupported | Keep `Vendor.ownerId` (back-compat); add `VendorMembership` in P8-004 | Yes | P8-004 |
| GAP-14 | All 4 write endpoints (`POST /tenants`, `/vendors`, `/categories`, `/products`) are publicly writable | `backend/src/*/controllers/` | CRITICAL — anyone can create tenants, vendors, categories, products without auth | Wrap all 4 write endpoints in `AuthGuard` in P8-003; add `RolesGuard` enforcement in P8-004 (deny-by-default; even platform-owner must be authenticated) | Yes | P8-003, P8-004 |
| GAP-15 | `PrismaService.onModuleInit` does not connect; `health` says `database: not_configured` | `backend/src/prisma/prisma.service.ts`, `backend/src/health/health.service.ts` | LOW (today) | P8-002 (or later) decides: lazy vs startup connect. PM must confirm. | Yes | P8-002+ |
| GAP-16 | `Membership.status: INVITED` users can authenticate against that tenant today (no enforcement) | `backend/src/` (no enforcement) | MEDIUM | P8-004 enforces `Membership.status === ACTIVE` for the active tenant | Yes | P8-004 |
| GAP-17 | `User.status: DISABLED` does not block authentication | `backend/src/` (no enforcement) | HIGH | P8-003 enforces `User.status === ACTIVE` | Yes | P8-003 |
| GAP-18 | Frontend routes `/owner/*`, `/admin/*`, `/vendor/*` are visible to any visitor; no route guards | `src/app/` | MEDIUM (UX only, backend is the authority) | Out of scope for Phase 8 (frontend is frozen) | No | Future phase |
| GAP-19 | `backend/.env.example` shows `JWT_ACCESS_SECRET=CHANGE_ME_DEV_ONLY` placeholder — correct for dev, but no production secret store is approved | `backend/.env.example` | HIGH in production | PM must approve secret store before any production deployment | Yes (production only) | Production |
| GAP-20 | No `@nestjs/throttler` or other rate-limit dependency | `backend/package.json` | MEDIUM | Add in P8-002/003 if PM confirms | Yes (new package) | P8-002/003 |
| GAP-21 | No `argon2`, `bcrypt`, or other password-hashing library | `backend/package.json` | HIGH | Add `argon2` in P8-002 (PM-confirmed) — or per F, an alternative if PM chooses | Yes (new package) | P8-002 |
| GAP-22 | No JWT library (`@nestjs/jwt`, `jsonwebtoken`) | `backend/package.json` | HIGH | Add `@nestjs/jwt` and `@nestjs/passport` in P8-002/003 — **only if PM-confirmed** | Yes (new packages) | P8-002/003 |
| GAP-23 | Phase 3 design `UserRole` and `StaffRole` tables overlap with the `Membership` model | `PHASE-03-DATABASE-SCHEMA-DESIGN.md` §5.1, P4-003 | LOW (design conflict only) | Use `Membership` + `TenantMembershipRole` (post-Phase 3 unified). Do not add `UserRole`/`StaffRole`. | Yes | P8-004 |
| GAP-24 | `Module` and `TenantModule` (per-tenant module enablement) not present | `PHASE-03-AUTH-RBAC-DESIGN.md` §4.8–4.9 | LOW (no current need) | Defer to a post-Phase 8 phase | Yes (defer) | Future phase |
| GAP-25 | `ApprovalGate` (financial/AI approval) not present | `PHASE-03-AUTH-RBAC-DESIGN.md` §4.13 | LOW (no financial/AI work in Phase 8) | Defer to Phase 9+ | Yes (defer) | Phase 9+ |
| GAP-26 | `AuthAccount` (OAuth providers) not present | `PHASE-03-AUTH-RBAC-DESIGN.md` §4.11 | LOW (Phase 8 is email/password only) | Defer to a post-Phase 8 phase | Yes (defer) | Future phase |

---

## K. Risk Register

| ID | Risk | Severity | Mitigation | Verification Evidence | Owner |
|---|---|---|---|---|---|
| RISK-01 | **Unauthenticated writes** — anyone can `POST /tenants`, `/vendors`, `/categories`, `/products` today | CRITICAL | P8-003 wraps all 4 write endpoints in `AuthGuard`; P8-004 adds `RolesGuard`; deny-by-default; smoke test that unauthenticated requests return 401 | Existing `test-product-create.js` etc. fail to seed (no auth); PM-audited test report | PM + impl |
| RISK-02 | **Tenant isolation breach** — a future `findMany` could leak across tenants | HIGH | Phase 7 services already filter by `tenantId` for category/product; future services must follow the same pattern; P8-004 adds a `TenantContextGuard` that asserts the JWT's `tenantId` matches the route's resolved tenant | Existing category/product tests pass with same-tenant and fail with cross-tenant | PM + impl |
| RISK-03 | **Credential leakage** — password/token in logs or error responses | HIGH | `LoggingInterceptor` already excludes headers/bodies; `AuditService.redactMetadata()` strips `*token*`/`*secret*`/`*password*`; `AllExceptionsFilter` returns fixed messages for 401/403 | Manual code review + integration test that logs do not contain the credential substring | PM + impl |
| RISK-04 | **Token / session compromise** — stolen JWT used by attacker | HIGH | Short access-token lifetime (15 min); single-use refresh tokens; session revocation deletes the row so a replay fails; `AuditLog.ipAddress`/`userAgent` enable compromise detection | P8-003 tests that revoked sessions reject the access token; replay of a used refresh token triggers session revoke | PM + impl |
| RISK-05 | **Privilege escalation** — a user escalates from `VENDOR_STAFF` to `OWNER` via a forgotten route | HIGH | `RolesGuard` is a global guard; `PermissionsGuard` resolves the actual role hierarchy; admin actions go through `OWNER`-only permissions; all role changes audit-logged | P8-004 test that a `VENDOR_STAFF` token cannot call `owner.*` | PM + impl |
| RISK-06 | **Database operation and target risks** | HIGH | **No environment is freely destructible.** PM must explicitly approve any destructive operation against any environment. Enumerated risks: (1) wrong-target connection (e.g., a non-local or non-`toplineshop_dev` `DATABASE_URL` causing writes against the wrong database); (2) `prisma migrate reset` (drops schema and data); (3) destructive generated SQL inside an additive migration (e.g., accidental `DROP TABLE`, `TRUNCATE`, unsafe `ALTER`, missing `IF NOT EXISTS`); (4) raw SQL outside the migration framework (psql, ad-hoc queries); (5) `DROP TABLE` / `TRUNCATE` (any tool); (6) unsafe `ALTER COLUMN` (drop NOT NULL, change type, drop default, drop constraint without backfill); (7) seed side effects (`prisma db seed` writing unexpected rows or violating constraints); (8) production / staging targeting (any future P8 task that connects to a non-local or non-dev environment). P8-002 keeps lazy `PrismaService.onModuleInit`. Future migration tasks must inspect generated SQL, prove additive/non-destructive behavior, document rollback, and STOP on any non-local target. R1 removed the prior "local DB can be destroyed freely" wording. | Phase 4 freeze gate proved no destructive SQL was in the original migration; future migration tasks must paste generated SQL into the WDR. | PM |
| RISK-07 | **Audit gaps** — auth events are not recorded | MEDIUM | P8-002 adds `AuditLog.ipAddress`/`userAgent`; P8-003 wires auth events; P8-004 wires denial events; `AuditService.recordEvent()` is the only writer | P8-003 test that `auth.login.success` creates an `AuditLog` row with the right fields | PM + impl |
| RISK-08 | **Production configuration** — secrets in env, CORS origins, JWT secret rotation | HIGH (in production) | Phase 8 is dev-only by design. Production deployment is out of scope. PM must approve production secret store, CORS origin list, and secret rotation policy before any production deploy. | Phase 4 freeze gate proved no production connection | PM (production only) |
| RISK-09 | **Phase 3 vs Phase 4 design contradictions** — `UserRole`/`StaffRole` (Phase 3) vs `Membership` (Phase 4) | LOW (design conflict) | GAP-23 recommends `Membership` + `TenantMembershipRole` as the unified model. No `UserRole`/`StaffRole` is added. | This document records the decision; P8-004 implements it. | PM |
| RISK-10 | **Phase 8 scope creep** — adding Module/TenantModule/ApprovalGate/AuthAccount prematurely | MEDIUM | P8 plan is bounded to email/password + RBAC + audit. Module/TenantModule deferred; ApprovalGate deferred; AuthAccount deferred. Email verification, password reset, OAuth, self-registration, financial approvals, and real notification delivery are deferred to later PM decisions. | This document enumerates the deferred items explicitly | PM |

---

## L. Proposed Governed Task Sequence (R1 §A, R1 §B)

**Constraint**: Phase 8 is registered with `megaPromptTarget: 5`. The accurate statement is: **P8-001 plan + three implementation tasks (P8-002, P8-003, P8-004) + P8-005 freeze gate = five core mega prompts**. **P8-005 is the freeze gate only; it is not also an implementation task.** **P8-006 is outside the core sequence.** R1 and R2 are corrective tasks and do **not** increment `megaPromptsCompleted`. Email verification, password reset, self-registration, OAuth, `Module`/`TenantModule`, financial `ApprovalGate`, and real notification delivery are **deferred to later PM decisions** (see §Z Deferred items), not squeezed into Phase 8 to preserve old design scope. **All tasks P8-002+ are PROPOSED, not approved. PM must approve each before execution. R2 does not register any of them.**

| Task | Title | Objective | Dependencies | Conceptual Scope | Allowed File Families | Forbidden Scope | Verification | Stop Conditions | WDR Evidence | PM Gate |
|---|---|---|---|---|---|---|---|---|---|---|
| **P8-002** | Auth Persistence Data Model and Migration Safety Foundation | Persistence and migration safety only. P8-002 is the **sole owner** of all authentication persistence required by P8-003: the PM-selected credential representation, `User.passwordHash` (nullable per F), the `Session` model (PM-decided digest and fields), refresh-token digest columns/fields, audit context columns (`AuditLog.ipAddress`, `AuditLog.userAgent`), related enums/indexes/constraints, the additive forward-only migration SQL review, rollback documentation, and explicitly authorized local-only application of the migration. P8-002 contains **no** `AuthGuard`, no login/logout/refresh endpoint, no JWT issuance, no auth behavior, no RBAC model, no frontend work, and no unrelated package install. P8-002 must use the decisions explicitly selected by PM in the future P8-002 PM prompt; recommendations in this plan are not approvals. | P8-001 (R1) | Schema additive migration; migration SQL review; local-only application evidence | `backend/prisma/schema.prisma`, `backend/prisma/migrations/`, `backend/src/prisma/`, `backend/src/audit/` (re-export of new types only), `backend/src/testing/test.utils.ts`, `backend/src/testing/test.module.ts`, `src/project/projectRegistry.ts`, `AGENT_REPORTS/latest-status.md`, `AGENT_REPORTS/latest-wdr-summary.md`, `PM_OUTBOX/next-opencode-prompt.md`, `WDR/_All/Phase-08-Database-Auth-RBAC/TOPLINE-P8-002_WDR_2026-09-10.md` | Frontend, frontend API client, frontend types, frontend pages/components, env files (real `.env`), login/logout/refresh endpoints, `AuthGuard`/guards, JWT issuance, auth behavior, RBAC, packages not PM-approved, migration that modifies or drops existing columns, destructive DB commands, real secrets, any DB-connecting command in production, shop.com | `git diff --check`; `npm run build` (backend); `npm test` (backend) — 12/12 must still pass; `npm run smoke` (read-only smoke must still pass); review of generated migration SQL must be pasted into the WDR (additive only, no DROP, no `ALTER COLUMN DROP NOT NULL`); `node backend/scripts/test-tenant-create.js` (and the other 4 evidence scripts) must still pass; negative: missing/unknown column on a frozen model must NOT be added by the new migration; P8-002 **must** add the `Session` model (and exactly one additive migration) required by P8-003, and P8-002 must prove that the `Session` model is created exactly once in P8-002 and that P8-003 will not recreate it, re-create it, or add a new migration for it; P8-002 must NOT add `User.emailVerified` (deferred per §Z) | Destructive DB action; real secret in commit; production target; tenant uncertainty; contradiction; scope expansion; any forbidden action attempted | Single WDR; registry updated; pmAudit PLANNED until PM audit; migration SQL excerpt and review pasted; column existence and absence tests pass | Yes |
| **P8-003** | Authentication Session Lifecycle and Write Endpoint Protection | Authentication and session behavior. P8-003 owns the approved auth package installation (each package requires separate PM approval), `POST /auth/login` (returns access + refresh tokens), `POST /auth/logout` (deletes session), `POST /auth/refresh` (rotates refresh, single-use, replay detection revokes the entire session), refresh rotation/reuse handling, public-route allowlist enforcement, audit redaction/events, `AuthGuard` as a global NestJS guard (with explicit `PUBLIC` allowlist per F), and protection of the four existing write endpoints. P8-003 must **not** edit `backend/prisma/schema.prisma` or migrations and must **not** create Session/credential persistence — those are P8-002 deliverables. P8-003 must **not** add RBAC schema/permission hierarchy. Ensure login failures return a fixed 401 message with no email/user-id leak; ensure `AuditLog.metadata` is redacted before write (no tokens/secrets/passwords); preserve every existing route shape. | P8-002 | `AuthGuard`; login/logout/refresh endpoints; 4 write endpoints wrapped; redactor; public-route allowlist | `backend/src/auth/`, `backend/src/tenants/`, `backend/src/vendors/`, `backend/src/categories/`, `backend/src/products/`, `backend/src/audit/`, `backend/src/common/`, `backend/src/app.module.ts`, `backend/src/main.ts`, `backend/src/testing/test.utils.ts`, `backend/src/testing/test.module.ts`, `backend/scripts/test-*.js` (new auth tests), `backend/package.json` and `backend/package-lock.json` (only if separately PM-approved for the needed packages), `src/project/projectRegistry.ts`, `AGENT_REPORTS/latest-status.md`, `AGENT_REPORTS/latest-wdr-summary.md`, `PM_OUTBOX/next-opencode-prompt.md`, `WDR/_All/Phase-08-Database-Auth-RBAC/TOPLINE-P8-003_WDR_2026-09-10.md` | Frontend, frontend API client, frontend types, frontend pages/components, env files (real `.env`), real secrets, `backend/prisma/schema.prisma`, `backend/prisma/migrations/`, Session/credential persistence creation, RBAC schema/permission hierarchy, destructive migration, shop.com | `git diff --check`; `npm run build` (backend); `npm test` (backend); auth scenario tests (login success, login failure with fixed 401, logout, refresh rotation, replay-revoke); redaction test that proves `*token*`/`*secret*`/`*password*` are absent from `AuditLog.metadata`; 4 write endpoints return 401 when called without a valid token; existing read-only smoke still passes; P8-003 must not produce a Prisma migration; P8-003 must not add the Session model; **no raw token/link/secret in any log, audit row, or WDR** | Destructive DB; secret leak; tenant uncertainty; scope expansion; raw token/link in any log; Prisma or migration changes attempted | Single WDR; registry updated; pmAudit PLANNED; redaction test passes; replay-revoke test passes | Yes |
| **P8-004** | Tenant-Aware RBAC Enforcement and Security Audit Hardening | RBAC persistence, enforcement, audit hardening. Add the `Role`, `Permission`, `RolePermission`, `TenantMembershipRole`, `VendorMembership` models (per F, PM-decided). Add a `PermissionsGuard` and a `TenantContextGuard` (per F: `tenantId` only from JWT, never body/query). Wire RBAC into the 4 write endpoints. Add a `POST /auth/switch-tenant` endpoint with audit. Add a `seed:rbac` script (PM-approved only, additive only) for the canonical seed roles (`OWNER`, `PLATFORM_ADMIN`, `VENDOR_OWNER`, `VENDOR_MANAGER`, `VENDOR_STAFF`) and a starter permission set. Implement explicit authorization freshness (per F, do not treat long-lived role claims as permanently authoritative). Wire all denial events to `AuditLog` with the redactor. | P8-003 | RBAC models; `PermissionsGuard`; `TenantContextGuard`; seed script (PM-approved only); authorization freshness | `backend/prisma/schema.prisma`, `backend/prisma/migrations/`, `backend/src/auth/`, `backend/src/tenants/`, `backend/src/vendors/`, `backend/src/categories/`, `backend/src/products/`, `backend/src/audit/`, `backend/src/common/`, `backend/src/app.module.ts`, `backend/src/testing/`, `backend/scripts/test-*.js` (new RBAC tests), `backend/package.json` and `backend/package-lock.json` (only if separately PM-approved), `src/project/projectRegistry.ts`, `AGENT_REPORTS/latest-status.md`, `AGENT_REPORTS/latest-wdr-summary.md`, `PM_OUTBOX/next-opencode-prompt.md`, `WDR/_All/Phase-08-Database-Auth-RBAC/TOPLINE-P8-004_WDR_2026-09-10.md` | Frontend, real `.env`, destructive migration that removes any of the 7 frozen models, email verification, password reset, OAuth, shop.com, any production seed | `git diff --check`; `npm run build` (backend); `npm test` (backend); tenant-isolation tests (same-tenant PASS, cross-tenant 403); body/query `tenantId` spoofing test (rejected 403); VENDOR_STAFF cannot call owner-only; revoked-role test within access-token TTL; redaction test still passes; 4 write endpoints enforce tenant + role; **no raw token/link/secret in any log, audit row, or WDR** | Destructive DB; secret leak; contradiction; scope expansion | Single WDR; 4 write endpoints enforce tenant + role; seed script is idempotent; cross-tenant request rejected with 403; revoked-role token rejected within access TTL | Yes |
| **P8-005** | Phase 8 Freeze Gate | Audit and freeze only. Verify all Phase 8 tasks are complete, internally consistent, safely scoped, documented, buildable, and ready to freeze before Phase 9. Same shape as P7-010 freeze gate: registry consistency check, scope safety audit, code health (build + lint + test + diff --check), dashboard source verification, no product code beyond Phase 8 scope, no Phase 9 work started. Must not implement fixes silently. | P8-004 | Freeze gate (audit-only) | `src/project/projectRegistry.ts`, `AGENT_REPORTS/latest-status.md`, `AGENT_REPORTS/latest-wdr-summary.md`, `PM_OUTBOX/next-opencode-prompt.md`, `WDR/_All/Phase-08-Database-Auth-RBAC/TOPLINE-P8-005_WDR_*.md` (path assigned when P8-005 is PM-approved and registered; the `*` is a literal placeholder, not a guess) | All implementation work; frontend; packages (unless a corrective add is required); secrets; production; shop.com; Phase 9 | `npm run build` (root + backend), `npm run lint` (root), `npm test` (backend), `git diff --check`, targeted searches against the actual `tasks[]` and `wdrs[]` registered IDs (not guessed IDs); **no raw token/link/secret in any WDR or log** | Registry inconsistency; scope expansion; production target; contradiction; unauthorized frontend change | Single WDR; phase-8 rollup `status: "CLOSED"`; `taskCount` matches actual `tasks[]` length | Yes |

**Database/auth work separation**: Only **P8-002** and **P8-004** are planned additive migration tasks. P8-002 owns the authentication persistence migration (Session, `User.passwordHash`, audit context columns, related enums/indexes/constraints). P8-004 owns the RBAC persistence migration (`Role`, `Permission`, `RolePermission`, `TenantMembershipRole`, `VendorMembership`). **P8-003 is code-only**: it does not edit `backend/prisma/schema.prisma`, does not create migrations, and does not add Session/credential persistence. **P8-005 is audit/freeze only** and never an implementation task. Additive migrations are not "irreversible"; every migration task must follow the SQL review, additive/non-destructive proof, rollback documentation, local-only application, and explicit PM authorization requirements. No task removes or renames any of the 7 frozen models from Phase 4.

**Package additions** (each requires a separate PM-approved prompt, never silent): **P8-003 is the sole planned owner of any PM-approved auth package install.** Package names remain recommendations only and require explicit future PM approval plus actual compatibility/dependency evidence. Candidates (no automatic install): `argon2` (password hashing, per F), `@nestjs/jwt` + `@nestjs/passport` (access/refresh token signing, per F), `@nestjs/throttler` (rate limiting, optional, PM-decision). `passport-jwt` is **not** asserted as transitive to `@nestjs/passport`; that relationship must be verified from the actual `package.json` and official package documentation at the time of any future PM-approved install. **P8-002 installs no packages**; it is schema/migration-only.

---

## M. Verification Matrix (R1 §G)

Every row below aligns with the **three future implementation tasks (P8-002, P8-003, P8-004) plus the P8-005 freeze gate**. **R1 does not claim any of these tests exist or pass.** R1 is a planning correction; the tests below describe the negative-security coverage the future tasks must produce and verify under their own PM-approved prompts. Future WDR IDs and dates for P8-002 through P8-005 are **not reserved or guessed in this plan**; each ID/path/date is assigned only when PM approves and registers the corresponding task. The existing `wdr-065`, `wdr-066`, `wdr-067`, and `wdr-068` entries belong to the P8-001 corrective chain and must not be reused.

| Future task | Static checks | Build | Tests | Negative-security tests | Tenant-isolation tests | Migration review | Browser/E2E |
|---|---|---|---|---|---|---|---|
| P8-002 | `git diff --check`; no console.log of tokens/secrets | `npm run build` (backend); `npm run build` (root — registry should not break imports) | `npm test` (backend) — 12/12 must still pass; 5 evidence scripts must still pass | Missing/unknown column on a frozen model is NOT added by the new migration; redaction pre-check | n/a (no new tenant logic in P8-002) | Review the additive migration: only `ADD COLUMN` / `CREATE TABLE`; no `ALTER COLUMN DROP NOT NULL`; no `DROP TABLE`; rollback documented; SQL excerpt pasted into the WDR | n/a (backend only) |
| P8-003 | `git diff --check`; redaction test | `npm run build` (backend) | `npm test` (backend) — auth event tests; refresh-rotation tests; redaction tests | Login with wrong password returns 401 with fixed message; missing `Authorization` header returns 401; expired token returns 401; revoked session's access token returns 401; replayed refresh token revokes the entire session; `*token*`/`*secret*`/`*password*` are absent from `AuditLog.metadata`; **no raw token/link/secret in any log, audit row, or WDR** | Cross-tenant call returns 403 (no `Membership` for that tenant); body/query `tenantId` spoofing rejected with 403 (P8-003 or P8-004) | **n/a (P8-003 must not edit `backend/prisma/schema.prisma` or migrations and must not create `Session` or any credential persistence; any such need is a stop condition and requires PM correction)** | n/a |
| P8-004 | `git diff --check`; seed script idempotency | `npm run build` (backend) | `npm test` (backend) — RBAC tests; cross-tenant tests; role tests; authorization freshness tests | Vendor staff cannot call `owner.*`; cross-tenant call returns 403; same-tenant vendor staff cannot write to another vendor; body/query `tenantId` spoofing rejected; revoked-role token rejected within access-token TTL; `*token*`/`*secret*`/`*password*` are absent from `AuditLog.metadata` | VENDOR_STAFF on vendor 1 cannot write to vendor 2 in the same tenant; user without `Membership` for tenant B is rejected at the guard | Review the `Role`, `Permission`, `RolePermission`, `TenantMembershipRole`, `VendorMembership` migration: additive only; seed runs cleanly against the local dev DB | n/a |
| P8-005 | `git diff --check`; targeted registry searches | `npm run build` (root + backend), `npm run lint` (root) | `npm test` (backend) | n/a (audit) | n/a (audit) | n/a (audit) | n/a |

**Database commands require separate explicit authorization**: any `prisma migrate dev`, `prisma db push`, `prisma db seed`, `prisma migrate reset`, raw SQL, or connection to a non-local database must be in its own PM-approved task with a clear destructive-vs-additive flag.

---

## N. Global Stop Conditions

A future Phase 8 task must STOP as BLOCKED and report before edits if any of the following is true:

1. **Destructive DB risk** — any task that would DROP, TRUNCATE, or `ALTER COLUMN DROP NOT NULL` on a frozen column must STOP. Phase 4 freeze gate forbids destructive migrations; Phase 8 inherits that. **No local database is freely destructible.** PM must approve any destructive operation against any environment.
2. **Production target** — any task that connects to a non-local database or that would affect a deployed environment must STOP. Phase 8 is dev-only.
3. **Real secrets** — any task that reads `backend/.env` (not `.env.example`) or that writes a real secret to the repository must STOP. Use the placeholder values from `.env.example` and document the production secret store in a separate task.
4. **Unresolved architecture contradiction** — if a future task's plan contradicts this document, the previous WDR, or the Phase 4 freeze gate, the task must STOP and ask PM to resolve.
5. **Tenant uncertainty** — if a future task cannot prove (via test) that its change preserves tenant isolation (same-tenant PASS, cross-tenant 403, body/query `tenantId` spoofing rejected), it must STOP.
6. **Scope expansion** — if a future task needs to touch a file outside its `Allowed File Families`, it must STOP and ask PM to expand the scope (or split the task).
7. **Inability to verify** — if a future task cannot run `npm run build`, `npm test`, `git diff --check`, or its own required tests for reasons unrelated to environment, it must STOP.
8. **Forbidden-path access** — any read/write/copy from `F:\OpenCode\shop.com` is forbidden at all times. Any task that requires it must STOP.
9. **Raw credential in log/audit/WDR** — any task that would write a raw verification link, password reset link, access token, refresh token, `Authorization` header value, or raw credential to an application log, audit log, WDR, or test output must STOP and use a captured test-only value or in-memory fake transport instead.

---

## O. Recommended Next Task

**Recommended next task: TOPLINE-P8-002 — Auth Persistence Data Model and Migration Safety Foundation.**

### Why it is dependency-first
P8-002 must come first because:
1. It adds the schema columns (`User.passwordHash`, `AuditLog.ipAddress`, `AuditLog.userAgent`) and the `Session` model that P8-003 directly depends on.
2. It establishes the additive migration review and rollback discipline that all later migrations inherit, and produces the columns and indexes that P8-003's `AuthGuard` and write-endpoint protection will rely on.
3. It adds the persistence + digest pattern that P8-003 and P8-004 reuse.
4. It is a strictly additive schema/migration change with no AuthGuard/endpoint behavior; P8-003 is the sole owner of `AuthGuard`, login/logout/refresh, public-route allowlist, redaction, and the four write-endpoint protections.

P8-003, P8-004, P8-005 cannot be implemented safely without P8-002's schema, columns, and migration discipline in place.

### Marked unapproved
This recommendation is **unapproved**. P8-002 has not been added to the registry. The P8-001 / R1 / R2 / R3 governance reconciliation chain does not register P8-002, P8-003, P8-004, or P8-005. PM must write a separate, PM-approved prompt for P8-002 only after the full P8-001 corrective chain (P8-001, R1, R2, and R3) has been audited and PASSED by PM. P8-001 / R1 / R2 / R3 are all currently BLOCKED pending PM audit. R3 STOPPED BEFORE TOPLINE-P8-002 per #123.

---

## Z. Deferred Items (require later PM approval — NOT Phase 8 deliverables)

The items below are **not** part of the Phase 8 core sequence. They must not be described elsewhere in this plan as Phase 8 deliverables. Any future inclusion requires a separate, PM-approved corrective plan and prompt. Self-service flows and verification/reset flows are out of Phase 8.

| Deferred item | Why deferred | Reopens only via |
|---|---|---|
| Self-registration / `POST /auth/register` | Not in core Phase 8 identity objective (Phase 8 covers login and logout only) | Later PM-approved phase |
| Email verification / `User.emailVerified` column / `POST /auth/verify-email` / `POST /auth/resend-verification` | Deferred — not a Phase 8 deliverable; would couple P8-002 to a feature out of scope | Later PM-approved phase |
| Password reset / `POST /auth/forgot-password` / `POST /auth/reset-password` / `PasswordResetToken` model | Deferred — not a Phase 8 deliverable; reset-link transport requires its own PM decision | Later PM-approved phase |
| OAuth / `AuthAccount` model / `POST /auth/oauth/*` | Deferred to a post-Phase 8 phase (Phase 8 is email/password only) | Later PM-approved phase |
| `Module` and `TenantModule` (per-tenant module enablement) | Deferred to a post-Phase 8 phase | Later PM-approved phase |
| Financial `ApprovalGate` (financial/AI approval flow) | Deferred to Phase 9+ | Phase 9+ |
| Real notification delivery (email, SMS) | Deferred; no real provider is selected; verification/reset links are not in scope | Later PM-approved phase |
| `UserRole` / `StaffRole` (Phase 3 §4.1 / §5.7) | Merged into `Membership` + `TenantMembershipRole` (post-Phase 3 unified model); do not add separate tables | n/a (replaced) |

**Critical reminders** (apply to every section of this plan):
- The §B Security objective lists **login and logout only** for Phase 8.
- The §L task table describes `P8-002` as persistence/schema/migration safety only and `P8-003` as authentication/session behavior with no Prisma or migration changes.
- The §J Gap register, §K Risk register, §M Verification matrix, and any acceptance criteria must not reintroduce `User.emailVerified`, registration, email verification, or password reset as Phase 8 deliverables.
- Any future change to this deferred list requires a new PM-approved prompt that names the scope expansion.

---

## End of plan (R4)

This document is the P8-001-R1 / R2 / R3 / R4 deliverable. The canonical registry update is `src/project/projectRegistry.ts`; the canonical WDRs are `WDR/_All/Phase-08-Database-Auth-RBAC/TOPLINE-P8-001-R1_WDR_2026-09-10.md`, `WDR/_All/Phase-08-Database-Auth-RBAC/TOPLINE-P8-001-R2_WDR_2026-09-11.md`, `WDR/_All/Phase-08-Database-Auth-RBAC/TOPLINE-P8-001-R3_WDR_2026-09-11.md`, and `WDR/_All/Phase-08-Database-Auth-RBAC/TOPLINE-P8-001-R4_WDR_2026-09-11.md`. The PM_OUTBOX R4 audit hold notice is `PM_OUTBOX/next-opencode-prompt.md`. The two agent reports are `AGENT_REPORTS/latest-status.md` and `AGENT_REPORTS/latest-wdr-summary.md`. No other file was created or modified.

**R1 audit findings addressed** (one by one, per `WDR/_All/Phase-08-Database-Auth-RBAC/TOPLINE-P8-001-AUDIT_2026-09-10.md`):
1. Prompt budget contradiction — addressed in §A and §L (target 5, sequence P8-001…P8-005, P8-006 removed, R1 not a mega prompt).
2. P8-002 too large — addressed in §A and §L (P8-002 is persistence/migration safety only; guards/JWT issuance/RBAC/frontend explicitly forbidden in P8-002).
3. Security architecture presented as resolved — addressed in §F (decision matrix with options, tradeoffs, recommendations, required evidence, `PM DECISION REQUIRED`; no claims of resolution).
4. Refresh-token transport analysis incomplete — addressed in §F (both bearer and HttpOnly cookie evaluated; `PM DECISION REQUIRED`).
5. Verification-link logging forbidden — addressed in §G (raw token/link/secret logging explicitly forbidden; captured test-only transport pattern; redactor).
6. Local database safety wording — addressed in §E (prior "destroyed and re-migrated freely" wording removed; destructive operations require explicit PM approval regardless of environment; future migration tasks must inspect SQL, prove additive, document rollback, stop on any production target).
7. Authorization freshness + public-route — addressed in §F (explicit `PUBLIC` allowlist option; explicit authorization freshness decision).
8. Evidence placeholders/count errors — addressed in §D (real test inventory: 12 Jest + 5 evidence scripts; P8-001 evidence-fill hash `894d2b36f52c3442650774b2371f035252d8834b` recorded; six allowed files recorded; starting commit `314fe82c5a0cb40e9d0d63f9da5c108a38a79f6c` already named `TOPLINE-P8-001` as next).
9. False/ungrounded verification facts — addressed in §D and §L (`passport-jwt` transitive claim removed; test counts use real executable inventory).
10. Scope isolation and reproducible health checks — preserved; P8-001 PASS execution remains in evidence; R1 is governance-only with no implementation.

**R2 audit findings addressed** (one by one, per `WDR/_All/Phase-08-Database-Auth-RBAC/TOPLINE-P8-001-R1-AUDIT_2026-09-11.md`):
1. Deferred identity flows in §B — removed from the §B security objective; the four deferred items now live only in the new §Z Deferred items section.
2. P8-002 guard ownership contradiction — removed. §O and §L no longer claim that P8-002 introduces `AuthGuard`. P8-002 is sole owner of all auth persistence; P8-003 is sole owner of `AuthGuard`.
3. Session persistence split — resolved. `Session` model is owned by P8-002; P8-003 must not edit `backend/prisma/schema.prisma` or migrations.
4. Prompt-count double-count — corrected. The accurate statement is: P8-001 plan + three implementation tasks (P8-002, P8-003, P8-004) + P8-005 freeze = five core mega prompts.
5. RISK-06 wording — corrected. The risk register now enumerates wrong-target connection, migration reset, destructive generated SQL, raw SQL, DROP, TRUNCATE, unsafe ALTER, seed side effects, and production/staging targeting. "No environment is freely destructible" is preserved.
6. `User.emailVerified` removed from P8-002/P8-003 schema, gaps, risks, and recommendations. It is listed only in §Z Deferred items.
7. Evidence path/status accuracy — corrected in the latest reports and recorded as a historical R1 WDR inaccuracy in the R2 WDR.
8. Successful R1 corrections preserved — the PM decision matrix, refresh-token transport comparison, token/logging prohibition, authorization freshness, public-route, tenant-spoof, credential bootstrap, strict DB safety, real test inventory, and dependency-evidence requirements remain intact.

**R3 audit findings addressed** (one by one, per `WDR/_All/Phase-08-Database-Auth-RBAC/TOPLINE-P8-001-R2-AUDIT_2026-09-11.md`):
1. P8-002 verification now **requires** P8-002 to add the `Session` model exactly once and proves P8-003 does not recreate or migrate it; the prior negative clause "must NOT add a Session model that P8-003 will recreate" is removed.
2. P8-003 verification matrix migration-review cell is now `n/a` with the stop condition "any Prisma/migration need requires PM correction". The fallback "if P8-003 adds the `Session` model, the same review applies" is removed.
3. Database/auth separation paragraph now states only P8-002 and P8-004 are planned additive migration tasks; P8-003 is code-only; P8-005 is audit/freeze only; additive migrations are not "irreversible" — every migration task must follow SQL review, additive/non-destructive proof, rollback documentation, local-only application, and explicit PM authorization.
4. Inventory split — `Session`, `Role`, `Permission`, `RolePermission`, `TenantMembershipRole`, and `VendorMembership` are now marked as Phase 8 planned candidates (P8-002 and P8-004 respectively), not deferred. Only `User.emailVerified`, `AuthAccount`, `Module`, `TenantModule`, `ApprovalGate`, `UserRole`/`StaffRole`, registration, email verification, password reset, OAuth, and real notification delivery are deferred per §Z.
5. Package ownership now restricted to P8-003 only; P8-002 installs no packages. The prior `P8-002 or P8-003` ambiguity is removed from every section.
6. Verification matrix intro and P8-005 row now use the exact count "three future implementation tasks (P8-002, P8-003, P8-004) plus the P8-005 freeze gate". The prior "four future implementation tasks" wording is removed. The P8-005 row no longer reserves `wdr-066` through `wdr-068`; future WDR IDs and dates are assigned only when each future task is PM-approved and registered. Section O now refers to the full P8-001 / R1 / R2 / R3 corrective chain (all currently BLOCKED) instead of "R1 audit passes".
7. R2 overstatements recorded as historical R2 inaccuracies (R2 WDR is immutable; R3 reports and this plan correction capture the truth).
8. Successful R1/R2 corrections preserved — the PM decision matrix, refresh-token transport comparison, token/logging prohibition, authorization freshness, public-route, tenant-spoof, credential bootstrap, strict DB safety, real test inventory, and dependency-evidence requirements remain intact. Recommendations remain unapproved until each future PM prompt.

**Historical R2 inaccuracies** (recorded in R3 per R2 audit finding 7; the R2 WDR is immutable and is not rewritten):
- The R2 WDR and reports stated "all contradictions are resolved" while residual Session/P8-003 verification clauses remained.
- The R2 WDR and reports stated P8-003 is "schema-free" while a fallback verification-matrix clause permitted P8-003 to add the `Session` model.
- The R2 plan's database/auth separation paragraph called P8-002 + P8-003 + P8-004 "irreversible additive migrations" and conflated P8-005 (freeze gate) with implementation tasks.
- The R2 plan's inventory/deferred section conflated Phase 8 planned candidates with truly deferred items.
- The R2 plan's package paragraph allowed `P8-002 or P8-003` for auth packages, contradicting the P8-002 schema/migration-only boundary.
- The R2 plan's verification matrix intro and P8-005 row reserved `wdr-066` through `wdr-068` for P8-002 through P8-004 (those IDs already belong to the P8-001 corrective chain).
- The R2 plan's Section O said P8-002 follows "the P8-001-R1 audit", which became stale when R2 and R3 entered the corrective chain.

**R3 audit findings addressed** (one by one, per `WDR/_All/Phase-08-Database-Auth-RBAC/TOPLINE-P8-001-R3-AUDIT_2026-09-11.md`):
1. Current plan metadata and revision framing — updated to R4, date `2026-09-11`, current corrective task `TOPLINE-P8-001-R4`. Historical R1, R2, R3 evidence is preserved only in immutable WDRs/audits and in the historical evidence block below.
2. Bounded-scope P8-002 package install — removed. The early §C bounded-scope summary now states that P8-002 installs no packages, is schema/migration-only, and that P8-003 is the sole planned owner of future PM-approved auth package installation.
3. Inventory table Phase 8 candidates vs deferred — corrected. The `Designed but not implemented` table now labels `User.passwordHash`, `AuditLog.ipAddress`, `AuditLog.userAgent`, and `Session` as **Phase 8 P8-002 planned candidates**; `Role`, `Permission`, `RolePermission`, `TenantMembershipRole`, and `VendorMembership` as **Phase 8 P8-004 planned candidates**. The blanket "all Phase 3 tables deferred" sentence is replaced with the exact split.
4. Ownership summaries outside the task rows — corrected. The early §C bounded-scope summary, the §D inventory status cells, the §F architecture matrix context, the §J gap register, the §K risk register, the §L task table, the §M verification matrix, and the §O recommended-next-task section all restate the same persistence/package/schema contract for P8-002, P8-003, P8-004, and P8-005.
5. R3 overstatements recorded as historical R3 inaccuracies (the R3 WDR is immutable; R4 reports and this plan body capture the truth).
6. Useful R3 corrections preserved — Session verification, P8-003 migration stop condition, task classification paragraph, exact count, future WDR-ID rule, Section O chain reference, and R1/R2 security decisions and safety boundaries remain intact.

**Historical R3 inaccuracies** (recorded in R4 per R3 audit finding 5; the R3 WDR is immutable and is not rewritten):
- The R3 plan header and revision framing still labeled the live plan as the R1 corrective task with R1's date (`2026-09-10`).
- The R3 plan's early §C bounded-scope summary still stated that P8-002 may install packages if a future PM prompt separately approves them, contradicting the later statement that P8-002 installs no packages.
- The R3 plan's `Designed but not implemented` table still labeled `Session`, `Role`, `Permission`, `RolePermission`, `TenantMembershipRole`, and `VendorMembership` as `deferred`, and the following "Deferred" paragraph still said all listed Phase 3 tables are deferred — directly contradicting the later detailed task table that schedules these models in P8-002 and P8-004.
- The R3 WDR and reports claimed the inventory split and the package restriction were complete; the canonical plan still contained the contradictions above.
- The R3 WDR and reports claimed that the P8-002 ownership summary was consistent with the task rows; the early §C summary did not state P8-002's sole Session/persistence ownership or P8-003's absolute schema-free boundary.

**Historical R1 / R2 corrections preserved** (live in R3 and R4; historical R1/R2 evidence in immutable WDRs/audits):
- Phase 8 core objective: login/logout only; deferred identity flows live only in §Z Deferred items.
- Five-prompt budget formula (P8-001 + P8-002 + P8-003 + P8-004 + P8-005 freeze).
- RISK-06 enumerates wrong-target connection, migration reset, destructive generated SQL, raw SQL, DROP, TRUNCATE, unsafe ALTER, seed side effects, production/staging targeting.
- PM decision matrix (F) is preserved with `PM DECISION REQUIRED` on every row.
- Refresh-token transport comparison (bearer vs HttpOnly cookie) and refresh-token digest decision.
- Credential/token logging prohibition (G) and AuditService redactor.
- Authorization freshness, public-route allowlist, tenant-spoof protection, credential bootstrap.
- Real test inventory: 12 Jest + 5 evidence scripts.
- `passport-jwt` transitive claim removed.
- Evidence path/status accuracy: real preserved unrelated file is `WDR/_All/Governance/TOPLINE-GOV-AUTO-001_WDR_2026-09-08.md`; `.claude/` is untracked.

**R4 audit findings addressed** (one by one, per `WDR/_All/Phase-08-Database-Auth-RBAC/TOPLINE-P8-001-R3-AUDIT_2026-09-11.md` — note the audit file is named after R3 because it audits R3's execution): R3 PM audit findings 1–6 are all addressed in the live plan body above. The P8-001 / R1 / R2 / R3 / wdr-065 / wdr-066 / wdr-067 / wdr-068 entries remain BLOCKED in the registry. Future WDR IDs and dates for P8-002 through P8-005 are not reserved or guessed.
