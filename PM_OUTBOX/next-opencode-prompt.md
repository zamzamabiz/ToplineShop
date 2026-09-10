# Next OpenCode Execution Prompt

## Status

**Awaiting PM re-audit of P7-010-R2**

`TOPLINE-P7-010-R2` (Phase 7 Corrective Registry Source-of-Truth
Completion) is implemented and awaiting PM re-audit. See
`WDR/_All/Phase-07-Backend-API-Foundation/TOPLINE-P7-010-R2_WDR_2026-09-10.md`.

The corrective governance chain is now complete in the canonical
registry:
- `TOPLINE-P7-010` task entry + `wdr-062` (pmAudit: "BLOCKED" —
  awaiting PM audit, implementation commit `feea2bf`)
- `TOPLINE-P7-010-R1` task entry + `wdr-063` (pmAudit: "BLOCKED" —
  awaiting PM audit, implementation commit `e5decfb`)
- `TOPLINE-P7-010-R2` task entry + `wdr-064` (pmAudit: "PLANNED" —
  awaiting PM audit, registry completion commit `<P7-010-R2_HASH>`)

PM/CTO action required:
1. Re-audit P7-010 + P7-010-R1 + P7-010-R2 against the actual
   repository.
2. If blocked, write the next corrective prompt.
3. If passed, close P7-010 + P7-010-R1 + P7-010-R2 (flip
   `wdr-062`/`wdr-063`/`wdr-064.pmAudit` and the three task entries'
   `pmApproval` to `PASS`) and write the next PM prompt for Phase 8
   (Database, Auth, RBAC) planning.

## Instructions for OpenCode

1. Wait for PM to replace this section with the next approved PM prompt.
2. Do not execute any prompt that has not been PM-approved.
3. Do not infer approval for any later task.
4. Do not start Phase 8 work without explicit PM approval.

## PM Prompt

<!-- PM: Write your next execution prompt below this line -->
