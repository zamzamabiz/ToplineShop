# Latest WDR Summary

## Current WDR

**TOPLINE-P8-002** — Auth Persistence Data Model Foundation

- Execution: **PASS** (schema/migration-only, additive; PM audit corrections applied)
- PM audit: **PLANNED** (awaiting independent PM/owner audit)
- Migration applied to a live database: **NO**
- Implementation Commit A: `a1ce796df4a226bb16fb556fc8ac18fad730e07c` — TOPLINE-P8-002: add auth persistence foundation
- Evidence-fill Commit B: hash reported in the final handoff; this summary intentionally does not store Commit B's own hash inside itself.
- Both commits pushed to `origin/feature/p8-002-auth-persistence`. No `git merge`, no PR.
- WDR: `WDR/_All/Phase-08-Database-Auth-RBAC/TOPLINE-P8-002_WDR_2026-09-16.md`

## P8-002 Result

P8-002 implemented the additive schema/migration foundation for authentication persistence on `feature/p8-002-auth-persistence` (base `origin/codex/platform-core` HEAD `5d680f85...`):

- New enum `SessionRevocationReason` with seven reason values.
- New nullable `User.passwordHash` (`VARCHAR(255)`). Hashing behavior deferred to P8-003.
- New nullable `AuditLog.ipAddress` (`VARCHAR(45)`) and `AuditLog.userAgent` (`TEXT`).
- New `Session` model with `refreshTokenDigest` (HMAC-SHA256 digest of the **secret only**; raw token / raw secret are never persisted or logged), `deviceId`, `expiresAt`, `revokedAt`, `revokedReason`, per-session `ipAddress`/`userAgent`, `@@unique([userId, deviceId])`, `@@unique([refreshTokenDigest])` (defense-in-depth uniqueness invariant; **NOT** the lookup hot path), FKs to `users` and `tenants` (`ON DELETE RESTRICT ON UPDATE CASCADE`), and supporting indexes.
- One forward-only additive Prisma migration `20260916020000_p8_002_auth_persistence` containing `CREATE TYPE` (1), `CREATE TABLE` (1), `CREATE INDEX` (3), `CREATE UNIQUE INDEX` (2), `ALTER TABLE ... ADD COLUMN` (3), and `ALTER TABLE ... ADD CONSTRAINT FOREIGN KEY` (2). No DROP, TRUNCATE, RENAME, DELETE FROM, UPDATE SET, or destructive ALTER.

`LoginAttempt` was **not** added — the canonical plan (`docs/PHASE-08-DATABASE-AUTH-RBAC-READINESS-PLAN.md`) does not unambiguously assign it to P8-002, so it is reported as **deferred for PM resolution**.

## Forward-Looking P8-003 Refresh-Token Contract

The audit corrections clarified the future verification flow:

- Token format: `<sessionId>.<randomSecret>`.
- **Lookup hot path: by `sessionId` (UUID PK), NOT by digest.**
- Verification: `HMAC-SHA256(serverSecret, secret)` compared to `refreshTokenDigest` using **timing-safe** equality.
- Replay handling: mismatch on an **active** session → revoke with `revokedReason = REFRESH_REUSE_DETECTED`.
- Raw token / raw secret are **never** persisted, logged, written to `AuditLog.metadata`, or sent to error sinks.

P8-002 implements none of this — verification, rotation, reuse-detection, HMAC server-secret storage, or any logging of tokens/secrets. Those are P8-003's responsibility.

## Verification Results (what PASSED in this task)

| Check | Result |
|---|---|
| `npm.cmd run prisma:validate` (backend) | PASS |
| `npm.cmd run prisma:generate` (backend) | PASS |
| `npm.cmd run build` (backend) | PASS — exit `0` |
| `npm.cmd test` (backend) | PASS — 12/12 |
| `npm.cmd run build` (repo root) | PASS — 25/25 static pages |
| `git diff --check` | PASS — exit `0` |
| Migration SQL destructive-pattern scan (DROP / TRUNCATE / RENAME / DELETE FROM / UPDATE SET / non-TABLE-ALTER) | none — clean |

## Smoke and Database Evidence Scripts — Not Run

Per PM scope, no live database was reachable, no migration was applied, and database writes were not authorized. The five canonical Node evidence scripts were therefore **NOT RUN** in P8-002:

- `backend/scripts/smoke-health.js` — NOT RUN
- `backend/scripts/test-tenant-create.js` — NOT RUN
- `backend/scripts/test-vendor-create.js` — NOT RUN
- `backend/scripts/test-category-create.js` — NOT RUN
- `backend/scripts/test-product-create.js` — NOT RUN

The scripts themselves were not modified, deleted, or cleaned. They remain in `backend/scripts/`.

## Phase 8 Rollup (after audit corrections)

| Field | Value |
|---|---|
| `phase-8.status` | BLOCKED |
| `phase-8.progress` | 40 |
| `phase-8.megaPromptsCompleted` | 2 |
| `phase-8.taskCount` | 26 |
| `phase-8.completedTaskCount` | 26 |
| `phase-8.currentTask` | null |
| `phase-8.databaseGate` | PLANNED |
| `lastCompletedTask` | TOPLINE-P8-002 |
| `nextPlannedTask` | TOPLINE-P8-002-PM-AUDIT |

## R22 / R23 / R24 Commit A Ownership (preserved)

- R22 task `commitHash` and `wdr-087.commitHash` remain R22 Commit A `a13cb04b13a1c81877aa15e5d070fc2b39e9d82d`.
- R23 task `commitHash` and `wdr-088.commitHash` remain R23 Commit A `bdacbcb16951951982edf8ef0afd3615a59d619b`.
- R24 task `commitHash` and `wdr-089.commitHash` remain R24 Commit A `f1e0fb3578dd33f0aab01da7a2b838d4a8d3c7d8`.
- Registry `git.lastCommit` remains the R22 evidence-fill Commit B hash `bd398f270a781be54e40e51e2832ea46c874a84f` (not replaced).

## What P8-002 Changed

- `backend/prisma/schema.prisma` — additive only (one new enum, two new nullable columns on existing tables, three reverse relations on existing models, one new `Session` model). Field and `@@unique` comments corrected to reflect sessionId hot path.
- `backend/prisma/migrations/20260916020000_p8_002_auth_persistence/migration.sql` — new forward-only additive migration. Digest-index comment corrected.
- `WDR/_All/Phase-08-Database-Auth-RBAC/TOPLINE-P8-002_WDR_2026-09-16.md` — new WDR with full schema, migration SQL, Forward-Looking P8-003 Refresh-Token Contract, Smoke and DB Evidence Scripts — Not Run, Migration Application — Separate Gate, verification, rollback, safety, and deferred-items record.
- `src/project/projectRegistry.ts` — P8-002 task registered (status PASS, commitHash null until owner-approved commit), wdr-090 registered; Phase 8 rollup updated (`progress: 40`, `megaPromptsCompleted: 2`, `taskCount: 26`, `completedTaskCount: 26`); `lastUpdated` 2026-09-16, `lastCompletedTask` = TOPLINE-P8-002, `nextPlannedTask` = TOPLINE-P8-002-PM-AUDIT.
- `AGENT_REPORTS/latest-status.md` and `AGENT_REPORTS/latest-wdr-summary.md` re-oriented to P8-002 (audit-corrected).
- `PM_OUTBOX/next-opencode-prompt.md` re-oriented to P8-002 PM-AUDIT (audit-corrected).

## Safety State

- Phase 8 remains **BLOCKED** pending P8-002 PM audit and the separate owner-approved migration-application gate.
- `currentTask` remains `null`; the audit is the gate.
- TOPLINE-P8-003 (auth behavior), P8-004 (RBAC), and P8-005 (audit/freeze only) remain unauthorized.
- No frontend, package, secret, environment, TLS, Trade Refinery, RBAC, or auth-behavior file was changed.
- No `git merge` was performed and no PR was opened. `git add`, `git commit`, and `git push` were performed for the two-commit delivery (Commit A = implementation; Commit B = evidence-fill, hash reported in the final handoff).
- The migration artifact is on disk only; no live database has been touched.

## Next WDR / Audit

**Independent PM/owner audit of TOPLINE-P8-002 is required**, including the audit corrections (sessionId hot path, smoke + 4 `test-*-create.js` NOT RUN with reasons, migration-application gate). Before any P8-003 preparation, a separate owner-approved task must apply the migration to an authorized database, run `node backend/scripts/smoke-health.js`, and run the four `node backend/scripts/test-*-create.js` evidence scripts, recording pre/post row counts and assertion totals.
