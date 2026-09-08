# Next OpenCode Execution Prompt

## Status

**PM prompt ready - TOPLINE-P7-003-R2 corrective task**

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

**TOPLINE-P7-003-R2 - Safe Request Path Logging Reconciliation**

### Goal

Remove the remaining possibility of sensitive query data entering request logs. Preserve useful route observability while logging only a safe pathname or explicitly allowlisted non-sensitive query information.

### Read first

- `AGENTS.md`
- `docs/PROJECT_CONSTITUTION.md`
- `docs/MEGA-PROMPT-STRATEGY.md`
- `docs/PHASE-07-BACKEND-API-READINESS-PLAN.md`
- `WDR/_All/Phase-07-Backend-API-Foundation/TOPLINE-P7-003_WDR_2026-09-08.md`
- `WDR/_All/Phase-07-Backend-API-Foundation/TOPLINE-P7-003-AUDIT_2026-09-08.md`
- `WDR/_All/Phase-07-Backend-API-Foundation/TOPLINE-P7-003-R1_WDR_2026-09-08.md`
- `WDR/_All/Phase-07-Backend-API-Foundation/TOPLINE-P7-003-R1-AUDIT_2026-09-08.md`
- `backend/src/common/interceptors/logging.interceptor.ts`
- `backend/src/common/filters/all-exceptions.filter.ts`
- `backend/src/main.ts`
- `src/project/projectRegistry.ts`
- `AGENT_REPORTS/latest-status.md`
- `AGENT_REPORTS/latest-wdr-summary.md`
- `PM_OUTBOX/next-opencode-prompt.md`

Do not read, copy, import, or edit `F:\OpenCode\shop.com`.

### Required corrective work

1. Replace raw `request.url` logging with a safe route/path representation that excludes query strings by default.
2. If any query information is retained, use an explicit allowlist limited to known non-sensitive keys and document the decision. Never log arbitrary query values.
3. Apply the same safe path rule in both the logging interceptor and exception filter.
4. Preserve method, status, duration, correlation ID, and safe error-code observability.
5. Add focused verification proving that a request containing a sensitive-looking query value does not emit that value in logs.
6. Do not change endpoint contracts, business logic, frontend code, database/schema/migrations, auth/RBAC, payments, settlement, or packages.
7. Write the WDR to `WDR/_All/Phase-07-Backend-API-Foundation/TOPLINE-P7-003-R2_WDR_2026-09-08.md`.
8. Update P7-003 and R1 audit/WDR records and the registry only after verification passes. Keep P7-004 unapproved until then.
9. Update the latest reports and reset PM_OUTBOX to awaiting state after completion.

### Verification and closure

- Run backend type/build checks and focused tests or deterministic verification.
- Prove raw exception messages, stack traces, sensitive correlation IDs, and sensitive query values are absent from logs.
- Run `git diff --check`.
- Stage exact files only. Never use `git add .`, `git add -A`, or `git add --all`.
- Record exact files, limitations, and the real commit hash in the WDR, commit, report the hash, and stop.
