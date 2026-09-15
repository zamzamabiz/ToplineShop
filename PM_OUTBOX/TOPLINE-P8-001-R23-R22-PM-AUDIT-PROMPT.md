# Core Platform Execution Prompt — TOPLINE-P8-001-R23

Execute one governance-only task in `E:\ToplineShop`:

`TOPLINE-P8-001-R23 — Phase 8 R22 PM Audit and Evidence-Fill Governance Reconciliation`

## Mandatory reading

Read `AGENTS.md`, `docs/PROJECT_CONSTITUTION.md`, `docs/PHASE-08-DATABASE-AUTH-RBAC-READINESS-PLAN.md`, `src/project/projectRegistry.ts`, `PM_OUTBOX/next-opencode-prompt.md`, the R22 WDR, and both latest reports.

## Scope

- Verify `TOPLINE-P8-001-R22` execution evidence and dependency chain.
- Resolve `<R22_COMMIT_B_HASH>` only from a real repository commit; never guess or fabricate it.
- Reconcile the R22 WDR, registry, latest reports, and PM outbox.
- Decide whether the Phase 8 hold may close.
- Create the single R23 audit WDR at `WDR/_All/Phase-08-Database-Auth-RBAC/TOPLINE-P8-001-R23_WDR_2026-09-15.md`.

## Forbidden

- Do not start or register `TOPLINE-P8-002`.
- Do not modify product code.
- Do not change backend, database, Prisma, migrations, authentication, RBAC, packages, secrets, or `master`.
- Do not rewrite historical commit hashes.
- Do not mark PASS while the placeholder or any evidence contradiction remains.

## Governance

Follow `#123`: DISCUSS → DECIDE → EXECUTE → VERIFY/AUDIT → CLOSE → NEXT.

If the placeholder cannot be resolved from real evidence, record `BLOCKED` and stop. If all evidence is real and consistent, record the PM-audit decision and preserve P8-002 as separately unapproved until a later prompt explicitly authorizes it.

Report branch, Git state, exact files, evidence, blockers, final decision, and whether P8-002 remains blocked. No implementation work is allowed.
