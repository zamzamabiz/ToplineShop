# Next OpenCode Execution Prompt

## Status

**PM prompt ready**

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
`TOPLINE-P7-005 — Vendor Write API`

Current evidence to read:
- `WDR/_All/Phase-07-Backend-API-Foundation/TOPLINE-P7-004-R2-AUDIT_2026-09-10.md`
- `docs/PHASE-07-BACKEND-API-READINESS-PLAN.md` only where it defines P7-005/vendor write scope
- `backend/src/vendors/`
- `backend/src/common/`
- `backend/src/prisma/prisma.service.ts`

Objective:
Implement the approved Vendor Write API scope for creating vendors, using the existing backend response, validation, and error patterns.

Scope:
- Allowed: `POST /vendors`, create-vendor DTO, vendor service create method, focused vendor create tests, governance records, WDR.
- Forbidden: frontend API client writes, category/product writes, tenant write changes beyond using tenant existence validation if required, payment, settlement, auth/RBAC, packages, migrations, infrastructure, secrets, `shop.com`.
- Do not start `TOPLINE-P7-006` or later.

Required work:
1. Inspect existing vendor read endpoints and Prisma `Vendor` model before editing.
2. Add `CreateVendorDto` using actual schema fields needed for vendor creation.
3. Add `VendorsService.create()` with input validation support, duplicate slug detection, tenant existence handling, and safe response envelope.
4. Add `POST /vendors` controller endpoint returning the established success/error shapes.
5. Add focused tests that import real compiled DTO/service code after build and exercise real `VendorsService.create()` against a call-tracking mocked Prisma dependency.
6. Preserve all read APIs and do not expand scope.

Verification:
- `npm run build` from `backend`
- Run the corrected vendor create tests from `backend`
- `git diff --check`
- Confirm no unauthorized scope changes

After completion:
- Write WDR at `WDR/_All/Phase-07-Backend-API-Foundation/TOPLINE-P7-005_WDR_2026-09-10.md`
- Include a "Prompt Used" section in the WDR containing this prompt or a faithful summary of it.
- Update `src/project/projectRegistry.ts`
- Update `AGENT_REPORTS/latest-status.md`
- Update `AGENT_REPORTS/latest-wdr-summary.md`
- Reset `PM_OUTBOX/next-opencode-prompt.md` to awaiting PM prompt
- Commit exact files only. Never use `git add .`, `git add -A`, or `git add --all`.
- Report WDR path, real commit hash, files changed, verification results, then stop.

Do not start `TOPLINE-P7-006`.

<!-- PM: End of prompt -->
