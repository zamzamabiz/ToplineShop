# Next OpenCode Execution Prompt

## PM/CTO Decision

**P8-001-R8 execution: PASS — PM audit pending**

R8 corrected the two R7 PM audit findings. R8 is
documentation/governance only. It does not authorize
`TOPLINE-P8-002` or any database/auth/RBAC implementation.

PM/CTO must audit the R8 WDR before any P8-002 prompt is
written or executed. Do not paste any P8-002 prompt into
#MM until the R8 audit passes (and only after the full
P8-001 / R1 / R2 / R3 / R4 / R5 / R6 / R7 / R8 corrective
chain has been PM-audited and PASSED).

## R8 Evidence

- R8 WDR: `WDR/_All/Phase-08-Database-Auth-RBAC/TOPLINE-P8-001-R8_WDR_2026-09-11.md`
- R8 implementation commit: `8457d2ce321722505595fcaddd09858b8a0768c4`
- R8 evidence-fill commit (Commit B): reported in #MM's final handoff
- R7 WDR (Git Evidence section updated by R8): `WDR/_All/Phase-08-Database-Auth-RBAC/TOPLINE-P8-001-R7_WDR_2026-09-11.md`
- R7 audit: `WDR/_All/Phase-08-Database-Auth-RBAC/TOPLINE-P8-001-R7-AUDIT_2026-09-11.md`
- R7 PM audit commit: `5a7b67b331b8cfa0f4cdf44aa6256bed46b15965`
- R7 implementation commit: `b9bfa2bcec283815ead71d9d2fd7ce0e39943306`
- R7 evidence-fill commit (Commit B): `760f61304b05cd9ce992a9e35ed21abce451e931` (now recorded in the R7 WDR Git Evidence section, the latest status, the latest WDR summary, and this PM outbox)
- R6 implementation commit: `1f6c3f9f56fc6bfb91cde9564706e0e35808a0cb`
- R6 evidence-fill commit: `ab864dc073b244bc24415bb67f8777ceb7504662`
- R6 PM audit commit: `b2456c2d15388ffe1beb7958f41da21a40bbd604`
- R6 audit: `WDR/_All/Phase-08-Database-Auth-RBAC/TOPLINE-P8-001-R6-AUDIT_2026-09-11.md`
- R6 WDR (immutable, R6 status-evidence correction recorded in R7): `WDR/_All/Phase-08-Database-Auth-RBAC/TOPLINE-P8-001-R6_WDR_2026-09-11.md`
- R6 plan: `docs/PHASE-08-DATABASE-AUTH-RBAC-READINESS-PLAN.md` (preserved byte-for-byte by R7 and R8)
- Canonical registry: `src/project/projectRegistry.ts` (R8 execution PASS with pmApproval PLANNED, wdr-073 PLANNED, P8-001 through R7 pmApproval BLOCKED, wdr-065 through wdr-072 pmAudit BLOCKED, Phase 8 BLOCKED, currentTask null, lastCompletedTask `TOPLINE-P8-001-R8`, nextPlannedTask `TOPLINE-P8-002` proposed/unregistered/unapproved)
- Reports: `AGENT_REPORTS/latest-status.md`, `AGENT_REPORTS/latest-wdr-summary.md`

## Block Status

- `TOPLINE-P8-001`, `TOPLINE-P8-001-R1`, `TOPLINE-P8-001-R2`, `TOPLINE-P8-001-R3`, `TOPLINE-P8-001-R4`, `TOPLINE-P8-001-R5`, `TOPLINE-P8-001-R6`, `TOPLINE-P8-001-R7` and `wdr-065`, `wdr-066`, `wdr-067`, `wdr-068`, `wdr-069`, `wdr-070`, **`wdr-071`**, `wdr-072` remain BLOCKED.
- Phase 8 remains BLOCKED. P8-002 is proposed, unregistered, and unapproved.
- P8-001-R8 STOPPED BEFORE `TOPLINE-P8-002` per #123.

## Audit Required

PM/CTO must audit the R8 WDR against the actual repository.
After audit, PM may:

- **PASS** the R8 evidence fill and WDR state reconciliation and write a separate, PM-approved prompt for `TOPLINE-P8-002` (only after the entire P8-001 / R1 / R2 / R3 / R4 / R5 / R6 / R7 / R8 chain has been PM-audited and PASSED).
- **BLOCK** with a corrective prompt that names the specific gap.
- **PASS with edits** by approving an edited report in a follow-up WDR (which would itself be a `TOPLINE-P8-001-R9` corrective task).

Until that prompt is written and PM-approved, no Phase 8
implementation is authorized.
