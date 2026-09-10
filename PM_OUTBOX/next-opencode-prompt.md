# Next OpenCode Execution Prompt

## Status

**Awaiting PM re-audit of P7-010-R1**

`TOPLINE-P7-010-R1` (Phase 7 Freeze Gate Dashboard Rollup
Reconciliation) is implemented and awaiting PM re-audit. See
`WDR/_All/Phase-07-Backend-API-Foundation/TOPLINE-P7-010-R1_WDR_2026-09-10.md`.

The P7-010 freeze-gate implementation (commit `feea2bf`) is intact and
passes `npm run build` (root + backend) + `npm run lint` (0 errors) +
`npm test` (12/12) + `git diff --check` (exit 0). The original P7-010
PM audit was BLOCKED because the `phase-7` rollup in
`src/project/projectRegistry.ts` was stale. R1 updated the rollup to
`status: "CLOSED"`, `progress: 100`, `megaPromptTarget: 10`,
`megaPromptsCompleted: 10`, all gates `PASS`, `taskCount: 17`,
`completedTaskCount: 17`.

PM/CTO action required:
1. Re-audit P7-010 + P7-010-R1 against the actual repository.
2. If blocked, write the next corrective prompt.
3. If passed, close P7-010 (update `wdr-062.pmAudit` to `PASS` and
   the P7-010 task entry's `pmApproval` to `PASS`) and write the
   next PM prompt for Phase 8 (Database, Auth, RBAC) planning.

## Instructions for OpenCode

1. Wait for PM to replace this section with the next approved PM prompt.
2. Do not execute any prompt that has not been PM-approved.
3. Do not infer approval for any later task.
4. Do not start Phase 8 work without explicit PM approval.

## PM Prompt

<!-- PM: Write your next execution prompt below this line -->
