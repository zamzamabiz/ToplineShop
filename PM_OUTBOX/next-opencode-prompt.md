# Next OpenCode Execution Prompt

## Status

**PM prompt ready - TOPLINE-P7-002-R1 approved**

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

**TOPLINE-P7-002-R1 - API Connectivity and Configuration Reconciliation**

### Goal

Resolve and verify the API connectivity failure discovered during the P7-002 WDR audit. The frontend currently defaults to port `3001`, while the NestJS backend listens on port `4000`; the frontend environment variable name also differs from the client code. Reconcile the configuration and prove that the dashboard read requests can reach the backend.

### Read first

- `AGENTS.md`
- `docs/PROJECT_CONSTITUTION.md`
- `docs/MEGA-PROMPT-STRATEGY.md`
- `docs/PHASE-07-BACKEND-API-READINESS-PLAN.md`
- `WDR/_All/Phase-07-Backend-API-Foundation/TOPLINE-P7-002_WDR_2026-09-08.md`
- `WDR/_All/Phase-07-Backend-API-Foundation/TOPLINE-P7-001-AUDIT_2026-09-08.md`
- `src/project/projectRegistry.ts`
- `src/lib/api-client.ts`
- `.env.example` and `backend/.env.example`
- `backend/src/main.ts`
- `backend/scripts/smoke-health.js`
- `AGENT_REPORTS/latest-status.md`
- `AGENT_REPORTS/latest-wdr-summary.md`
- `PM_OUTBOX/next-opencode-prompt.md`
- The relevant active readiness/configuration documents that reference the API port

Do not read, copy, import, or edit `F:\OpenCode\shop.com`.

### Required work

1. Confirm the failure with evidence before editing. Determine whether it is caused by the port mismatch, environment-variable mismatch, missing CORS configuration, the backend not running, or a combination.
2. Establish one canonical frontend API configuration. It must use the actual backend port from the repository configuration, avoid conflicting variable names, and preserve a clearly documented override for other environments.
3. Update only the necessary frontend API client and safe example/configuration documentation. Do not alter historical WDR claims merely to hide history.
4. If runtime verification proves cross-origin requests are blocked, add the minimum safe development CORS configuration to the backend bootstrap. Keep allowed origins explicit and environment-driven; do not add auth, write APIs, or unrelated middleware.
5. Do not change backend business logic, database behavior, Prisma schema, migrations, packages, or endpoint contracts.
6. Verify the backend health and at least the affected read endpoints on the configured port. Verify the frontend dashboard can fetch successfully in the available browser environment. If browser verification is unavailable, report the exact limitation and provide command-level evidence instead.
7. Write the corrective WDR to:
   `WDR/_All/Phase-07-Backend-API-Foundation/TOPLINE-P7-002-R1_WDR_2026-09-08.md`
8. Update the P7-002 WDR audit/approval status only according to the evidence. Do not claim P7-002 fully reconciled if runtime connectivity remains unverified or broken.
9. Update the canonical registry and WDR registry entry for `TOPLINE-P7-002-R1` using the existing convention. Keep `TOPLINE-P7-003` unapproved and do not start it.
10. Update `AGENT_REPORTS/latest-status.md` and `AGENT_REPORTS/latest-wdr-summary.md` with the actual result.
11. Reset `PM_OUTBOX/next-opencode-prompt.md` to an awaiting state after completion and state that `TOPLINE-P7-003` is not approved.

### Hard boundaries

- Do not implement observability, entity write APIs, auth/RBAC, payments, settlement, orders, or any later Phase 7 task.
- Do not modify Prisma schema, migrations, database records, secrets, infrastructure, or unrelated frontend features.
- Do not change the backend port unless repository evidence proves that the documented `4000` port is incorrect.
- Do not read or touch `F:\OpenCode\shop.com`.
- Preserve unrelated modified files.
- Stage exact files only. Never use `git add .`, `git add -A`, or `git add --all`.

### Verification and closure

- Run the relevant frontend and backend type/build checks.
- Run the existing backend health smoke check or an equivalent read-only request set.
- Verify the configured frontend-to-backend request path, including CORS only if required.
- Run `git diff --check`.
- Confirm no prohibited scope changed.
- Record exact changed files, runtime evidence, limitations, and the real commit hash in the WDR.
- Follow `DISCUSS -> DECIDE -> EXECUTE -> VERIFY/AUDIT -> CLOSE -> NEXT`.
- Commit exact files only, report the real commit hash, and stop.
