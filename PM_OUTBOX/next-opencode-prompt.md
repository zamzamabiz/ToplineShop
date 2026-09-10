# Next OpenCode Execution Prompt

## PM/CTO Decision

**P8-001-R1 AUDIT: BLOCKED**

Approved corrective task:
`TOPLINE-P8-001-R2 - Phase 8 Readiness Plan Final Contract Alignment`

Paste only the #MP below into #MM.

## #MP

```text
#MM - TOPLINE-P8-001-R2 - Phase 8 Readiness Plan Final Contract Alignment

Execute exactly one PM/CTO-approved corrective task under #123:
DISCUSS -> DECIDE -> EXECUTE -> VERIFY/AUDIT -> CLOSE -> NEXT

APPROVAL BOUNDARY

Approved: TOPLINE-P8-001-R2 only.

This is a narrow documentation/governance correction. Do not start P8-002.
Do not implement backend/frontend behavior, packages, Prisma/schema,
migrations, database commands/connections, auth, sessions, tokens, RBAC,
guards, permissions, secrets, infrastructure, or deployment.

MANDATORY READS

- `AGENTS.md`
- `docs/HAIKU_EXECUTION_PROTOCOL.md`
- `docs/PROJECT_CONSTITUTION.md`
- `src/project/projectRegistry.ts` as canonical source of truth
- `WDR/_All/Phase-08-Database-Auth-RBAC/TOPLINE-P8-001-R1-AUDIT_2026-09-11.md`
- `WDR/_All/Phase-08-Database-Auth-RBAC/TOPLINE-P8-001-R1_WDR_2026-09-10.md`
- `docs/PHASE-08-DATABASE-AUTH-RBAC-READINESS-PLAN.md`

Confirm Git root is `E:/ToplineShop`, R2 and `wdr-067` already exist as
PLANNED entries, Phase 8 is BLOCKED, and P8-002 is not registered.

`F:\OpenCode\shop.com` is strictly out of scope. Do not access it.

Preserve and never stage:
- modified `WDR/_All/Governance/TOPLINE-GOV-AUTO-001_WDR_2026-09-08.md`
- untracked `.claude/`

ALLOWED FILES ONLY

1. `docs/PHASE-08-DATABASE-AUTH-RBAC-READINESS-PLAN.md`
2. `src/project/projectRegistry.ts`
3. `AGENT_REPORTS/latest-status.md`
4. `AGENT_REPORTS/latest-wdr-summary.md`
5. `PM_OUTBOX/next-opencode-prompt.md`
6. `WDR/_All/Phase-08-Database-Auth-RBAC/TOPLINE-P8-001-R2_WDR_2026-09-11.md`

Do not edit prior WDRs or audits.

REQUIRED CORRECTIONS

1. Phase 8 core objective
- Remove self-registration, email verification, password reset, and OAuth
  from the Phase 8 core objective.
- Remove `User.emailVerified` from proposed P8-002/P8-003 schema, gaps,
  risks, verification, and acceptance criteria.
- Retain these only in one clear deferred-items section requiring later PM
  approval. Do not describe them elsewhere as Phase 8 deliverables.

2. Exact five-prompt sequence
- State accurately: P8-001 plan + three implementation tasks P8-002,
  P8-003, P8-004 + P8-005 freeze gate = five core mega prompts.
- R1 and R2 are correctives and do not increment megaPromptsCompleted.
- Remove wording that counts P8-005 both as implementation and freeze.
- Keep P8-006 outside the core sequence.

3. P8-002 ownership
- P8-002 is the sole owner of all authentication persistence required by
  P8-003: the PM-selected credential representation, password hash storage,
  Session persistence, refresh-token digest fields, audit context fields,
  related enums/indexes/constraints, additive migration SQL review,
  rollback documentation, and explicitly authorized local application.
- P8-002 contains no AuthGuard, login/logout/refresh endpoint, JWT issuance,
  auth behavior, RBAC model, frontend work, or unrelated package install.
- Remove every statement that P8-002 introduces or wraps an AuthGuard.
- P8-002 must use decisions explicitly selected by PM in the future prompt;
  recommendations in this plan are not approvals.

4. P8-003 ownership
- P8-003 owns authentication/session behavior, approved auth package
  installation, login/logout/refresh, refresh rotation/reuse handling,
  public-route allowlist, audit redaction/events, AuthGuard, and protection
  of the four existing write endpoints.
- P8-003 must not edit `backend/prisma/schema.prisma`, migrations, or create
  Session/credential persistence. Those are P8-002 deliverables.
- Remove Prisma/migration paths and migration-review clauses from P8-003's
  allowed scope and verification matrix.
- Keep RBAC schema/permission hierarchy out of P8-003.

5. P8-004 and P8-005
- Preserve P8-004 as tenant-aware RBAC persistence/enforcement, negative
  cross-tenant tests, authorization freshness, and audit hardening.
- Preserve P8-005 as audit/freeze only; it must not implement fixes.

6. Database risk accuracy
- Replace any claim that `prisma db push` is the only DB risk.
- Enumerate wrong-target connection, migration reset, destructive generated
  SQL, raw SQL, DROP, TRUNCATE, unsafe ALTER, seed side effects, and
  production/staging targeting.
- Preserve: no environment is freely destructible; every destructive action
  requires explicit PM approval; stop on any non-local target.

7. Evidence accuracy
- Latest reports must identify the real preserved unrelated file as
  `WDR/_All/Governance/TOPLINE-GOV-AUTO-001_WDR_2026-09-08.md`.
- Describe `.claude/` as untracked. Do not call it ignored.
- The R2 WDR must accurately record both starting unrelated items.
- Do not rewrite the historical R1 WDR; record its inaccuracies in R2.
- Record exact R1 hashes:
  - `42cc6ac63e375a1adb82f692f3885fd8b29a55ad`
  - `343798502c41cf51a05748371b8fc1b4336d9bfd`

8. Preserve successful R1 corrections
- Keep the PM decision matrix and all choices unapproved.
- Keep refresh bearer-vs-HttpOnly XSS/CSRF comparison.
- Keep token/link/credential logging prohibition.
- Keep authorization-freshness, public-route, tenant-spoof, credential
  bootstrap, strict DB safety, real test inventory, and dependency-evidence
  requirements.

REGISTRY CONTRACT

- Keep P8-001 and wdr-065 BLOCKED.
- Set P8-001-R1 pmApproval BLOCKED and wdr-066 pmAudit BLOCKED.
- Complete existing P8-001-R2: status PASS, dates `2026-09-11`, actual
  build/tests, ownerApproval PLANNED, pmApproval PLANNED, full Commit A.
- Complete existing wdr-067: status PASS, date `2026-09-11`, full Commit A,
  pmAudit PLANNED.
- Phase 8 remains BLOCKED pending R2 PM audit; progress 20;
  megaPromptTarget/completed 5/1; taskCount/completedTaskCount 3/3;
  implementation and owner gates remain unpassed; currentTask null.
- Root: currentPhase Phase 8; currentTask null; lastCompletedTask
  TOPLINE-P8-001-R2; nextPlannedTask TOPLINE-P8-002 (proposed/unapproved);
  lastUpdated `2026-09-11`.
- `git.lastCommit` stores full Commit A.

REPORTS, HOLD NOTICE, AND WDR

Update latest reports: R2 execution PASS pending PM audit; P8-001/R1 and
wdr-065/066 remain BLOCKED; Phase 8 BLOCKED; P8-002 unapproved; accurate
unrelated status. Record Commit A without any Commit B placeholder.

Replace PM_OUTBOX with an R2 audit hold notice. Do not write P8-002 prompt.

Create:
`WDR/_All/Phase-08-Database-Auth-RBAC/TOPLINE-P8-001-R2_WDR_2026-09-11.md`

The WDR must map every R1 audit finding to its correction, list exactly six
changed files, record real checks, full Commit A, safety confirmations, PM
audit required, and stopped before P8-002. Commit B belongs in the final
handoff only; do not leave a placeholder for it.

VERIFICATION

- Targeted-search every required contradiction; none may remain except when
  quoted as historical audit evidence.
- Confirm P8-002 owns Session/schema/migration and contains no guard/auth
  behavior.
- Confirm P8-003 owns AuthGuard/auth behavior and contains no Prisma/migration
  scope.
- Confirm exact five-prompt count and deferred identity scope.
- Confirm registry IDs/counts/statuses/root fields.
- Run `git diff --check`, root `npm run build`, and root `npm run lint`.
- Do not run Prisma, database, backend implementation, or network commands.
- Confirm exactly six allowed task files; preserve unrelated items unstaged.

GIT

Never use `git add .`, `git add -A`, or `git add --all`.

Commit A: use `PENDING_UNTIL_COMMIT` only for Commit A fields, stage the six
exact allowed paths, inspect staged names, commit, capture full 40-char hash.

Commit B: replace Commit A placeholders with full Commit A, leave no Commit B
placeholder, rerun diff check, stage exact changed allowed files, commit,
capture full 40-char hash. Do not create a third commit.

FINAL HANDOFF - RETURN ONLY

TASK: TOPLINE-P8-001-R2 - Phase 8 Readiness Plan Final Contract Alignment
STATUS: PASS / BLOCKED
WDR: WDR/_All/Phase-08-Database-Auth-RBAC/TOPLINE-P8-001-R2_WDR_2026-09-11.md
IMPLEMENTATION COMMIT: <full Commit A or NONE>
EVIDENCE-FILL COMMIT: <full Commit B or NONE>
FILES CHANGED: <exact list>
VERIFICATION: <real results>
UNRELATED CHANGES PRESERVED: YES / NO
DATABASE/AUTH/RBAC IMPLEMENTED: NO
P8-001/R1 AND WDR-065/066 REMAIN BLOCKED: YES
PM AUDIT REQUIRED: YES
STOPPED BEFORE TOPLINE-P8-002: YES

Stop and wait for PM/CTO audit.
```
