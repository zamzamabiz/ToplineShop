# Next OpenCode Execution Prompt

## PM/CTO Decision

**P8-001-R2 execution: PASS — PM audit pending**

R2 is a narrow documentation/governance correction only. It does
not authorize `TOPLINE-P8-002` or any database/auth/RBAC
implementation.

PM/CTO must audit the R2 WDR before any P8-002 prompt is written or
executed. Do not paste any P8-002 prompt into #MM until the R2 audit
passes.

## R2 Evidence

- R2 WDR: `WDR/_All/Phase-08-Database-Auth-RBAC/TOPLINE-P8-001-R2_WDR_2026-09-11.md`
- R2 implementation commit: `PENDING_UNTIL_COMMIT` (replaced with real hash in evidence-fill commit; the real full 40-character Commit A hash is reported in #MM's final handoff and resolved in Git by Commit B)
- R2 evidence-fill commit (Commit B): reported in #MM's final handoff
- R1 implementation commit: `42cc6ac63e375a1adb82f692f3885fd8b29a55ad`
- R1 evidence-fill commit: `343798502c41cf51a05748371b8fc1b4336d9bfd`
- R1 PM audit commit: `f2269d1ea5399bbbc9f0d229c733007b85928c97`
- R1 audit: `WDR/_All/Phase-08-Database-Auth-RBAC/TOPLINE-P8-001-R1-AUDIT_2026-09-11.md`
- R1 WDR (immutable, with recorded inaccuracies): `WDR/_All/Phase-08-Database-Auth-RBAC/TOPLINE-P8-001-R1_WDR_2026-09-10.md`
- Revised plan: `docs/PHASE-08-DATABASE-AUTH-RBAC-READINESS-PLAN.md`
- Canonical registry: `src/project/projectRegistry.ts` (R2 PASS, wdr-067 PASS, P8-001-R1 pmApproval BLOCKED, wdr-066 pmAudit BLOCKED, Phase 8 BLOCKED, currentTask null, lastCompletedTask `TOPLINE-P8-001-R2`, nextPlannedTask `TOPLINE-P8-002` proposed/unapproved)
- Reports: `AGENT_REPORTS/latest-status.md`, `AGENT_REPORTS/latest-wdr-summary.md`

## Block Status

- `TOPLINE-P8-001` and `wdr-065` remain BLOCKED.
- `TOPLINE-P8-001-R1` and `wdr-066` remain BLOCKED.
- Phase 8 remains BLOCKED. P8-002 is proposed but unapproved.
- P8-001-R2 STOPPED BEFORE `TOPLINE-P8-002` per #123.

## Audit Required

PM/CTO must audit the R2 WDR against the actual repository. After
audit, PM may:

- **PASS** the R2 plan and write a separate, PM-approved prompt for `TOPLINE-P8-002`.
- **BLOCK** with a corrective prompt that names the specific gap.
- **PASS with edits** by approving an edited plan in a follow-up WDR (which would itself be a `TOPLINE-P8-001-R3` corrective task).

Until that prompt is written and PM-approved, no Phase 8
implementation is authorized.
