# Next OpenCode Execution Prompt

## PM/CTO Decision

**TOPLINE-P8-001-R13 PM audit: BLOCKED**

R13 correctly closed the R12 evidence-fill target in substance
and remained documentation/governance-only. The R13 PM audit
is BLOCKED because the R13 WDR Git Evidence section, both
latest reports, the PM outbox, and the registry `git.lastCommit`
still reflect the R13 Commit A state; the real R13 Commit B
hash `038ffb1db413a4dba8e5940dae2b5dd8cde76dbf` is not yet
filled into the claimed locations. No P8-002 implementation is
authorized.

Do not paste any P8-002 prompt into #MM.

## R13 PM Audit Evidence

- R13 PM audit: `WDR/_All/Phase-08-Database-Auth-RBAC/TOPLINE-P8-001-R13-AUDIT_2026-09-11.md`
- R13 PM-audit commit: `8be6ffe33ed0331836bd8ecc154b4a23ae08adee`
- R13 WDR: `WDR/_All/Phase-08-Database-Auth-RBAC/TOPLINE-P8-001-R13_WDR_2026-09-11.md`
- R13 implementation commit (Commit A): `a0f3318967fb931adb8463844c3165bf2d0ed778`
- R13 evidence-fill commit (Commit B): `038ffb1db413a4dba8e5940dae2b5dd8cde76dbf` (not yet filled into the R13 WDR, reports, outbox, or registry `git.lastCommit`)
- R12 WDR (immutable; GIT EVIDENCE section only was corrected by R13 — not further edited by R13 PM audit): `WDR/_All/Phase-08-Database-Auth-RBAC/TOPLINE-P8-001-R12_WDR_2026-09-11.md`
- R12 audit (immutable): `WDR/_All/Phase-08-Database-Auth-RBAC/TOPLINE-P8-001-R12-AUDIT_2026-09-11.md`
- R12 PM-audit Commit A: `5d502fc7ca8a88e5a62d60c8db9824d57720c153`
- R12 implementation commit (R12 Commit A): `330e61087ae972c2440f2ac2ea12ea4c627fad8d` (preserved — NOT replaced with R12 Commit B)
- R12 evidence-fill commit (R12 Commit B): `a92659bfe0d96930fe33878a6a178bfc016c8a10`
- R11 WDR (immutable; GIT EVIDENCE section only was corrected by R12 — not further edited by R13 PM audit): `WDR/_All/Phase-08-Database-Auth-RBAC/TOPLINE-P8-001-R11_WDR_2026-09-11.md`
- R11 audit (immutable): `WDR/_All/Phase-08-Database-Auth-RBAC/TOPLINE-P8-001-R11-AUDIT_2026-09-11.md`
- R11 evidence-fill commit (R11 Commit B): `c602d3ab030213b1894c8549ee705beaeb283979`
- R10 evidence-fill commit (R10 Commit B): `90f87ede6727154e25a27ade64d93be9b80141f`
- R9 evidence-fill commit (R9 Commit B): `17655b7b6e168fb617ac3af3e80c46c2e0abfc2f`
- R8 evidence-fill commit (R8 Commit B): `d876589d4c8691534999f3692e859325f8b77d88`
- R6 plan: `docs/PHASE-08-DATABASE-AUTH-RBAC-READINESS-PLAN.md` (preserved byte-for-byte by R12, R13, and R13 PM audit)
- Canonical registry: `src/project/projectRegistry.ts` (R13 pmApproval BLOCKED, wdr-078 pmAudit BLOCKED, R14 PLANNED, P8-001 through R13 pmApproval BLOCKED, wdr-065 through wdr-078 pmAudit BLOCKED, Phase 8 BLOCKED, currentTask null, lastCompletedTask `TOPLINE-P8-001-R13`, nextPlannedTask `TOPLINE-P8-001-R14` as a non-authorizing placeholder)
- Reports: `AGENT_REPORTS/latest-status.md`, `AGENT_REPORTS/latest-wdr-summary.md`

## Block Status

- `TOPLINE-P8-001`, `TOPLINE-P8-001-R1`, `TOPLINE-P8-001-R2`, `TOPLINE-P8-001-R3`, `TOPLINE-P8-001-R4`, `TOPLINE-P8-001-R5`, `TOPLINE-P8-001-R6`, `TOPLINE-P8-001-R7`, `TOPLINE-P8-001-R8`, `TOPLINE-P8-001-R9`, `TOPLINE-P8-001-R10`, `TOPLINE-P8-001-R11`, `TOPLINE-P8-001-R12`, `TOPLINE-P8-001-R13` and `wdr-065`, `wdr-066`, `wdr-067`, `wdr-068`, `wdr-069`, `wdr-070`, **`wdr-071`**, `wdr-072`, `wdr-073`, `wdr-074`, `wdr-075`, `wdr-076`, `wdr-077`, `wdr-078` remain BLOCKED.
- Phase 8 remains BLOCKED. P8-002 is proposed, unregistered, and unapproved.
- P8-001-R13 PM audit STOPPED BEFORE `TOPLINE-P8-002` per #123.

## Required Corrective Task

`TOPLINE-P8-001-R14 - Phase 8 R13 Evidence-Fill Reconciliation`

R14 is documentation/governance only. It must:

1. Fill `038ffb1db413a4dba8e5940dae2b5dd8cde76dbf` into the R13 WDR Git Evidence section, both latest reports, the PM outbox, and the canonical registry evidence state.
2. Preserve the R13 task and `wdr-078` Commit A fields, the R12 correction, the readiness plan, and all prior audits byte-for-byte.
3. Preserve all valid R12, R11, R10, R9, R8, and R7 corrections.
4. Re-run the required governance and build/test verification, stage exact files only, and stop before P8-002.

Until R14 is completed and PM-audited, no P8-002 prompt or implementation is authorized.
