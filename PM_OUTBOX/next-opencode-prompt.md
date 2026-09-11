# Next OpenCode Execution Prompt

## PM/CTO Decision

**TOPLINE-P8-001-R9 execution: PASS — PM audit PLANNED**

R9 corrected the two R8 PM audit findings: the R8 Commit B hash
`d876589d4c8691534999f3692e859325f8b77d88` is now recorded in
the R8 WDR Git Evidence section, and the R8 WDR OBJECTIVE section
now explicitly names the narrow R7 WDR Git Evidence exception.
No P8-002 implementation is authorized.

R8 PM audit remains BLOCKED. Do not paste any P8-002 prompt into #MM.

## R9 Evidence

- R9 WDR: `WDR/_All/Phase-08-Database-Auth-RBAC/TOPLINE-P8-001-R9_WDR_2026-09-11.md`
- R9 audit: `WDR/_All/Phase-08-Database-Auth-RBAC/TOPLINE-P8-001-R9-AUDIT_2026-09-11.md` (not yet written; PM audit pending)
- R9 PM audit commit: PLANNED (pending)
- R9 implementation commit (Commit A): `<R9_COMMIT_A_HASH>`
- R9 evidence-fill commit (Commit B): `<R9_COMMIT_B_HASH>`
- R8 WDR (Git Evidence section + scope wording corrected by R9): `WDR/_All/Phase-08-Database-Auth-RBAC/TOPLINE-P8-001-R8_WDR_2026-09-11.md`
- R8 audit (immutable): `WDR/_All/Phase-08-Database-Auth-RBAC/TOPLINE-P8-001-R8-AUDIT_2026-09-11.md`
- R8 PM audit commit: `0ed7d95461b84c4b54a0709d261688354efed2c0`
- R8 implementation commit (R8 Commit A): `8457d2ce321722505595fcaddd09858b8a0768c4`
- R8 evidence-fill commit (R8 Commit B): `d876589d4c8691534999f3692e859325f8b77d88` (now recorded in the R8 WDR Git Evidence section, the latest status, the latest WDR summary, and this PM outbox)
- R7 WDR (immutable, Git Evidence section only was updated by R8 — not further edited by R9): `WDR/_All/Phase-08-Database-Auth-RBAC/TOPLINE-P8-001-R7_WDR_2026-09-11.md`
- R7 audit: `WDR/_All/Phase-08-Database-Auth-RBAC/TOPLINE-P8-001-R7-AUDIT_2026-09-11.md`
- R7 PM audit commit: `5a7b67b331b8cfa0f4cdf44aa6256bed46b15965`
- R7 implementation commit: `b9bfa2bcec283815ead71d9d2fd7ce0e39943306`
- R7 evidence-fill commit (Commit B): `760f61304b05cd9ce992a9e35ed21abce451e931`
- R6 implementation commit: `1f6c3f9f56fc6bfb91cde9564706e0e35808a0cb`
- R6 evidence-fill commit: `ab864dc073b244bc24415bb67f8777ceb7504662`
- R6 PM audit commit: `b2456c2d15388ffe1beb7958f41da21a40bbd604`
- R6 audit: `WDR/_All/Phase-08-Database-Auth-RBAC/TOPLINE-P8-001-R6-AUDIT_2026-09-11.md`
- R6 WDR (immutable, R6 status-evidence correction recorded in R7): `WDR/_All/Phase-08-Database-Auth-RBAC/TOPLINE-P8-001-R6_WDR_2026-09-11.md`
- R6 plan: `docs/PHASE-08-DATABASE-AUTH-RBAC-READINESS-PLAN.md` (preserved byte-for-byte by R7, R8, and R9)
- Canonical registry: `src/project/projectRegistry.ts` (R9 execution PASS with pmApproval PLANNED, wdr-074 PLANNED, P8-001 through R8 pmApproval BLOCKED, wdr-065 through wdr-073 pmAudit BLOCKED, Phase 8 BLOCKED, currentTask null, lastCompletedTask `TOPLINE-P8-001-R9`, nextPlannedTask `TOPLINE-P8-002`)
- Reports: `AGENT_REPORTS/latest-status.md`, `AGENT_REPORTS/latest-wdr-summary.md`

## Block Status

- `TOPLINE-P8-001`, `TOPLINE-P8-001-R1`, `TOPLINE-P8-001-R2`, `TOPLINE-P8-001-R3`, `TOPLINE-P8-001-R4`, `TOPLINE-P8-001-R5`, `TOPLINE-P8-001-R6`, `TOPLINE-P8-001-R7`, `TOPLINE-P8-001-R8` and `wdr-065`, `wdr-066`, `wdr-067`, `wdr-068`, `wdr-069`, `wdr-070`, **`wdr-071`**, `wdr-072`, `wdr-073` remain BLOCKED.
- Phase 8 remains BLOCKED. P8-002 is proposed, unregistered, and unapproved.
- P8-001-R9 STOPPED BEFORE `TOPLINE-P8-002` per #123.

## Required Corrective Task (if R9 PM audit BLOCKED)

`TOPLINE-P8-001-R10 - Phase 8 R9 Evidence-Fill and <next-gap> Reconciliation`

R10 would be documentation/governance only (only if R9 PM audit BLOCKED). It would:
- Fill the real R9 evidence-fill hash into the R9 WDR Git Evidence section, both latest reports, the PM outbox, and the canonical registry where applicable.
- Address any new R9 audit findings explicitly.
- Preserve the valid R9 R8-evidence-fill and R8-scope-wording corrections.
- Preserve the Phase 8 readiness plan byte-for-byte.
- Re-run status, diff, build, lint, backend build, and backend test checks.
- Stop before P8-002. Do not install packages, change Prisma/schema or migrations, implement database/auth/RBAC/session/token/security behavior, touch secrets, or access `F:\OpenCode\shop.com`.

## Or: PM-Approved Implementation Task (if R9 PM audit PASSED)

`TOPLINE-P8-002 - Phase 8 Authentication Persistence (schema/migration-only, additive, no packages, no auth behavior)`

PM would write the full P8-002 prompt separately. P8-002 is **proposed but unregistered and unapproved** in `src/project/projectRegistry.ts`. R9 ends at the VERIFY/AUDIT stage and does not start, authorize, or prepare any P8-002 implementation.

Until PM writes the next PM-approved prompt, no Phase 8 implementation is authorized.
