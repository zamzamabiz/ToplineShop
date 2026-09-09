# Next OpenCode Execution Prompt

## Status

**PM prompt ready**

`TOPLINE-P7-006` (Category Write API) is approved and closed — see
`WDR/_All/Phase-07-Backend-API-Foundation/TOPLINE-P7-006-AUDIT_2026-09-10.md`.
Next approved governed task: `TOPLINE-P7-007 — Product Write API`.

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

<!-- PM: Write your next execution prompt below this line -->

You are executing one PM-approved ToplineShop task as the coding agent.

Follow:
- `AGENTS.md`
- `docs/HAIKU_EXECUTION_PROTOCOL.md`
- `src/project/projectRegistry.ts` as canonical current state

Task:
`TOPLINE-P7-007 — Product Write API`

Current evidence to read:
- `WDR/_All/Phase-07-Backend-API-Foundation/TOPLINE-P7-006-AUDIT_2026-09-10.md`
- `docs/PHASE-07-BACKEND-API-READINESS-PLAN.md` only where it defines P7-007/product write scope
- `backend/src/products/`
- `backend/src/common/`
- `backend/src/prisma/prisma.service.ts`

Objective:
Implement the approved Product Write API scope for creating products, using the existing backend response, validation, and error patterns.

Scope:
- Allowed: `POST /products`, create-product DTO, product service create method, focused product create tests, governance records, WDR.
- Forbidden: frontend API client writes, update/delete APIs, category/vendor/tenant write changes beyond read-only existence validation if required, payment, settlement, auth/RBAC, packages, migrations, infrastructure, secrets, `shop.com`.
- Do not start `TOPLINE-P7-008` or later.

Required work:
1. Inspect existing product read endpoints and Prisma `Product` model before editing.
2. Add `CreateProductDto` using actual schema fields needed for product creation.
3. Add `ProductsService.create()` with input validation support, tenant/vendor/category existence handling, same-tenant relationship safety, duplicate `(tenantId, slug)` detection, decimal/basePrice handling, currency validation, stock/status handling, and safe response envelope.
4. Add `POST /products` controller endpoint returning the established success/error shapes.
5. Add focused tests that import real compiled DTO/service code after build and exercise real `ProductsService.create()` against a call-tracking mocked Prisma dependency.
6. Preserve all read APIs and do not expand scope.

Verification:
- `npm run build` from `backend`
- Run the product create tests from `backend`
- `git diff --check`
- Confirm no unauthorized scope changes

After completion:
- Write WDR at `WDR/_All/Phase-07-Backend-API-Foundation/TOPLINE-P7-007_WDR_2026-09-10.md`
- Include a "Prompt Used" section in the WDR containing this prompt or a faithful summary of it.
- Update `src/project/projectRegistry.ts`
- Update `AGENT_REPORTS/latest-status.md`
- Update `AGENT_REPORTS/latest-wdr-summary.md`
- Reset `PM_OUTBOX/next-opencode-prompt.md` to awaiting PM prompt
- Commit exact files only. Never use `git add .`, `git add -A`, or `git add --all`.
- Report WDR path, real commit hash, files changed, verification results, then stop.

Do not start `TOPLINE-P7-008`.
