# Next OpenCode Execution Prompt

## PM/CTO Decision

**P8-001-R2 AUDIT: BLOCKED**

Approved corrective task:
`TOPLINE-P8-001-R3 - Phase 8 Readiness Plan Residual Consistency Reconciliation`

Paste only the #MP below into #MM.

## #MP

```text
#MM - TOPLINE-P8-001-R3 - Phase 8 Readiness Plan Residual Consistency Reconciliation

Execute exactly one PM/CTO-approved corrective task under #123:
DISCUSS -> DECIDE -> EXECUTE -> VERIFY/AUDIT -> CLOSE -> NEXT

APPROVAL BOUNDARY

Approved: TOPLINE-P8-001-R3 only.

This is a narrow documentation/governance correction. Do not start P8-002.
Do not implement backend/frontend behavior, packages, Prisma/schema,
migrations, database commands/connections, auth, sessions, tokens, RBAC,
guards, permissions, secrets, infrastructure, or deployment.

MANDATORY READS

- `AGENTS.md`
- `docs/HAIKU_EXECUTION_PROTOCOL.md`
- `docs/PROJECT_CONSTITUTION.md`
- `src/project/projectRegistry.ts` as canonical source of truth
- `WDR/_All/Phase-08-Database-Auth-RBAC/TOPLINE-P8-001-R2-AUDIT_2026-09-11.md`
- `WDR/_All/Phase-08-Database-Auth-RBAC/TOPLINE-P8-001-R2_WDR_2026-09-11.md`
- `docs/PHASE-08-DATABASE-AUTH-RBAC-READINESS-PLAN.md`

Confirm Git root is `E:/ToplineShop`, R3 and `wdr-068` already exist as
PLANNED entries, Phase 8 is BLOCKED, and P8-002 is not registered.

`F:\OpenCode\shop.com` is strictly out of scope. Do not access it.

Preserve and never stage:
- modified `WDR/_All/Governance/TOPLINE-GOV-AUTO-001_WDR_2026-09-08.md`
- untracked `.claude/settings.local.json`

ALLOWED FILES ONLY

1. `docs/PHASE-08-DATABASE-AUTH-RBAC-READINESS-PLAN.md`
2. `src/project/projectRegistry.ts`
3. `AGENT_REPORTS/latest-status.md`
4. `AGENT_REPORTS/latest-wdr-summary.md`
5. `PM_OUTBOX/next-opencode-prompt.md`
6. `WDR/_All/Phase-08-Database-Auth-RBAC/TOPLINE-P8-001-R3_WDR_2026-09-11.md`

Do not edit prior WDRs or audits.

REQUIRED CORRECTIONS

1. Session ownership must be exact everywhere
- P8-002 is the sole owner of all authentication persistence required by
  P8-003, including exactly one Session model and its additive migration.
- Replace the P8-002 verification sentence that currently says P8-002 must
  not add a Session model that P8-003 will recreate. It must require P8-002
  to add Session and prove P8-003 will not recreate or migrate it.
- Remove every fallback, condition, or parenthetical that permits P8-003 to
  add Session, credential persistence, Prisma schema, or migration files.
- In the P8-003 verification-matrix migration-review cell, use `n/a` and
  state that any Prisma/migration need is a stop condition and PM correction.

2. Task classification and migration language
- Describe P8-002 as auth persistence/schema/migration safety only.
- Describe P8-003 as code-only authentication/session behavior, approved
  auth package installation, AuthGuard, redaction/audit events, and write
  endpoint protection; no Prisma or migration work.
- Describe P8-004 as RBAC persistence/migration/enforcement and audit
  hardening.
- Describe P8-005 as audit/freeze only, never an implementation task.
- Replace the paragraph claiming P8-002/P8-003/P8-004 are irreversible
  additive migrations. Only P8-002 and P8-004 are planned additive migration
  tasks. Do not call migrations irreversible; retain SQL review, rollback,
  non-destructive, local-only, and explicit PM authorization requirements.

3. Inventory and deferred disposition
- Preserve the factual historical inventory: these models are currently not
  implemented.
- Mark `Session` as a Phase 8 P8-002 planned candidate, not deferred.
- Mark `Role`, `Permission`, `RolePermission`, `TenantMembershipRole`, and
  `VendorMembership` as Phase 8 P8-004 planned candidates, not deferred.
- Keep `AuthAccount`, `Module`, `TenantModule`, `ApprovalGate`, registration,
  email verification, `User.emailVerified`, password reset, OAuth, and real
  notification delivery explicitly deferred.
- Replace the statement that all listed Phase 3 tables are deferred with an
  exact split between Phase 8 planned candidates and genuinely deferred
  items. Recommendations remain unapproved until their future PM prompt.

4. Package ownership
- P8-002 installs no packages. It is schema/migration-only.
- P8-003 is the sole planned owner of any PM-approved auth package install.
- Remove `P8-002 or P8-003` package ambiguity from every section.
- Package names remain recommendations only and require explicit future PM
  approval plus actual compatibility/dependency evidence.

5. Exact count and future governance references
- Use only this formula: P8-001 plan + three implementation tasks P8-002,
  P8-003, P8-004 + P8-005 freeze gate = five core mega prompts.
- Replace every phrase calling P8-002 through P8-005 four implementation
  tasks. P8-005 is freeze-only.
- Do not guess or reserve WDR IDs/dates for P8-002 through P8-005 inside the
  plan. State that each ID/path/date is assigned when PM approves and
  registers that task. Existing wdr-065 through wdr-068 belong to the P8-001
  corrective chain and must not be reused.
- Update section O so P8-002 can follow only after PM approval of the full
  P8-001/R1/R2/R3 corrective chain. Replace stale R1-only stop/audit wording
  with R3 and final-chain wording.

6. Evidence accuracy
- Keep the R2 WDR and audit immutable.
- In the R3 WDR, record R2's overstatements as historical inaccuracies:
  R2 claimed all contradictions were resolved and P8-003 was schema-free
  while residual clauses remained.
- Record exact R2 hashes:
  - `1789cef06978109fef92043668a7e36e62674f5f`
  - `34581637b992ff4f6c9c81a7b9c53e304597d63d`
- Preserve accurate unrelated evidence: modified 2026-09-08 governance WDR
  and untracked `.claude/settings.local.json`.

7. Preserve valid R1/R2 decisions
- Keep deferred identity flows outside Phase 8 core.
- Keep the exact five-prompt budget, complete RISK-06 database risks, PM
  decision matrix, bearer-vs-cookie XSS/CSRF comparison, credential/token
  logging prohibition, authorization freshness, public-route allowlist,
  tenant-spoof protections, credential bootstrap, strict DB safety, real
  test inventory, and dependency-evidence requirements.
- Recommendations are not approvals. Do not silently select open decisions.

REGISTRY CONTRACT

- Keep P8-001/R1/R2 and wdr-065/066/067 BLOCKED.
- Complete existing P8-001-R3: status PASS, dates `2026-09-11`, actual
  build/tests, ownerApproval PLANNED, pmApproval PLANNED, full Commit A.
- Complete existing wdr-068: status PASS, date `2026-09-11`, full Commit A,
  pmAudit PLANNED.
- Phase 8 remains BLOCKED pending R3 PM audit; progress 20;
  megaPromptTarget/completed 5/1; taskCount/completedTaskCount 4/4;
  implementation and owner gates remain unpassed; currentTask null.
- Root: currentPhase Phase 8; currentTask null; lastCompletedTask
  TOPLINE-P8-001-R3; nextPlannedTask TOPLINE-P8-002 (proposed/unapproved);
  lastUpdated `2026-09-11`.
- `git.lastCommit` stores full Commit A.

REPORTS, HOLD NOTICE, AND WDR

Update latest reports: R3 execution PASS pending PM audit; P8-001/R1/R2 and
wdr-065/066/067 remain BLOCKED; Phase 8 BLOCKED; P8-002 unapproved; accurate
unrelated status. Record Commit A without any Commit B placeholder.

Replace PM_OUTBOX with an R3 audit hold notice. Do not write P8-002 prompt.

Create:
`WDR/_All/Phase-08-Database-Auth-RBAC/TOPLINE-P8-001-R3_WDR_2026-09-11.md`

The WDR must map every R2 audit finding to its correction, list exactly six
changed files, record real checks, full Commit A, safety confirmations, PM
audit required, and stopped before P8-002. Commit B belongs in the final
handoff only; do not leave a placeholder for it.

VERIFICATION

- Targeted-search all contradictory phrases named in the R2 audit; none may
  remain except when quoted as immutable historical evidence.
- Confirm P8-002 creates Session exactly once and installs no packages.
- Confirm P8-003 cannot create Session or touch Prisma/migrations and is the
  sole planned owner of explicitly PM-approved auth package installation.
- Confirm only P8-002 and P8-004 are planned migration tasks.
- Confirm the inventory distinguishes Phase 8 candidates from deferred work.
- Confirm exact five-prompt count and no guessed future WDR IDs/dates.
- Confirm registry IDs/counts/statuses/root fields.
- Run `git diff --check`, root `npm run build`, root `npm run lint`, backend
  `npm run build`, and backend `npm test -- --runInBand`.
- Do not run Prisma, database, implementation, or network commands.
- Confirm exactly six allowed task files; preserve unrelated items unstaged.

GIT

Never use `git add .`, `git add -A`, or `git add --all`.

Commit A: use `PENDING_UNTIL_COMMIT` only for Commit A fields, stage the six
exact allowed paths, inspect staged names, commit, capture full 40-char hash.

Commit B: replace Commit A placeholders with full Commit A, leave no Commit B
placeholder, rerun diff check, stage exact changed allowed files, commit,
capture full 40-char hash. Do not create a third commit.

FINAL HANDOFF - RETURN ONLY

TASK: TOPLINE-P8-001-R3 - Phase 8 Readiness Plan Residual Consistency Reconciliation
STATUS: PASS / BLOCKED
WDR: WDR/_All/Phase-08-Database-Auth-RBAC/TOPLINE-P8-001-R3_WDR_2026-09-11.md
IMPLEMENTATION COMMIT: <full Commit A or NONE>
EVIDENCE-FILL COMMIT: <full Commit B or NONE>
FILES CHANGED: <exact list>
VERIFICATION: <real results>
UNRELATED CHANGES PRESERVED: YES / NO
DATABASE/AUTH/RBAC IMPLEMENTED: NO
P8-001/R1/R2 AND WDR-065/066/067 REMAIN BLOCKED: YES
PM AUDIT REQUIRED: YES
STOPPED BEFORE TOPLINE-P8-002: YES

Stop and wait for PM/CTO audit.
```
