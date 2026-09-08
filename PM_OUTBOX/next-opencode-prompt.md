# Next OpenCode Execution Prompt

## Status

**PM prompt ready — TOPLINE-P6-008 approved**

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

## Approved Task

Execute exactly one governed task: **TOPLINE-P6-008 — Phase 6 Freeze Gate**.

## PM Decision

TOPLINE-P6-008 is approved for execution. This approval authorizes a read-only freeze-gate audit and the required governance documentation updates only.

## Audit Objective

Audit Phase 6 — Admin & Platform Owner Frontend for closure readiness after approved tasks TOPLINE-P6-001 through TOPLINE-P6-007.

## Required Audit Scope

1. Read `AGENTS.md`, `PROJECT_CONSTITUTION.md`, `docs/MEGA-PROMPT-STRATEGY.md`, the Phase 6 readiness plan, all Phase 6 WDRs, `AGENT_REPORTS/latest-status.md`, `AGENT_REPORTS/latest-wdr-summary.md`, and `src/project/projectRegistry.ts`.
2. Verify the registry, WDRs, reports, and commit hashes agree for P6-001 through P6-007.
3. Inspect every Phase 6 admin/owner route and confirm the routes are present, compile, and use only Phase 5 read-only API capabilities.
4. Verify loading, error, empty/not-found, ready states, navigation links, responsive layouts, and visible safety/deferred-action notices where claimed.
5. Verify no Phase 6 change introduced auth/RBAC, write operations, payment/settlement behavior, schema or migration changes, secrets, new packages, or backend scope expansion.
6. Run `npx tsc --noEmit`, `npm run lint`, and `npm run build` when available. Record exact results, including any pre-existing warnings. Perform browser verification when a browser is available; otherwise record that limitation explicitly.

## Freeze Decision Rules

- If all required checks pass, create `WDR/_All/Phase-06-Admin-Owner-Frontend/TOPLINE-P6-008_WDR_2026-09-08.md` with PASS/CLOSED evidence, mark Phase 6 CLOSED in the canonical registry, record the real freeze-gate commit hash, and update both latest agent reports.
- If any required check fails or evidence conflicts, do not claim closure. Write the WDR as BLOCKED or PARTIAL with findings, leave Phase 6 IN_PROGRESS, and stop for PM review.

## Hard Boundaries

- Do not implement new product functionality.
- Do not edit backend, Prisma schema, migrations, auth/RBAC, payment, settlement, or infrastructure code.
- Do not add packages or change package manifests.
- Do not read, copy, import, or edit `F:\OpenCode\shop.com`.
- Do not start Phase 7 or any task after P6-008.
- Preserve unrelated existing changes.
- Stage exact files only. Never use `git add .`, `git add -A`, or `git add --all`.

## Completion Protocol

Follow #123: DISCUSS → DECIDE → EXECUTE → VERIFY/AUDIT → CLOSE → NEXT. After this one audit, update the WDR, `AGENT_REPORTS/latest-status.md`, `AGENT_REPORTS/latest-wdr-summary.md`, and `src/project/projectRegistry.ts` as justified by evidence, commit exact files only with a clear P6-008 message, report the commit hash, and stop.

<!-- PM: End of prompt -->
