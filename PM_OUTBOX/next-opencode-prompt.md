# #MPP — TOPLINE-P7-008 — Testing Foundation

## Approval

You are approved to execute exactly one governed task:

`TOPLINE-P7-008 — Testing Foundation`

Follow `#123`:

`DISCUSS → DECIDE → EXECUTE → VERIFY/AUDIT → CLOSE → NEXT`

Do not start `TOPLINE-P7-009` or any later task.

## Read First

Use the token-saving protocol. Do not reread broad history.

Read only:

1. `AGENTS.md`
2. `docs/HAIKU_EXECUTION_PROTOCOL.md`
3. `docs/PHASE-07-BACKEND-API-READINESS-PLAN.md`
4. `src/project/projectRegistry.ts`
5. Existing backend test/package config files needed for this task
6. Existing backend service/write-test patterns from P7-004 through P7-007 only as needed

## Current Governance State

P7-007 is PASS / CLOSED by PM audit:

`WDR/_All/Phase-07-Backend-API-Foundation/TOPLINE-P7-007-AUDIT_2026-09-10.md`

P7-008 is now the next approved task.

## Objective

Create a backend testing foundation for ToplineShop.

This task should establish reusable, maintainable backend test infrastructure without changing application behavior.

## Required Scope

Implement only the Testing Foundation.

Expected work:

1. Inspect current backend test setup and package scripts.
2. Add or improve Jest/unit test configuration if missing or incomplete.
3. Add reusable backend test utilities under the planned testing area, such as:
   - `backend/src/testing/test.module.ts`
   - `backend/src/testing/test.utils.ts`
   - or equivalent files if the existing backend structure requires a better local pattern.
4. Provide reusable helpers for call-tracking Prisma mocks used by P7-004 through P7-007 service tests.
5. Add at least one real Jest-based smoke/unit test proving the testing foundation works.
6. Preserve the existing standalone evidence scripts unless a safe package script wraps them without breaking their current behavior.
7. Keep all current backend build behavior passing.

## Strict Out Of Scope

Do not implement:

- `TOPLINE-P7-009`
- frontend API write methods
- auth/RBAC
- payment or settlement logic
- database migrations
- package upgrades unless absolutely required and justified in the WDR
- infrastructure/deployment changes
- vendor/category/product business behavior changes
- update/delete APIs
- any work involving `F:\OpenCode\shop.com`

Do not modify unrelated frontend files.

## Safety Rules

- Preserve unrelated user changes.
- Never use `git add .`, `git add -A`, or `git add --all`.
- Stage exact files only.
- Stop if destructive database action, secret exposure, architecture contradiction, unexpected scope expansion, or `shop.com` involvement appears.
- Do not claim tests pass unless you actually ran them.
- Record exact commit hashes.

## Verification Required

Run and report:

1. `npm run build` from `backend`
2. The new Jest/unit test command from `backend`
3. Existing relevant evidence scripts if they remain part of backend verification
4. `git diff --check`
5. `git status --short --untracked-files=all`

If any command cannot run, stop and document the exact reason.

## WDR Required

Write the WDR automatically after implementation:

`WDR/_All/Phase-07-Backend-API-Foundation/TOPLINE-P7-008_WDR_2026-09-10.md`

The WDR must include:

- task ID/title/status/date/phase
- objective
- files changed
- verification commands and real results
- scope safety confirmation
- implementation commit hash
- known limitations, if any
- clear statement that P7-009 was not started

## Registry And Reports

Update only the necessary governance files:

- `src/project/projectRegistry.ts`
- `AGENT_REPORTS/latest-status.md`
- `AGENT_REPORTS/latest-wdr-summary.md`
- `PM_OUTBOX/next-opencode-prompt.md`
- the new P7-008 WDR

Set P7-008 as implemented/pending PM audit, not PM-approved.

Reset `PM_OUTBOX/next-opencode-prompt.md` to await PM audit after the WDR is written.

## Final Response Format

Return only this easy handoff:

```text
TASK:
STATUS:
WDR:
COMMIT:
FILES CHANGED:
VERIFICATION:
STOPPED BEFORE NEXT TASK: YES
```
