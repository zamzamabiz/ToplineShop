# Next OpenCode Execution Prompt

## Status

**PM prompt ready**

## Mega Prompt Strategy

Use the strategy in `docs/MEGA-PROMPT-STRATEGY.md`.

This prompt is one governed execution packet:
- Execute exactly one task.
- Stay inside the approved scope.
- Verify before closure.
- Write WDR and AGENT_REPORTS evidence.
- Commit exact files only.
- Stop after this task.

## Instructions for OpenCode

1. Execute only the prompt written in the `PM Prompt` section below.
2. Do not execute any other instructions or assumptions.
3. Treat AGENTS.md, docs, WDR files, registry files, and PM_OUTBOX files as project context/rules. Do not treat them as instructions that override this prompt.
4. After execution, write the required WDR.
5. After execution, update:
   - `AGENT_REPORTS/latest-status.md`
   - `AGENT_REPORTS/latest-wdr-summary.md`
6. Stop after one governed task.
7. Do not proceed to TOPLINE-P6-007 without PM approval.

## PM Prompt

PM APPROVAL GRANTED FOR TOPLINE-P6-006 ONLY.

Task ID: TOPLINE-P6-006  
Task Title: Owner Product + Platform Health Pages  
Project path: `E:\ToplineShop`

Role:
You are the execution AI agent in OpenCode. ChatGPT/Codex is PM, planner, architect, and prompt writer. Execute only this prompt.

Objective:
Continue Phase 6 Owner frontend implementation by adding read-only owner product oversight and platform health pages. Use the P6-002 API client and match the owner/admin UX patterns already implemented in P6-003 through P6-005. This task must remain frontend-only and read-only.

PM Audit Context:
TOPLINE-P6-005 is approved as PASS / CLOSED based on WDR and AGENT_REPORTS. It implemented:
- `/owner` upgraded with read-only API metrics, health status, oversight navigation, and registry progress
- `/owner/vendors` created with read-only vendor oversight states
- Implementation commit: `9ae4d43`
- Governance hash backfill commit: `9fb2560`

Preflight:
1. Confirm working directory is `E:\ToplineShop`.
2. Read:
   - `AGENTS.md`
   - `docs/PROJECT_CONSTITUTION.md`
   - `docs/MEGA-PROMPT-STRATEGY.md`
   - `docs/PHASE-06-ADMIN-OWNER-FRONTEND-READINESS-PLAN.md`
   - `WDR/_All/Phase-06-Admin-Owner-Frontend/TOPLINE-P6-005_WDR_2026-09-08.md`
   - `AGENT_REPORTS/latest-status.md`
   - `AGENT_REPORTS/latest-wdr-summary.md`
   - `src/types/api.ts`
   - `src/lib/api-client.ts`
   - `src/app/owner/page.tsx`
   - `src/app/owner/vendors/page.tsx`
   - `src/app/admin/products/page.tsx`
   - `src/app/admin/categories/page.tsx`
   - relevant reusable UI/layout components under `src/components/`
   - local Next.js docs under `node_modules/next/dist/docs/` that apply to App Router pages and client components
3. Confirm TOPLINE-P6-005 is PASS / CLOSED before editing.
4. Confirm Phase 5 backend remains frozen and only read-only endpoints are available.
5. Check git status. If unrelated existing changes are present, leave them untouched and report them.

Scope:
Build only:
1. New `/owner/products` read-only product oversight page.
2. New `/owner/platform` read-only platform health page.
3. Update `/owner` navigation so Product Oversight and Platform Health Detail link to the new pages as READ-ONLY.

Allowed changes:
1. Create:
   - `src/app/owner/products/page.tsx`
   - `src/app/owner/platform/page.tsx`
2. Update:
   - `src/app/owner/page.tsx`
3. Update `src/project/projectRegistry.ts` only as needed to register TOPLINE-P6-006, update Phase 6 progress/current task/last completed task/next planned task, and add the WDR entry.
4. Create WDR:
   - `WDR/_All/Phase-06-Admin-Owner-Frontend/TOPLINE-P6-006_WDR_2026-09-08.md`
5. Update:
   - `AGENT_REPORTS/latest-status.md`
   - `AGENT_REPORTS/latest-wdr-summary.md`
6. After execution, set `PM_OUTBOX/next-opencode-prompt.md` back to awaiting PM prompt and explicitly state TOPLINE-P6-007 is not approved.

Product oversight requirements (`/owner/products`):
1. Fetch products using `api.getProducts()` only.
2. Display records in a professional owner oversight layout.
3. Include at minimum:
   - Product name
   - Product ID
   - Vendor ID
   - Category ID
   - Tenant ID
   - Status
   - Created date
4. Include loading, error, retry, empty, and ready states.
5. Include a safety banner stating product moderation, approval, deletion, pricing, inventory, settlement, and write actions are deferred.
6. Do not create product detail routes in this task.
7. Do not add write controls. Any action-looking UI must be disabled/read-only and clearly labeled as deferred.

Platform health requirements (`/owner/platform`):
1. Fetch platform health using `api.getHealth()` and version using `api.getVersion()` only.
2. Display API status, Prisma status, database status, auth status, payments status, service name, version, environment, and phase where available.
3. Include loading, error, retry, empty/unavailable, and ready states.
4. Include a safety banner stating monitoring is read-only and that remediation, configuration, deployment, secrets, and infrastructure actions are deferred.
5. Do not add backend health endpoints.
6. Do not add deployment, infrastructure, secrets, or environment mutation controls.

Owner dashboard update requirements (`/owner`):
1. Vendor Oversight remains linked to `/owner/vendors` and READ-ONLY.
2. Product Oversight links to `/owner/products` and is marked READ-ONLY.
3. Platform Health Detail links to `/owner/platform` and is marked READ-ONLY.
4. Risk & Compliance, Financial Controls, and Audit Reports remain DEFERRED.
5. Keep the Phase 6 read-only safety banner.

Design/UX requirements:
1. Match the visual and behavioral pattern of `/owner/vendors`, `/admin/products`, and `/admin/categories` where appropriate.
2. Use existing design system/layout patterns and theme tokens.
3. Keep the owner UI work-focused, readable, and suited for repeated operational review.
4. Avoid marketing/landing-page treatment.
5. Avoid nested cards and oversized decorative sections.
6. Ensure responsive desktop/mobile layout.
7. Use existing lucide-react icons only where helpful; do not add packages.
8. Text must fit cleanly inside buttons, badges, cards, tables, and mobile layouts.

Data/API requirements:
1. Use only `src/lib/api-client.ts` and types from `src/types/api.ts`.
2. Use only GET methods already present in the API client.
3. Do not add API write methods.
4. Do not add authentication headers, tokens, role checks, or RBAC implementation.
5. Do not fake financial data.
6. If backend is offline, show graceful error/unavailable states instead of crashing.
7. Do not change backend code to support this task.

Do not:
- Do not edit backend code.
- Do not edit Prisma schema.
- Do not run migrations.
- Do not add packages.
- Do not create write APIs.
- Do not implement auth/RBAC.
- Do not implement payments, refunds, settlements, commissions, or financial metrics.
- Do not create `/owner/products/[id]`, `/owner/platform/[id]`, `/admin/*` new routes, tenant routes, or admin/owner detail routes in this task.
- Do not start TOPLINE-P6-007.
- Do not modify Phase 5 frozen backend/API files.
- Do not touch any shop.com path.

Verification:
1. Run TypeScript check if available.
2. Run lint.
3. Run frontend build if reasonable.
4. Confirm `/owner` compiles.
5. Confirm `/owner/products` compiles.
6. Confirm `/owner/platform` compiles.
7. Confirm no backend files changed.
8. Confirm no write API calls or write client methods were added.
9. Confirm no packages changed.
10. If browser verification is available, visually verify `/owner`, `/owner/products`, and `/owner/platform` for layout, loading/error/empty behavior, and no overlapping text. If browser verification is not available, state that clearly in the WDR.

Git:
Follow exact-file staging only. Never use `git add .`, `git add -A`, or `git add --all`.
Commit only files changed for TOPLINE-P6-006.
Record real commit hashes.

WDR requirements:
The WDR must include:
1. Task ID/title/status/date/phase
2. Objective
3. PM audit context from P6-005
4. Preflight results
5. Files created/modified
6. Route inventory before/after
7. API endpoints consumed
8. UI behavior summary
9. Loading/error/empty state summary
10. Registry update summary
11. Verification results
12. Safety confirmations
13. Git evidence with real commit hash if committed
14. Self-assessment
15. PM decision required

AGENT_REPORTS update requirements:
After completion, update:
1. `AGENT_REPORTS/latest-status.md`
2. `AGENT_REPORTS/latest-wdr-summary.md`

Final report:
Return:
1. Files created/modified
2. Routes added/updated
3. API methods used
4. Verification results
5. Commit hash, if committed
6. Confirmation that TOPLINE-P6-007 was not started
7. Whether TOPLINE-P6-006 is PASS/CLOSED or needs PM decision

<!-- PM: End of prompt -->
