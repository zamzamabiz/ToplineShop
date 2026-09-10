# Next OpenCode Execution Prompt

## PM/CTO Decision

**P8-001-R3 AUDIT: BLOCKED**

Approved corrective task:
`TOPLINE-P8-001-R4 - Phase 8 Readiness Plan Canonical Contract Cleanup`

Paste only the #MP below into #MM.

## #MP

```text
#MM - TOPLINE-P8-001-R4 - Phase 8 Readiness Plan Canonical Contract Cleanup

Execute exactly one PM/CTO-approved corrective task under #123:
DISCUSS -> DECIDE -> EXECUTE -> VERIFY/AUDIT -> CLOSE -> NEXT

APPROVAL BOUNDARY

Approved: TOPLINE-P8-001-R4 only.

This is documentation/governance only. Do not start P8-002. Do not implement
backend/frontend behavior, packages, Prisma/schema, migrations, database
commands/connections, auth, sessions, tokens, RBAC, guards, permissions,
secrets, infrastructure, or deployment.

MANDATORY READS

- `AGENTS.md`
- `docs/HAIKU_EXECUTION_PROTOCOL.md`
- `docs/PROJECT_CONSTITUTION.md`
- `src/project/projectRegistry.ts` as canonical source of truth
- `WDR/_All/Phase-08-Database-Auth-RBAC/TOPLINE-P8-001-R3-AUDIT_2026-09-11.md`
- `WDR/_All/Phase-08-Database-Auth-RBAC/TOPLINE-P8-001-R3_WDR_2026-09-11.md`
- `docs/PHASE-08-DATABASE-AUTH-RBAC-READINESS-PLAN.md`

Confirm Git root is `E:/ToplineShop`, R4 and `wdr-069` already exist as
PLANNED entries, Phase 8 is BLOCKED, and P8-002 is not registered.
`F:\OpenCode\shop.com` is strictly out of scope.

Preserve and never stage:
- modified `WDR/_All/Governance/TOPLINE-GOV-AUTO-001_WDR_2026-09-08.md`
- untracked `.claude/settings.local.json`

ALLOWED FILES ONLY

1. `docs/PHASE-08-DATABASE-AUTH-RBAC-READINESS-PLAN.md`
2. `src/project/projectRegistry.ts`
3. `AGENT_REPORTS/latest-status.md`
4. `AGENT_REPORTS/latest-wdr-summary.md`
5. `PM_OUTBOX/next-opencode-prompt.md`
6. `WDR/_All/Phase-08-Database-Auth-RBAC/TOPLINE-P8-001-R4_WDR_2026-09-11.md`

Do not edit prior WDRs or audits.

REQUIRED CORRECTIONS

1. Current plan metadata
- Update the live plan header and current revision framing to R4, with date
  `2026-09-11`, and identify the current corrective task as P8-001-R4.
- Preserve historical R1/R2/R3 evidence only in immutable WDRs/audits and in
  an explicitly labeled historical section. Do not leave R1 as the current
  plan identity.

2. Package ownership everywhere
- Remove every live statement that P8-002 may install packages.
- State consistently in every summary and task section that P8-002 installs
  no packages and is schema/migration-only.
- P8-003 is the sole planned owner of future PM-approved auth package
  installation. Package names remain recommendations, not approvals.

3. Inventory and deferred split
- In the `Designed but not implemented` table, preserve factual absence but
  label `Session` as a Phase 8 P8-002 planned candidate.
- Label `Role`, `Permission`, `RolePermission`, `TenantMembershipRole`, and
  `VendorMembership` as Phase 8 P8-004 planned candidates.
- Replace the blanket sentence saying all listed Phase 3 design tables are
  deferred with an exact planned-candidates versus deferred-items split.
- Keep `AuthAccount`, `Module`, `TenantModule`, `ApprovalGate`,
  `User.emailVerified`, registration, email verification, password reset,
  OAuth, and real notification delivery deferred.
- Ensure every live inventory/recommendation/verification section agrees with
  this split; do not rely only on the detailed task table.

4. Ownership summaries
- Repeat the same live contract in the early bounded-scope summary:
  P8-002 owns all required auth persistence including Session and the
  additive migration, with no auth behavior and no packages; P8-003 owns
  auth behavior and approved packages with no Prisma/schema/migration work;
  P8-004 owns RBAC persistence/enforcement; P8-005 is freeze-only.
- Preserve R3's detailed task-row and verification-matrix corrections.

5. Evidence accuracy
- Keep R3 WDR and R3 audit immutable.
- In the R4 WDR, record that R3 overstated completion because stale live
  clauses remained outside its targeted searches.
- Record exact R3 hashes:
  `fb1d3e2b64961286390b138123adfc3e5bc3d815` and
  `1c9e886529d9fba34e95bca0f84c552ebb0019f9`.
- Preserve accurate unrelated evidence: modified 2026-09-08 governance WDR
  and untracked `.claude/settings.local.json`.

6. Preserve valid decisions
- Keep the five-prompt budget, complete database-risk register, PM decision
  matrix, refresh transport comparison, credential/token logging prohibition,
  authorization freshness, public-route allowlist, tenant-spoof protection,
  credential bootstrap, strict DB safety, real test inventory, and all
  R3 ownership corrections. Recommendations remain unapproved.

REGISTRY CONTRACT

- Keep P8-001/R1/R2/R3 and wdr-065/066/067/068 BLOCKED.
- Complete existing P8-001-R4: status PASS, dates `2026-09-11`, actual
  build/tests, ownerApproval PLANNED, pmApproval PLANNED, full Commit A.
- Complete existing wdr-069: status PASS, date `2026-09-11`, full Commit A,
  pmAudit PLANNED.
- Phase 8 remains BLOCKED pending R4 audit; progress 20;
  megaPromptTarget/completed 5/1; taskCount/completedTaskCount 5/5;
  implementation and owner gates remain unpassed; currentTask null.
- Root: currentPhase Phase 8; currentTask null; lastCompletedTask
  TOPLINE-P8-001-R4; nextPlannedTask TOPLINE-P8-002 proposed/unapproved;
  lastUpdated `2026-09-11`.
- `git.lastCommit` stores full Commit A.

REPORTS, HOLD NOTICE, AND WDR

Update latest reports: R4 execution PASS pending PM audit; P8-001/R1/R2/R3
and wdr-065/066/067/068 remain BLOCKED; Phase 8 BLOCKED; P8-002
unapproved; accurate unrelated status. Record Commit A without a Commit B
placeholder.

Replace PM_OUTBOX with an R4 audit hold notice. Do not write a P8-002 prompt.
Create:
`WDR/_All/Phase-08-Database-Auth-RBAC/TOPLINE-P8-001-R4_WDR_2026-09-11.md`

The WDR must map every R3 audit finding to its correction, list exactly six
changed files, record real checks, full Commit A, safety confirmations, PM
audit required, and stopped before P8-002. Commit B belongs in the final
handoff only; do not leave a placeholder for it.

VERIFICATION

- Search the entire plan for every stale R1 current-header phrase, every
  P8-002 package-install permission, every `Session`/RBAC deferred label,
  and the blanket all-tables-deferred sentence; none may remain outside
  explicitly labeled historical evidence.
- Confirm the early summary and detailed rows have identical ownership.
- Confirm P8-002 installs no packages and P8-003 is the sole package owner.
- Confirm Phase 8 planned candidates and truly deferred items are distinct.
- Confirm registry IDs/counts/statuses/root fields.
- Run `git diff --check`, root `npm run build`, root `npm run lint`, backend
  `npm run build`, and backend `npm test -- --runInBand`.
- Do not run Prisma, database, implementation, or network commands.
- Confirm exactly six allowed task files; preserve unrelated items unstaged.

GIT

Never use `git add .`, `git add -A`, or `git add --all`.
Stage exact files only.

Commit A: use `PENDING_UNTIL_COMMIT` only for Commit A fields, stage the six
exact allowed paths, inspect staged names, commit, capture full 40-char hash.
Commit B: replace Commit A placeholders with full Commit A, leave no Commit B
placeholder, rerun diff check, stage exact changed allowed files, commit,
capture full 40-char hash. Do not create a third commit.

FINAL HANDOFF - RETURN ONLY

TASK: TOPLINE-P8-001-R4 - Phase 8 Readiness Plan Canonical Contract Cleanup
STATUS: PASS / BLOCKED
WDR: WDR/_All/Phase-08-Database-Auth-RBAC/TOPLINE-P8-001-R4_WDR_2026-09-11.md
IMPLEMENTATION COMMIT: <full Commit A or NONE>
EVIDENCE-FILL COMMIT: <full Commit B or NONE>
FILES CHANGED: <exact list>
VERIFICATION: <real results>
UNRELATED CHANGES PRESERVED: YES / NO
DATABASE/AUTH/RBAC IMPLEMENTED: NO
P8-001/R1/R2/R3 AND WDR-065/066/067/068 REMAIN BLOCKED: YES
PM AUDIT REQUIRED: YES
STOPPED BEFORE TOPLINE-P8-002: YES

Stop and wait for PM/CTO audit.
```
