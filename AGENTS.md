# ToplineShop — Agent Rules

## Project Root
`E:\ToplineShop`

## Greenfield Rule
ToplineShop is 100% greenfield. Start from zero. Do not migrate from `F:\OpenCode\shop.com`.

## shop.com Isolation
`F:\OpenCode\shop.com` is STRICTLY OUT OF SCOPE. Do not read, edit, copy, move, or import from it.

## #FDD — Frontend Development First
Frontend behavior must be proved visually before deep backend work. Backend/database/auth starts only after frontend freeze.

## #123 — Governance Protocol
DISCUSS → DECIDE → EXECUTE → VERIFY/AUDIT → CLOSE → NEXT
- Include safety boundaries, token-saving context use, and next-prompt preparation after WDR when possible.

## Git Rules
- Never use `git add .`, `git add -A`, or `git add --all`
- Stage exact files only
- Record real commit hashes

## WDR Path
`WDR/_All/Phase-XX-Name/`

## Stop Conditions
- Destructive risk
- Architecture contradiction
- Unexpected existing content
- Scope expansion
- Secrets
- Database destructive action
- Inability to verify safety
- Action involving shop.com

## Current Task
Must be PM-approved before execution. See `src/project/projectRegistry.ts` for current state.

## Source of Truth
`src/project/projectRegistry.ts` — All dashboard panels consume this canonical registry.

## Leadership and Resume Policy
- The CTO/PM governing agent makes technical sequencing, architecture, scope-control, and execution-readiness decisions when the safe choice is established by the roadmap, constitution, registry, WDR evidence, or hard gates.
- The non-technical owner retains business, legal, compliance, budget, production-data, and release-ownership decisions. Technical uncertainty must be documented; it must not be silently guessed.
- Every module, including Core Platform-Javed and every future module, follows `#123` and must maintain a module-specific `START-HERE.md` checkpoint.
- On restart, read the repository root `START-HERE.md` if present, then the module `START-HERE.md`, `AGENTS.md`, the constitution, the canonical registry, the newest applicable WDR, latest status, and Git state.
- The newest authoritative WDR controls status when summaries or chat history disagree. Contradictions are blockers until reconciled.
- A checkpoint must state the task ID, status, last verified commit, changed files, evidence, blockers, exact next action, and approved prompt path. No agent may resume from memory or an old chat.
- If no valid prompt exists for the approved task, prepare one and stop. Never reuse a stale prompt or infer approval for the next task.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
