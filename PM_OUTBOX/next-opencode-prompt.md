# Next OpenCode Execution Prompt

## Status

**PM prompt ready - TOPLINE-P7-003-R1 corrective task**

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

You are authorized by the PM to complete exactly one corrective governed task:

**TOPLINE-P7-003-R1 - Safe Error Logging Reconciliation**

### Goal

Correct and verify the P7-003 observability foundation so failed-request logs cannot expose raw exception details, infrastructure information, tokens, credentials, or sensitive request data.

### Read first

- `AGENTS.md`
- `docs/PROJECT_CONSTITUTION.md`
- `docs/MEGA-PROMPT-STRATEGY.md`
- `docs/PHASE-07-BACKEND-API-READINESS-PLAN.md`
- `WDR/_All/Phase-07-Backend-API-Foundation/TOPLINE-P7-003_WDR_2026-09-08.md`
- `WDR/_All/Phase-07-Backend-API-Foundation/TOPLINE-P7-003-AUDIT_2026-09-08.md`
- `src/project/projectRegistry.ts`
- `backend/src/common/interceptors/logging.interceptor.ts`
- `backend/src/common/filters/all-exceptions.filter.ts`
- `backend/src/main.ts`
- `AGENT_REPORTS/latest-status.md`
- `AGENT_REPORTS/latest-wdr-summary.md`
- `PM_OUTBOX/next-opencode-prompt.md`

Do not read, copy, import, or edit `F:\OpenCode\shop.com`.

### Required corrective work

1. Inspect the current interceptor/filter interaction and reproduce the success and failure logging paths.
2. Replace raw `error.message` logging with a safe, bounded representation that records only non-sensitive error classification/status. Do not log stack traces, exception payloads, request bodies, query values, authorization headers, cookies, tokens, database URLs, or credentials.
3. Validate or safely bound incoming correlation IDs before using them in response headers or logs. Preserve generated IDs when the incoming value is missing or unsafe.
4. Keep request method, route/path, status, duration, and correlation ID observability intact.
5. Do not change endpoint contracts or business behavior. Do not add write APIs, auth/RBAC, payments, settlement, schema changes, migrations, or unrelated packages.
6. Add focused tests or deterministic verification for sanitized error logging, correlation IDs, 404 responses, and successful health requests where the existing backend setup permits.
7. Write the corrective WDR to `WDR/_All/Phase-07-Backend-API-Foundation/TOPLINE-P7-003-R1_WDR_2026-09-08.md`.
8. Update P7-003 audit/WDR and the registry only after the safety correction is actually verified. Keep P7-004 unapproved until then.
9. Update the latest reports with the actual result.
10. Reset `PM_OUTBOX/next-opencode-prompt.md` to an awaiting state after completion and state that `TOPLINE-P7-004` is not approved.

### Hard boundaries

- Do not modify frontend product code.
- Do not implement tenant or other entity write APIs.
- Do not modify Prisma, database, migrations, auth/RBAC, payment, settlement, infrastructure, or secrets.
- Preserve unrelated modified files.
- Stage exact files only. Never use `git add .`, `git add -A`, or `git add --all`.

### Verification and closure

- Run backend type/build checks and focused tests or reproducible verification.
- Prove that representative exception messages do not appear in logs.
- Run `git diff --check`.
- Record exact files, evidence, limitations, and the real commit hash in the corrective WDR.
- Follow `DISCUSS -> DECIDE -> EXECUTE -> VERIFY/AUDIT -> CLOSE -> NEXT`.
- Commit exact files only, report the real commit hash, and stop.
