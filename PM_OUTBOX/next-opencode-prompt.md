# Next OpenCode Execution Prompt

## PM/CTO Decision

**P8-001-R4 AUDIT: BLOCKED**

Approved corrective task:
`TOPLINE-P8-001-R5 - Phase 8 Readiness Plan Ownership and State Reconciliation`

Paste only the #MP below into #MM.

## #MP

```text
#MM - TOPLINE-P8-001-R5 - Phase 8 Readiness Plan Ownership and State Reconciliation

Execute exactly one PM/CTO-approved corrective task under #123:
DISCUSS -> DECIDE -> EXECUTE -> VERIFY/AUDIT -> CLOSE -> NEXT

APPROVAL BOUNDARY

Approved: TOPLINE-P8-001-R5 only.

Documentation/governance only. Do not start P8-002. Do not implement backend,
frontend, package, Prisma, migration, database, auth, session, token, RBAC,
guard, secret, infrastructure, deployment, or product behavior.

MANDATORY READS

- `AGENTS.md`
- `docs/HAIKU_EXECUTION_PROTOCOL.md`
- `docs/PROJECT_CONSTITUTION.md`
- `src/project/projectRegistry.ts`
- `WDR/_All/Phase-08-Database-Auth-RBAC/TOPLINE-P8-001-R4-AUDIT_2026-09-11.md`
- `WDR/_All/Phase-08-Database-Auth-RBAC/TOPLINE-P8-001-R4_WDR_2026-09-11.md`
- `docs/PHASE-08-DATABASE-AUTH-RBAC-READINESS-PLAN.md`

Confirm Git root is `E:/ToplineShop`, R5 and `wdr-070` are PLANNED, Phase 8
is BLOCKED, and P8-002 is not registered. `F:\OpenCode\shop.com` is out
of scope.

Preserve and never stage:
- modified `WDR/_All/Governance/TOPLINE-GOV-AUTO-001_WDR_2026-09-08.md`
- untracked `.claude/settings.local.json`

ALLOWED FILES ONLY

1. `docs/PHASE-08-DATABASE-AUTH-RBAC-READINESS-PLAN.md`
2. `src/project/projectRegistry.ts`
3. `AGENT_REPORTS/latest-status.md`
4. `AGENT_REPORTS/latest-wdr-summary.md`
5. `PM_OUTBOX/next-opencode-prompt.md`
6. `WDR/_All/Phase-08-Database-Auth-RBAC/TOPLINE-P8-001-R5_WDR_2026-09-11.md`

Do not edit prior WDRs or audits.

REQUIRED CORRECTIONS

1. Exact ownership in every live section
- P8-002 alone owns all auth persistence: User.passwordHash, audit context,
  Session, digest fields, related indexes/enums/constraints, and its additive
  migration. P8-002 installs no packages and has no auth behavior.
- P8-003 owns AuthGuard, authentication/session behavior, approved auth
  package installation, redaction, and current write-endpoint protection.
  P8-003 owns no schema, migration, RBAC persistence, or RBAC guards.
- P8-004 alone owns Role, Permission, RolePermission,
  TenantMembershipRole, VendorMembership, RBAC guards, tenant context,
  permission enforcement, and the RBAC additive migration.
- P8-005 is freeze-only.
- Correct the Phase 3 versus Phase 4 architecture table and every other live
  recommendation so no task has overlapping ownership.

2. Staged backend authority
- Rewrite the backend-authority section to describe the sequence: P8-003
  first establishes authentication and protects writes with AuthGuard; only
  after that does P8-004 add RBAC guards, tenant context, and permission
  enforcement. Do not imply P8-003 implements RolesGuard/PermissionsGuard.
- Keep the final-state architecture clear without authorizing either future
  task before its own PM approval.

3. Planned versus implemented state
- Restore all planned-but-not-implemented columns and models to the
  “Absent (today’s repository state)” inventory with their planned owner:
  User.passwordHash, AuditLog.ipAddress/userAgent, Session, Role, Permission,
  RolePermission, TenantMembershipRole, and VendorMembership.
- Annotate each as “absent today; planned candidate,” not implemented.
- Keep AuthAccount, Module, TenantModule, ApprovalGate, email verification,
  User.emailVerified, registration, password reset, OAuth, and notification
  delivery deferred.

4. Current labels and future paths
- Replace live R1 labels in current sections with R5/current-contract labels.
  Historical R1/R2/R3/R4 evidence may remain only in explicitly historical
  sections and immutable evidence files.
- Remove old corrective dates from future P8-002 through P8-005 WDR paths.
  Future WDR IDs, paths, and dates are assigned only when PM approves and
  registers each task.

5. Preserve valid corrections
- Keep the R4 header, package summary, candidate/deferred split, Session
  exactly-once verification, P8-003 migration stop condition, five-prompt
  count, future-WDR rule, database safety, security decision matrix,
  credential/token logging prohibition, and all previous valid boundaries.

6. Evidence accuracy
- Keep R4 WDR and audit immutable.
- Record in the R5 WDR that R4 overclaimed canonical consistency because the
  architecture table, authority section, and absent-state wording retained
  contradictions.
- Record exact R4 hashes:
  `5e2b799249cccc5b6d4f1e0b8f2d05d165152ba1`
  `038f47a147fb61c4675646383799dccf5678de4a`
- Preserve the modified 2026-09-08 governance WDR and untracked `.claude`.

REGISTRY CONTRACT

- Keep P8-001/R1/R2/R3/R4 and wdr-065/066/067/068/069 BLOCKED.
- Complete P8-001-R5 as PASS with dates `2026-09-11`, actual build/tests,
  ownerApproval PLANNED, pmApproval PLANNED, and full Commit A.
- Complete wdr-070 as PASS with full Commit A and pmAudit PLANNED.
- Phase 8 remains BLOCKED; progress 20; megaPromptTarget/completed 5/1;
  taskCount/completedTaskCount 6/6; currentTask null; implementation and
  owner gates remain unpassed.
- Root lastCompletedTask is `TOPLINE-P8-001-R5`; nextPlannedTask is
  `TOPLINE-P8-002` proposed/unapproved; lastUpdated `2026-09-11`.
- `git.lastCommit` stores full Commit A.

REPORTS, HOLD NOTICE, AND WDR

Update reports for R5 PASS execution pending PM audit. Keep P8-001 through R4
and wdr-065 through wdr-069 BLOCKED, Phase 8 BLOCKED, and P8-002 unapproved.
Replace PM_OUTBOX with an R5 audit hold notice. Do not write a P8-002 prompt.
Create `WDR/_All/Phase-08-Database-Auth-RBAC/TOPLINE-P8-001-R5_WDR_2026-09-11.md`.
The WDR must list exactly six changed files, real checks, full Commit A,
safety confirmations, PM audit required, and stopped before P8-002. Commit B
belongs in the final handoff only; leave no placeholder.

VERIFICATION

- Search the entire plan for all split Session/RBAC ownership phrases, all
  RolesGuard/PermissionsGuard assignment to P8-003, all planned candidates
  omitted from the absent inventory, live R1 labels, and old future WDR
  dates; none may remain outside explicitly historical evidence.
- Confirm planned candidates are still absent in the actual schema and are
  never described as implemented.
- Confirm registry IDs/counts/statuses/root fields and no P8-002 entry.
- Run `git diff --check`, root `npm run build`, root `npm run lint`, backend
  `npm run build`, and backend `npm test -- --runInBand`.
- Do not run Prisma, database, implementation, or network commands.
- Confirm exactly six allowed task files and preserve unrelated items.

GIT

Never use `git add .`, `git add -A`, or `git add --all`. Stage exact files only.
Commit A uses `PENDING_UNTIL_COMMIT` only for Commit A fields; stage six exact
paths, inspect names, commit, and capture the full hash. Commit B fills that
hash, leaves no placeholder, stages exact changed files, commits, and captures
the full hash. Do not create a third commit.

FINAL HANDOFF - RETURN ONLY

TASK: TOPLINE-P8-001-R5 - Phase 8 Readiness Plan Ownership and State Reconciliation
STATUS: PASS / BLOCKED
WDR: WDR/_All/Phase-08-Database-Auth-RBAC/TOPLINE-P8-001-R5_WDR_2026-09-11.md
IMPLEMENTATION COMMIT: <full Commit A or NONE>
EVIDENCE-FILL COMMIT: <full Commit B or NONE>
FILES CHANGED: <exact list>
VERIFICATION: <real results>
UNRELATED CHANGES PRESERVED: YES / NO
DATABASE/AUTH/RBAC IMPLEMENTED: NO
P8-001/R1/R2/R3/R4 AND WDR-065/066/067/068/069 REMAIN BLOCKED: YES
PM AUDIT REQUIRED: YES
STOPPED BEFORE TOPLINE-P8-002: YES

Stop and wait for PM/CTO audit.
```
