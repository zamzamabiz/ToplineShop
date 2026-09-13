# Claude Code Execution Prompt — TDR-P1-001

You are Claude Code, the execution and coding AI for the Trade Data Refinery module in ToplineShop.

## Project identity

- Repository: `E:\ToplineShop`
- GitHub: `zamzamabiz/ToplineShop`
- Integration branch: `codex/trade-data-refinery`
- Stable branch: `master`
- Governing CTO: ChatGPT Luna
- Governance protocol: `DISCUSS → DECIDE → EXECUTE → VERIFY/AUDIT → CLOSE → NEXT`

## Task

**ID:** `TDR-P1-001`  
**Title:** Trade Data Refinery Frontend Module Shell and Overview  
**Objective:** Implement the first frontend-only TDR experience using the existing ToplineShop design system and synthetic mock data.

This is the first product-development task after governance registration. It proves the operator experience before any deep backend, database, authentication, RBAC, ingestion, or infrastructure work.

## Mandatory preflight

Before editing:

1. Read `AGENTS.md` and `CLAUDE.md`.
2. Read `docs/PROJECT_CONSTITUTION.md`.
3. Read `docs/TRADE-DATA-REFINERY-STRATEGIC-EXECUTION-ROADMAP.md`.
4. Read `src/project/projectRegistry.ts`.
5. Verify the current branch is `codex/trade-data-refinery` or a task branch created from it.
6. Verify the working tree and identify all pre-existing changes.
7. Confirm `TDR-P0-002` has been registered and passed in the project controls.
8. Confirm no TDR backend or database implementation is approved yet.

If registration is missing, the branch is wrong, the worktree contains unexpected overlapping changes, or the current governance state contradicts this prompt, stop and report. Do not improvise.

## Allowed scope

Primary implementation scope:

- `src/app/tdr/page.tsx`
- `src/components/tdr/`
- `src/features/tdr/`
- `src/types/tdr.ts`
- Existing shared UI/layout files only when strictly required for the TDR route
- Synthetic mock data only
- The task WDR: `WDR/_All/Trade-Data-Refinery/TDR-P1-001_WDR_2026-09-13.md`

Use the existing ToplineShop component and theme conventions. Reuse existing `Card`, `Badge`, `StatusPill`, `MetricCard`, `Section`, `Button`, `Input`, `Select`, `EmptyState`, layout, and theme primitives where appropriate instead of adding duplicate primitives.

## Forbidden scope

Do not change or add:

- NestJS backend modules, controllers, services, DTOs, or APIs;
- Prisma schema, migrations, database data, or database commands;
- authentication, JWT, sessions, RBAC, permissions, guards, or tenant-context implementation;
- package dependencies or lock files;
- external connectors, file upload processing, parsers, queues, object storage, analytics stores, or deployment;
- real customer, supplier, trade, or confidential data;
- payment, settlement, accounting, purchasing, or automated trading behavior;
- `master`;
- `shop.com` or any legacy source;
- unrelated marketplace, admin, owner, vendor, category, product, or checkout behavior.

All actions must remain mock or disabled. Do not present mock actions as connected or implemented backend capabilities.

## Required user experience

Create a TDR module overview at the appropriate route, preferably `/tdr`, consistent with the existing ToplineShop shell.

The page must include:

1. TDR page title, short purpose statement, and module status.
2. Four to six metric cards using synthetic values:
   - batches received;
   - records processed;
   - records quarantined;
   - records published;
   - data-quality score;
   - last successful run.
3. Recent import batches with source name, received time, status, accepted count, quarantine count, and safe view action.
4. Quality summary with accepted, warning, error, and fatal states.
5. Quarantine summary explaining that review workflow is planned or preview-only.
6. Source health summary with active, paused, and attention-needed states.
7. A clear “frontend preview / backend not connected” indicator.
8. A disabled or clearly inert “New Import” action with safe explanatory feedback.

## Required visual states

Represent the following with local mock state or fixtures:

- healthy dashboard;
- no imports yet;
- loading/skeleton state;
- warning state;
- failed batch state;
- module disabled state;
- empty quarantine state;
- responsive narrow-width layout.

Do not add fake network calls or pretend that an API exists.

## UX and accessibility requirements

- Use the established ToplineShop visual language, spacing, typography, and theme tokens.
- Support light/dark or existing theme modes without hardcoded incompatible colors.
- Use semantic headings, labels, buttons, and status text.
- Do not rely on color alone for status.
- Provide visible focus and keyboard-operable controls.
- Keep tables/cards readable on mobile; use safe overflow or responsive stacking.
- Avoid unnecessary animation and avoid misleading progress indicators.
- Do not expose raw source rows, secrets, tokens, or sensitive payloads.

## Architecture requirements

- Keep TDR-specific components under the TDR boundary.
- Keep mock data and TypeScript types centralized and replaceable by a future API adapter.
- Avoid changing global components unless required for route integration.
- Do not create a second project registry or status system.
- Do not mark backend or data capabilities as complete.

## Verification

Run only checks relevant to this task and record actual results:

- root lint;
- root build;
- `git diff --check`;
- browser verification of the TDR route at desktop and narrow viewport sizes;
- verification of healthy, empty, warning, failed, disabled, and loading states;
- keyboard/focus and basic accessibility review;
- regression spot-check of the existing root marketplace route and shared shell.

If a check fails, report the exact failure and do not hide or rewrite unrelated failures.

## WDR requirements

Create `WDR/_All/Trade-Data-Refinery/TDR-P1-001_WDR_2026-09-13.md` with:

- task objective, authorization, allowed and forbidden scope;
- preflight branch and working-tree evidence;
- exact files changed;
- screenshots or browser evidence locations if available;
- lint, build, diff, and accessibility results;
- mock-only and backend-not-connected confirmation;
- known limitations and residual risks;
- exact commit hash only if a commit was actually created;
- recommendation for the next task, without executing it.

## Stop conditions

Stop immediately and report if the task requires:

- backend, database, authentication, RBAC, package, infrastructure, or external-service work;
- a new architecture decision not already approved;
- changes outside allowed scope;
- modification of `master`;
- access to `shop.com`;
- secrets or real sensitive data;
- destructive actions;
- bypassing the project registry, WDR, PM audit, or frontend-first gate.

## Completion report

Report:

1. what was implemented;
2. exact files changed;
3. visual states verified;
4. checks and results;
5. confirmation that backend/database/auth/RBAC remained untouched;
6. any blocker or pre-existing failure;
7. the proposed next governed task.

Do not start `TDR-P1-002` or any backend task.
