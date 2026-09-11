# Next OpenCode Execution Prompt

## PM/CTO Decision

**TOPLINE-P8-001-R19 execution: PASS, PM audit: PLANNED**

R19 correctly closed the R18 PM-audit finding and remained documentation/governance-only. The R18 WDR Git Evidence section, both latest reports, the PM outbox, and the registry `git.lastCommit` now reflect the R18 Commit B state with the real hash `48cf1ddb28f401ba2cb3378a7a5152e36a670020`. The R18 task `commitHash` and `wdr-083.commitHash` correctly remain on R18 Commit A `db5c49f2bbac1a00f24752a18f3881e16c7ecfa7` (NOT replaced with R18 Commit B per the R19 instruction "Preserve Commit Ownership"). The R19 PM audit is **PLANNED**. No P8-002 implementation is authorized.

Do not paste any P8-002 prompt into #MM.

## R19 Audit Evidence

- R19 WDR: `WDR/_All/Phase-08-Database-Auth-RBAC/TOPLINE-P8-001-R19_WDR_2026-09-11.md`
- R19 implementation commit (R19 Commit A): `<R19_COMMIT_A_HASH>` (filled by R19 Commit B)
- R19 evidence-fill commit (R19 Commit B): `<R19_COMMIT_B_HASH>` (filled by R19)
- R18 WDR (immutable; GIT EVIDENCE section only was corrected by R19 itself — not further edited by R19 PM audit): `WDR/_All/Phase-08-Database-Auth-RBAC/TOPLINE-P8-001-R18_WDR_2026-09-11.md`
- R18 PM audit (immutable; BLOCKED decision preserved as historical): `WDR/_All/Phase-08-Database-Auth-RBAC/TOPLINE-P8-001-R18-AUDIT_2026-09-11.md`
- R18 implementation commit (Commit A): `db5c49f2bbac1a00f24752a18f3881e16c7ecfa7`
- R18 evidence-fill commit (Commit B): `48cf1ddb28f401ba2cb3378a7a5152e36a670020` (now recorded in the R18 WDR Git Evidence section by R19, and preserved in latest-status.md, latest-wdr-summary.md, PM_OUTBOX, and the historical commit graph)
- R18 PM-audit Commit A: `c4c151f8dbbe706d253e7c5c647e31ad08097dfd` (preserved as historical)
- R18 PM-audit evidence-fill Commit B: `e204e0ee5c6430135165cf90195b217d0f132433` (R19 starting HEAD; preserved as historical)
- R17 WDR (immutable; GIT EVIDENCE section only was corrected by R18 — not further edited by R19): `WDR/_All/Phase-08-Database-Auth-RBAC/TOPLINE-P8-001-R17_WDR_2026-09-11.md`
- R17 PM audit (immutable): `WDR/_All/Phase-08-Database-Auth-RBAC/TOPLINE-P8-001-R17-AUDIT_2026-09-11.md`
- R17 implementation commit (R17 Commit A): `8c7f46d7547220e88b9a6d6dd7e0fbc5d7fed8ae` (preserved — NOT replaced with R17 Commit B)
- R17 evidence-fill commit (R17 Commit B): `39267f0f7c74eb41108c115a046f58ff386bb748`
- R16 audit (immutable): `WDR/_All/Phase-08-Database-Auth-RBAC/TOPLINE-P8-001-R16-AUDIT_2026-09-11.md`
- R16 PM-audit Commit A: `88b4366cb080defd62cd1909c91349467d8b729d`
- R16 PM-audit evidence-fill Commit B: `7481c0bcc50b96c4d50f3c35e69b515d4c52ced7`
- R16 implementation commit (R16 Commit A): `2b45216458e00c5776760184f76d3c073acd7094` (preserved — NOT replaced with R16 Commit B)
- R16 evidence-fill commit (R16 Commit B): `5a5e4cc8735c3e474f11de3620240b7965936951`
- R15 WDR (immutable; GIT EVIDENCE section only was corrected by R16 — not further edited by R19): `WDR/_All/Phase-08-Database-Auth-RBAC/TOPLINE-P8-001-R15_WDR_2026-09-11.md`
- R15 audit (immutable): `WDR/_All/Phase-08-Database-Auth-RBAC/TOPLINE-P8-001-R15-AUDIT_2026-09-11.md`
- R15 PM-audit Commit A: `e7f56be7e06983c7e23ceb36915b129034c1cf97`
- R15 PM-audit evidence-fill Commit B: `62765789b639204c2a78627acc329bf57bc91de8`
- R15 implementation commit (R15 Commit A): `22118accf43bcc94699e3f4d42cbfa9020d8edc9` (preserved — NOT replaced with R15 Commit B)
- R15 evidence-fill commit (R15 Commit B): `91f3f56062c7e6cc6401ef52d421cbbebb99491c`
- R14 audit (immutable): `WDR/_All/Phase-08-Database-Auth-RBAC/TOPLINE-P8-001-R14-AUDIT_2026-09-11.md`
- R14 PM-audit Commit A: `34eaac16e94255549668cb93304ba2cccbfee97b`
- R14 PM-audit evidence-fill Commit B: `cfec359b1b7e4cd6ba529f715cfb6bac89489588`
- R14 implementation commit (R14 Commit A): `fafdb0a062706fb5aa93996c7a74350706c808e0` (preserved — NOT replaced with R14 Commit B)
- R14 evidence-fill commit (R14 Commit B): `0edb50aeb0df69bc65763daf7fb46d2b07af6344`
- R13 audit (immutable): `WDR/_All/Phase-08-Database-Auth-RBAC/TOPLINE-P8-001-R13-AUDIT_2026-09-11.md`
- R13 evidence-fill commit (R13 Commit B): `038ffb1db413a4dba8e5940dae2b5dd8cde76dbf`
- R12 evidence-fill commit (R12 Commit B): `a92659bfe0d96930fe33878a6a178bfc016c8a10`
- R11 evidence-fill commit (R11 Commit B): `c602d3ab030213b1894c8549ee705beaeb283979`
- R10 evidence-fill commit (R10 Commit B): `90f87ede6727154e25a27ade64d93be9b80141f`
- R9 evidence-fill commit (R9 Commit B): `17655b7b6e168fb617ac3af3e80c46c2e0abfc2f`
- R8 evidence-fill commit (R8 Commit B): `d876589d4c8691534999f3692e859325f8b77d88`
- R6 plan: `docs/PHASE-08-DATABASE-AUTH-RBAC-READINESS-PLAN.md` (preserved byte-for-byte by R15, R16, R16 PM audit, R17, R17 PM audit, R18, R18 PM audit, and R19)
- Canonical registry: `src/project/projectRegistry.ts` (R18 pmApproval BLOCKED, wdr-083 pmAudit BLOCKED, R19 status PASS with pmApproval PLANNED, wdr-084 status PASS with pmAudit PLANNED, P8-001 through R18 pmApproval BLOCKED, wdr-065 through wdr-083 pmAudit BLOCKED, Phase 8 BLOCKED, currentTask null, lastCompletedTask `TOPLINE-P8-001-R19`, nextPlannedTask `TOPLINE-P8-002` as a non-authorizing placeholder, phase-8 taskCount 20, completedTaskCount 20)
- Reports: `AGENT_REPORTS/latest-status.md`, `AGENT_REPORTS/latest-wdr-summary.md`

## Block Status

- `TOPLINE-P8-001`, `TOPLINE-P8-001-R1`, `TOPLINE-P8-001-R2`, `TOPLINE-P8-001-R3`, `TOPLINE-P8-001-R4`, `TOPLINE-P8-001-R5`, `TOPLINE-P8-001-R6`, `TOPLINE-P8-001-R7`, `TOPLINE-P8-001-R8`, `TOPLINE-P8-001-R9`, `TOPLINE-P8-001-R10`, `TOPLINE-P8-001-R11`, `TOPLINE-P8-001-R12`, `TOPLINE-P8-001-R13`, `TOPLINE-P8-001-R14`, `TOPLINE-P8-001-R15`, `TOPLINE-P8-001-R16`, `TOPLINE-P8-001-R17`, `TOPLINE-P8-001-R18` and `wdr-065`, `wdr-066`, `wdr-067`, `wdr-068`, `wdr-069`, `wdr-070`, **`wdr-071`**, `wdr-072`, `wdr-073`, `wdr-074`, `wdr-075`, `wdr-076`, `wdr-077`, `wdr-078`, `wdr-079`, `wdr-080`, `wdr-081`, `wdr-082`, `wdr-083` remain BLOCKED.
- Phase 8 remains BLOCKED. P8-002 is proposed, unregistered, and unapproved.
- R19 PM audit is **PLANNED**. Until R19 is PM-audited and PASSED, no P8-002 prompt or implementation is authorized.

## Audit Required

A PM/CTO audit of R19 is **PLANNED**. The PM/CTO must audit:

- The R19 WDR: `WDR/_All/Phase-08-Database-Auth-RBAC/TOPLINE-P8-001-R19_WDR_2026-09-11.md`
- The R18 WDR (GIT EVIDENCE section only): `WDR/_All/Phase-08-Database-Auth-RBAC/TOPLINE-P8-001-R18_WDR_2026-09-11.md`
- The canonical registry: `src/project/projectRegistry.ts`
- Both latest reports: `AGENT_REPORTS/latest-status.md`, `AGENT_REPORTS/latest-wdr-summary.md`
- This PM outbox: `PM_OUTBOX/next-opencode-prompt.md`

PM may:

- **PASS** the R19 evidence fill. If PASS, Phase 8 remains BLOCKED until the entire chain is PM-audited and PASSED and a separate PM-approved prompt authorizes P8-002. No further corrective task is required; R20 is not registered unless R19 PM audit BLOCKS.
- **BLOCK** with a corrective prompt that names the specific gap. If BLOCK, R20 (`TOPLINE-P8-001-R20 - Phase 8 R19 Evidence-Fill Reconciliation`) becomes the only planned corrective task. R20 will be registered as a non-authorizing placeholder in the canonical registry by the R19 PM audit.
- **PASS with edits** by approving an edited report in a follow-up WDR (which would itself be a `TOPLINE-P8-001-R20` corrective task).

Until the R19 PM audit is written and approved, no Phase 8 implementation is authorized.
