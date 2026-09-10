# Next OpenCode Execution Prompt

## PM/CTO Decision

**P8-001-R6 execution: PASS — PM audit pending**

R6 is a narrow documentation/governance correction only. It
does not authorize `TOPLINE-P8-002` or any database/auth/RBAC
implementation.

PM/CTO must audit the R6 WDR before any P8-002 prompt is
written or executed. Do not paste any P8-002 prompt into #MM
until the R6 audit passes (and only after the full P8-001 /
R1 / R2 / R3 / R4 / R5 / R6 corrective chain has been
PM-audited and PASSED).

## R6 Evidence

- R6 WDR: `WDR/_All/Phase-08-Database-Auth-RBAC/TOPLINE-P8-001-R6_WDR_2026-09-11.md`
- R6 implementation commit: `PENDING_UNTIL_COMMIT` (replaced with real hash in evidence-fill commit; the real full 40-character Commit A hash is reported in #MM's final handoff and resolved in Git by Commit B)
- R6 evidence-fill commit (Commit B): reported in #MM's final handoff
- R5 implementation commit: `aaa32521d2dd36f520542666b3318486745a150e`
- R5 evidence-fill commit: `9aa86e491486e192378b8ff3856126c5b0b8144b`
- R5 PM audit commit: `5793f29b937197bbf1223185444e28c8b76658c5`
- R5 audit: `WDR/_All/Phase-08-Database-Auth-RBAC/TOPLINE-P8-001-R5-AUDIT_2026-09-11.md`
- R5 WDR (immutable, with R5 overclaims recorded in R6): `WDR/_All/Phase-08-Database-Auth-RBAC/TOPLINE-P8-001-R5_WDR_2026-09-11.md`
- Revised plan: `docs/PHASE-08-DATABASE-AUTH-RBAC-READINESS-PLAN.md`
- Canonical registry: `src/project/projectRegistry.ts` (R6 PASS, wdr-071 PASS, P8-001 / P8-001-R1 / P8-001-R2 / P8-001-R3 / P8-001-R4 / P8-001-R5 pmApproval BLOCKED, wdr-066 / wdr-067 / wdr-068 / wdr-069 / wdr-070 pmAudit BLOCKED, Phase 8 BLOCKED, currentTask null, lastCompletedTask `TOPLINE-P8-001-R6`, nextPlannedTask `TOPLINE-P8-002` proposed/unapproved)
- Reports: `AGENT_REPORTS/latest-status.md`, `AGENT_REPORTS/latest-wdr-summary.md`

## Block Status

- `TOPLINE-P8-001`, `TOPLINE-P8-001-R1`, `TOPLINE-P8-001-R2`, `TOPLINE-P8-001-R3`, `TOPLINE-P8-001-R4`, `TOPLINE-P8-001-R5` and `wdr-065`, `wdr-066`, `wdr-067`, `wdr-068`, `wdr-069`, `wdr-070` remain BLOCKED.
- Phase 8 remains BLOCKED. P8-002 is proposed but unapproved.
- P8-001-R6 STOPPED BEFORE `TOPLINE-P8-002` per #123.

## Audit Required

PM/CTO must audit the R6 WDR against the actual repository.
After audit, PM may:

- **PASS** the R6 plan and write a separate, PM-approved prompt for `TOPLINE-P8-002` (only after the entire P8-001 / R1 / R2 / R3 / R4 / R5 / R6 chain has been PM-audited and PASSED).
- **BLOCK** with a corrective prompt that names the specific gap.
- **PASS with edits** by approving an edited plan in a follow-up WDR (which would itself be a `TOPLINE-P8-001-R7` corrective task).

Until that prompt is written and PM-approved, no Phase 8
implementation is authorized.
