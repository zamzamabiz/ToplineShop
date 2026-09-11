# Next OpenCode Execution Prompt

## PM/CTO Decision

**TOPLINE-P8-001-R11 execution: PASS — PM audit PLANNED**

R11 corrected the R10 PM audit finding: the R10 Commit B hash
`90f87ede6727154e25a27ade64d93be9b80141f` is now recorded in
the R10 WDR GIT EVIDENCE section (the `<R10_COMMIT_B_HASH>`
placeholder has been replaced). No P8-002 implementation is
authorized.

R10 PM audit remains BLOCKED. Do not paste any P8-002 prompt into #MM.

## R11 Evidence

- R11 WDR: `WDR/_All/Phase-08-Database-Auth-RBAC/TOPLINE-P8-001-R11_WDR_2026-09-11.md`
- R11 audit: `WDR/_All/Phase-08-Database-Auth-RBAC/TOPLINE-P8-001-R11-AUDIT_2026-09-11.md` (not yet written; PM audit pending)
- R11 PM audit commit: PLANNED (pending)
- R11 implementation commit (Commit A): `b8d25fe1c078267c76ed2f54a094e93fcc2a3719`
- R11 evidence-fill commit (Commit B): `<R11_COMMIT_B_HASH>`
- R10 WDR (GIT EVIDENCE section corrected by R11): `WDR/_All/Phase-08-Database-Auth-RBAC/TOPLINE-P8-001-R10_WDR_2026-09-11.md`
- R10 audit (immutable): `WDR/_All/Phase-08-Database-Auth-RBAC/TOPLINE-P8-001-R10-AUDIT_2026-09-11.md`
- R10 PM-audit commit: `0f1401d6884d194d4d0d035167ca21c44ff26160`
- R10 implementation commit (R10 Commit A): `980d7513ab78fd2baf7c18065198a2e02d926ae8` (preserved — NOT replaced with R10 Commit B)
- R10 evidence-fill commit (R10 Commit B): `90f87ede6727154e25a27ade64d93be9b80141f` (now recorded in the R10 WDR Git Evidence section, the latest status, the latest WDR summary, and this PM outbox)
- R9 WDR (immutable; Git Evidence + 2 status rows were corrected by R10 — not further edited by R11): `WDR/_All/Phase-08-Database-Auth-RBAC/TOPLINE-P8-001-R9_WDR_2026-09-11.md`
- R9 audit (immutable): `WDR/_All/Phase-08-Database-Auth-RBAC/TOPLINE-P8-001-R9-AUDIT_2026-09-11.md`
- R9 PM audit commit: `55fd9bfafac684aacbc24c4eed4e94cb73c86778`
- R9 implementation commit (R9 Commit A): `2b1082d3058132198a605ffd8674aa46a106351f`
- R9 evidence-fill commit (R9 Commit B): `17655b7b6e168fb617ac3af3e80c46c2e0abfc2f`
- R8 evidence-fill commit (R8 Commit B): `d876589d4c8691534999f3692e859325f8b77d88`
- R6 plan: `docs/PHASE-08-DATABASE-AUTH-RBAC-READINESS-PLAN.md` (preserved byte-for-byte by R10 and R11)
- Canonical registry: `src/project/projectRegistry.ts` (R11 execution PASS with pmApproval PLANNED, wdr-076 PLANNED, P8-001 through R10 pmApproval BLOCKED, wdr-065 through wdr-075 pmAudit BLOCKED, Phase 8 BLOCKED, currentTask null, lastCompletedTask `TOPLINE-P8-001-R11`, nextPlannedTask `TOPLINE-P8-002` as non-authorizing placeholder)
- Reports: `AGENT_REPORTS/latest-status.md`, `AGENT_REPORTS/latest-wdr-summary.md`

## Block Status

- `TOPLINE-P8-001`, `TOPLINE-P8-001-R1`, `TOPLINE-P8-001-R2`, `TOPLINE-P8-001-R3`, `TOPLINE-P8-001-R4`, `TOPLINE-P8-001-R5`, `TOPLINE-P8-001-R6`, `TOPLINE-P8-001-R7`, `TOPLINE-P8-001-R8`, `TOPLINE-P8-001-R9`, `TOPLINE-P8-001-R10` and `wdr-065`, `wdr-066`, `wdr-067`, `wdr-068`, `wdr-069`, `wdr-070`, **`wdr-071`**, `wdr-072`, `wdr-073`, `wdr-074`, `wdr-075` remain BLOCKED.
- Phase 8 remains BLOCKED. P8-002 is proposed, unregistered, and unapproved.
- P8-001-R11 STOPPED BEFORE `TOPLINE-P8-002` per #123.

## Required Corrective Task (if R11 PM audit BLOCKED)

`TOPLINE-P8-001-R12 - Phase 8 R11 Evidence-Fill and <next-gap> Reconciliation`

R12 would be documentation/governance only (only if R11 PM audit BLOCKED). It would:
- Fill the real R11 evidence-fill hash into the R11 WDR Git Evidence section, both latest reports, the PM outbox, and the canonical registry where applicable.
- Address any new R11 audit findings explicitly.
- Preserve the valid R11 R10-evidence-fill correction.
- Preserve the Phase 8 readiness plan byte-for-byte.
- Re-run status, diff, build, lint, backend build, and backend test checks.
- Stop before P8-002. Do not install packages, change Prisma/schema or migrations, implement database/auth/RBAC/session/token/security behavior, touch secrets, or access `F:\OpenCode\shop.com`.

## Or: PM-Approved Implementation Task (if R11 PM audit PASSED)

`TOPLINE-P8-002 - Phase 8 Authentication Persistence (schema/migration-only, additive, no packages, no auth behavior)`

PM would write the full P8-002 prompt separately. P8-002 is **proposed but unregistered and unapproved** in `src/project/projectRegistry.ts`. R11 ends at the VERIFY/AUDIT stage and does not start, authorize, or prepare any P8-002 implementation.

Until PM writes the next PM-approved prompt, no Phase 8 implementation is authorized.
