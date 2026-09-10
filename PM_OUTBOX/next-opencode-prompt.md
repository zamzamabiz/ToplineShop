# Next OpenCode Execution Prompt

## PM/CTO Decision

**TOPLINE-P8-001-R7 execution: PASS — PM audit BLOCKED**

R7 corrected the underlying ignored-file status evidence, but its
evidence-fill handoff is incomplete. No P8-002 implementation is
authorized.

R7 PM audit is BLOCKED. Do not paste any P8-002 prompt into #MM.

## R7 Evidence

- R7 WDR: `WDR/_All/Phase-08-Database-Auth-RBAC/TOPLINE-P8-001-R7_WDR_2026-09-11.md`
- R7 audit: `WDR/_All/Phase-08-Database-Auth-RBAC/TOPLINE-P8-001-R7-AUDIT_2026-09-11.md`
- R7 implementation commit: `b9bfa2bcec283815ead71d9d2fd7ce0e39943306`
- R7 evidence-fill commit (Commit B): `760f61304b05cd9ce992a9e35ed21abce451e931`
- R6 implementation commit: `1f6c3f9f56fc6bfb91cde9564706e0e35808a0cb`
- R6 evidence-fill commit: `ab864dc073b244bc24415bb67f8777ceb7504662`
- R6 PM audit commit: `b2456c2d15388ffe1beb7958f41da21a40bbd604`
- R6 audit: `WDR/_All/Phase-08-Database-Auth-RBAC/TOPLINE-P8-001-R6-AUDIT_2026-09-11.md`
- R6 WDR (immutable, with R6 status-evidence correction recorded in R7): `WDR/_All/Phase-08-Database-Auth-RBAC/TOPLINE-P8-001-R6_WDR_2026-09-11.md`
- R6 plan: `docs/PHASE-08-DATABASE-AUTH-RBAC-READINESS-PLAN.md` (preserved byte-for-byte by R7)
- Canonical registry: `src/project/projectRegistry.ts` (R7 execution PASS with pmApproval BLOCKED, wdr-072 BLOCKED, P8-001 through R6 pmApproval BLOCKED, wdr-065 through wdr-071 pmAudit BLOCKED, Phase 8 BLOCKED, currentTask null, lastCompletedTask `TOPLINE-P8-001-R7`, nextPlannedTask `TOPLINE-P8-001-R8`)
- Reports: `AGENT_REPORTS/latest-status.md`, `AGENT_REPORTS/latest-wdr-summary.md`

## Block Status

- `TOPLINE-P8-001`, `TOPLINE-P8-001-R1`, `TOPLINE-P8-001-R2`, `TOPLINE-P8-001-R3`, `TOPLINE-P8-001-R4`, `TOPLINE-P8-001-R5`, `TOPLINE-P8-001-R6` and `wdr-065`, `wdr-066`, `wdr-067`, `wdr-068`, `wdr-069`, `wdr-070`, `wdr-071` remain BLOCKED.
- Phase 8 remains BLOCKED. P8-002 is proposed but unapproved.
- P8-001-R7 STOPPED BEFORE `TOPLINE-P8-002` per #123.

## Required Corrective Task

`TOPLINE-P8-001-R8 - Phase 8 R7 Evidence-Fill and WDR State Reconciliation`

R8 is documentation/governance only. It must:

- Fill the real R7 evidence-fill hash into the R7 WDR Git Evidence
  section, both latest reports, the PM outbox, and the canonical registry
  where applicable.
- Add blocked `wdr-071` to `AGENT_REPORTS/latest-wdr-summary.md`.
- Preserve the R7 ignored-file correction and R6 readiness-plan corrections
  byte-for-byte.
- Re-run status, diff, build, lint, backend build, and backend test checks.
- Stop before P8-002. Do not install packages, change Prisma/schema or
  migrations, implement database/auth/RBAC/session/token/security behavior,
  touch secrets, or access `F:\OpenCode\shop.com`.

Until R8 is completed and PM-audited, no P8-002 prompt or implementation is
authorized.
