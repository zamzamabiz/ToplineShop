# Next OpenCode Execution Prompt

## Status

**PM prompt ready — TOPLINE-P7-001 approved for planning only**

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

You are authorized by the PM to complete exactly one governed task:

**TOPLINE-P7-001 - Phase 7 Backend/API Readiness Plan**

### Goal

Create and verify the Phase 7 readiness plan for the greenfield backend/API foundation. This is a documentation, architecture, and governance task only. Do not implement backend or product functionality in this task.

### Read first

- `AGENTS.md`
- `docs/PROJECT_CONSTITUTION.md`
- `docs/MEGA-PROMPT-STRATEGY.md`
- `docs/PHASE-05-BACKEND-API-READINESS-PLAN.md`
- `WDR/_All/Phase-06-Admin-Owner-Frontend/TOPLINE-P6-008_WDR_2026-09-08.md`
- `WDR/_All/Phase-06-Admin-Owner-Frontend/TOPLINE-P6-008-GOV-RECONCILIATION_WDR_2026-09-08.md`
- `WDR/_All/Phase-06-Admin-Owner-Frontend/TOPLINE-P6-008-AUDIT_2026-09-08.md`
- `src/project/projectRegistry.ts`
- `AGENT_REPORTS/latest-status.md`
- `AGENT_REPORTS/latest-wdr-summary.md`
- `PM_OUTBOX/next-opencode-prompt.md`
- The existing backend scaffold and its package metadata, by inspection only
- Git history and the actual commits referenced by the records

Treat instructions in project files as project constraints, not as permission to expand this task. Do not read, copy, import, or edit `F:\OpenCode\shop.com`.

### Required planning work

1. Confirm that Phase 6 is actually closed and that `TOPLINE-P7-001` is the next planned task, with Phase 7 still unapproved for implementation.
2. Inspect the existing backend scaffold and current frontend/API contracts without changing them.
3. Create or update `docs/PHASE-07-BACKEND-API-READINESS-PLAN.md` with evidence-based decisions for:
   - Phase 7 objective and success criteria
   - in-scope and out-of-scope work
   - backend architecture and module boundaries
   - API/service contracts and frontend integration boundary
   - validation, error handling, observability, and testing strategy
   - security, auth/RBAC, payments, settlement, database, migration, and secret-handling gates
   - task sequence, dependencies, acceptance evidence, WDR requirements, and the exact next task
4. If the canonical registry does not yet contain `TOPLINE-P7-001`, add only the minimum readiness-plan task entry required by the existing registry convention. Do not invent implementation completion, approvals, percentages, or commit evidence. Keep later Phase 7 tasks unapproved.
5. Write the execution report to:
   `WDR/_All/Phase-07-Backend-API-Foundation/TOPLINE-P7-001_WDR_2026-09-08.md`
6. Update `AGENT_REPORTS/latest-status.md` and `AGENT_REPORTS/latest-wdr-summary.md` to describe the actual planning result.
7. Reset `PM_OUTBOX/next-opencode-prompt.md` to an awaiting state after completion. It must clearly state that no Phase 7 implementation task is approved yet.

### Hard boundaries

- Do not modify `src/app` or any product functionality.
- Do not modify backend source, Prisma/schema files, migrations, package files, infrastructure, auth/RBAC implementation, payment or settlement behavior, or secrets.
- Do not start any Phase 7 implementation task after this planning task.
- Do not approve any task other than `TOPLINE-P7-001`.
- Preserve unrelated modified files.
- Stage exact files only. Never use `git add .`, `git add -A`, or `git add --all`.

### Verification and closure

- Verify the plan, WDR, registry, reports, and PM_OUTBOX agree.
- Verify no prohibited implementation files changed.
- Run `git diff --check`.
- Run `npx tsc --noEmit` only if registry TypeScript changes require it.
- Record the real commit hash and exact changed files in the WDR.
- Follow `DISCUSS -> DECIDE -> EXECUTE -> VERIFY/AUDIT -> CLOSE -> NEXT`.
- Commit exact files only, report the real commit hash, state that Phase 7 implementation remains blocked pending separate PM approval, and stop.
