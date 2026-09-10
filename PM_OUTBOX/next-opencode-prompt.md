# Next OpenCode Execution Prompt

## PM/CTO Decision

**P8-001 AUDIT: BLOCKED**

Approved corrective task:
`TOPLINE-P8-001-R1 - Phase 8 Readiness Plan Security and Governance Reconciliation`

This is planning/governance correction only. It does not authorize P8-002
or any database/auth/RBAC implementation.

Paste only the prompt below into #MM.

## Correction Giant Mega Prompt

```text
#MM - TOPLINE-P8-001-R1 - Phase 8 Readiness Plan Security and Governance Reconciliation

You are MiniMax-M3 executing exactly one PM/CTO-approved corrective
planning task under #123:
DISCUSS -> DECIDE -> EXECUTE -> VERIFY/AUDIT -> CLOSE -> NEXT

============================================================
1. APPROVAL BOUNDARY
============================================================

Approved task:
TOPLINE-P8-001-R1 - Phase 8 Readiness Plan Security and Governance
Reconciliation

This task corrects the P8-001 plan and governance evidence only.

Not approved:
- TOPLINE-P8-002 or any later Phase 8 task
- backend/frontend implementation
- package changes
- Prisma/schema/migration changes
- database commands or connections
- auth, session, token, RBAC, guard, permission, or security code

Stop after the R1 WDR and two exact-file commits. PM/CTO must audit R1
before any P8-002 prompt is written or executed.

============================================================
2. MANDATORY PREFLIGHT
============================================================

Read completely:
- `AGENTS.md`
- `docs/HAIKU_EXECUTION_PROTOCOL.md`
- `docs/PROJECT_CONSTITUTION.md`
- `docs/MEGA-PROMPT-STRATEGY.md`
- `src/project/projectRegistry.ts` as canonical source of truth
- `WDR/_All/Phase-08-Database-Auth-RBAC/TOPLINE-P8-001-AUDIT_2026-09-10.md`
- `WDR/_All/Phase-08-Database-Auth-RBAC/TOPLINE-P8-001_WDR_2026-09-10.md`
- `docs/PHASE-08-DATABASE-AUTH-RBAC-READINESS-PLAN.md`

Confirm:
- Git root is `E:/ToplineShop`.
- HEAD includes the PM audit commit named in the registry/audit after PM
  closeout.
- P8-001 and wdr-065 are BLOCKED by PM audit.
- TOPLINE-P8-001-R1 and reserved wdr-066 already exist as PLANNED entries.
  Update them; do not duplicate them.
- P8-002 is not registered and has not started.

`F:\OpenCode\shop.com` is strictly out of scope. Do not read, list, search,
open, compare, copy, import, or access it.

Preserve and never stage these unrelated local changes:
- `WDR/_All/Governance/TOPLINE-GOV-AUTO-001_WDR_2026-09-08.md`
- `.claude/`

STOP before edits if canonical state differs, an allowed file has unsafe
overlap, or any forbidden action appears necessary.

============================================================
3. ALLOWED FILES
============================================================

Modify/create only:
1. `docs/PHASE-08-DATABASE-AUTH-RBAC-READINESS-PLAN.md`
2. `src/project/projectRegistry.ts`
3. `AGENT_REPORTS/latest-status.md`
4. `AGENT_REPORTS/latest-wdr-summary.md`
5. `PM_OUTBOX/next-opencode-prompt.md`
6. `WDR/_All/Phase-08-Database-Auth-RBAC/TOPLINE-P8-001-R1_WDR_2026-09-10.md`

Do not edit the P8-001 WDR or PM audit. They are immutable audit evidence.

============================================================
4. REQUIRED PLAN CORRECTIONS
============================================================

Revise the Phase 8 readiness plan without implementing anything.

A. Prompt budget and sequence
- Set the Phase 8 core mega-prompt target to 5, allowed by the constitution.
- Reconcile the core sequence to exactly:
  - P8-001: readiness plan (already executed; blocked pending R1 audit)
  - P8-002: Auth Persistence Data Model and Migration Safety Foundation
  - P8-003: Authentication Session Lifecycle and Write Endpoint Protection
  - P8-004: Tenant-Aware RBAC Enforcement and Security Audit Hardening
  - P8-005: Phase 8 Freeze Gate
- R1 is a corrective task and does not increment megaPromptsCompleted.
- Remove P8-006 from the proposed core sequence.
- Defer self-registration, email verification, password reset, OAuth,
  Module/TenantModule, financial ApprovalGate, and real notification delivery
  to later PM decisions. Do not squeeze them into Phase 8 merely to preserve
  old design scope.

B. Bounded future scopes
- P8-002 is persistence/migration safety only: chosen auth persistence model,
  additive schema, migration SQL review and explicitly authorized local-only
  application evidence. No login endpoints, guards, JWT issuance, RBAC, or
  frontend work.
- P8-003 is authentication/session behavior plus protection of the four
  current write endpoints. It may install only packages separately approved
  by the future PM prompt. No RBAC schema/permission hierarchy.
- P8-004 is tenant-aware role/permission persistence, enforcement, negative
  cross-tenant tests, authorization freshness, and audit hardening. No email
  verification/reset/OAuth or frontend work.
- P8-005 is audit/freeze only and must not implement fixes silently.

C. Architecture decision matrix
Do not label unresolved choices "resolved by this plan." For each item,
document options, security tradeoffs, recommendation, required evidence,
and `PM DECISION REQUIRED`:
- credential representation: `User.passwordHash` versus separate credential
  model/AuthAccount subset;
- password hashing algorithm and runtime/package compatibility;
- access-token signing: symmetric versus asymmetric;
- access-token claims and lifetime;
- refresh-token transport: JavaScript-accessible bearer versus HttpOnly,
  Secure, SameSite cookie, including XSS and CSRF tradeoffs;
- refresh-token digest/storage and rotation/reuse detection;
- single-device versus multi-device sessions;
- session revocation and authorization freshness after role/status change;
- platform role versus tenant role persistence;
- vendor role relationship to tenant membership and `Vendor.ownerId`;
- public-route allowlist if a global/default auth guard is used;
- active tenant selection and prevention of trusting body/query tenantId;
- credential bootstrap for existing users with no password credential;
- startup versus lazy Prisma connection behavior;
- rate limiting/lockout storage without assuming Redis or a new model;
- production secret store remains out of scope.

Recommendations are allowed. Approval claims are not.

D. Token and logging safety
- Remove every instruction to log verification links, reset links, access
  tokens, refresh tokens, bearer headers, secrets, or raw credentials.
- If a later test needs a verification/reset token, propose an in-memory fake
  transport or captured test-only value that is never written to app logs,
  audit logs, WDRs, or console output.
- Do not assume Argon2 is the correct digest for high-entropy refresh tokens.
  Require a decision between a suitable cryptographic digest/keyed digest
  approach and any justified alternative.
- Explain how role/status changes invalidate or refresh authorization data;
  do not treat long-lived role claims in JWTs as permanently authoritative.

E. Database safety
- Remove the statement that a local database can be destroyed freely.
- State that destructive operations require explicit PM approval regardless
  of environment.
- Future migration tasks must verify the exact local target without exposing
  connection values, inspect generated SQL, prove additive/non-destructive
  behavior, document rollback, and stop on any production target.
- Do not run any database or Prisma command in R1.

F. Correct factual errors
- Replace the false `12 Jest + 202 evidence scripts` wording with actual,
  verifiable test inventory. The current audit reproduced 12/12 Jest tests;
  do not invent script counts.
- Remove the unverified claim that `passport-jwt` is transitive to
  `@nestjs/passport`. Future dependency choices must be verified from the
  actual package manifest and official package documentation when approved.
- Correct the P8-001 file count to six.
- Record the real P8-001 evidence-fill hash:
  `894d2b36f52c3442650774b2371f035252d8834b`.
- Do not repeat the P8-001 WDR's inaccurate starting-registry summary as fact.
  Starting commit `314fe82c5a0cb40e9d0d63f9da5c108a38a79f6c`
  already identified TOPLINE-P8-001 as next.

G. Verification matrix
- Align every verification row with the corrected four future tasks.
- Include negative tests for missing/invalid/expired/revoked credentials,
  refresh replay, disabled users, suspended memberships, stale/revoked roles,
  cross-tenant access, body/query tenant spoofing, public-route availability,
  secret/token redaction, and migration target safety.
- Do not claim tests exist or pass during this planning correction.

============================================================
5. REGISTRY CONTRACT
============================================================

Update existing entries; do not create duplicates.

Keep TOPLINE-P8-001:
- status PASS (execution completed)
- pmApproval BLOCKED
- implementation commit unchanged

Keep wdr-065:
- status PASS
- pmAudit BLOCKED
- implementation commit unchanged

Complete TOPLINE-P8-001-R1 after work:
- status PASS
- completedAt `2026-09-10`
- tests/build from real verification
- ownerApproval PLANNED
- pmApproval PLANNED pending PM audit
- full implementation commit after Commit A
- notes: planning correction only; stopped before P8-002

Complete wdr-066 after work:
- taskId TOPLINE-P8-001-R1; phase phase-8; status PASS
- date 2026-09-10; pmAudit PLANNED
- full implementation commit after Commit A

Phase 8 remains BLOCKED pending R1 PM audit:
- progress 20
- megaPromptTarget 5
- megaPromptsCompleted 1
- taskCount 2
- completedTaskCount 2
- all implementation/owner gates remain unpassed
- currentTask null

Root state after R1 execution:
- currentPhase `Phase 8`
- currentTask null
- lastCompletedTask `TOPLINE-P8-001-R1`
- nextPlannedTask `TOPLINE-P8-002` (proposed/unapproved)
- lastUpdated `2026-09-10`

`git.lastCommit` records full Commit A. Commit B is final-response evidence,
not a placeholder requiring a third self-referential commit.

============================================================
6. REPORTS, OUTBOX, AND WDR
============================================================

Update latest reports to say R1 execution PASS, PM audit pending, P8-001 and
wdr-065 remain BLOCKED until audit, Phase 8 remains BLOCKED, and P8-002 is
unapproved. Record full Commit A. Do not leave an evidence-fill placeholder.

Replace PM_OUTBOX with a short R1 audit hold notice. It must contain the R1
WDR path, full Commit A, and state that Commit B will be reported in #MM's
final handoff and resolved by Git. Do not leave `<...HASH>` placeholders.

Create:
`WDR/_All/Phase-08-Database-Auth-RBAC/TOPLINE-P8-001-R1_WDR_2026-09-10.md`

The R1 WDR must include preflight, audit findings addressed one by one,
exact six-file scope, real verification, safety confirmations, full Commit A,
known limitations, PM audit required, and stopped-before-P8-002 statement.

============================================================
7. VERIFICATION
============================================================

- Confirm every PM audit finding is addressed by targeted search.
- Confirm plan sequence is exactly P8-001 through P8-005.
- Confirm no P8-006 core task remains in the plan.
- Confirm no raw-link/token logging guidance remains.
- Confirm no statement permits free local DB destruction.
- Confirm all architecture choices remain PM-gated.
- Confirm registry IDs/counts/statuses/root fields agree.
- Run `git diff --check`.
- Run root `npm run build` and `npm run lint` because registry changed.
- Do not run Prisma, database, backend implementation, or network commands.
- Inspect `git diff --name-only` and staged names for exact allowed scope.
- Preserve unrelated changes unstaged.

============================================================
8. EXACT-FILE TWO-COMMIT PROCEDURE
============================================================

Commit A:
- Use `PENDING_UNTIL_COMMIT` only where Commit A must later be inserted.
- Stage exactly the six allowed files using explicit paths.
- Inspect staged names before committing.
- Commit and capture full 40-character hash.

Commit B:
- Replace all Commit A placeholders with full Commit A.
- Do not create a placeholder for Commit B.
- Re-run diff check and stage only exact changed allowed files.
- Commit evidence fill and capture full 40-character hash.
- Report both hashes in final; do not create a third commit.

Never use `git add .`, `git add -A`, or `git add --all`.

============================================================
9. FINAL HANDOFF - RETURN ONLY
============================================================

TASK: TOPLINE-P8-001-R1 - Phase 8 Readiness Plan Security and Governance Reconciliation
STATUS: PASS / BLOCKED
WDR: WDR/_All/Phase-08-Database-Auth-RBAC/TOPLINE-P8-001-R1_WDR_2026-09-10.md
IMPLEMENTATION COMMIT: <full 40-character Commit A or NONE>
EVIDENCE-FILL COMMIT: <full 40-character Commit B or NONE>
FILES CHANGED: <exact list>
VERIFICATION: <real commands/results>
UNRELATED CHANGES PRESERVED: YES / NO
DATABASE/AUTH/RBAC IMPLEMENTED: NO
P8-001 AND WDR-065 REMAIN BLOCKED: YES
PM AUDIT REQUIRED: YES
STOPPED BEFORE TOPLINE-P8-002: YES

Stop and wait for PM/CTO audit.
```
