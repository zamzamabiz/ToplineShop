# Next OpenCode Execution Prompt

## PM/CTO Decision

**P8-001-R4 execution: PASS — PM audit pending**

R4 is a narrow documentation/governance correction only. It
does not authorize `TOPLINE-P8-002` or any database/auth/RBAC
implementation.

PM/CTO must audit the R4 WDR before any P8-002 prompt is
written or executed. Do not paste any P8-002 prompt into #MM
until the R4 audit passes (and only after the full P8-001 /
R1 / R2 / R3 / R4 corrective chain has been PM-audited and
PASSED).

## R4 Evidence

- R4 WDR: `WDR/_All/Phase-08-Database-Auth-RBAC/TOPLINE-P8-001-R4_WDR_2026-09-11.md`
- R4 implementation commit: `5e2b799249cccc5b6d4f1e0b8f2d05d165152ba1`
- R4 evidence-fill commit (Commit B): reported in #MM's final handoff
- R3 implementation commit: `fb1d3e2b64961286390b138123adfc3e5bc3d815`
- R3 evidence-fill commit: `1c9e886529d9fba34e95bca0f84c552ebb0019f9`
- R3 PM audit commit: `b43a5114e2f8845e55e28f64cd987b4e4e9a80ce`
- R3 audit: `WDR/_All/Phase-08-Database-Auth-RBAC/TOPLINE-P8-001-R3-AUDIT_2026-09-11.md`
- R3 WDR (immutable, with R3 overstatements recorded in R4): `WDR/_All/Phase-08-Database-Auth-RBAC/TOPLINE-P8-001-R3_WDR_2026-09-11.md`
- Revised plan: `docs/PHASE-08-DATABASE-AUTH-RBAC-READINESS-PLAN.md`
- Canonical registry: `src/project/projectRegistry.ts` (R4 PASS, wdr-069 PASS, P8-001 / P8-001-R1 / P8-001-R2 / P8-001-R3 pmApproval BLOCKED, wdr-066 / wdr-067 / wdr-068 pmAudit BLOCKED, Phase 8 BLOCKED, currentTask null, lastCompletedTask `TOPLINE-P8-001-R4`, nextPlannedTask `TOPLINE-P8-002` proposed/unapproved)
- Reports: `AGENT_REPORTS/latest-status.md`, `AGENT_REPORTS/latest-wdr-summary.md`

## Block Status

- `TOPLINE-P8-001`, `TOPLINE-P8-001-R1`, `TOPLINE-P8-001-R2`, `TOPLINE-P8-001-R3` and `wdr-065`, `wdr-066`, `wdr-067`, `wdr-068` remain BLOCKED.
- Phase 8 remains BLOCKED. P8-002 is proposed but unapproved.
- P8-001-R4 STOPPED BEFORE `TOPLINE-P8-002` per #123.

## Audit Required

PM/CTO must audit the R4 WDR against the actual repository.
After audit, PM may:

- **PASS** the R4 plan and write a separate, PM-approved prompt for `TOPLINE-P8-002` (only after the entire P8-001 / R1 / R2 / R3 / R4 chain has been PM-audited and PASSED).
- **BLOCK** with a corrective prompt that names the specific gap.
- **PASS with edits** by approving an edited plan in a follow-up WDR (which would itself be a `TOPLINE-P8-001-R5` corrective task).

Until that prompt is written and PM-approved, no Phase 8
implementation is authorized.
