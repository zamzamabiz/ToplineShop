# Claude Code Execution Prompt — TDR-P0-002

You are the execution and coding AI for ToplineShop. Execute exactly one governed task: `TDR-P0-002 — Program Registration and Control Baseline`.

## Authority

The Owner/PM authorized the Trade Data Refinery strategic roadmap on 2026-09-13. ChatGPT Luna is the CTO/governing AI. This prompt authorizes only `TDR-P0-002`; it does not authorize any later TDR task.

## Required reads

Read these files before changing anything:

1. `AGENTS.md`
2. `CLAUDE.md`
3. `docs/PROJECT_CONSTITUTION.md`
4. `docs/TRADE-DATA-REFINERY-STRATEGIC-EXECUTION-ROADMAP.md`
5. `WDR/_All/Trade-Data-Refinery/TDR-P0-001_WDR_2026-09-13.md`
6. `src/project/projectRegistry.ts`
7. `AGENT_REPORTS/latest-status.md`
8. `AGENT_REPORTS/latest-wdr-summary.md`

Verify the branch and working tree before editing. Work only on `codex/trade-data-refinery` or a PM-approved task branch created from it. Never modify `master` directly.

## Objective

Register the approved Trade Data Refinery roadmap, module, branch, task sequence, risks, and next action in the canonical ToplineShop controls without implementing TDR product behavior and without changing the truth of the current ToplineShop Phase 8 blocker.

## Allowed scope

- `src/project/projectRegistry.ts`
- `docs/TRADE-DATA-REFINERY-STRATEGIC-EXECUTION-ROADMAP.md` only if a factual registration correction is required
- `WDR/_All/Trade-Data-Refinery/TDR-P0-002_WDR_2026-09-13.md`
- `AGENT_REPORTS/latest-status.md`
- `AGENT_REPORTS/latest-wdr-summary.md`
- `PM_OUTBOX/next-opencode-prompt.md` or a TDR-specific next-prompt file

## Required registration outcome

1. Preserve ToplineShop `currentPhase`, Phase 8 status, blockers, and existing task history truthfully.
2. Add a non-conflicting TDR program/module representation using existing registry types where possible.
3. Record `TDR-P0-001` as `PASS` with owner authorization and its WDR path.
4. Record `TDR-P0-002` as the single active TDR governance task while executing it.
5. Identify `TDR-P0-003` as the next planned TDR task only after successful closure; do not execute or mark it active.
6. Record `codex/trade-data-refinery` as the TDR integration branch in an appropriate truthful control field or decision note without replacing the repository-wide Git truth.
7. Add only the minimum TDR risks and decisions needed for governance visibility.
8. Keep all product capability status as planned/not started.

## Forbidden scope

- No frontend routes, pages, components, navigation implementation, or mock product UX.
- No backend modules, controllers, services, DTOs, or APIs.
- No dependency or lock-file changes.
- No Prisma schema or migration changes.
- No database commands or data changes.
- No authentication, session, JWT, RBAC, permission, guard, or tenant-context implementation.
- No ingestion, parser, mapping, validation, quarantine, canonical, lineage, analytics, or export implementation.
- No infrastructure, deployment, secrets, external calls, or production data.
- No interaction with `shop.com`.
- No changes to `master`.
- Never use `git add .`, `git add -A`, or `git add --all`.

## Required verification

- Confirm the exact working tree before and after changes.
- Run focused checks for registry/type correctness.
- Run root lint and build if the registry changes application compilation.
- Run `git diff --check`.
- Verify no forbidden file changed.
- Verify current Phase 8 status remains truthful and unchanged unless a separately authorized PM audit changed it before execution.
- Verify TDR product capabilities remain unimplemented.

## WDR

Create `WDR/_All/Trade-Data-Refinery/TDR-P0-002_WDR_2026-09-13.md` containing scope, changed files, actual verification results, Git state, blockers, residual risks, and the proposed next task. Do not claim a commit hash that does not exist.

## Stop conditions

Stop and report without improvising if:

- the worktree contains unexpected changes overlapping allowed files;
- registry types cannot represent TDR without an architecture change;
- registration would replace or falsify the current ToplineShop phase;
- Phase 8 governance creates a direct contradiction;
- any product implementation, package, schema, migration, secret, destructive action, or `shop.com` access becomes necessary;
- the task cannot be verified safely.

## Completion report

Report exactly what changed, checks run and their results, files not changed by design, any blocker, and the truthful next task. Do not start `TDR-P0-003`.

