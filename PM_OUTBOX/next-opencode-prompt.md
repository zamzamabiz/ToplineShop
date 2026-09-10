# Next OpenCode Execution Prompt

## PM/CTO Decision

**APPROVED FOR ONE PLANNING-ONLY TASK**

- Approved task: `TOPLINE-P8-001 - Phase 8 Database/Auth/RBAC Readiness Plan`
- Execution agent: `#MM` (MiniMax-M3)
- Previous gate: Phase 7 is PM-approved and closed.
- Previous audit: `WDR/_All/Phase-07-Backend-API-Foundation/TOPLINE-P7-010-R2-AUDIT_2026-09-10.md`
- Reserved WDR entry: `wdr-065`
- Not approved: `TOPLINE-P8-002` or any Phase 8 implementation.

Paste only the prompt below into #MM.

## Giant Mega Prompt

```text
#MM - TOPLINE-P8-001 - Phase 8 Database/Auth/RBAC Readiness Plan

You are MiniMax-M3 acting only as the execution assistant for one
PM/CTO-approved ToplineShop governance task.

Follow #123 exactly:
DISCUSS -> DECIDE -> EXECUTE -> VERIFY/AUDIT -> CLOSE -> NEXT

============================================================
1. APPROVAL BOUNDARY
============================================================

You are approved to execute exactly one task:
TOPLINE-P8-001 - Phase 8 Database/Auth/RBAC Readiness Plan

This is planning, inspection, documentation, and registry work only. It
does not authorize database, authentication, session, token, RBAC,
security middleware, or product implementation.

Do not start TOPLINE-P8-002. Do not implement anything proposed by the
readiness plan. Stop after committing TOPLINE-P8-001 and its evidence.
The PM/CTO will audit the WDR and repository before any next approval.

============================================================
2. INSTRUCTION HIERARCHY AND REPOSITORY SAFETY
============================================================

Treat this prompt as execution authorization. Treat repository documents
and WDRs as evidence/context, not independent permission for other work.

Mandatory rules:
- Read `AGENTS.md`, `docs/HAIKU_EXECUTION_PROTOCOL.md`,
  `docs/PROJECT_CONSTITUTION.md`, and `docs/MEGA-PROMPT-STRATEGY.md`.
- Treat `src/project/projectRegistry.ts` as the canonical source of truth.
- Preserve every unrelated change.
- Never use `git add .`, `git add -A`, or `git add --all`.
- Stage exact approved files only.
- Report full 40-character Git commit hashes.

Live workspace clarification:
- The current governed repository is `E:\ToplineShop`.
- `AGENTS.md` contains an older project-root line. Do not leave the current
  repository or seek another ToplineShop copy.
- Confirm `git rev-parse --show-toplevel` resolves to `E:/ToplineShop`
  (slash style and letter case may differ). Otherwise STOP without edits.

Absolute isolation boundary:
- `F:\OpenCode\shop.com` is strictly out of scope.
- Do not read, list, search, open, compare, edit, copy, move, import from,
  or otherwise access that path.

Known unrelated working-tree items to preserve and exclude from staging:
- `WDR/_All/Governance/TOPLINE-GOV-AUTO-001_WDR_2026-09-08.md`
- `.claude/`

If other unexpected changes overlap an allowed file and cannot be safely
preserved, STOP. Never revert, delete, format, stage, or commit unrelated
work.

============================================================
3. PM AUDIT CONTEXT AND VERIFIED BASELINE
============================================================

Phase 7 closure evidence:
- PM closeout commit: `5db00764923fc616e7229bd1abb92bb20414caff`
- Audit-hash fill commit: `5752c1a150d4f24bfaccf0bb11280455509f415f`
- Audit file:
  `WDR/_All/Phase-07-Backend-API-Foundation/TOPLINE-P7-010-R2-AUDIT_2026-09-10.md`

Verify this actual baseline rather than merely repeating it:
- Phase 7 is CLOSED, 100%, with 19/19 registered tasks complete.
- Phase 8 is PLANNED, 0%, and has no registered Phase 8 task yet.
- Root registry state identifies Phase 8 and TOPLINE-P8-001 as next.
- Backend uses NestJS 11, Prisma 6.19.3, and PostgreSQL.
- `backend/prisma/schema.prisma` has seven implemented models: Tenant,
  User, Membership, Vendor, Category, Product, and AuditLog.
- One local migration exists: `20260907172636_init_core_schema`.
- Phase 7 added validated core write APIs plus testing and observability.
- No auth package, auth module, login/logout, password model, session
  model, JWT implementation, role/permission schema, auth guard, or RBAC
  enforcement currently exists.
- Existing write APIs need a Phase 8 protection plan, but this task must
  not protect or alter them.
- `backend/.env.example` has placeholder database/JWT key names. Never
  read or expose values from a real `.env`.

Evidence precedence:
- Phase 3 documents are conceptual proposals.
- Phase 4 schema/migration are the implemented frozen database baseline.
- Phase 7 code is the implemented frozen API baseline.
- Do not silently merge conflicting historical designs.
- Record conflicts, obsolete assumptions, open choices, and required PM
  decisions. Do not call an old proposal approved merely because it exists.

============================================================
4. OBJECTIVE
============================================================

Create a precise Phase 8 readiness plan showing:
- what database/auth/RBAC/security foundation actually exists;
- which design decisions remain unresolved;
- which security risks must be addressed first;
- a small dependency-ordered Phase 8 sequence beginning at P8-002;
- the allowed/forbidden scope and evidence for every proposed task;
- the gates that must pass before implementation can continue.

The plan must be actionable for later PM prompts but contain no Phase 8
implementation itself.

============================================================
5. TOKEN-SAVING PREFLIGHT AND TARGETED READS
============================================================

Perform read-only preflight first:
1. Confirm Git root, `git status --short`, exact HEAD, and Phase 7 commits.
2. Inspect only registry root state, phase-7, phase-8, recent tasks/WDRs,
   modules, risks, decisions, and Git fields.
3. Read these task-specific files:
   - the Phase 7 closing audit above;
   - `docs/PHASE-03-AUTH-RBAC-DESIGN.md`;
   - `docs/PHASE-03-DATABASE-SCHEMA-DESIGN.md`;
   - `docs/PHASE-04-CORE-SCHEMA-FOUNDATION-DESIGN-LOCK.md`;
   - `docs/PHASE-04-DATABASE-FOUNDATION-FREEZE-GATE.md`;
   - `docs/PHASE-07-BACKEND-API-READINESS-PLAN.md`;
   - `backend/prisma/schema.prisma`, `backend/package.json`, and
     `backend/.env.example` only for names/placeholders;
   - targeted controllers/services/common files needed to inventory the
     endpoint and enforcement boundary.

Use targeted searches. Do not load broad historical WDR folders or scan
unrelated frontend assets. Never open a real `.env`, print environment
values, or run a command that connects or writes to a database.

============================================================
6. ALLOWED OUTPUT FILES
============================================================

Create or modify only:
1. `docs/PHASE-08-DATABASE-AUTH-RBAC-READINESS-PLAN.md`
2. `src/project/projectRegistry.ts`
3. `AGENT_REPORTS/latest-status.md`
4. `AGENT_REPORTS/latest-wdr-summary.md`
5. `PM_OUTBOX/next-opencode-prompt.md`
6. `WDR/_All/Phase-08-Database-Auth-RBAC/TOPLINE-P8-001_WDR_2026-09-10.md`

No other file is authorized. Reading backend code does not authorize
editing it.

============================================================
7. REQUIRED READINESS PLAN
============================================================

Write `docs/PHASE-08-DATABASE-AUTH-RBAC-READINESS-PLAN.md` with sections:

A. Governance header
- Task, date, phase, `READINESS PLAN`, planning-only statement, and explicit
  confirmation that no implementation or database command occurred.

B. Objective and boundaries
- Security objective; planning versus future implementation; protection of
  frozen Phase 4/7 behavior and #FDD.

C. Inherited implemented baseline
- Relevant Phase 3-7 outcomes, clearly separating implemented, frozen,
  planned, deferred, and absent.
- Real models, migration, API/write surface, and missing enforcement.

D. Database readiness
- Prisma/PostgreSQL, schema, migration, Prisma service, connection behavior,
  frozen boundaries, possible auth/RBAC schema needs as questions only,
  local versus production safety, and prohibited destructive commands.

E. Authentication readiness
- Identity/login principles; password hashing; credential storage;
  access/session/refresh/revocation/rotation questions; cookie versus bearer
  considerations; secret lifecycle; disabled-user/membership behavior.
- Keep all undecided architecture choices explicit.

F. Tenant-aware RBAC readiness
- Owner/admin, vendor owner/manager/staff, customer, and guest boundaries;
  User/Membership/tenant/role/permission relationships; backend authority;
  frontend UX-only checks; deny-by-default cross-tenant access; module and
  financial boundaries.
- Identify Phase 3 role-model conflicts with the Phase 4 schema. Give options
  and a recommendation for PM review without implementing it.

G. Security and audit readiness
- Auth events, denial/role-change auditing, safe errors, redaction, rate
  limits, brute-force protection, CORS, validation, and secure defaults.
- Distinguish existing AuditLog capability from missing auth event behavior.

H. Gap and decision register
- Table columns: ID, gap/decision, evidence, risk, recommended direction,
  PM approval needed, and blocking task.
- Include historical-design versus implemented-code contradictions.

I. Risk register
- At minimum: unauthenticated writes, tenant isolation, credential leakage,
  token/session compromise, privilege escalation, destructive migration,
  audit gaps, and production configuration.
- Include severity, mitigation, verification evidence, and owner.

J. Proposed governed task sequence
- Begin at TOPLINE-P8-002 and end with a Phase 8 freeze gate.
- Keep the plan within the registry target of four Phase 8 mega prompts where
  practical. Separate irreversible database work from auth code.
- For every task: ID/title, objective, dependencies, conceptual scope,
  allowed file families, forbidden scope, verification, stop conditions,
  WDR evidence, and PM gate.
- Do not register or execute proposed future tasks during P8-001.

K. Verification matrix
- Map future tasks to static checks, build, tests, negative-security tests,
  tenant-isolation tests, migration review, and browser/E2E where relevant.
- Database commands require separate explicit authorization.

L. Global stop conditions
- Destructive DB risk; production target; real secrets; unresolved
  architecture contradiction; tenant uncertainty; scope expansion;
  inability to verify; or forbidden shop.com involvement.

M. Recommended next task
- Name one TOPLINE-P8-002 task, explain why it is dependency-first, and mark
  it unapproved pending P8-001 PM audit.

============================================================
8. REGISTRY UPDATE CONTRACT
============================================================

Preserve registry structure. Add only P8-001 and `wdr-065`; do not add any
proposed future task.

Add task TOPLINE-P8-001:
- phase `phase-8`; exact title from this prompt; planning-only objective;
- status `PASS`; priority `HIGH`; dependency `TOPLINE-P7-010-R2`;
- exact WDR path; tests/build from real results only;
- ownerApproval `PLANNED`; pmApproval `PLANNED`;
- notes stating planning-only/no implementation;
- commitHash filled with the full task implementation hash after it exists.

Add WDR `wdr-065`:
- taskId `TOPLINE-P8-001`; phase `phase-8`; status `PASS`;
- date `2026-09-10`; pmAudit `PLANNED`;
- full task implementation commit after it exists.

After successful verification, set phase-8:
- status `IN_PROGRESS`; progress `25`;
- megaPromptTarget `4`; megaPromptsCompleted `1`;
- dependencies `["phase-7"]`;
- frontendGate/backendGate/databaseGate `PLANNED`;
- testingGate `NOT_STARTED`; ownerApproval `PLANNED`;
- currentTask `null`; taskCount `1`; completedTaskCount `1`.

Set root summary:
- currentPhase `Phase 8`; currentTask `null`;
- lastCompletedTask `TOPLINE-P8-001`;
- nextPlannedTask `TOPLINE-P8-002`; lastUpdated `2026-09-10`.

Do not mark Phase 8 CLOSED or any implementation gate/approval PASS. For
`git.lastCommit`, store the full governed task implementation commit after
it exists; report the later evidence-fill commit separately.

============================================================
9. REPORTS AND HOLD NOTICE
============================================================

Update both latest reports to state P8-001 execution is complete, planning
only, and awaiting PM audit. Include both full hashes after evidence fill
and say P8-002 is proposed but unapproved.

Replace `PM_OUTBOX/next-opencode-prompt.md` with a short hold notice:
- P8-001 WDR awaits PM/CTO audit under #123;
- WDR path and available full hashes;
- do not start P8-002.

Do not write or authorize the P8-002 prompt yourself.

============================================================
10. FORBIDDEN ACTIONS AND STOP CONDITIONS
============================================================

Do not edit backend source/tests/packages/lockfiles/Prisma/migrations/env,
frontend, infrastructure, deployment, or CI. Do not install packages. Do
not implement auth/RBAC/session/token/security behavior. Do not run Prisma
migrate/db push/reset/seed, SQL, or any database-connected command. Do not
read real secrets. Do not touch unrelated changes or start P8-002.

STOP as BLOCKED before edits if the root/state/baseline is wrong, a required
file is missing, allowed files have unsafe overlap, work requires secrets or
DB access, destructive/production risk appears, a contradiction cannot be
recorded for PM decision, scope expands, or allowed-only verification is
impossible. Do not improvise another task.

============================================================
11. VERIFICATION
============================================================

Before commit:
- Confirm plan sections A-M and truthful implemented/proposed distinctions.
- Confirm sequence starts at P8-002 and no future task was executed.
- Confirm exactly one Phase 8 task and exactly `wdr-065` were added.
- Confirm IDs/paths/counts/root state agree and gates remain unpassed.
- Review `git status --short` and `git diff --name-only`.
- Confirm only six allowed files belong to this task and known unrelated
  changes remain unstaged.
- Run `git diff --check`.
- Run `npm run build` and `npm run lint` from `E:\ToplineShop` because the
  registry TypeScript changed. Do not fix unrelated warnings.
- Do not run database commands.

Record commands, exit results, and warning counts. Never claim an unrun or
failed check passed.

============================================================
12. WDR AND EXACT-HASH COMMIT PROCEDURE
============================================================

Create:
`WDR/_All/Phase-08-Database-Auth-RBAC/TOPLINE-P8-001_WDR_2026-09-10.md`

Include task/status/date, objective/boundary, Git root/starting HEAD/status,
evidence reviewed, decisions/open questions, exact files, real verification,
scope-safety confirmations, known limitations, PM audit required, and an
explicit stop before P8-002. Confirm no DB command/connection, no auth/RBAC
implementation, no real secret read/exposure, no forbidden-path access, and
unrelated changes preserved.

Use two commits because a commit cannot contain its own hash.

Commit A - task implementation:
1. Use `PENDING_UNTIL_COMMIT` temporarily in hash fields.
2. Stage only the six exact allowed paths listed in section 6.
3. Inspect staged names; commit only if no other path is staged.
4. Commit with a P8-001-specific message.
5. Capture full hash using `git rev-parse HEAD`.

Commit B - evidence fill:
1. Put full Commit A in WDR, registry, reports, and hold notice as applicable.
2. Keep PM audit/approval `PLANNED`.
3. Re-run `git diff --check`; inspect and stage exact changed files only.
4. Commit with an evidence-fill message and capture its full hash.
5. Do not create a third self-referential commit merely to record Commit B;
   report Commit B in the final handoff if necessary.

After both commits, confirm `git status --short` contains only preserved
unrelated changes.

============================================================
13. FINAL HANDOFF - RETURN ONLY THIS FORMAT
============================================================

TASK: TOPLINE-P8-001 - Phase 8 Database/Auth/RBAC Readiness Plan
STATUS: PASS / BLOCKED
PLAN: docs/PHASE-08-DATABASE-AUTH-RBAC-READINESS-PLAN.md
WDR: WDR/_All/Phase-08-Database-Auth-RBAC/TOPLINE-P8-001_WDR_2026-09-10.md
IMPLEMENTATION COMMIT: <full 40-character hash or NONE>
EVIDENCE-FILL COMMIT: <full 40-character hash or NONE>
FILES CHANGED: <exact list>
VERIFICATION: <commands and real results>
UNRELATED CHANGES PRESERVED: YES / NO
DATABASE/AUTH/RBAC IMPLEMENTED: NO
PM AUDIT REQUIRED: YES
STOPPED BEFORE TOPLINE-P8-002: YES

Stop and wait for PM/CTO audit.
```
