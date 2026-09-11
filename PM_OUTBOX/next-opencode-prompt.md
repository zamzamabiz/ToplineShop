# Next OpenCode Execution Prompt

## PM/CTO Decision

**TOPLINE-P8-001-R15 PM audit: BLOCKED**

R15 correctly closed the R14 evidence-fill target in substance
and remained documentation/governance-only. The R15 PM audit
is BLOCKED because the R15 WDR Git Evidence section, both
latest reports, the PM outbox, and the registry `git.lastCommit`
still reflect the R15 Commit A state; the real R15 Commit B
hash `91f3f56062c7e6cc6401ef52d421cbbebb99491c` is not yet
filled into the claimed locations. No P8-002 implementation is
authorized.

Do not paste any P8-002 prompt into #MM.

## R15 PM Audit Evidence

- R15 PM audit: `WDR/_All/Phase-08-Database-Auth-RBAC/TOPLINE-P8-001-R15-AUDIT_2026-09-11.md`
- R15 PM-audit commit: `e7f56be7e06983c7e23ceb36915b129034c1cf97`
- R15 WDR: `WDR/_All/Phase-08-Database-Auth-RBAC/TOPLINE-P8-001-R15_WDR_2026-09-11.md`
- R15 implementation commit (Commit A): `22118accf43bcc94699e3f4d42cbfa9020d8edc9`
- R15 evidence-fill commit (Commit B): `91f3f56062c7e6cc6401ef52d421cbbebb99491c` (not yet filled into the R15 WDR, reports, outbox, or registry `git.lastCommit`)
- R14 WDR (immutable; GIT EVIDENCE section only was corrected by R15 — not further edited by R15 PM audit): `WDR/_All/Phase-08-Database-Auth-RBAC/TOPLINE-P8-001-R14_WDR_2026-09-11.md`
- R14 audit (immutable): `WDR/_All/Phase-08-Database-Auth-RBAC/TOPLINE-P8-001-R14-AUDIT_2026-09-11.md`
- R14 PM-audit Commit A: `34eaac16e94255549668cb93304ba2cccbfee97b`
- R14 PM-audit evidence-fill Commit B: `cfec359b1b7e4cd6ba529f715cfb6bac89489588`
- R14 implementation commit (R14 Commit A): `fafdb0a062706fb5aa93996c7a74350706c808e0` (preserved — NOT replaced with R14 Commit B)
- R14 evidence-fill commit (R14 Commit B): `0edb50aeb0df69bc65763daf7fb46d2b07af6344`
- R13 WDR (immutable; GIT EVIDENCE section only was corrected by R14 — not further edited by R15 PM audit): `WDR/_All/Phase-08-Database-Auth-RBAC/TOPLINE-P8-001-R13_WDR_2026-09-11.md`
- R13 audit (immutable): `WDR/_All/Phase-08-Database-Auth-RBAC/TOPLINE-P8-001-R13-AUDIT_2026-09-11.md`
- R13 evidence-fill commit (R13 Commit B): `038ffb1db413a4dba8e5940dae2b5dd8cde76dbf`
- R12 evidence-fill commit (R12 Commit B): `a92659bfe0d96930fe33878a6a178bfc016c8a10`
- R11 evidence-fill commit (R11 Commit B): `c602d3ab030213b1894c8549ee705beaeb283979`
- R10 evidence-fill commit (R10 Commit B): `90f87ede6727154e25a27ade64d93be9b80141f`
- R9 evidence-fill commit (R9 Commit B): `17655b7b6e168fb617ac3af3e80c46c2e0abfc2f`
- R8 evidence-fill commit (R8 Commit B): `d876589d4c8691534999f3692e859325f8b77d88`
- R6 plan: `docs/PHASE-08-DATABASE-AUTH-RBAC-READINESS-PLAN.md` (preserved byte-for-byte by R14, R15, and R15 PM audit)
- Canonical registry: `src/project/projectRegistry.ts` (R15 pmApproval BLOCKED, wdr-080 pmAudit BLOCKED, R16 PLANNED, P8-001 through R15 pmApproval BLOCKED, wdr-065 through wdr-080 pmAudit BLOCKED, Phase 8 BLOCKED, currentTask null, lastCompletedTask `TOPLINE-P8-001-R15`, nextPlannedTask `TOPLINE-P8-001-R16` as a non-authorizing placeholder, phase-8 taskCount 17, completedTaskCount 16)
- Reports: `AGENT_REPORTS/latest-status.md`, `AGENT_REPORTS/latest-wdr-summary.md`

## Block Status

- `TOPLINE-P8-001`, `TOPLINE-P8-001-R1`, `TOPLINE-P8-001-R2`, `TOPLINE-P8-001-R3`, `TOPLINE-P8-001-R4`, `TOPLINE-P8-001-R5`, `TOPLINE-P8-001-R6`, `TOPLINE-P8-001-R7`, `TOPLINE-P8-001-R8`, `TOPLINE-P8-001-R9`, `TOPLINE-P8-001-R10`, `TOPLINE-P8-001-R11`, `TOPLINE-P8-001-R12`, `TOPLINE-P8-001-R13`, `TOPLINE-P8-001-R14`, `TOPLINE-P8-001-R15` and `wdr-065`, `wdr-066`, `wdr-067`, `wdr-068`, `wdr-069`, `wdr-070`, **`wdr-071`**, `wdr-072`, `wdr-073`, `wdr-074`, `wdr-075`, `wdr-076`, `wdr-077`, `wdr-078`, `wdr-079`, `wdr-080` remain BLOCKED.
- Phase 8 remains BLOCKED. P8-002 is proposed, unregistered, and unapproved.
- P8-001-R15 PM audit STOPPED BEFORE `TOPLINE-P8-002` per #123.

## Required Corrective Task

`TOPLINE-P8-001-R16 - Phase 8 R15 Evidence-Fill Reconciliation`

R16 is documentation/governance only. It must:

1. Fill `91f3f56062c7e6cc6401ef52d421cbbebb99491c` into the R15 WDR Git Evidence section, both latest reports, the PM outbox, and the canonical registry evidence state.
2. Preserve the R15 task and `wdr-080` Commit A fields, the R14 correction, the readiness plan, and all prior audits byte-for-byte.
3. Preserve all valid R14, R13, R12, R11, R10, R9, R8, and R7 corrections.
4. Re-run the required governance and build/test verification, stage exact files only, and stop before P8-002.

Until R16 is completed and PM-audited, no P8-002 prompt or implementation is authorized.
