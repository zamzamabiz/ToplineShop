# ToplineShop — Project Constitution

## Immutable Baseline Rules

1. **Greenfield**: ToplineShop is 100% greenfield. Start from zero.
2. **shop.com Isolation**: `F:\OpenCode\shop.com` is strictly out of scope. Do not read, edit, copy, move, or import from it.
3. **No Legacy Migration**: No legacy source code, CSS, routing, database models, or architecture carries into ToplineShop.
4. **Business Lessons**: Business knowledge from shop.com may be reconsidered separately after PM approval.
5. **Frontend First (#FDD)**: Strict Frontend Development First. Frontend behavior is proved visually before deep backend work.
6. **One Governed Task**: One mega task at a time. No independent next-task execution.
7. **Mega Prompt Budget**: 2–5 mega prompts maximum per major phase (planning target).
8. **WDR Required**: Every governed task produces a WDR with evidence.
9. **PM Audit Before Next**: PM audit is required before starting the next governed task.
10. **Single Source of Truth**: The machine-readable project registry drives the dashboard. No duplicate status systems.
11. **No False Claims**: Do not falsely claim planned features are implemented.
12. **Lean Documentation**: Keep documentation lean during development. Detailed docs belong near project completion.
13. **Evidence Required**: Tests, build results, and browser verification evidence required when applicable.
14. **No Destructive DB Ops**: No destructive database operations without explicit approval.
15. **No Secrets**: No secrets, keys, or credentials in the repository.
16. **Exact-File Git Staging**: Stage exact task files only. Never use `git add .`, `git add -A`, or `git add --all`.
17. **Unexpected Scope = STOP**: If unexpected scope is encountered, stop and report.

## Protocol

**#123** — DISCUSS → DECIDE → EXECUTE → VERIFY/AUDIT → CLOSE → NEXT

Protocol expansion:
- **Safety first**: every task must declare allowed scope, forbidden scope, stop conditions, and exact-file git rules.
- **Mega prompt discipline**: one approved governed task per prompt; maximum-useful prompt detail, but no repeated bulk context.
- **Token saving**: keep standing rules in repository files; prompts should reference canonical files and use targeted reads/search.
- **WDR first**: every execution produces a WDR with evidence before any closure or next task.
- **Next prompt after audit**: after WDR audit, prepare the next prompt when possible, but do not execute it without PM approval.

## Documentation Budget

~90% implementation / verification, ~10% documentation. Machine-readable project state preferred over duplicated prose.
