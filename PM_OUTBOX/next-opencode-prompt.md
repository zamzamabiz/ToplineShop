# Next OpenCode Execution Prompt

## PM/CTO Decision

**TOPLINE-P8-001-R20 PM audit: BLOCKED**

R20 correctly closed the R19 PM-audit finding in substance and remained documentation/governance-only. The R20 PM audit is BLOCKED because the R20 WDR Git Evidence section, both latest reports, the PM outbox, and the registry `git.lastCommit` still reflect the R20 Commit A state; the real R20 Commit B hash `e19f1472e238cfff2f3e517c2580f78df6254ded` is not yet filled into the claimed locations. No P8-002 implementation is authorized.

Do not paste any P8-002 prompt into #MM.

## R20 PM Audit Evidence

- R20 PM audit: `WDR/_All/Phase-08-Database-Auth-RBAC/TOPLINE-P8-001-R20-AUDIT_2026-09-11.md`
- R20 PM-audit Commit A: `8185fcd6308c02ced6bb0b599b4fa9298b24b67b` (filled by R20 PM-audit evidence-fill Commit B)
- R20 PM-audit evidence-fill Commit B: `<R20_PM_AUDIT_COMMIT_B_HASH>` (filled by R20 PM-audit evidence-fill Commit B; reported in final handoff)
- R20 WDR (immutable; GIT EVIDENCE section line 211 still contains `<R20_COMMIT_B_HASH>` placeholder — not further edited by R20 PM audit): `WDR/_All/Phase-08-Database-Auth-RBAC/TOPLINE-P8-001-R20_WDR_2026-09-11.md`
- R20 implementation commit (Commit A): `fa79db386a4f3bb250093631e47a457e17218f34`
- R20 evidence-fill commit (Commit B): `e19f1472e238cfff2f3e517c2580f78df6254ded` (not yet filled into the R20 WDR, reports, outbox, or registry `git.lastCommit`)
- R19 WDR (immutable; GIT EVIDENCE section line 201 was corrected by R20 — not further edited by R20 PM audit): `WDR/_All/Phase-08-Database-Auth-RBAC/TOPLINE-P8-001-R19_WDR_2026-09-11.md`
- R19 PM audit (immutable; BLOCKED decision preserved as historical): `WDR/_All/Phase-08-Database-Auth-RBAC/TOPLINE-P8-001-R19-AUDIT_2026-09-11.md`
- R19 implementation commit (R19 Commit A): `7d9eafaaf5b802c6778c50afd6e2d0fec8ec886e` (preserved — NOT replaced with R19 Commit B)
- R19 evidence-fill commit (R19 Commit B): `c55c44bf79b53e8ec5779fef3fc226c714f021b5` (now recorded in R19 WDR Git Evidence section line 201 by R20)
- R18 WDR (immutable; GIT EVIDENCE section only was corrected by R19 — not further edited by R20 PM audit): `WDR/_All/Phase-08-Database-Auth-RBAC/TOPLINE-P8-001-R18_WDR_2026-09-11.md`
- R18 PM audit (immutable; BLOCKED decision preserved as historical): `WDR/_All/Phase-08-Database-Auth-RBAC/TOPLINE-P8-001-R18-AUDIT_2026-09-11.md`
- R18 implementation commit (R18 Commit A): `db5c49f2bbac1a00f24752a18f3881e16c7ecfa7` (preserved — NOT replaced with R18 Commit B)
- R18 evidence-fill commit (R18 Commit B): `48cf1ddb28f401ba2cb3378a7a5152e36a670020` (now recorded in R18 WDR Git Evidence section by R19)
- R18 PM-audit Commit A: `c4c151f8dbbe706d253e7c5c647e31ad08097dfd`
- R18 PM-audit evidence-fill Commit B: `e204e0ee5c6430135165cf90195b217d0f132433`
- R17 audit (immutable): `WDR/_All/Phase-08-Database-Auth-RBAC/TOPLINE-P8-001-R17-AUDIT_2026-09-11.md`
- R17 implementation commit (R17 Commit A): `8c7f46d7547220e88b9a6d6dd7e0fbc5d7fed8ae` (preserved — NOT replaced with R17 Commit B)
- R17 evidence-fill commit (R17 Commit B): `39267f0f7c74eb41108c115a046f58ff386bb748`
- R16 audit (immutable): `WDR/_All/Phase-08-Database-Auth-RBAC/TOPLINE-P8-001-R16-AUDIT_2026-09-11.md`
- R16 PM-audit Commit A: `88b4366cb080defd62cd1909c91349467d8b729d`
- R16 PM-audit evidence-fill Commit B: `7481c0bcc50b96c4d50f3c35e69b515d4c52ced7`
- R16 implementation commit (R16 Commit A): `2b45216458e00c5776760184f76d3c073acd7094` (preserved — NOT replaced with R16 Commit B)
- R16 evidence-fill commit (R16 Commit B): `5a5e4cc8735c3e474f11de3620240b7965936951`
- R15 WDR (immutable; GIT EVIDENCE section only was corrected by R16 — not further edited by R20 PM audit): `WDR/_All/Phase-08-Database-Auth-RBAC/TOPLINE-P8-001-R15_WDR_2026-09-11.md`
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
- R6 plan: `docs/PHASE-08-DATABASE-AUTH-RBAC-READINESS-PLAN.md` (preserved byte-for-byte by R15, R16, R16 PM audit, R17, R17 PM audit, R18, R18 PM audit, R19, R19 PM audit, R20, and R20 PM audit)
- Canonical registry: `src/project/projectRegistry.ts` (R20 pmApproval BLOCKED, wdr-085 pmAudit BLOCKED, R21 PLANNED, wdr-086 PLANNED, P8-001 through R20 pmApproval BLOCKED, wdr-065 through wdr-085 pmAudit BLOCKED, Phase 8 BLOCKED, currentTask null, lastCompletedTask `TOPLINE-P8-001-R20`, nextPlannedTask `TOPLINE-P8-001-R21` as a non-authorizing placeholder, phase-8 taskCount 22, completedTaskCount 21)
- Reports: `AGENT_REPORTS/latest-status.md`, `AGENT_REPORTS/latest-wdr-summary.md`

## Block Status

- `TOPLINE-P8-001`, `TOPLINE-P8-001-R1`, `TOPLINE-P8-001-R2`, `TOPLINE-P8-001-R3`, `TOPLINE-P8-001-R4`, `TOPLINE-P8-001-R5`, `TOPLINE-P8-001-R6`, `TOPLINE-P8-001-R7`, `TOPLINE-P8-001-R8`, `TOPLINE-P8-001-R9`, `TOPLINE-P8-001-R10`, `TOPLINE-P8-001-R11`, `TOPLINE-P8-001-R12`, `TOPLINE-P8-001-R13`, `TOPLINE-P8-001-R14`, `TOPLINE-P8-001-R15`, `TOPLINE-P8-001-R16`, `TOPLINE-P8-001-R17`, `TOPLINE-P8-001-R18`, `TOPLINE-P8-001-R19`, `TOPLINE-P8-001-R20` and `wdr-065`, `wdr-066`, `wdr-067`, `wdr-068`, `wdr-069`, `wdr-070`, **`wdr-071`**, `wdr-072`, `wdr-073`, `wdr-074`, `wdr-075`, `wdr-076`, `wdr-077`, `wdr-078`, `wdr-079`, `wdr-080`, `wdr-081`, `wdr-082`, `wdr-083`, `wdr-084`, `wdr-085` remain BLOCKED.
- Phase 8 remains BLOCKED. P8-002 is proposed, unregistered, and unapproved.
- R20 PM audit is **BLOCKED**. Until R20 is PM-audited and PASSED via R21, no P8-002 prompt or implementation is authorized.

## Required Corrective Task

`TOPLINE-P8-001-R21 - Phase 8 R20 Evidence-Fill Reconciliation`

R21 is documentation/governance only. It must:

1. Fill `e19f1472e238cfff2f3e517c2580f78df6254ded` into the R20 WDR Git Evidence section, both latest reports, the PM outbox, and the canonical registry evidence state (including `git.lastCommit`).
2. Preserve the R20 task and `wdr-085` Commit A fields as `fa79db386a4f3bb250093631e47a457e17218f34` (NOT replaced with R20 Commit B), the R19 correction, the readiness plan, and all prior audits byte-for-byte.
3. Preserve all valid R20, R19, R18, R17, R16, R15, R14, R13, R12, R11, R10, R9, R8, and R7 corrections.
4. Re-run the required governance and build/test verification, stage exact files only, and stop before P8-002.

Until R21 is completed and PM-audited, no P8-002 prompt or implementation is authorized.
