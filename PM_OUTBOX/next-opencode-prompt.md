# Next OpenCode Execution Prompt

## Status

**PM prompt ready - TOPLINE-P7-002 approved**

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

**TOPLINE-P7-002 - Error Handling + Validation Foundation**

### Goal

Implement the shared NestJS error-handling and request-validation foundation identified in the approved Phase 7 readiness plan. Keep the work limited to reusable backend infrastructure. Do not implement entity write APIs, auth/RBAC, payments, settlement, or later Phase 7 tasks.

### Read first

- `AGENTS.md`
- `docs/PROJECT_CONSTITUTION.md`
- `docs/MEGA-PROMPT-STRATEGY.md`
- `docs/PHASE-07-BACKEND-API-READINESS-PLAN.md`
- `WDR/_All/Phase-07-Backend-API-Foundation/TOPLINE-P7-001_WDR_2026-09-08.md`
- `WDR/_All/Phase-07-Backend-API-Foundation/TOPLINE-P7-001-AUDIT_2026-09-08.md`
- `src/project/projectRegistry.ts`
- `AGENT_REPORTS/latest-status.md`
- `AGENT_REPORTS/latest-wdr-summary.md`
- `PM_OUTBOX/next-opencode-prompt.md`
- Existing files under `backend/src`, `backend/package.json`, and the lockfile

Do not read, copy, import, or edit `F:\OpenCode\shop.com`.

### Required implementation

1. Inspect the existing NestJS application, response conventions, controllers, and current build configuration before editing.
2. Add a shared validation foundation using the project plan's agreed approach. Configure global validation with `whitelist`, `forbidNonWhitelisted`, and transformation only where compatible with the existing application.
3. Add a shared global exception/error-handling layer that returns a consistent safe API error shape, maps known HTTP and validation failures correctly, and does not expose stack traces or secrets in responses.
4. Integrate the foundation into the existing NestJS bootstrap without changing existing read endpoint behavior except for the intended consistent error responses.
5. Add only the minimum dependencies required by the chosen implementation, and update the lockfile consistently. Do not add unrelated packages.
6. Add focused verification for the new foundation where the existing backend test setup supports it. Do not create the full testing foundation assigned to P7-008.
7. Write the WDR to `WDR/_All/Phase-07-Backend-API-Foundation/TOPLINE-P7-002_WDR_2026-09-08.md`.
8. Update the canonical registry and reports to reflect only the actual completion state of P7-002. Do not mark P7-003 or any write-API task complete. Keep the next planned task accurate.
9. Reset `PM_OUTBOX/next-opencode-prompt.md` to an awaiting state after completion and state that P7-003 is not approved.

### Hard boundaries

- Do not modify `src/app` or frontend product functionality.
- Do not add POST, PATCH, or DELETE entity endpoints.
- Do not modify Prisma schema, migrations, database behavior, auth/RBAC, payment, settlement, order logic, infrastructure, or secrets.
- Do not start P7-003 or any later task.
- Preserve unrelated modified files.
- Stage exact files only. Never use `git add .`, `git add -A`, or `git add --all`.

### Verification and closure

- Run backend type/build checks and focused tests that are available.
- Verify existing read endpoints still compile and the error response shape is safe.
- Run `git diff --check`.
- Confirm no prohibited scope changed.
- Record exact changed files and the real commit hash in the WDR.
- Follow `DISCUSS -> DECIDE -> EXECUTE -> VERIFY/AUDIT -> CLOSE -> NEXT`.
- Commit exact files only, report the real commit hash, and stop.
