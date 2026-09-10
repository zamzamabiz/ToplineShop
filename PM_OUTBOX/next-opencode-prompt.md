# Next OpenCode Execution Prompt

## PM/CTO Decision

**TOPLINE-P8-001-R6 execution: PASS — PM audit BLOCKED**

R6 corrected the live Phase 8 package ownership and stale-chain
contradictions, but its status evidence is inaccurate. The actual
repository contains `.claude/settings.local.json` as a globally ignored
file, while the R6 WDR and reports describe it as ordinary untracked and
not git-ignored. No P8-002 implementation is authorized.

R6 PM audit is BLOCKED. Do not paste any P8-002 prompt into #MM.

## R6 Evidence

- R6 WDR: `WDR/_All/Phase-08-Database-Auth-RBAC/TOPLINE-P8-001-R6_WDR_2026-09-11.md`
- R6 audit: `WDR/_All/Phase-08-Database-Auth-RBAC/TOPLINE-P8-001-R6-AUDIT_2026-09-11.md`
- R6 PM audit commit: `cbb96c5a80424cc8da88294775685cf9ae8bd99a`
- R6 implementation commit: `1f6c3f9f56fc6bfb91cde9564706e0e35808a0cb`
- R6 evidence-fill commit (Commit B): `ab864dc073b244bc24415bb67f8777ceb7504662`
- R5 implementation commit: `aaa32521d2dd36f520542666b3318486745a150e`
- R5 evidence-fill commit: `9aa86e491486e192378b8ff3856126c5b0b8144b`
- R5 PM audit commit: `5793f29b937197bbf1223185444e28c8b76658c5`
- R5 audit: `WDR/_All/Phase-08-Database-Auth-RBAC/TOPLINE-P8-001-R5-AUDIT_2026-09-11.md`
- R5 WDR (immutable, with R5 overclaims recorded in R6): `WDR/_All/Phase-08-Database-Auth-RBAC/TOPLINE-P8-001-R5_WDR_2026-09-11.md`
- Revised plan: `docs/PHASE-08-DATABASE-AUTH-RBAC-READINESS-PLAN.md`
- Canonical registry: `src/project/projectRegistry.ts` (R6 PASS, wdr-071 PASS, P8-001 / P8-001-R1 / P8-001-R2 / P8-001-R3 / P8-001-R4 / P8-001-R5 pmApproval BLOCKED, wdr-066 / wdr-067 / wdr-068 / wdr-069 / wdr-070 pmAudit BLOCKED, Phase 8 BLOCKED, currentTask null, lastCompletedTask `TOPLINE-P8-001-R6`, nextPlannedTask `TOPLINE-P8-002` proposed/unapproved)
- Reports: `AGENT_REPORTS/latest-status.md`, `AGENT_REPORTS/latest-wdr-summary.md`

## Block Status

- `TOPLINE-P8-001` through `TOPLINE-P8-001-R6` and `wdr-065` through `wdr-071` remain BLOCKED.
- Phase 8 remains BLOCKED. P8-002 is proposed but unapproved.
- P8-001-R6 STOPPED BEFORE `TOPLINE-P8-002` per #123.

## Required Corrective Task

`TOPLINE-P8-001-R7 - Phase 8 Evidence Status Reconciliation`

R7 is documentation/governance only. It must:

- Correct the R6 status evidence so `.claude/settings.local.json` is
  described as present and globally ignored, not ordinary untracked.
- Record the exact ignore/status evidence without editing the ignored file.
- Preserve all valid R6 package ownership and readiness-plan corrections.
- Re-run status, ignore, diff, build, lint, backend build, and backend test
  checks as applicable.
- Stop before P8-002 and do not install packages, change Prisma/schema or
  migrations, implement database/auth/RBAC/session/token/security behavior,
  touch secrets, or access `F:\OpenCode\shop.com`.

Until R7 is completed and PM-audited, no P8-002 prompt or implementation is
authorized.
