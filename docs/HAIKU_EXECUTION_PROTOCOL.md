# ToplineShop — Haiku Execution Protocol

## Purpose

Use Claude Haiku as a low-cost execution agent while PM/CTO review remains with Codex. Haiku should do narrow implementation work, produce evidence, and stop. Codex audits the WDR before any next task starts.

## Standing Context

Haiku must treat these files as standing context, not text to paste into every prompt:

- `AGENTS.md` — hard project rules
- `docs/PROJECT_CONSTITUTION.md` — governance constitution
- `docs/MEGA-PROMPT-STRATEGY.md` — prompt structure and scope discipline
- `src/project/projectRegistry.ts` — canonical project state
- Current task WDR/audit files referenced by the PM prompt

## Token-Saving Rules

- Read `AGENTS.md` and `src/project/projectRegistry.ts` at the start of a new Haiku session.
- For each task, read only the current WDR/audit and the files that will be edited or tested.
- Use targeted search for relevant code instead of loading broad folders.
- Do not reread old WDRs unless the current audit explicitly depends on them.
- Do not paste large documentation into chat; reference repository files by path.
- Keep final reports short: files changed, verification, commit hash, WDR path, stop status.

## Execution Rules

- Execute exactly one PM-approved task.
- Do not infer approval for the next task.
- Do not start `P7-005` or later unless PM explicitly approves it.
- Preserve unrelated user changes.
- Stop on destructive risk, secrets, database destructive action, architecture contradiction, unexpected scope, or any `shop.com` involvement.
- Never read, copy, import, or edit `F:\OpenCode\shop.com`.
- Never use `git add .`, `git add -A`, or `git add --all`.
- Stage exact files only.

## WDR Rules

Every Haiku task must write a WDR automatically after work is done.

The WDR must include:

- Task ID, title, status, date, phase
- Objective
- Files changed
- Verification commands and real results
- Scope safety confirmation
- Real commit hash
- Known limitations or unavailable verification
- Clear stop statement

WDR path format:

`WDR/_All/Phase-XX-Name/TASK-ID_WDR_YYYY-MM-DD.md`

## PM/CTO Audit Loop

1. User pastes compact PM prompt to Haiku.
2. Haiku executes one task and writes WDR.
3. User gives WDR to Codex.
4. Codex audits WDR against the actual repository.
5. If blocked, Codex writes the next corrective prompt.
6. If passed, Codex closes the task and writes the next PM prompt.
7. User pastes only the approved next prompt into Haiku.

## User-Friendly Handoff Format

Haiku final response should be easy to paste back to Codex:

```text
TASK:
STATUS:
WDR:
COMMIT:
FILES CHANGED:
VERIFICATION:
STOPPED BEFORE NEXT TASK: YES
```
