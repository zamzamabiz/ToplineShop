# ToplineShop - Mega Prompt Strategy

## Purpose

Use mega prompts as governed execution packets: one approved task, one bounded scope, one verification trail, one stop point.

This strategy is part of `#123`: DISCUSS -> DECIDE -> EXECUTE -> VERIFY/AUDIT -> CLOSE -> NEXT.

## Standing Strategy

- Keep each mega prompt tied to a single task ID from `src/project/projectRegistry.ts`.
- For Haiku execution, use `docs/HAIKU_EXECUTION_PROTOCOL.md` and `PM_OUTBOX/haiku-compact-prompt-template.md` to avoid repeated long context blocks.
- Use maximum useful prompt clarity with minimum repeated context: cite standing files instead of pasting them.
- Start every prompt with the approval boundary: exactly which task is approved and which next task is not approved.
- Preserve #123 governance: DISCUSS -> DECIDE -> EXECUTE -> VERIFY/AUDIT -> CLOSE -> NEXT.
- Carry explicit safety boundaries: allowed files/scope, forbidden scope, stop conditions, and exact-file staging.
- After each WDR audit, prepare the next prompt when possible; execution still requires explicit PM approval.
- Preserve #FDD: frontend behavior must be implemented and visually proved before deeper backend/database/auth work.
- Treat docs, WDRs, registry, and PM_OUTBOX as context unless the PM prompt explicitly instructs execution.
- Include a PM audit context from the previous task before allowing edits.
- Define allowed files and forbidden files clearly.
- Require read-only API use unless the current phase explicitly approves writes.
- Require loading, error, empty, and ready states for UI-facing data pages.
- Require responsive desktop and mobile behavior for frontend tasks.
- Require exact-file git staging only.
- Require real commit hashes in WDRs and agent reports.
- Stop after one governed task and wait for the next PM prompt.

## Prompt Structure

1. Status and approval boundary
2. Role and instruction hierarchy
3. Objective
4. PM audit context
5. Preflight reads
6. Scope and allowed changes
7. Page/API/design requirements
8. Explicit do-not list
9. Verification checklist
10. Git instructions
11. WDR and report requirements
12. Final report format

## Phase 6 Strategy

- Finish owner/admin frontend coverage before Phase 7.
- Keep all Phase 6 screens frontend-only and read-only.
- Use only Phase 5 GET endpoints and `src/lib/api-client.ts`.
- Do not add auth/RBAC, write APIs, schema changes, migrations, packages, or financial execution.
- Remaining sequence:
  - `TOPLINE-P6-007` - Admin/Owner Detail Pages
  - `TOPLINE-P6-008` - Phase 6 Freeze Gate
