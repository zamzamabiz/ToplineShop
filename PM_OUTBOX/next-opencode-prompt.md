# Next OpenCode Execution Prompt

## PM/CTO Decision

**P8-001-R5 execution: PASS — PM audit pending**

R5 is a narrow documentation/governance correction only. It
does not authorize `TOPLINE-P8-002` or any database/auth/RBAC
implementation.

PM/CTO must audit the R5 WDR before any P8-002 prompt is
written or executed. Do not paste any P8-002 prompt into #MM
until the R5 audit passes (and only after the full P8-001 /
R1 / R2 / R3 / R4 / R5 corrective chain has been PM-audited
and PASSED).

## R5 Evidence

- R5 WDR: `WDR/_All/Phase-08-Database-Auth-RBAC/TOPLINE-P8-001-R5_WDR_2026-09-11.md`
- R5 implementation commit: `aaa32521d2dd36f520542666b3318486745a150e`
- R5 evidence-fill commit (Commit B): reported in #MM's final handoff
- R4 implementation commit: `5e2b799249cccc5b6d4f1e0b8f2d05d165152ba1`
- R4 evidence-fill commit: `038f47a147fb61c4675646383799dccf5678de4a`
- R4 PM audit commit: `0f3ea0903943dd8489b8619f0aad1f2c315b936d`
- R4 audit: `WDR/_All/Phase-08-Database-Auth-RBAC/TOPLINE-P8-001-R4-AUDIT_2026-09-11.md`
- R4 WDR (immutable, with R4 overclaims recorded in R5): `WDR/_All/Phase-08-Database-Auth-RBAC/TOPLINE-P8-001-R4_WDR_2026-09-11.md`
- Revised plan: `docs/PHASE-08-DATABASE-AUTH-RBAC-READINESS-PLAN.md`
- Canonical registry: `src/project/projectRegistry.ts` (R5 PASS, wdr-070 PASS, P8-001 / P8-001-R1 / P8-001-R2 / P8-001-R3 / P8-001-R4 pmApproval BLOCKED, wdr-066 / wdr-067 / wdr-068 / wdr-069 pmAudit BLOCKED, Phase 8 BLOCKED, currentTask null, lastCompletedTask `TOPLINE-P8-001-R5`, nextPlannedTask `TOPLINE-P8-002` proposed/unapproved)
- Reports: `AGENT_REPORTS/latest-status.md`, `AGENT_REPORTS/latest-wdr-summary.md`

## Block Status

- `TOPLINE-P8-001`, `TOPLINE-P8-001-R1`, `TOPLINE-P8-001-R2`, `TOPLINE-P8-001-R3`, `TOPLINE-P8-001-R4` and `wdr-065`, `wdr-066`, `wdr-067`, `wdr-068`, `wdr-069` remain BLOCKED.
- Phase 8 remains BLOCKED. P8-002 is proposed but unapproved.
- P8-001-R5 STOPPED BEFORE `TOPLINE-P8-002` per #123.

## Audit Required

PM/CTO must audit the R5 WDR against the actual repository.
After audit, PM may:

- **PASS** the R5 plan and write a separate, PM-approved prompt for `TOPLINE-P8-002` (only after the entire P8-001 / R1 / R2 / R3 / R4 / R5 chain has been PM-audited and PASSED).
- **BLOCK** with a corrective prompt that names the specific gap.
- **PASS with edits** by approving an edited plan in a follow-up WDR (which would itself be a `TOPLINE-P8-001-R6` corrective task).

Until that prompt is written and PM-approved, no Phase 8
implementation is authorized.
