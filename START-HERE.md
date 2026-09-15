# ToplineShop — Universal Restart Point

This is the repository-wide entry point for ChatGPT Luna, Claude Code, and human operators.

## Mandatory first steps

1. Read `AGENTS.md` and `docs/PROJECT_CONSTITUTION.md`.
2. Identify the module from the user request.
3. Open that module's `START-HERE.md` checkpoint.
4. Verify `src/project/projectRegistry.ts`, the newest applicable WDR, latest status, and Git state.
5. Report the recovered state before changing anything.
6. Execute only the single task explicitly approved by the CTO/PM governing agent.

## Module checkpoints

- Trade Data Refinery: `TDR-START-HERE.md`
- Core Platform-Javed: checkpoint to be created at its governed module root when its files are connected to this repository
- Future modules: copy `MODULE-START-HERE-TEMPLATE.md` and complete every field before execution

The repository and module checkpoints are the continuity source of truth. Chat history is supporting context only. Conflicting registry, WDR, status, or Git evidence is a blocker requiring reconciliation under `#123`.
