# ToplineShop — Agent Rules

## Project Root
`F:\OpenCode\ToplineShop`

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

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
