# Next OpenCode Execution Prompt

## PM/CTO Decision Needed

**Audit TOPLINE-P8-001-R24**

R24 execution is complete and awaits **independent PM/owner audit**. R24 was a documentation/governance-only corrective task that fixed the R23 evidence-integrity finding from the R23 supervisory audit. **TOPLINE-P8-002 remains proposed, unregistered, and unapproved — no P8-002 prompt or implementation may be prepared, pasted, or executed until the R24 PM audit is complete and the owner has granted explicit approval.**

## R24 Evidence

- R24 WDR: `WDR/_All/Phase-08-Database-Auth-RBAC/TOPLINE-P8-001-R24_WDR_2026-09-15.md`
- Corrected R23 WDR: `WDR/_All/Phase-08-Database-Auth-RBAC/TOPLINE-P8-001-R23_WDR_2026-09-15.md`
- R23 Commit A: `bdacbcb16951951982edf8ef0afd3615a59d619b` — TOPLINE-P8-001-R23: clean governance reconciliation
- R23 Commit B: `c704ea647689b8f0fcbc019f6e828d7116aa2b62` — TOPLINE-P8-001-R23: finalize clean evidence
- R23 Commit C: `c5fde66d19780f3c31371bb85b27b512e8e63aa3` — TOPLINE-P8-001-R23: correct final evidence references
- Canonical registry: `src/project/projectRegistry.ts`
- Reports: `AGENT_REPORTS/latest-status.md`, `AGENT_REPORTS/latest-wdr-summary.md`
- PM_OUTBOX: `PM_OUTBOX/next-opencode-prompt.md` (this file)

## R22 / R23 Commit A Ownership (must remain preserved)

- R22 implementation Commit A: `a13cb04b13a1c81877aa15e5d070fc2b39e9d82d`
- R22 evidence-fill Commit B: `bd398f270a781be54e40e51e2832ea46c874a84f`
- R22 PM-audit Commit A: `5a91bd7a8587aff9ceda497749760ef7efbfdbc9`
- R22 PM-audit evidence-fill Commit B: `e0e00864e9eb2f1c20c50cc3f9395058e9517168`
- R23 task `commitHash` and `wdr-088.commitHash` remain R23 Commit A `bdacbcb16951951982edf8ef0afd3615a59d619b`
- R22 task `commitHash` and `wdr-087.commitHash` remain R22 Commit A `a13cb04b13a1c81877aa15e5d070fc2b39e9d82d`
- Registry `git.lastCommit` remains the R22 evidence-fill Commit B hash (not replaced with R23 Commit A)

## Required Audit Checks

1. Confirm the corrected R23 WDR Git Evidence section records all three R23 commits (`bdacbcb`, `c704ea6`, `c5fde66`) with their real subjects — no placeholder, no "Commit A alone" claim.
2. Confirm both latest reports and this PM_OUTBOX have been re-oriented to R24 (lastCompletedTask = TOPLINE-P8-001-R24).
3. Confirm the canonical registry `lastUpdated` is `2026-09-15`, R24 task and `wdr-089` are registered, and `nextPlannedTask` is `TOPLINE-P8-001-R24-PM-AUDIT`.
4. Confirm the R22 / R23 Commit A ownership fields are preserved (task `commitHash` and WDR `commitHash` unchanged for both R22 and R23).
5. Confirm `git.lastCommit` in the registry remains the R22 evidence-fill Commit B hash (not replaced).
6. Confirm Phase 8 is BLOCKED, `currentTask` is null, and **TOPLINE-P8-002 has no task entry and no WDR registration anywhere in the repository**.
7. Confirm only the six allowed R24 file paths were changed; all other repository files (Core UI PRs #2/#3/#4, backend, Prisma, TLS, Trade Refinery, .claude, etc.) are unchanged.

## Stop Before P8-002

**Do not paste, prepare, or execute any P8-002 implementation prompt until the R24 PM audit is complete and owner approval is explicit.** The R24 audit is the gate. P8-002 remains unauthorized.
