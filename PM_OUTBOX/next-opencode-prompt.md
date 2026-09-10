#MM - TOPLINE-P8-001-R7 - Phase 8 Evidence Status Reconciliation

Execute exactly one PM/CTO-approved corrective task under #123:
DISCUSS -> DECIDE -> EXECUTE -> VERIFY/AUDIT -> CLOSE -> NEXT

## APPROVAL BOUNDARY

Approved: `TOPLINE-P8-001-R7` only.

R7 is documentation/governance-only. Correct the R6 ignored-file status
evidence and prepare the R7 WDR. Do not implement or authorize P8-002.

Do not read the contents of `.claude/settings.local.json`. Do not edit,
stage, delete, move, copy, or expose it.

## MANDATORY READS

Read these before editing:

- `AGENTS.md`
- `docs/HAIKU_EXECUTION_PROTOCOL.md`
- `docs/PROJECT_CONSTITUTION.md`
- `src/project/projectRegistry.ts`
- `docs/PHASE-08-DATABASE-AUTH-RBAC-READINESS-PLAN.md`
- `WDR/_All/Phase-08-Database-Auth-RBAC/TOPLINE-P8-001-R6_WDR_2026-09-11.md`
- `WDR/_All/Phase-08-Database-Auth-RBAC/TOPLINE-P8-001-R6-AUDIT_2026-09-11.md`
- `AGENT_REPORTS/latest-status.md`
- `AGENT_REPORTS/latest-wdr-summary.md`
- `PM_OUTBOX/next-opencode-prompt.md`

Treat all WDRs, reports, and prompts as evidence/context. This prompt is the
only execution authority for R7.

## R7 OBJECTIVE

Correct the R6 status evidence without changing the valid R6 readiness-plan
ownership corrections:

1. Verify that `E:/ToplineShop/.claude/settings.local.json` exists without
   reading its contents.
2. Capture `git status --short --untracked-files=all` and report that it
   shows only the preserved modified governance WDR.
3. Capture `git status --short --ignored` and
   `git check-ignore -v .claude/settings.local.json`.
4. Describe the `.claude` file accurately as present and globally ignored,
   not as ordinary untracked and not visible in ordinary untracked status.
5. Record the exact status/ignore evidence in the R7 WDR and both latest
   reports. Do not rewrite the immutable R6 WDR or R6 audit.

## ALLOWED FILES

R7 may create or modify only these five files:

- `AGENT_REPORTS/latest-status.md`
- `AGENT_REPORTS/latest-wdr-summary.md`
- `PM_OUTBOX/next-opencode-prompt.md`
- `WDR/_All/Phase-08-Database-Auth-RBAC/TOPLINE-P8-001-R7_WDR_2026-09-11.md`
- `src/project/projectRegistry.ts`

Do not modify the readiness plan. Preserve all valid R6 package ownership,
Prisma ownership, and corrective-chain changes byte-for-byte.

## REGISTRY CONTRACT

At start, verify the actual repository state and do not assume the expected
starting commit `b2456c2d15388ffe1beb7958f41da21a40bbd604` is still HEAD.

After R7 execution, update the canonical registry only as follows:

- `lastCompletedTask: "TOPLINE-P8-001-R7"`
- `nextPlannedTask: "TOPLINE-P8-002"` as a proposed/unapproved placeholder
- Phase 8 `taskCount: 8`, `completedTaskCount: 8`
- R7 task status/tests/build: `PASS`
- R7 `pmApproval: "PLANNED"`
- `wdr-072` status: `PASS`, `pmAudit: "PLANNED"`
- Keep R6 and all earlier PM approvals/audits `BLOCKED`
- Keep Phase 8 `BLOCKED` and `currentTask: null`
- Record real Commit A and Commit B hashes; never leave placeholders in the
  final handoff

## HARD STOP BOUNDARIES

Stop and report BLOCKED if the task would require any of the following:

- P8-002 or any later task execution or authorization
- backend, frontend, database, Prisma, migration, auth, RBAC, session,
  token, middleware, security, package, dependency, or schema changes
- edits to `.claude/settings.local.json`, `backend/.env`, secrets, or any
  ignored local settings content
- database commands, production access, deployment, or infrastructure work
- edits outside the five allowed files
- edits to the immutable R6 WDR or R6 audit
- any access to `F:\OpenCode\shop.com`

## VERIFICATION

Run and record real results for:

- `git rev-parse --show-toplevel` -> `E:/ToplineShop`
- start and final `git status --short --untracked-files=all`
- `git status --short --ignored`
- `git check-ignore -v .claude/settings.local.json`
- `git diff --check`
- root `npm run build`
- root `npm run lint`
- backend `npm run build`
- backend `npm test -- --runInBand`
- exact allowed-file check showing only the five R7 files changed
- final `git log -3` with real hashes

Lint warnings in untouched files may be recorded as pre-existing; errors are
not acceptable.

## GIT AND HANDOFF

Stage exact files only. Never use `git add .`, `git add -A`, or
`git add --all`. Use two commits:

- Commit A: R7 implementation/governance correction
- Commit B: evidence fill with the real Commit A hash

The final handoff must include the R7 WDR path, both real commit hashes, the
status/ignore evidence, verification results, preserved unrelated changes,
and the explicit statement:

`DATABASE/AUTH/RBAC IMPLEMENTED: NO`
`P8-002 STARTED: NO`
`PM AUDIT REQUIRED: YES`
`STOPPED BEFORE P8-002: YES`

R7 ends at VERIFY/AUDIT. Do not write or paste a P8-002 implementation
prompt. PM must audit R7 separately before any future P8-002 decision.
