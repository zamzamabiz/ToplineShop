# TOPLINE-P8-001 Audit - Phase 8 Database/Auth/RBAC Readiness Plan

## Decision

**Audit result: BLOCKED**

`TOPLINE-P8-001` stayed within its planning-only file boundary and its
build/test evidence is reproducible. It is not approved because the proposed
Phase 8 execution sequence contains unresolved budget, scope, security, and
evidence contradictions. No `TOPLINE-P8-002` implementation is authorized.

## Evidence Reviewed

- P8-001 plan:
  `docs/PHASE-08-DATABASE-AUTH-RBAC-READINESS-PLAN.md`
- P8-001 WDR:
  `WDR/_All/Phase-08-Database-Auth-RBAC/TOPLINE-P8-001_WDR_2026-09-10.md`
- Implementation commit:
  `82361970c15181c8a19bc1249f3a525bac4ad9cd`
- Evidence-fill commit:
  `894d2b36f52c3442650774b2371f035252d8834b`
- Canonical registry: `src/project/projectRegistry.ts`
- Latest reports and PM outbox
- Phase 3 auth/schema designs, Phase 4 database freeze, and Phase 7 backend
  readiness/closure evidence
- Actual backend package, Prisma schema, controllers, services, and security
  infrastructure inspected read-only

## Verification Performed

- Commit hashes resolved to the exact 40-character values above.
- Commit A changed exactly the six allowed P8-001 files.
- Commit B changed five of those allowed files for evidence filling.
- `npm run build` at project root: PASS; 25 pages generated and 27 routes
  listed, including `/project-management`.
- `npm run lint` at project root: PASS with 0 errors and the same 5
  pre-existing `<img>` warnings.
- `npm run build` in `backend`: PASS.
- `npm test -- --runInBand` in `backend`: PASS, 12/12 tests.
- `git diff --check`: PASS; warning only on the preserved unrelated
  governance WDR due line-ending normalization.
- Current working tree contains only the preserved unrelated governance WDR
  and `.claude/`; neither belongs to P8-001.
- No backend, frontend, package, Prisma, migration, environment, or product
  implementation file changed in either P8-001 commit.

## Findings

1. **The proposed sequence contradicts the governed prompt budget.**
   The plan says `megaPromptTarget: 4`, but proposes four implementation
   tasks plus a freeze gate after P8-001. That is six core governed prompts
   total, not four. The claim that P8-002 through P8-006 fit the target is
   internally false. PM sets Phase 8's corrected target to 5, within the
   constitution's 2-5 limit. The revised core sequence must end at P8-005.

2. **P8-002 is too large and crosses risk boundaries.**
   It combines schema changes, a migration, package installation, password
   hashing, JWT/session lifecycle, three auth endpoints, audit changes, a
   global guard, and protection of four write APIs. This contradicts the
   requirement to separate irreversible/high-risk database work from auth
   behavior and is too broad for reliable MiniMax execution and audit.

3. **Security architecture is presented as resolved before PM decision.**
   The WDR labels several design conflicts as resolved without PM
   re-decision. Bearer refresh tokens, HS256, Argon2id, session lookup,
   refresh rotation, role storage, tenant switching, and account lifecycle
   remain recommendations/options. They require an explicit decision matrix
   and PM selection before implementation.

4. **The refresh-token transport analysis is incomplete.**
   The plan chooses JavaScript-accessible bearer refresh tokens mainly to
   avoid CSRF, without balancing XSS/token-exfiltration risk against an
   HttpOnly Secure SameSite cookie design and its CSRF controls. The revised
   plan must compare both options without silently approving either.

5. **Verification-link logging is forbidden.**
   P8-005 proposes a stub notification service that logs verification links.
   Verification and reset links contain bearer credentials and must never be
   written to application logs, audit metadata, WDRs, or test output. Tests
   must use captured in-memory fakes or token digests, never raw-link logs.

6. **Local database safety wording is unacceptable.**
   The plan says the local database can be destroyed and remigrated freely,
   then says reset requires PM approval. ToplineShop forbids destructive DB
   actions without explicit approval regardless of environment. The first
   statement must be removed.

7. **Authorization freshness and public-route behavior need design gates.**
   Roles embedded in access tokens can become stale after revocation or role
   changes. A global auth guard also requires an explicit public-route
   allowlist for health, version, public reads, and auth endpoints. The plan
   must define options and negative-test requirements before implementation.

8. **Evidence is incomplete and internally inconsistent.**
   The reports and PM outbox still contain `<P8-001_FILL_HASH>` even though
   evidence-fill commit `894d2b36f52c3442650774b2371f035252d8834b`
   exists. The WDR repeatedly says five allowed files while its own list and
   the commit show six. Its recorded starting registry state also disagrees
   with starting commit `314fe82c5a0cb40e9d0d63f9da5c108a38a79f6c`,
   which already named `TOPLINE-P8-001` as next.

9. **Some proposed verification facts are false or ungrounded.**
   The P8-002 row claims "12 Jest + 202 evidence scripts" and calls
   `passport-jwt` transitive to `@nestjs/passport`. These claims were not
   established by the repository. Future package relationships must be
   verified from actual manifests/official package documentation, and test
   counts must use real executable inventory.

10. **Scope isolation and reproducible health checks pass.**
    No P8-002 work was started, no forbidden product files changed, exact
    commits exist, and all rerun build/lint/backend checks passed. The block
    concerns plan quality and governance evidence, not unauthorized code.

## Required Correction

Corrective task:
`TOPLINE-P8-001-R1 - Phase 8 Readiness Plan Security and Governance Reconciliation`

R1 must remain planning-only and must:

- Reconcile the Phase 8 core sequence to five total mega prompts:
  P8-001, P8-002, P8-003, P8-004, and P8-005 freeze gate.
- Split the proposed work into bounded dependency stages: auth data/security
  foundation; auth/session lifecycle plus write protection; tenant-aware
  RBAC/security hardening; freeze gate.
- Defer registration, email verification, password reset, OAuth, module
  enablement, financial approvals, and real notification delivery unless PM
  separately expands scope later.
- Replace premature resolutions with explicit options, tradeoffs,
  recommendations, and PM decision gates.
- Add complete refresh-token transport/storage, authorization freshness,
  public-route allowlist, tenant-context, credential bootstrap, and migration
  safety analysis.
- Remove all raw verification/reset-link logging guidance.
- State that no local database is freely destructible.
- Correct report/outbox hashes, file counts, starting-state evidence, package
  claims, and test counts.
- Keep P8-001 and wdr-065 BLOCKED until R1 audit passes.
- Add/complete the pre-registered R1 task and `wdr-066` entries.
- Stop before P8-002.

## Governance Closure

- P8-001 implementation status: PASS, planning-only.
- P8-001 PM approval: BLOCKED.
- `wdr-065.pmAudit`: BLOCKED.
- Phase 8 status: BLOCKED pending P8-001-R1.
- Phase 8 implementation: not started and not authorized.
- Next approved corrective task: TOPLINE-P8-001-R1 only.

PM audit commit: `c2282eb5c7cf2c51388e7e538f8a6e61f12bd25c`
