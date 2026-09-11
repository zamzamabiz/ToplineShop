# Next OpenCode Execution Prompt

## PM/CTO Decision

**TOPLINE-P8-001-R12 execution: PASS — PM audit PLANNED**

R12 corrected the R11 PM audit finding: the R11 Commit B hash
`c602d3ab030213b1894c8549ee705beaeb283979` is now recorded in
the R11 WDR GIT EVIDENCE section (the `<R11_COMMIT_B_HASH>`
placeholder has been replaced). No P8-002 implementation is
authorized.

R11 PM audit remains BLOCKED. Do not paste any P8-002 prompt into #MM.

## R12 Evidence

- R12 WDR: `WDR/_All/Phase-08-Database-Auth-RBAC/TOPLINE-P8-001-R12_WDR_2026-09-11.md`
- R12 audit: `WDR/_All/Phase-08-Database-Auth-RBAC/TOPLINE-P8-001-R12-AUDIT_2026-09-11.md` (not yet written; PM audit pending)
- R12 PM audit commit: PLANNED (pending)
- R12 implementation commit (Commit A): `330e61087ae972c2440f2ac2ea12ea4c627fad8d`
- R12 evidence-fill commit (Commit B): `<R12_COMMIT_B_HASH>`
- R11 WDR (GIT EVIDENCE section corrected by R12): `WDR/_All/Phase-08-Database-Auth-RBAC/TOPLINE-P8-001-R11_WDR_2026-09-11.md`
- R11 audit (immutable): `WDR/_All/Phase-08-Database-Auth-RBAC/TOPLINE-P8-001-R11-AUDIT_2026-09-11.md`
- R11 PM-audit commit: `992c3a4f278fc1d1725cb3fcb5c5b8a7d2aa068f`
- R11 implementation commit (R11 Commit A): `b8d25fe1c078267c76ed2f54a094e93fcc2a3719` (preserved — NOT replaced with R11 Commit B)
- R11 evidence-fill commit (R11 Commit B): `c602d3ab030213b1894c8549ee705beaeb283979` (now recorded in the R11 WDR Git Evidence section, the latest status, the latest WDR summary, and this PM outbox)
- R10 WDR (immutable; Git Evidence section only was corrected by R11 — not further edited by R12): `WDR/_All/Phase-08-Database-Auth-RBAC/TOPLINE-P8-001-R10_WDR_2026-09-11.md`
- R10 audit (immutable): `WDR/_All/Phase-08-Database-Auth-RBAC/TOPLINE-P8-001-R10-AUDIT_2026-09-11.md`
- R10 evidence-fill commit (R10 Commit B): `90f87ede6727154e25a27ade64d93be9b80141f`
- R9 WDR (immutable; Git Evidence + 2 status rows were corrected by R10 — not further edited by R12): `WDR/_All/Phase-08-Database-Auth-RBAC/TOPLINE-P8-001-R9_WDR_2026-09-11.md`
- R9 audit (immutable): `WDR/_All/Phase-08-Database-Auth-RBAC/TOPLINE-P8-001-R9-AUDIT_2026-09-11.md`
- R9 evidence-fill commit (R9 Commit B): `17655b7b6e168fb617ac3af3e80c46c2e0abfc2f`
- R8 evidence-fill commit (R8 Commit B): `d876589d4c8691534999f3692e859325f8b77d88`
- R6 plan: `docs/PHASE-08-DATABASE-AUTH-RBAC-READINESS-PLAN.md` (preserved byte-for-byte by R11 and R12)
- Canonical registry: `src/project/projectRegistry.ts` (R12 execution PASS with pmApproval PLANNED, wdr-077 PLANNED, P8-001 through R11 pmApproval BLOCKED, wdr-065 through wdr-076 pmAudit BLOCKED, Phase 8 BLOCKED, currentTask null, lastCompletedTask `TOPLINE-P8-001-R12`, nextPlannedTask `TOPLINE-P8-002` as non-authorizing placeholder)
- Reports: `AGENT_REPORTS/latest-status.md`, `AGENT_REPORTS/latest-wdr-summary.md`

## Block Status

- `TOPLINE-P8-001`, `TOPLINE-P8-001-R1`, `TOPLINE-P8-001-R2`, `TOPLINE-P8-001-R3`, `TOPLINE-P8-001-R4`, `TOPLINE-P8-001-R5`, `TOPLINE-P8-001-R6`, `TOPLINE-P8-001-R7`, `TOPLINE-P8-001-R8`, `TOPLINE-P8-001-R9`, `TOPLINE-P8-001-R10`, `TOPLINE-P8-001-R11` and `wdr-065`, `wdr-066`, `wdr-067`, `wdr-068`, `wdr-069`, `wdr-070`, **`wdr-071`**, `wdr-072`, `wdr-073`, `wdr-074`, `wdr-075`, `wdr-076` remain BLOCKED.
- Phase 8 remains BLOCKED. P8-002 is proposed, unregistered, and unapproved.
- P8-001-R12 STOPPED BEFORE `TOPLINE-P8-002` per #123.

## Required Corrective Task (if R12 PM audit BLOCKED)

`TOPLINE-P8-001-R13 - Phase 8 R12 Evidence-Fill and <next-gap> Reconciliation`

R13 would be documentation/governance only (only if R12 PM audit BLOCKED). It would:
- Fill the real R12 evidence-fill hash into the R12 WDR Git Evidence section, both latest reports, the PM outbox, and the canonical registry where applicable.
- Address any new R12 audit findings explicitly.
- Preserve the valid R12 R11-evidence-fill correction.
- Preserve the Phase 8 readiness plan byte-for-byte.
- Re-run status, diff, build, lint, backend build, and backend test checks.
- Stop before P8-002. Do not install packages, change Prisma/schema or migrations, implement database/auth/RBAC/session/token/security behavior, touch secrets, or access `F:\OpenCode\shop.com`.

## Or: PM-Approved Implementation Task (if R12 PM audit PASSED)

`TOPLINE-P8-002 - Phase 8 Authentication Persistence (schema/migration-only, additive, no packages, no auth behavior)`

PM would write the full P8-002 prompt separately. P8-002 is **proposed but unregistered and unapproved** in `src/project/projectRegistry.ts`. R12 ends at the VERIFY/AUDIT stage and does not start, authorize, or prepare any P8-002 implementation.

Until PM writes the next PM-approved prompt, no Phase 8 implementation is authorized.
