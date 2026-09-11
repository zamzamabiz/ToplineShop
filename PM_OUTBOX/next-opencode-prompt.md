# Next OpenCode Execution Prompt

## PM/CTO Decision

**TOPLINE-P8-001-R14 execution: PASS — PM audit PLANNED**

R14 closed the R13 PM audit finding: the R13 Commit B hash
`038ffb1db413a4dba8e5940dae2b5dd8cde76dbf` is now recorded in
the R13 WDR GIT EVIDENCE section (the `<R13_COMMIT_B_HASH>`
placeholder has been replaced); the registry `git.lastCommit`
is updated to R14 Commit A (the R13 PM-audit hash is replaced);
the R13 task `commitHash` and `wdr-078.commitHash` correctly
remain on R13 Commit A `a0f3318967fb931adb8463844c3165bf2d0ed778`
per the R14 instruction "Preserve these fields exactly". No
P8-002 implementation is authorized.

R13 PM audit remains BLOCKED. Do not paste any P8-002 prompt into #MM.

## R14 Evidence

- R14 WDR: `WDR/_All/Phase-08-Database-Auth-RBAC/TOPLINE-P8-001-R14_WDR_2026-09-11.md`
- R14 audit: `WDR/_All/Phase-08-Database-Auth-RBAC/TOPLINE-P8-001-R14-AUDIT_2026-09-11.md` (not yet written; PM audit pending)
- R14 PM audit commit: PLANNED (pending)
- R14 implementation commit (Commit A): `<R14_COMMIT_A_HASH>`
- R14 evidence-fill commit (Commit B): `<R14_COMMIT_B_HASH>`
- R13 WDR (GIT EVIDENCE section corrected by R14): `WDR/_All/Phase-08-Database-Auth-RBAC/TOPLINE-P8-001-R13_WDR_2026-09-11.md`
- R13 audit (immutable): `WDR/_All/Phase-08-Database-Auth-RBAC/TOPLINE-P8-001-R13-AUDIT_2026-09-11.md`
- R13 PM-audit Commit A: `8be6ffe33ed0331836bd8ecc154b4a23ae08adee`
- R13 PM-audit evidence-fill Commit B: `157b1a5cef44bee246e74d93e6f29ccecc020b7c`
- R13 implementation commit (R13 Commit A): `a0f3318967fb931adb8463844c3165bf2d0ed778` (preserved — NOT replaced with R13 Commit B)
- R13 evidence-fill commit (R13 Commit B): `038ffb1db413a4dba8e5940dae2b5dd8cde76dbf` (now recorded in the R13 WDR Git Evidence section, the latest status, the latest WDR summary, and this PM outbox)
- R12 WDR (immutable; GIT EVIDENCE section only was corrected by R13 — not further edited by R14): `WDR/_All/Phase-08-Database-Auth-RBAC/TOPLINE-P8-001-R12_WDR_2026-09-11.md`
- R12 audit (immutable): `WDR/_All/Phase-08-Database-Auth-RBAC/TOPLINE-P8-001-R12-AUDIT_2026-09-11.md`
- R12 evidence-fill commit (R12 Commit B): `a92659bfe0d96930fe33878a6a178bfc016c8a10`
- R11 WDR (immutable; GIT EVIDENCE section only was corrected by R12 — not further edited by R14): `WDR/_All/Phase-08-Database-Auth-RBAC/TOPLINE-P8-001-R11_WDR_2026-09-11.md`
- R11 audit (immutable): `WDR/_All/Phase-08-Database-Auth-RBAC/TOPLINE-P8-001-R11-AUDIT_2026-09-11.md`
- R11 evidence-fill commit (R11 Commit B): `c602d3ab030213b1894c8549ee705beaeb283979`
- R10 evidence-fill commit (R10 Commit B): `90f87ede6727154e25a27ade64d93be9b80141f`
- R9 evidence-fill commit (R9 Commit B): `17655b7b6e168fb617ac3af3e80c46c2e0abfc2f`
- R8 evidence-fill commit (R8 Commit B): `d876589d4c8691534999f3692e859325f8b77d88`
- R6 plan: `docs/PHASE-08-DATABASE-AUTH-RBAC-READINESS-PLAN.md` (preserved byte-for-byte by R13 and R14)
- Canonical registry: `src/project/projectRegistry.ts` (R14 execution PASS with pmApproval PLANNED, wdr-079 PLANNED, P8-001 through R13 pmApproval BLOCKED, wdr-065 through wdr-078 pmAudit BLOCKED, Phase 8 BLOCKED, currentTask null, lastCompletedTask `TOPLINE-P8-001-R14`, nextPlannedTask `TOPLINE-P8-002` as non-authorizing placeholder)
- Reports: `AGENT_REPORTS/latest-status.md`, `AGENT_REPORTS/latest-wdr-summary.md`

## Block Status

- `TOPLINE-P8-001`, `TOPLINE-P8-001-R1`, `TOPLINE-P8-001-R2`, `TOPLINE-P8-001-R3`, `TOPLINE-P8-001-R4`, `TOPLINE-P8-001-R5`, `TOPLINE-P8-001-R6`, `TOPLINE-P8-001-R7`, `TOPLINE-P8-001-R8`, `TOPLINE-P8-001-R9`, `TOPLINE-P8-001-R10`, `TOPLINE-P8-001-R11`, `TOPLINE-P8-001-R12`, `TOPLINE-P8-001-R13` and `wdr-065`, `wdr-066`, `wdr-067`, `wdr-068`, `wdr-069`, `wdr-070`, **`wdr-071`**, `wdr-072`, `wdr-073`, `wdr-074`, `wdr-075`, `wdr-076`, `wdr-077`, `wdr-078` remain BLOCKED.
- Phase 8 remains BLOCKED. P8-002 is proposed, unregistered, and unapproved.
- P8-001-R14 STOPPED BEFORE `TOPLINE-P8-002` per #123.

## Required Corrective Task (if R14 PM audit BLOCKED)

`TOPLINE-P8-001-R15 - Phase 8 R14 Evidence-Fill and <next-gap> Reconciliation`

R15 would be documentation/governance only (only if R14 PM audit BLOCKED). It would:
- Fill the real R14 evidence-fill hash into the R14 WDR Git Evidence section, both latest reports, the PM outbox, and the canonical registry where applicable.
- Address any new R14 audit findings explicitly.
- Preserve the valid R14 R13-evidence-fill correction.
- Preserve the Phase 8 readiness plan byte-for-byte.
- Re-run status, diff, build, lint, backend build, and backend test checks.
- Stop before P8-002. Do not install packages, change Prisma/schema or migrations, implement database/auth/RBAC/session/token/security behavior, touch secrets, or access `F:\OpenCode\shop.com`.

## Or: PM-Approved Implementation Task (if R14 PM audit PASSED)

`TOPLINE-P8-002 - Phase 8 Authentication Persistence (schema/migration-only, additive, no packages, no auth behavior)`

PM would write the full P8-002 prompt separately. P8-002 is **proposed but unregistered and unapproved** in `src/project/projectRegistry.ts`. R14 ends at the VERIFY/AUDIT stage and does not start, authorize, or prepare any P8-002 implementation.

Until PM writes the next PM-approved prompt, no Phase 8 implementation is authorized.
