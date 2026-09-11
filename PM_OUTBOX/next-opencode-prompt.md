# Next OpenCode Execution Prompt

## PM/CTO Decision

**TOPLINE-P8-001-R13 execution: PASS — PM audit PLANNED**

R13 closed the R12 PM audit finding: the R12 Commit B hash
`a92659bfe0d96930fe33878a6a178bfc016c8a10` is now recorded in
the R12 WDR GIT EVIDENCE section (the `<R12_COMMIT_B_HASH>`
placeholder has been replaced); the registry `git.lastCommit`
is updated to R13 Commit A (the R12 PM-audit hash is replaced);
the R12 task `commitHash` and `wdr-077.commitHash` correctly
remain on R12 Commit A `330e61087ae972c2440f2ac2ea12ea4c627fad8d`
per the R13 instruction "Preserve these task and WDR Commit A
fields exactly". No P8-002 implementation is authorized.

R12 PM audit remains BLOCKED. Do not paste any P8-002 prompt into #MM.

## R13 Evidence

- R13 WDR: `WDR/_All/Phase-08-Database-Auth-RBAC/TOPLINE-P8-001-R13_WDR_2026-09-11.md`
- R13 audit: `WDR/_All/Phase-08-Database-Auth-RBAC/TOPLINE-P8-001-R13-AUDIT_2026-09-11.md` (not yet written; PM audit pending)
- R13 PM audit commit: PLANNED (pending)
- R13 implementation commit (Commit A): `a0f3318967fb931adb8463844c3165bf2d0ed778`
- R13 evidence-fill commit (Commit B): `<R13_COMMIT_B_HASH>`
- R12 WDR (GIT EVIDENCE section corrected by R13): `WDR/_All/Phase-08-Database-Auth-RBAC/TOPLINE-P8-001-R12_WDR_2026-09-11.md`
- R12 audit (immutable): `WDR/_All/Phase-08-Database-Auth-RBAC/TOPLINE-P8-001-R12-AUDIT_2026-09-11.md`
- R12 PM-audit Commit A: `5d502fc7ca8a88e5a62d60c8db9824d57720c153`
- R12 implementation commit (R12 Commit A): `330e61087ae972c2440f2ac2ea12ea4c627fad8d` (preserved — NOT replaced with R12 Commit B)
- R12 evidence-fill commit (R12 Commit B): `a92659bfe0d96930fe33878a6a178bfc016c8a10` (now recorded in the R12 WDR Git Evidence section, the latest status, the latest WDR summary, and this PM outbox)
- R11 WDR (immutable; GIT EVIDENCE section only was corrected by R12 — not further edited by R13): `WDR/_All/Phase-08-Database-Auth-RBAC/TOPLINE-P8-001-R11_WDR_2026-09-11.md`
- R11 audit (immutable): `WDR/_All/Phase-08-Database-Auth-RBAC/TOPLINE-P8-001-R11-AUDIT_2026-09-11.md`
- R11 evidence-fill commit (R11 Commit B): `c602d3ab030213b1894c8549ee705beaeb283979`
- R10 evidence-fill commit (R10 Commit B): `90f87ede6727154e25a27ade64d93be9b80141f`
- R9 evidence-fill commit (R9 Commit B): `17655b7b6e168fb617ac3af3e80c46c2e0abfc2f`
- R8 evidence-fill commit (R8 Commit B): `d876589d4c8691534999f3692e859325f8b77d88`
- R6 plan: `docs/PHASE-08-DATABASE-AUTH-RBAC-READINESS-PLAN.md` (preserved byte-for-byte by R12 and R13)
- Canonical registry: `src/project/projectRegistry.ts` (R13 execution PASS with pmApproval PLANNED, wdr-078 PLANNED, P8-001 through R12 pmApproval BLOCKED, wdr-065 through wdr-077 pmAudit BLOCKED, Phase 8 BLOCKED, currentTask null, lastCompletedTask `TOPLINE-P8-001-R13`, nextPlannedTask `TOPLINE-P8-002` as non-authorizing placeholder)
- Reports: `AGENT_REPORTS/latest-status.md`, `AGENT_REPORTS/latest-wdr-summary.md`

## Block Status

- `TOPLINE-P8-001`, `TOPLINE-P8-001-R1`, `TOPLINE-P8-001-R2`, `TOPLINE-P8-001-R3`, `TOPLINE-P8-001-R4`, `TOPLINE-P8-001-R5`, `TOPLINE-P8-001-R6`, `TOPLINE-P8-001-R7`, `TOPLINE-P8-001-R8`, `TOPLINE-P8-001-R9`, `TOPLINE-P8-001-R10`, `TOPLINE-P8-001-R11`, `TOPLINE-P8-001-R12` and `wdr-065`, `wdr-066`, `wdr-067`, `wdr-068`, `wdr-069`, `wdr-070`, **`wdr-071`**, `wdr-072`, `wdr-073`, `wdr-074`, `wdr-075`, `wdr-076`, `wdr-077` remain BLOCKED.
- Phase 8 remains BLOCKED. P8-002 is proposed, unregistered, and unapproved.
- P8-001-R13 STOPPED BEFORE `TOPLINE-P8-002` per #123.

## Required Corrective Task (if R13 PM audit BLOCKED)

`TOPLINE-P8-001-R14 - Phase 8 R13 Evidence-Fill and <next-gap> Reconciliation`

R14 would be documentation/governance only (only if R13 PM audit BLOCKED). It would:
- Fill the real R13 evidence-fill hash into the R13 WDR Git Evidence section, both latest reports, the PM outbox, and the canonical registry where applicable.
- Address any new R13 audit findings explicitly.
- Preserve the valid R13 R12-evidence-fill correction.
- Preserve the Phase 8 readiness plan byte-for-byte.
- Re-run status, diff, build, lint, backend build, and backend test checks.
- Stop before P8-002. Do not install packages, change Prisma/schema or migrations, implement database/auth/RBAC/session/token/security behavior, touch secrets, or access `F:\OpenCode\shop.com`.

## Or: PM-Approved Implementation Task (if R13 PM audit PASSED)

`TOPLINE-P8-002 - Phase 8 Authentication Persistence (schema/migration-only, additive, no packages, no auth behavior)`

PM would write the full P8-002 prompt separately. P8-002 is **proposed but unregistered and unapproved** in `src/project/projectRegistry.ts`. R13 ends at the VERIFY/AUDIT stage and does not start, authorize, or prepare any P8-002 implementation.

Until PM writes the next PM-approved prompt, no Phase 8 implementation is authorized.
