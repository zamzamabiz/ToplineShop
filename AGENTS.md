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
