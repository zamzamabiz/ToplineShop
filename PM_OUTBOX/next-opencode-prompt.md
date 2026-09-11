# Next OpenCode Execution Prompt

## PM/CTO Decision

**TOPLINE-P8-001-R17 execution: PASS, PM audit: PLANNED**

R17 correctly closed the R16 PM-audit finding and remained documentation/governance-only. The R16 WDR Git Evidence section, both latest reports, the PM outbox, and the registry `git.lastCommit` now reflect the R16 Commit B state with the real hash `5a5e4cc8735c3e474f11de3620240b7965936951`. The R16 task `commitHash` and `wdr-081.commitHash` correctly remain on R16 Commit A `2b45216458e00c5776760184f76d3c073acd7094` (NOT replaced with R16 Commit B per the R17 instruction). The R17 PM audit is **PLANNED**. No P8-002 implementation is authorized.

Do not paste any P8-002 prompt into #MM.

## R17 Audit Evidence

- R17 WDR: `WDR/_All/Phase-08-Database-Auth-RBAC/TOPLINE-P8-001-R17_WDR_2026-09-11.md`
- R17 implementation commit (R17 Commit A): `<R17_COMMIT_A_HASH>` (filled by R17 Commit B)
- R17 evidence-fill commit (R17 Commit B): `<R17_COMMIT_B_HASH>` (filled by R17)
- R16 WDR (GIT EVIDENCE section corrected by R17 — no other section edited): `WDR/_All/Phase-08-Database-Auth-RBAC/TOPLINE-P8-001-R16_WDR_2026-09-11.md`
- R16 PM audit (immutable; BLOCKED decision preserved as historical): `WDR/_All/Phase-08-Database-Auth-RBAC/TOPLINE-P8-001-R16-AUDIT_2026-09-11.md`
- R16 PM-audit Commit A: `88b4366cb080defd62cd1909c91349467d8b729d` (preserved as historical)
- R16 PM-audit evidence-fill Commit B: `7481c0bcc50b96c4d50f3c35e69b515d4c52ced7` (R17 starting HEAD; preserved as historical)
- R16 implementation commit (Commit A): `2b45216458e00c5776760184f76d3c073acd7094` (preserved — NOT replaced with R16 Commit B)
- R16 evidence-fill commit (Commit B): `5a5e4cc8735c3e474f11de3620240b7965936951` (now recorded in the R16 WDR Git Evidence section by R17, and preserved in latest-status.md, latest-wdr-summary.md, PM_OUTBOX, and the historical commit graph)
- R15 WDR (immutable; GIT EVIDENCE section only was corrected by R16 — not further edited by R17): `WDR/_All/Phase-08-Database-Auth-RBAC/TOPLINE-P8-001-R15_WDR_2026-09-11.md`
- R15 audit (immutable): `WDR/_All/Phase-08-Database-Auth-RBAC/TOPLINE-P8-001-R15-AUDIT_2026-09-11.md`
- R15 PM-audit Commit A: `e7f56be7e06983c7e23ceb36915b129034c1cf97`
- R15 PM-audit evidence-fill Commit B: `62765789b639204c2a78627acc329bf57bc91de8`
- R15 implementation commit (R15 Commit A): `22118accf43bcc94699e3f4d42cbfa9020d8edc9` (preserved — NOT replaced with R15 Commit B)
- R15 evidence-fill commit (R15 Commit B): `91f3f56062c7e6cc6401ef52d421cbbebb99491c`
- R14 WDR (immutable; GIT EVIDENCE section only was corrected by R15 — not further edited by R17): `WDR/_All/Phase-08-Database-Auth-RBAC/TOPLINE-P8-001-R14_WDR_2026-09-11.md`
- R14 audit (immutable): `WDR/_All/Phase-08-Database-Auth-RBAC/TOPLINE-P8-001-R14-AUDIT_2026-09-11.md`
- R14 PM-audit Commit A: `34eaac16e94255549668cb93304ba2cccbfee97b`
- R14 PM-audit evidence-fill Commit B: `cfec359b1b7e4cd6ba529f715cfb6bac89489588`
- R14 implementation commit (R14 Commit A): `fafdb0a062706fb5aa93996c7a74350706c808e0` (preserved — NOT replaced with R14 Commit B)
- R14 evidence-fill commit (R14 Commit B): `0edb50aeb0df69bc65763daf7fb46d2b07af6344`
- R13 WDR (immutable; GIT EVIDENCE section only was corrected by R14 — not further edited by R17): `WDR/_All/Phase-08-Database-Auth-RBAC/TOPLINE-P8-001-R13_WDR_2026-09-11.md`
- R13 audit (immutable): `WDR/_All/Phase-08-Database-Auth-RBAC/TOPLINE-P8-001-R13-AUDIT_2026-09-11.md`
- R13 evidence-fill commit (R13 Commit B): `038ffb1db413a4dba8e5940dae2b5dd8cde76dbf`
- R12 evidence-fill commit (R12 Commit B): `a92659bfe0d96930fe33878a6a178bfc016c8a10`
- R11 evidence-fill commit (R11 Commit B): `c602d3ab030213b1894c8549ee705beaeb283979`
- R10 evidence-fill commit (R10 Commit B): `90f87ede6727154e25a27ade64d93be9b80141f`
- R9 evidence-fill commit (R9 Commit B): `17655b7b6e168fb617ac3af3e80c46c2e0abfc2f`
- R8 evidence-fill commit (R8 Commit B): `d876589d4c8691534999f3692e859325f8b77d88`
- R6 plan: `docs/PHASE-08-DATABASE-AUTH-RBAC-READINESS-PLAN.md` (preserved byte-for-byte by R14, R15, R16, R16 PM audit, and R17)
- Canonical registry: `src/project/projectRegistry.ts` (R16 pmApproval BLOCKED, wdr-081 pmAudit BLOCKED, R17 status PASS with pmApproval PLANNED, wdr-082 status PASS with pmAudit PLANNED, P8-001 through R16 pmApproval BLOCKED, wdr-065 through wdr-081 pmAudit BLOCKED, Phase 8 BLOCKED, currentTask null, lastCompletedTask `TOPLINE-P8-001-R17`, nextPlannedTask `TOPLINE-P8-002` as a non-authorizing placeholder, phase-8 taskCount 18, completedTaskCount 18)
- Reports: `AGENT_REPORTS/latest-status.md`, `AGENT_REPORTS/latest-wdr-summary.md`

## Block Status

- `TOPLINE-P8-001`, `TOPLINE-P8-001-R1`, `TOPLINE-P8-001-R2`, `TOPLINE-P8-001-R3`, `TOPLINE-P8-001-R4`, `TOPLINE-P8-001-R5`, `TOPLINE-P8-001-R6`, `TOPLINE-P8-001-R7`, `TOPLINE-P8-001-R8`, `TOPLINE-P8-001-R9`, `TOPLINE-P8-001-R10`, `TOPLINE-P8-001-R11`, `TOPLINE-P8-001-R12`, `TOPLINE-P8-001-R13`, `TOPLINE-P8-001-R14`, `TOPLINE-P8-001-R15`, `TOPLINE-P8-001-R16` and `wdr-065`, `wdr-066`, `wdr-067`, `wdr-068`, `wdr-069`, `wdr-070`, **`wdr-071`**, `wdr-072`, `wdr-073`, `wdr-074`, `wdr-075`, `wdr-076`, `wdr-077`, `wdr-078`, `wdr-079`, `wdr-080`, `wdr-081` remain BLOCKED.
- Phase 8 remains BLOCKED. P8-002 is proposed, unregistered, and unapproved.
- R17 PM audit is **PLANNED**. Until R17 is PM-audited and PASSED, no P8-002 prompt or implementation is authorized.

## Audit Required

A PM/CTO audit of R17 is **PLANNED**. The PM/CTO must audit:

- The R17 WDR: `WDR/_All/Phase-08-Database-Auth-RBAC/TOPLINE-P8-001-R17_WDR_2026-09-11.md`
- The R16 WDR (GIT EVIDENCE section only): `WDR/_All/Phase-08-Database-Auth-RBAC/TOPLINE-P8-001-R16_WDR_2026-09-11.md`
- The canonical registry: `src/project/projectRegistry.ts`
- Both latest reports: `AGENT_REPORTS/latest-status.md`, `AGENT_REPORTS/latest-wdr-summary.md`
- This PM outbox: `PM_OUTBOX/next-opencode-prompt.md`

PM may:

- **PASS** the R17 evidence fill. If PASS, Phase 8 remains BLOCKED until the entire chain is PM-audited and PASSED and a separate PM-approved prompt authorizes P8-002. No further corrective task is required; R18 is not registered unless R17 PM audit BLOCKS.
- **BLOCK** with a corrective prompt that names the specific gap. If BLOCK, R18 (`TOPLINE-P8-001-R18 - Phase 8 R17 Evidence-Fill Reconciliation`) becomes the only planned corrective task. R18 will be registered as a non-authorizing placeholder in the canonical registry by the R17 PM audit.
- **PASS with edits** by approving an edited report in a follow-up WDR (which would itself be a `TOPLINE-P8-001-R18` corrective task).

Until the R17 PM audit is written and approved, no Phase 8 implementation is authorized.
