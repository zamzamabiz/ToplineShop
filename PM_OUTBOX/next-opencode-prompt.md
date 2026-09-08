# Next OpenCode Execution Prompt

## Status

**PM prompt ready - TOPLINE-P7-003 approved**

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

**TOPLINE-P7-003 - Observability + Logging Foundation**

### Goal

Implement the shared NestJS observability foundation defined in the approved Phase 7 readiness plan. Add safe request logging, correlation/request identification, and duration/status visibility without changing business behavior or implementing write APIs.

### Read first

- `AGENTS.md`
- `docs/PROJECT_CONSTITUTION.md`
- `docs/MEGA-PROMPT-STRATEGY.md`
- `docs/PHASE-07-BACKEND-API-READINESS-PLAN.md`
- `WDR/_All/Phase-07-Backend-API-Foundation/TOPLINE-P7-002_WDR_2026-09-08.md`
- `WDR/_All/Phase-07-Backend-API-Foundation/TOPLINE-P7-002-R1_WDR_2026-09-08.md`
- `WDR/_All/Phase-07-Backend-API-Foundation/TOPLINE-P7-002-R1-AUDIT_2026-09-08.md`
- `src/project/projectRegistry.ts`
- Existing files under `backend/src`, especially bootstrap, filters, response helpers, and controllers
- `AGENT_REPORTS/latest-status.md`
- `AGENT_REPORTS/latest-wdr-summary.md`
- `PM_OUTBOX/next-opencode-prompt.md`

Do not read, copy, import, or edit `F:\OpenCode\shop.com`.

### Required implementation

1. Inspect current logging and error-handling behavior before editing.
2. Add a reusable NestJS logging/interceptor foundation that records request method, path, status, duration, and a request/correlation identifier.
3. Preserve the existing safe error response behavior. Never log authorization headers, cookies, passwords, tokens, database URLs, secrets, or full sensitive request bodies.
4. Integrate the observability foundation into the existing bootstrap with minimal behavior change.
5. Use existing dependencies where possible. Add no package unless technically necessary and justified in the WDR.
6. Do not add entity write APIs, auth/RBAC, payments, settlement, database changes, migrations, or frontend changes.
7. Write the WDR to `WDR/_All/Phase-07-Backend-API-Foundation/TOPLINE-P7-003_WDR_2026-09-08.md`.
8. Update the registry and reports only for the actual completion of P7-003. Keep P7-004 and later tasks unapproved.
9. Reset `PM_OUTBOX/next-opencode-prompt.md` to an awaiting state after completion and state that P7-004 is not approved.

### Verification and closure

- Run backend type/build checks and focused tests available in the repository.
- Verify successful and failing requests produce useful, non-sensitive logs.
- Verify the existing error response contract remains intact.
- Run `git diff --check` and confirm no prohibited scope changed.
- Record exact files, verification evidence, limitations, and the real commit hash in the WDR.
- Follow `DISCUSS -> DECIDE -> EXECUTE -> VERIFY/AUDIT -> CLOSE -> NEXT`.
- Stage exact files only. Never use `git add .`, `git add -A`, or `git add --all`.
- Commit exact files only, report the real commit hash, and stop.
