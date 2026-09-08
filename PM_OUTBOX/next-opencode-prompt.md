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
7. Do not proceed to TOPLINE-P6-008 without PM approval.

## PM Prompt

PM APPROVAL GRANTED FOR TOPLINE-P6-007 ONLY.

Task ID: TOPLINE-P6-007  
Task Title: Admin/Owner Detail Pages  
Project path: `E:\ToplineShop`

Role:
You are the execution AI agent in OpenCode. ChatGPT/Codex is PM, planner, architect, and prompt writer. Execute only this prompt.

Objective:
Continue Phase 6 Admin & Platform Owner frontend implementation by adding safe read-only detail pages for existing admin and owner list flows. Use the P6-002 API client and match the admin/owner UX patterns implemented in P6-003 through P6-006. This task must remain frontend-only and read-only.

PM Audit Context:
TOPLINE-P6-006 is approved as PASS / CLOSED based on WDR and AGENT_REPORTS. It implemented:
- `/owner/products` read-only product oversight page
- `/owner/platform` read-only platform health page
- `/owner` navigation updated with Product Oversight and Platform Health Detail READ-ONLY links
- Commit: `2ac252b`

Preflight:
1. Confirm working directory is `E:\ToplineShop`.
2. Read:
   - `AGENTS.md`
   - `docs/PROJECT_CONSTITUTION.md`
   - `docs/MEGA-PROMPT-STRATEGY.md`
   - `docs/PHASE-06-ADMIN-OWNER-FRONTEND-READINESS-PLAN.md`
   - `WDR/_All/Phase-06-Admin-Owner-Frontend/TOPLINE-P6-006_WDR_2026-09-08.md`
   - `AGENT_REPORTS/latest-status.md`
   - `AGENT_REPORTS/latest-wdr-summary.md`
   - `src/types/api.ts`
   - `src/lib/api-client.ts`
   - `src/app/admin/vendors/page.tsx`
   - `src/app/admin/products/page.tsx`
   - `src/app/admin/categories/page.tsx`
   - `src/app/owner/vendors/page.tsx`
   - `src/app/owner/products/page.tsx`
   - relevant reusable UI/layout components under `src/components/`
   - local Next.js docs under `node_modules/next/dist/docs/` that apply to App Router dynamic routes, pages, client components, and routing
3. Confirm TOPLINE-P6-006 is PASS / CLOSED before editing.
4. Confirm Phase 5 backend remains frozen and only read-only endpoints are available.
5. Check git status. If unrelated existing changes are present, leave them untouched and report them.

Scope:
Build only:
1. New `/admin/vendors/[id]` read-only vendor detail page.
2. New `/admin/products/[id]` read-only product detail page.
3. New `/admin/categories/[id]` read-only category detail page.
4. New `/owner/vendors/[id]` read-only vendor detail page.
5. New `/owner/products/[id]` read-only product detail page.
6. Update existing admin/owner list pages so previously disabled View/Review controls become safe read-only links to the new detail pages.

Allowed changes:
1. Create:
   - `src/app/admin/vendors/[id]/page.tsx`
   - `src/app/admin/products/[id]/page.tsx`
   - `src/app/admin/categories/[id]/page.tsx`
   - `src/app/owner/vendors/[id]/page.tsx`
   - `src/app/owner/products/[id]/page.tsx`
2. Update:
   - `src/app/admin/vendors/page.tsx`
   - `src/app/admin/products/page.tsx`
   - `src/app/admin/categories/page.tsx`
   - `src/app/owner/vendors/page.tsx`
   - `src/app/owner/products/page.tsx`
3. Create or reuse small admin/owner detail components only if they reduce duplication and stay consistent with existing local patterns.
4. Update `src/project/projectRegistry.ts` only as needed to register TOPLINE-P6-007, update Phase 6 progress/current task/last completed task/next planned task, and add the WDR entry.
5. Create WDR:
   - `WDR/_All/Phase-06-Admin-Owner-Frontend/TOPLINE-P6-007_WDR_2026-09-08.md`
6. Update:
   - `AGENT_REPORTS/latest-status.md`
   - `AGENT_REPORTS/latest-wdr-summary.md`
7. After execution, set `PM_OUTBOX/next-opencode-prompt.md` back to awaiting PM prompt and explicitly state TOPLINE-P6-008 is not approved.

Detail page requirements:
1. Fetch detail records using only existing API client GET methods:
   - `api.getVendor(id)`
   - `api.getProduct(id)`
   - `api.getCategory(id)`
2. Follow Next.js 16 App Router dynamic route requirements. If dynamic route params are typed as a Promise in local docs or existing project conventions, use that pattern.
3. Include loading, error, retry, not-found/unavailable, and ready states.
4. Include a back link to the relevant list page.
5. Display all fields available in the relevant summary/detail type:
   - Vendor: name, id, tenantId, status, createdAt
   - Product: name, id, tenantId, vendorId, categoryId, status, createdAt
   - Category: name, id, tenantId, parentId, sortOrder, status, createdAt
6. Include a visible safety banner on every detail page.
7. All action-like controls must be disabled/read-only and clearly labeled as deferred.
8. Do not add edit forms, approval forms, moderation actions, delete actions, pricing controls, inventory controls, settlement controls, or role controls.

List page update requirements:
1. In `/admin/vendors`, link each vendor View control to `/admin/vendors/{id}`.
2. In `/admin/products`, link each product View control to `/admin/products/{id}`.
3. In `/admin/categories`, link each category View control to `/admin/categories/{id}`.
4. In `/owner/vendors`, link each vendor Review control to `/owner/vendors/{id}`.
5. In `/owner/products`, link each product Review control to `/owner/products/{id}`.
6. Keep labels clear that pages are read-only and operational actions remain deferred.
7. Preserve responsive desktop table and mobile card layouts.

Design/UX requirements:
1. Match the visual and behavioral pattern of existing admin and owner pages.
2. Use existing design system/layout patterns and theme tokens.
3. Keep the UI work-focused, readable, and suited for repeated operational review.
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
6. If backend is offline or a record is unavailable, show graceful error/unavailable states instead of crashing.
7. Do not change backend code to support this task.

Do not:
- Do not edit backend code.
- Do not edit Prisma schema.
- Do not run migrations.
- Do not add packages.
- Do not create write APIs.
- Do not implement auth/RBAC.
- Do not implement payments, refunds, settlements, commissions, or financial metrics.
- Do not create tenant detail routes.
- Do not create platform/deployment mutation routes.
- Do not start TOPLINE-P6-008.
- Do not modify Phase 5 frozen backend/API files.
- Do not touch any shop.com path.

Verification:
1. Run TypeScript check if available.
2. Run lint.
3. Run frontend build if reasonable.
4. Confirm these routes compile:
   - `/admin/vendors/[id]`
   - `/admin/products/[id]`
   - `/admin/categories/[id]`
   - `/owner/vendors/[id]`
   - `/owner/products/[id]`
5. Confirm updated list pages compile:
   - `/admin/vendors`
   - `/admin/products`
   - `/admin/categories`
   - `/owner/vendors`
   - `/owner/products`
6. Confirm no backend files changed.
7. Confirm no write API calls or write client methods were added.
8. Confirm no packages changed.
9. If browser verification is available, visually verify representative list/detail flows for layout, loading/error/unavailable behavior, and no overlapping text. If browser verification is not available, state that clearly in the WDR.

Git:
Follow exact-file staging only. Never use `git add .`, `git add -A`, or `git add --all`.
Commit only files changed for TOPLINE-P6-007.
Record real commit hashes.

WDR requirements:
The WDR must include:
1. Task ID/title/status/date/phase
2. Objective
3. PM audit context from P6-006
4. Preflight results
5. Files created/modified
6. Route inventory before/after
7. API endpoints consumed
8. UI behavior summary
9. Loading/error/not-found/ready state summary
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
6. Confirmation that TOPLINE-P6-008 was not started
7. Whether TOPLINE-P6-007 is PASS/CLOSED or needs PM decision

<!-- PM: End of prompt -->
