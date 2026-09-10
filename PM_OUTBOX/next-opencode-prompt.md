# #MM — TOPLINE-P7-008-R1 — Testing Foundation Registry Reconciliation

## Approval

You are approved to execute exactly one corrective governed task:

`TOPLINE-P7-008-R1 — Testing Foundation Registry Reconciliation`

Follow `#123`:

`DISCUSS → DECIDE → EXECUTE → VERIFY/AUDIT → CLOSE → NEXT`

Do not start `TOPLINE-P7-009` or any later task.

## Read First

Use the token-saving protocol. Read only:

1. `AGENTS.md`
2. `docs/HAIKU_EXECUTION_PROTOCOL.md`
3. `src/project/projectRegistry.ts`
4. `WDR/_All/Phase-07-Backend-API-Foundation/TOPLINE-P7-008_WDR_2026-09-10.md`
5. `WDR/_All/Phase-07-Backend-API-Foundation/TOPLINE-P7-008-AUDIT_2026-09-10.md`
6. `AGENT_REPORTS/latest-status.md`
7. `AGENT_REPORTS/latest-wdr-summary.md`
8. `PM_OUTBOX/next-opencode-prompt.md`

## Audit Finding To Correct

P7-008 backend implementation evidence passes, but PM audit is BLOCKED.

Problem:

`src/project/projectRegistry.ts` has:

- root summary fields referencing `TOPLINE-P7-008`
- `wdr-058` for `TOPLINE-P7-008`

But it does **not** have a task-list entry with:

`id: "TOPLINE-P7-008"`

The WDR claimed the task entry was added, but the actual repository does not contain it.

## Required Correction

1. Add the missing `TOPLINE-P7-008` task entry in `src/project/projectRegistry.ts` in the correct Phase 7 task-list location after `TOPLINE-P7-007`.
2. The task entry must describe Testing Foundation accurately:
   - title: `Testing Foundation`
   - status/build/tests: `PASS`
   - pmApproval: `PLANNED`
   - commitHash: `2197d84`
   - wdrPath: `WDR/_All/Phase-07-Backend-API-Foundation/TOPLINE-P7-008_WDR_2026-09-10.md`
   - notes must mention Jest testing foundation, reusable Prisma mock, service test harness, proof spec, 12/12 Jest tests, and preserved evidence scripts.
3. Ensure root summary fields correctly show P7-008 implemented/pending PM audit, with next planned task `TOPLINE-P7-009`.
4. Ensure `wdr-058` remains present and consistent.
5. Update `AGENT_REPORTS/latest-status.md`, `AGENT_REPORTS/latest-wdr-summary.md`, and `PM_OUTBOX/next-opencode-prompt.md` to reflect P7-008-R1 completed and awaiting PM audit.
6. Write corrected WDR:

`WDR/_All/Phase-07-Backend-API-Foundation/TOPLINE-P7-008-R1_WDR_2026-09-10.md`

## Strict Out Of Scope

- Do not change backend testing implementation unless a verification command exposes a real break.
- Do not modify frontend files.
- Do not start `TOPLINE-P7-009`.
- Do not implement frontend API client write methods.
- Do not add packages.
- Do not modify migrations, auth/RBAC, payment, settlement, infrastructure, deployment, secrets, or business behavior.
- Do not touch `F:\OpenCode\shop.com`.

## Verification Required

Run and report:

1. `npm run build` from `backend`
2. `npm test` from `backend`
3. `git diff --check`
4. `git status --short --untracked-files=all`
5. A targeted search proving `id: "TOPLINE-P7-008"` exists in `src/project/projectRegistry.ts`

## Git Rules

- Preserve unrelated user changes.
- Never use `git add .`, `git add -A`, or `git add --all`.
- Stage exact files only.
- Commit the correction and report the exact commit hash.

## Final Response Format

Return only:

```text
TASK:
STATUS:
WDR:
COMMIT:
FILES CHANGED:
VERIFICATION:
STOPPED BEFORE NEXT TASK: YES
```
