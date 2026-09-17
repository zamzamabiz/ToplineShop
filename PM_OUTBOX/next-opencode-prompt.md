# Next OpenCode Execution Prompt

## PM/CTO Decision Needed

**Owner decision on `TOPLINE-P8-003-AUTH-BEHAVIOR-OWNER-DECISION` and governance transition recorded.**

P8-002 implementation is **CLOSED**, P8-002 PM audit is **PASS**, and P8-002 migration gate is **PASS**. The migration was applied to the authorized local PostgreSQL `toplineshop` database; Prisma reports the schema as up to date. Smoke (11/11) and all four database evidence scripts (30+33+57+82 = 202/202 assertions) PASSED. Pre/post row counts for `users`, `audit_logs`, and `sessions` were all `0 → 0` (additive-only migration, no data write).

**Phase 8 `databaseGate` is now `PASS`** (transitioned from PLANNED via this owner-decision task). `phase-8.nextPlannedTask` is `TOPLINE-P8-003-AUTH-BEHAVIOR-OWNER-DECISION`.

**P8-003 implementation is NOT authorized by this task.** A separate explicit implementation authorization is required.

P8-003 governance scope (record only — no design, no implementation):

- Login/session behavior
- Password hashing and verification
- Access-token issuance
- Refresh-token rotation
- Session revocation and reuse detection
- Auth guards and request identity propagation

Deferred / out-of-scope (record):

- RBAC (P8-004)
- OAuth
- Password reset
- Email verification
- LoginAttempt (unless separately approved)
- Payments
- Trade Refinery
- `shop.com`
- Unrelated frontend work

The implementation task `TOPLINE-P8-003-AUTH-BEHAVIOR-IMPLEMENTATION` requires a fresh `#123` cycle and explicit implementation authorization. It must NOT start until authorized.

## P8-002 Evidence

- P8-002 WDR: `WDR/_All/Phase-08-Database-Auth-RBAC/TOPLINE-P8-002_WDR_2026-09-16.md`
- Working branch: `feature/p8-002-auth-persistence` (created from `origin/codex/platform-core`)
- Base HEAD: `5d680f85c458d553c9ab43c06df2c1bb5554d3a8`
- Migration file: `backend/prisma/migrations/20260916020000_p8_002_auth_persistence/migration.sql`
- Schema file: `backend/prisma/schema.prisma` (additive only)
- Canonical registry: `src/project/projectRegistry.ts`
- Reports: `AGENT_REPORTS/latest-status.md`, `AGENT_REPORTS/latest-wdr-summary.md`
- PM_OUTBOX: `PM_OUTBOX/next-opencode-prompt.md` (this file)

## R22 / R23 / R24 Commit A Ownership (must remain preserved)

- R22 implementation Commit A: `a13cb04b13a1c81877aa15e5d070fc2b39e9d82d`
- R22 evidence-fill Commit B: `bd398f270a781be54e40e51e2832ea46c874a84f`
- R22 PM-audit Commit A: `5a91bd7a8587aff9ceda497749760ef7efbfdbc9`
- R22 PM-audit evidence-fill Commit B: `e0e00864e9eb2f1c20c50cc3f9395058e9517168`
- R23 Commit A: `bdacbcb16951951982edf8ef0afd3615a59d619b` — TOPLINE-P8-001-R23: clean governance reconciliation
- R23 Commit B: `c704ea647689b8f0fcbc019f6e828d7116aa2b62` — TOPLINE-P8-001-R23: finalize clean evidence
- R23 Commit C: `c5fde66d19780f3c31371bb85b27b512e8e63aa3` — TOPLINE-P8-001-R23: correct final evidence references
- R24 Commit A: `f1e0fb3578dd33f0aab01da7a2b838d4a8d3c7d8` — TOPLINE-P8-001-R24: correct R23 evidence integrity
- R22 task `commitHash` and `wdr-087.commitHash` remain R22 Commit A `a13cb04b13a1c81877aa15e5d070fc2b39e9d82d` (preserved unchanged)
- R23 task `commitHash` and `wdr-088.commitHash` remain R23 Commit A `bdacbcb16951951982edf8ef0afd3615a59d619b` (preserved unchanged)
- R24 task `commitHash` and `wdr-089.commitHash` remain R24 Commit A `f1e0fb3578dd33f0aab01da7a2b838d4a8d3c7d8` (preserved unchanged)
- Registry `git.lastCommit` was deliberately updated by P8-002 Commit B to `a1ce796df4a226bb16fb556fc8ac18fad730e07c` (P8-002 Commit A), replacing the prior R22 evidence-fill Commit B hash `bd398f270a781be54e40e51e2832ea46c874a84f`. This is a documented and authorized change distinct from the per-task ownership preservation above.

## Required Audit Checks

1. Confirm `backend/prisma/schema.prisma` changes are purely additive: one new enum `SessionRevocationReason`, two new nullable columns (`User.passwordHash`, `AuditLog.ipAddress`, `AuditLog.userAgent`), reverse relations on `User` and `Tenant`, and one new `Session` model. No existing field, index, relation, or constraint was modified or removed.
2. Confirm the migration SQL contains **no** `DROP`, `TRUNCATE`, `RENAME`, `DELETE FROM`, `UPDATE ... SET`, or destructive `ALTER`. Every statement must be `CREATE TYPE`, `CREATE TABLE`, `CREATE INDEX`, `CREATE UNIQUE INDEX`, `ALTER TABLE ... ADD COLUMN`, or `ALTER TABLE ... ADD CONSTRAINT FOREIGN KEY`.
3. Confirm `Session.refreshTokenDigest` is the only refresh-token storage column and is named to enforce the "digest only, never raw token or raw secret" invariant. Confirm `refreshTokenDigest` length covers hex (64) and base64 (44) encodings with headroom.
4. Confirm the refresh-token HOT PATH in P8-003 is documented as lookup by `sessionId` (UUID PK), not by digest. Confirm `@@unique([refreshTokenDigest])` is documented as a defense-in-depth uniqueness invariant only.
5. Confirm `Session` enforces "one revocable session per user/device" via `@@unique([userId, deviceId])`.
6. Confirm `Session.tenantId` is NOT NULL and `Session` has FK constraints `ON DELETE RESTRICT ON UPDATE CASCADE` to both `users` and `tenants`.
7. Confirm `LoginAttempt` is **not** present anywhere in the P8-002 schema or migration, and is reported as deferred for PM resolution per the canonical plan.
8. Confirm `package.json` / `package-lock.json` (root and backend) are unchanged; no package was installed; `.env` and `.env.example` are unchanged.
9. Confirm `prisma:validate`, `prisma:generate`, backend `build`, backend `test` (12/12), root `build` (25/25 static pages), and `git diff --check` all pass.
10. Confirm `backend/scripts/smoke-health.js` and the four `backend/scripts/test-*-create.js` evidence scripts are explicitly recorded as **NOT RUN in P8-002** (database unavailable, migration not applied, database writes not authorized) AND **PASSED in the migration-gate run** (smoke 11/11, tenant 30/30, vendor 33/33, category 57/57, product 82/82).
11. Confirm the migration scripts themselves were not modified, deleted, or cleaned; they remain in `backend/scripts/`.
12. Confirm the migration-application gate (smoke + 4 `test-*-create.js`) has been **completed and recorded**. Phase 8 `databaseGate` has transitioned `PLANNED` → `PASS`.
13. Confirm the Phase 8 rollup: `progress: 40`, `megaPromptsCompleted: 2`, `taskCount: 26`, `completedTaskCount: 26`; `status` remains `BLOCKED` (P8-003 implementation gate), `currentTask` remains `null`, `databaseGate` is now `PASS`, `nextPlannedTask` is now `TOPLINE-P8-003-AUTH-BEHAVIOR-OWNER-DECISION`.
14. Confirm `git add`, `git commit`, and `git push` were performed for P8-002 in the two-commit delivery pattern. Implementation Commit A: `a1ce796df4a226bb16fb556fc8ac18fad730e07c` (`TOPLINE-P8-002: add auth persistence foundation`, 7 files staged exactly). Evidence-fill Commit B: reported in the final handoff (intentionally not stored inside this PM_OUTBOX). Both commits were pushed to `origin/feature/p8-002-auth-persistence`. No `git merge` was performed and no PR was opened.
15. Confirm pre-existing untracked files were preserved (18 pre-existing untracked items preserved; two new untracked items added during the P8-002 two-commit delivery are scratch files `PM_OUTBOX/.p8-002-commit-a-msg.txt` and `PM_OUTBOX/.p8-002-commit-b-msg.txt`. **The P8-002 WDR and migration directory are NOT untracked — they are tracked in Commit A and pushed.**)
16. Confirm the R22 / R23 / R24 task `commitHash` fields and `wdr-087/088/089.commitHash` fields remain unchanged (R22 `a13cb04b13a1c81877aa15e5d070fc2b39e9d82d`, R23 `bdacbcb16951951982edf8ef0afd3615a59d619b`, R24 `f1e0fb3578dd33f0aab01da7a2b838d4a8d3c7d8`). The registry `git.lastCommit` was deliberately updated by P8-002 Commit B to `a1ce796df4a226bb16fb556fc8ac18fad730e07c` (P8-002 Commit A), replacing the prior R22 evidence-fill Commit B hash `bd398f270a781be54e40e51e2832ea46c874a84f`. This is a documented and authorized change distinct from the per-task ownership preservation above.
17. Confirm no authentication behavior was added: no `AuthGuard`, no login/logout/refresh endpoint, no JWT issuance, no token rotation, no reuse-detection logic, no HMAC server-secret storage, no logging of raw tokens or secrets.
18. Confirm Core UI PRs #2 (`feature/core-application-ui-resume`), #3 (`feature/core-admin-products-ui`), and #4 (`feature/core-product-detail-ui`) and Trade Refinery were not touched; `F:\OpenCode\shop.com` was not read or modified.

## Stop Before P8-003

**Do not prepare, paste, or execute any TOPLINE-P8-003 implementation prompt until the owner has granted explicit implementation authorization.** P8-003 (auth behavior, `AuthGuard`, login/logout/refresh, audit redaction/events, write-endpoint protection) and P8-004 (RBAC persistence and enforcement) both remain unauthorized. P8-002 and the migration-application gate do NOT authorize either of them.

The P8-002 migration has now been applied to the authorized local PostgreSQL `toplineshop` database. A local-only rollback script is documented in the WDR, but any rollback is also gated by owner approval.
