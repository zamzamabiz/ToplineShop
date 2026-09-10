# Next OpenCode Execution Prompt

## PM/CTO Decision

**P8-001-R1 execution: PASS — PM audit pending**

R1 is a planning/governance correction only. It does not authorize
`TOPLINE-P8-002` or any database/auth/RBAC implementation.

PM/CTO must audit the R1 WDR before any P8-002 prompt is written or
executed. Do not paste any P8-002 prompt into #MM until the R1 audit
passes.

## R1 Evidence

- R1 WDR: `WDR/_All/Phase-08-Database-Auth-RBAC/TOPLINE-P8-001-R1_WDR_2026-09-10.md`
- R1 implementation commit: `42cc6ac63e375a1adb82f692f3885fd8b29a55ad`
- R1 evidence-fill commit (Commit B): reported in #MM's final handoff
- Revised plan: `docs/PHASE-08-DATABASE-AUTH-RBAC-READINESS-PLAN.md`
- Canonical registry: `src/project/projectRegistry.ts` (P8-001-R1 PASS, wdr-066 PASS, Phase 8 BLOCKED, currentTask null, lastCompletedTask `TOPLINE-P8-001-R1`, nextPlannedTask `TOPLINE-P8-002` proposed/unapproved)
- Reports: `AGENT_REPORTS/latest-status.md`, `AGENT_REPORTS/latest-wdr-summary.md`

## Block Status

- `TOPLINE-P8-001` and `wdr-065` remain BLOCKED until P8-001-R1 audit passes.
- Phase 8 remains BLOCKED. P8-002 is proposed but unapproved.
- P8-001-R1 STOPPED BEFORE `TOPLINE-P8-002` per #123.

## Audit Required

PM/CTO must audit the R1 WDR against the actual repository. After
audit, PM may:

- **PASS** the R1 plan and write a separate, PM-approved prompt for `TOPLINE-P8-002`.
- **BLOCK** with a corrective prompt that names the specific gap.
- **PASS with edits** by approving an edited plan in a follow-up WDR (which would itself be a P8-001-R2 corrective task).

Until that prompt is written and PM-approved, no Phase 8
implementation is authorized.
