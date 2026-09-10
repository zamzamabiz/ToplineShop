# Next OpenCode Execution Prompt

## PM/CTO Decision

**P8-001-R3 execution: PASS — PM audit pending**

R3 is a narrow documentation/governance correction only. It
does not authorize `TOPLINE-P8-002` or any database/auth/RBAC
implementation.

PM/CTO must audit the R3 WDR before any P8-002 prompt is
written or executed. Do not paste any P8-002 prompt into #MM
until the R3 audit passes (and only after the full P8-001 /
R1 / R2 / R3 corrective chain has been PM-audited and
PASSED).

## R3 Evidence

- R3 WDR: `WDR/_All/Phase-08-Database-Auth-RBAC/TOPLINE-P8-001-R3_WDR_2026-09-11.md`
- R3 implementation commit: `PENDING_UNTIL_COMMIT` (replaced with real hash in evidence-fill commit; the real full 40-character Commit A hash is reported in #MM's final handoff and resolved in Git by Commit B)
- R3 evidence-fill commit (Commit B): reported in #MM's final handoff
- R2 implementation commit: `1789cef06978109fef92043668a7e36e62674f5f`
- R2 evidence-fill commit: `34581637b992ff4f6c9c81a7b9c53e304597d63d`
- R2 PM audit commit: `37f85ffca7186d60b992bac4d9c53c6866711ebf`
- R2 audit: `WDR/_All/Phase-08-Database-Auth-RBAC/TOPLINE-P8-001-R2-AUDIT_2026-09-11.md`
- R2 WDR (immutable, with R2 overstatements recorded in R3): `WDR/_All/Phase-08-Database-Auth-RBAC/TOPLINE-P8-001-R2_WDR_2026-09-11.md`
- Revised plan: `docs/PHASE-08-DATABASE-AUTH-RBAC-READINESS-PLAN.md`
- Canonical registry: `src/project/projectRegistry.ts` (R3 PASS, wdr-068 PASS, P8-001 / P8-001-R1 / P8-001-R2 pmApproval BLOCKED, wdr-066 / wdr-067 pmAudit BLOCKED, Phase 8 BLOCKED, currentTask null, lastCompletedTask `TOPLINE-P8-001-R3`, nextPlannedTask `TOPLINE-P8-002` proposed/unapproved)
- Reports: `AGENT_REPORTS/latest-status.md`, `AGENT_REPORTS/latest-wdr-summary.md`

## Block Status

- `TOPLINE-P8-001`, `TOPLINE-P8-001-R1`, `TOPLINE-P8-001-R2` and `wdr-065`, `wdr-066`, `wdr-067` remain BLOCKED.
- Phase 8 remains BLOCKED. P8-002 is proposed but unapproved.
- P8-001-R3 STOPPED BEFORE `TOPLINE-P8-002` per #123.

## Audit Required

PM/CTO must audit the R3 WDR against the actual repository.
After audit, PM may:

- **PASS** the R3 plan and write a separate, PM-approved prompt for `TOPLINE-P8-002` (only after the entire P8-001 / R1 / R2 / R3 chain has been PM-audited and PASSED).
- **BLOCK** with a corrective prompt that names the specific gap.
- **PASS with edits** by approving an edited plan in a follow-up WDR (which would itself be a `TOPLINE-P8-001-R4` corrective task).

Until that prompt is written and PM-approved, no Phase 8
implementation is authorized.
