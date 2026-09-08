# Next OpenCode Execution Prompt

## Status

**PM prompt ready - Phase 6 governance reconciliation approved**

## Instructions for OpenCode

1. Execute only the prompt written in the `PM Prompt` section below.
2. Do not execute any other instructions or assumptions.
3. After execution, write the required WDR.
4. After execution, update:
   - `AGENT_REPORTS/latest-status.md`
   - `AGENT_REPORTS/latest-wdr-summary.md`
5. Stop after one governed task.
6. Do not proceed to the next task without PM approval.

## PM Prompt

<!-- PM: Write your next execution prompt below this line -->

Execute exactly one governance-only remediation task: **TOPLINE-P6-008-GOV-RECONCILIATION**.

This task is approved by PM to correct the findings in `WDR/_All/Phase-06-Admin-Owner-Frontend/TOPLINE-P6-008-AUDIT_2026-09-08.md`. It must not add product functionality or begin Phase 7.

## Required Corrections

1. Reconcile P6-001 through P6-006 closure records across their WDRs, `src/project/projectRegistry.ts`, and the agent reports. Use evidence already present in the WDRs and git history; do not invent approvals or commit hashes.
2. For P6-001, reconcile the known commit `388bfe5` consistently in the WDR Git Evidence and registry task entry, if git evidence confirms it remains the accepted task commit.
3. Correct P6-008 wording so it says all routes compile and source inspection passed, while browser verification was unavailable. Do not claim visual or interaction verification without browser evidence.
4. Remove or replace obsolete `PM DECISION REQUIRED` wording from already PM-approved P6-007 and P6-008 WDR sections, while preserving the approval decisions.
5. Reconcile the closed Phase 6 current-task state. Keep `TOPLINE-P7-001` as the next planned but unapproved task; do not mark it approved or active.
6. Reconcile `git.lastCommit` only with a real commit hash. If the cleanup commit changes the final repository state, perform an exact-file hash backfill so the registry records the actual final accepted commit.
7. Resolve the Phase 6 `megaPromptsCompleted` discrepancy only from documented project convention and git/PM evidence. If no reliable convention exists, leave the value unchanged and document why it is intentionally separate from `completedTaskCount`.
8. Add a short resolution section to the analytic audit report listing each finding as resolved, retained with rationale, or blocked by missing evidence.

## Verification and Boundaries

- Run `npx tsc --noEmit`, `npm run lint`, and `npm run build` only if needed to confirm that governance edits did not affect compilation.
- Verify exact file paths, WDR links, registry fields, reports, PM_OUTBOX state, and commit hashes after editing.
- Do not modify `src/app`, backend, database, Prisma, migrations, auth/RBAC, payments, write APIs, packages, or infrastructure.
- Do not read, copy, import, or edit `F:\OpenCode\shop.com`.
- Preserve the unrelated modified governance file.
- Stage exact files only. Never use `git add .`, `git add -A`, or `git add --all`.
- Update the affected WDRs, analytic audit report, registry, and latest reports as justified by evidence.
- Commit exact files only with a clear governance-reconciliation message, report the real commit hash, and stop.
- Do not start `TOPLINE-P7-001` or any later task.

<!-- PM: End of prompt -->
